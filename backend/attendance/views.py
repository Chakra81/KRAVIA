from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.utils import timezone
from .models import Attendance
from .serializers import AttendanceSerializer
from live_sessions.models import LiveSession
from live_sessions.views import get_auth_user

@api_view(['POST'])
def join_session(request):
    user = get_auth_user(request)
    if not user:
        return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

    session_id = request.data.get('session_id')
    if not session_id:
        return Response({'error': 'session_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        session = LiveSession.objects.get(pk=session_id)
    except LiveSession.DoesNotExist:
        return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

    attendance, created = Attendance.objects.get_or_create(
        student=user,
        session=session,
        left_at__isnull=True,
        defaults={'joined_at': timezone.now()}
    )

    return Response(AttendanceSerializer(attendance).data, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)

@api_view(['POST'])
def leave_session(request):
    user = get_auth_user(request)
    if not user:
        return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

    session_id = request.data.get('session_id')
    if not session_id:
        return Response({'error': 'session_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        session = LiveSession.objects.get(pk=session_id)
    except LiveSession.DoesNotExist:
        return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

    records = Attendance.objects.filter(student=user, session=session, left_at__isnull=True)
    if records.exists():
        for record in records:
            record.left_at = timezone.now()
            record.save()
        return Response({'message': 'Left session recorded.'}, status=status.HTTP_200_OK)

    return Response({'error': 'No active join record found.'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def attendance_analytics(request):
    user = get_auth_user(request)
    if not user:
        return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

    # Safely determine role
    role = 'student'
    try:
        if hasattr(user, 'profile') and user.profile is not None:
            role = user.profile.role or 'student'
    except Exception:
        pass

    # Allow admin, trainer, and superusers
    if role not in ['admin', 'trainer'] and not user.is_superuser and not user.is_staff:
        # For students, return empty data instead of a 403 error
        return Response({
            'records': [],
            'metrics': {
                'total_attendance_logs': 0,
                'unique_students_attended': 0
            }
        })

    session_id = request.query_params.get('session_id')
    records = Attendance.objects.select_related('student', 'session').all()

    # For trainers, scope to sessions from their assigned courses (via Batch)
    if role == 'trainer':
        from api.models import Batch
        trainer_courses = Batch.objects.filter(trainer=user).values_list('course', flat=True).distinct()
        trainer_sessions = LiveSession.objects.filter(course__in=trainer_courses)
        records = records.filter(session__in=trainer_sessions)

    if session_id:
        records = records.filter(session_id=session_id)

    records = records.order_by('-joined_at')

    total_records = records.count()
    unique_students = records.values('student').distinct().count()

    serializer = AttendanceSerializer(records, many=True)
    return Response({
        'records': serializer.data,
        'metrics': {
            'total_attendance_logs': total_records,
            'unique_students_attended': unique_students
        }
    })
