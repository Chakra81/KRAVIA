from django.db import models
from django.contrib.auth.models import User
import uuid


def generate_certificate_id():
    return f"CERT-{uuid.uuid4().hex[:8].upper()}"


class CertificateTemplate(models.Model):
    title = models.CharField(max_length=200, default='Standard Certificate')
    subtitle = models.CharField(max_length=200, default='Certificate of Completion')
    institute_name = models.CharField(max_length=200, default='Kravia Institute')
    signatory_name = models.CharField(max_length=100, default='Director')
    signatory_title = models.CharField(max_length=100, default='Institute Director')
    background_color = models.CharField(max_length=20, default='#1e1b4b')
    accent_color = models.CharField(max_length=20, default='#6366f1')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created_at']


class Certificate(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('pending', 'Pending'),
        ('revoked', 'Revoked'),
        ('expired', 'Expired'),
    )

    certificate_id = models.CharField(
        max_length=30, unique=True, default=generate_certificate_id
    )
    student = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='certificates'
    )
    course = models.ForeignKey(
        'api.Course', on_delete=models.CASCADE, related_name='certificates'
    )
    batch = models.ForeignKey(
        'api.Batch', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='certificates'
    )
    template = models.ForeignKey(
        CertificateTemplate, on_delete=models.SET_NULL,
        null=True, blank=True
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    issue_date = models.DateField(auto_now_add=True)
    completion_date = models.DateField()
    expiry_date = models.DateField(null=True, blank=True)
    issued_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='issued_certificates'
    )
    download_count = models.IntegerField(default=0)
    # auto-generation tracking
    auto_generated = models.BooleanField(default=False)
    revoke_reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('student', 'course')

    def __str__(self):
        return f"{self.certificate_id} — {self.student.get_full_name()} — {self.course.title}"
