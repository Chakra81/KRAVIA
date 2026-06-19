from django.db import models
from live_sessions.models import LiveSession

class Recording(models.Model):
    session = models.ForeignKey(LiveSession, on_delete=models.CASCADE, related_name='recordings')
    recording_url = models.TextField()
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Recording for {self.session.title}"
