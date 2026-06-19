from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Recording
from .serializers import RecordingSerializer
from live_sessions.models import LiveSession
from live_sessions.views import get_auth_user

@api_view(['GET', 'POST'])
def recording_list_create(request):
    user = get_auth_user(request)
    if not user:
        return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'GET':
        try:
            role = user.profile.role
        except Exception:
            role = 'student'

        if role == 'student':
            from api.models import Enrollment, Batch
            from django.db.models import Q
            enrolled_batches = Enrollment.objects.filter(student=user, status='active').values_list('batch', flat=True)
            enrolled_courses = Batch.objects.filter(id__in=enrolled_batches).values_list('course', flat=True)
            recordings = Recording.objects.filter(Q(session__course__in=enrolled_courses) | Q(session__course__isnull=True)).order_by('-uploaded_at')
        else:
            recordings = Recording.objects.all().order_by('-uploaded_at')

        serializer = RecordingSerializer(recordings, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        try:
            role = user.profile.role
        except Exception:
            role = 'student'
        if role not in ['admin', 'trainer']:
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        session_id = request.data.get('session_id')
        recording_url = request.data.get('recording_url')

        if not session_id or not recording_url:
            return Response({'error': 'session_id and recording_url are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            session = LiveSession.objects.get(pk=session_id)
        except LiveSession.DoesNotExist:
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

        recording = Recording.objects.create(session=session, recording_url=recording_url)
        return Response(RecordingSerializer(recording).data, status=status.HTTP_201_CREATED)
