from rest_framework import serializers
from .models import Notification, NotificationSettings
from django.contrib.auth import get_user_model

User = get_user_model()

class NotificationSerializer(serializers.ModelSerializer):
    type = serializers.CharField(source='notification_type', read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'type', 'priority', 'is_read', 'created_at']

class NotificationSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationSettings
        fields = ['email_notifications', 'push_notifications', 'in_app_notifications']
