from rest_framework import serializers
from django.contrib.auth.models import User
from .models import LiveSession, SessionMaterial

class UserMiniSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'name']

    def get_name(self, obj):
        return obj.first_name or obj.username.split('@')[0]

class SessionMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionMaterial
        fields = ['id', 'session', 'title', 'file_url', 'uploaded_at']

class CourseMiniSerializer(serializers.ModelSerializer):
    class Meta:
        from api.models import Course
        model = Course
        fields = ['id', 'title']

class LiveSessionSerializer(serializers.ModelSerializer):
    created_by_detail = UserMiniSerializer(source='created_by', read_only=True)
    host_detail = UserMiniSerializer(source='created_by', read_only=True)
    materials = SessionMaterialSerializer(many=True, read_only=True)
    scheduled_time = serializers.DateTimeField(source='start_time', read_only=True)
    duration = serializers.SerializerMethodField()
    is_live = serializers.SerializerMethodField()
    course_detail = CourseMiniSerializer(source='course', read_only=True)

    class Meta:
        model = LiveSession
        fields = [
            'id', 'title', 'description', 'meeting_id',
            'start_time', 'end_time', 'recording_enabled',
            'created_by', 'created_by_detail', 'host_detail',
            'status', 'admin_online', 'is_live',
            'materials', 'created_at', 'scheduled_time', 'duration',
            'course', 'course_detail'
        ]
        read_only_fields = ['created_by', 'meeting_id', 'created_at', 'admin_online']

    def get_is_live(self, obj):
        return obj.status == 'live'

    def get_duration(self, obj):
        if obj.end_time and obj.start_time:
            delta = obj.end_time - obj.start_time
            return int(delta.total_seconds() / 60)
        return 60
