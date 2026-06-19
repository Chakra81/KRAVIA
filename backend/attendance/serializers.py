from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Attendance
from live_sessions.serializers import UserMiniSerializer, LiveSessionSerializer

class AttendanceSerializer(serializers.ModelSerializer):
    student_detail = UserMiniSerializer(source='student', read_only=True)
    session_detail = LiveSessionSerializer(source='session', read_only=True)

    class Meta:
        model = Attendance
        fields = ['id', 'student', 'student_detail', 'session', 'session_detail', 'joined_at', 'left_at']
        read_only_fields = ['joined_at']
