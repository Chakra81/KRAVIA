import uuid
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from .models import LiveSession, SessionMaterial
from .serializers import LiveSessionSerializer, SessionMaterialSerializer
from api.models import Profile, Notification


def get_auth_user(request):
    email = (
        request.query_params.get('email')
        or request.data.get('email')
        or request.query_params.get('user_email')
        or request.data.get('user_email')
    )
    print("DEBUG get_auth_user:", request.query_params, "email:", email)
    user = None
    if email:
        user = User.objects.filter(email=email).first()
    print("DEBUG get_auth_user user:", user)
    if not user and request.user.is_authenticated:
        user = request.user
    return user

def notify_session_users(session, title, message, notif_type="batch"):
    from api.models import Notification, Enrollment, Batch, Profile
    users_to_notify = set()
    
    if session.course:
        batches = Batch.objects.filter(course=session.course)
        enrollments = Enrollment.objects.filter(batch__in=batches, status='active').select_related('student')
        for e in enrollments:
            users_to_notify.add(e.student)
        for b in batches:
            if b.trainer:
                users_to_notify.add(b.trainer)
    else:
        # Global session: notify all students
        profiles = Profile.objects.filter(role='student').select_related('user')
        for p in profiles:
            users_to_notify.add(p.user)
            
    # don't notify the person who created/started the session
    if session.created_by in users_to_notify:
        users_to_notify.remove(session.created_by)
        
    notifications = []
    from api.whatsapp_utils import send_whatsapp_message
    
    for u in users_to_notify:
        notifications.append(Notification(user=u, title=title, message=message, notification_type=notif_type))
        # Send WhatsApp if user has a phone number
        try:
            profile = Profile.objects.get(user=u)
            if profile.phone_number:
                # Use a shorter message for WhatsApp
                wa_msg = f"*{title}*\n{message}"
                send_whatsapp_message(profile.phone_number, wa_msg)
        except Profile.DoesNotExist:
            pass

    if notifications:
        for n in notifications:
            n.save()


