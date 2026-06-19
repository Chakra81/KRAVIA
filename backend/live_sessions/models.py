from django.db import models
from django.contrib.auth.models import User

class LiveSession(models.Model):
    STATUS_CHOICES = (
        ('scheduled', 'Scheduled'),
        ('live', 'Live'),
        ('ended', 'Ended'),
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    meeting_id = models.CharField(max_length=100, unique=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    recording_enabled = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_sessions')
    course = models.ForeignKey('api.Course', on_delete=models.SET_NULL, null=True, blank=True, related_name='live_sessions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    admin_online = models.BooleanField(default=False)   # True while host is inside the room
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.meeting_id})"

class SessionMaterial(models.Model):
    session = models.ForeignKey(LiveSession, on_delete=models.CASCADE, related_name='materials')
    title = models.CharField(max_length=200)
    file_url = models.TextField()
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.session.title}"
