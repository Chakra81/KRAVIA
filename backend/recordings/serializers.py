from rest_framework import serializers
from .models import Recording
from live_sessions.serializers import LiveSessionSerializer

class RecordingSerializer(serializers.ModelSerializer):
    session_detail = LiveSessionSerializer(source='session', read_only=True)

    class Meta:
        model = Recording
        fields = ['id', 'session', 'session_detail', 'recording_url', 'uploaded_at']
        read_only_fields = ['uploaded_at']