# ──────────────────────────────────────────────────────────────────────────────
# LIST / CREATE
# ──────────────────────────────────────────────────────────────────────────────
@api_view(['GET', 'POST'])
def session_list_create(request):
    user = get_auth_user(request)
    if not user:
        return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'GET':
        try:
            role = user.profile.role
        except Exception:
            role = 'student'

        if role == 'student' and not user.is_superuser:
            from api.models import Enrollment, Batch
            from django.db.models import Q
            enrolled_batches = Enrollment.objects.filter(student=user, status='active').values_list('batch', flat=True)
            enrolled_courses = Batch.objects.filter(id__in=enrolled_batches).values_list('course', flat=True)
            sessions = LiveSession.objects.filter(
                Q(course__in=enrolled_courses) | Q(course__isnull=True)
            ).order_by('-start_time')
        elif role == 'trainer' and not user.is_superuser:
            # Trainers only see sessions from their assigned courses
            from api.models import Batch
            from django.db.models import Q
            trainer_courses = Batch.objects.filter(trainer=user).values_list('course', flat=True).distinct()
            sessions = LiveSession.objects.filter(
                Q(course__in=trainer_courses) | Q(created_by=user)
            ).order_by('-start_time')
        else:
            sessions = LiveSession.objects.all().order_by('-start_time')

        serializer = LiveSessionSerializer(sessions, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        try:
            role = user.profile.role
        except Exception:
            role = 'student'

        if role not in ['admin', 'trainer'] and not user.is_superuser:
            return Response(
                {'error': 'Permission denied. Only admins/trainers can create live sessions.'},
                status=status.HTTP_403_FORBIDDEN
            )

        data = request.data.copy()
        meeting_id = f"room-{uuid.uuid4().hex[:10]}"

        scheduled_time_str = data.get('scheduled_time')
        duration_mins = int(data.get('duration', 60))

        if scheduled_time_str:
            from datetime import datetime, timedelta
            try:
                start_time = datetime.fromisoformat(scheduled_time_str.replace('Z', '+00:00'))
            except ValueError:
                try:
                    start_time = datetime.strptime(scheduled_time_str, "%Y-%m-%dT%H:%M")
                except ValueError:
                    start_time = datetime.now()

            end_time = start_time + timedelta(minutes=duration_mins)
            data['start_time'] = start_time.isoformat()
            data['end_time'] = end_time.isoformat()

        serializer = LiveSessionSerializer(data=data)
        if serializer.is_valid():
            session = serializer.save(created_by=user, meeting_id=meeting_id, status='scheduled')

            try:
                notify_session_users(
                    session=session,
                    title="🆕 Live Class Scheduled: " + session.title,
                    message=f"A new live session has been scheduled for {session.start_time}. Click here to view details.",
                    notif_type="batch"
                )
            except Exception as e:
                print(f"Failed to create notification: {e}")

            return Response(LiveSessionSerializer(session).data, status=status.HTTP_201_CREATED)
        print("LiveSessionSerializer errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ──────────────────────────────────────────────────────────────────────────────
# DETAIL (GET / PUT / DELETE)
# ──────────────────────────────────────────────────────────────────────────────
@api_view(['GET', 'PUT', 'DELETE'])
def session_detail(request, pk):
    user = get_auth_user(request)
    if not user:
        return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        session = LiveSession.objects.get(pk=pk)
    except LiveSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(LiveSessionSerializer(session).data)

    elif request.method == 'PUT':
        try:
            role = user.profile.role
        except Exception:
            role = 'student'
        if role not in ['admin', 'trainer'] and not user.is_superuser:
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()
        scheduled_time_str = data.get('scheduled_time')
        duration_mins = data.get('duration')

        if scheduled_time_str or duration_mins is not None:
            from datetime import datetime, timedelta
            if not scheduled_time_str:
                start_time = session.start_time
            else:
                try:
                    start_time = datetime.fromisoformat(scheduled_time_str.replace('Z', '+00:00'))
                except ValueError:
                    try:
                        start_time = datetime.strptime(scheduled_time_str, "%Y-%m-%dT%H:%M")
                    except ValueError:
                        start_time = datetime.now()

            if duration_mins is None:
                duration_mins = int((session.end_time - session.start_time).total_seconds() / 60)
            else:
                duration_mins = int(duration_mins)

            end_time = start_time + timedelta(minutes=duration_mins)
            data['start_time'] = start_time.isoformat()
            data['end_time'] = end_time.isoformat()

        serializer = LiveSessionSerializer(session, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        try:
            role = user.profile.role
        except Exception:
            role = 'student'
        if role not in ['admin', 'trainer'] and not user.is_superuser:
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        session.delete()
        return Response({'message': 'Session deleted successfully'}, status=status.HTTP_200_OK)


# ──────────────────────────────────────────────────────────────────────────────
# START SESSION  (admin/trainer only)
# ──────────────────────────────────────────────────────────────────────────────
@api_view(['POST'])
def start_session(request, pk):
    user = get_auth_user(request)
    if not user:
        return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        session = LiveSession.objects.get(pk=pk)
    except LiveSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

    try:
        role = user.profile.role
    except Exception:
        role = 'student'
    if role not in ['admin', 'trainer'] and not user.is_superuser:
        return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

    session.status = 'live'
    session.admin_online = True   # host is now in the room
    session.save()

    try:
        notify_session_users(
            session=session,
            title="🔴 Live Class Started: " + session.title,
            message=f"Live class '{session.title}' is active now! Join immediately.",
            notif_type="batch"
        )
    except Exception as e:
        print(f"Failed to create start notification: {e}")

    return Response(LiveSessionSerializer(session).data)


# ──────────────────────────────────────────────────────────────────────────────
# END SESSION  (admin/trainer only)
# ──────────────────────────────────────────────────────────────────────────────
@api_view(['POST'])
def end_session(request, pk):
    user = get_auth_user(request)
    if not user:
        return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        session = LiveSession.objects.get(pk=pk)
    except LiveSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

    try:
        role = user.profile.role
    except Exception:
        role = 'student'
    if role not in ['admin', 'trainer'] and not user.is_superuser:
        return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

    session.status = 'ended'
    session.admin_online = False   # host left
    session.save()

    # Automatically close all active attendance records for this session
    from attendance.models import Attendance
    from django.utils import timezone
    active_attendances = Attendance.objects.filter(session=session, left_at__isnull=True)
    active_attendances.update(left_at=timezone.now())

    return Response(LiveSessionSerializer(session).data)


# ──────────────────────────────────────────────────────────────────────────────
# ROOM STATUS  (anyone authenticated)
# ──────────────────────────────────────────────────────────────────────────────
@api_view(['GET'])
def room_status(request, pk):
    """
    Returns lightweight room state for polling from the waiting room.
    Response: { id, title, meeting_id, status, admin_online }
    """
    user = get_auth_user(request)
    if not user:
        return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        session = LiveSession.objects.get(pk=pk)
    except LiveSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

    return Response({
        'id': session.id,
        'title': session.title,
        'meeting_id': session.meeting_id,
        'status': session.status,
        'admin_online': session.admin_online,
    })


# ──────────────────────────────────────────────────────────────────────────────
# UPLOAD MATERIAL
# ──────────────────────────────────────────────────────────────────────────────
@api_view(['POST'])
def upload_material(request, pk):
    user = get_auth_user(request)
    if not user:
        return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        session = LiveSession.objects.get(pk=pk)
    except LiveSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

    try:
        role = user.profile.role
    except Exception:
        role = 'student'
    if role not in ['admin', 'trainer'] and not user.is_superuser:
        return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

    title = request.data.get('title')
    file_url = request.data.get('file_url') or request.data.get('fileUrl')

    if not title or not file_url:
        return Response({'error': 'Title and File URL are required.'}, status=status.HTTP_400_BAD_REQUEST)

    material = SessionMaterial.objects.create(session=session, title=title, file_url=file_url)

    try:
        notify_session_users(
            session=session,
            title="📂 New Materials Uploaded",
            message=f"New materials uploaded for '{session.title}': {title}.",
            notif_type="course"
        )
    except Exception as e:
        print(f"Failed to create notification: {e}")

    return Response(SessionMaterialSerializer(material).data, status=status.HTTP_201_CREATED)
