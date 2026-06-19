from django.db import models
from django.contrib.auth.models import User
from live_sessions.models import LiveSession

class Attendance(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='session_attendance')
    session = models.ForeignKey(LiveSession, on_delete=models.CASCADE, related_name='attendance_records')
    joined_at = models.DateTimeField(auto_now_add=True)
    left_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.student.username} - {self.session.title}"
