from rest_framework import serializers
from .certificate_models import Certificate, CertificateTemplate


class CertificateTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CertificateTemplate
        fields = '__all__'


class CertificateSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_email = serializers.SerializerMethodField()
    course_title = serializers.SerializerMethodField()
    batch_name = serializers.SerializerMethodField()
    issued_by_name = serializers.SerializerMethodField()
    template_data = CertificateTemplateSerializer(source='template', read_only=True)

    class Meta:
        model = Certificate
        fields = [
            'id', 'certificate_id', 'student', 'student_name', 'student_email',
            'course', 'course_title', 'batch', 'batch_name',
            'template', 'template_data', 'status', 'issue_date',
            'completion_date', 'expiry_date', 'issued_by', 'issued_by_name',
            'download_count', 'auto_generated', 'revoke_reason',
            'created_at', 'updated_at'
        ]

    def get_student_name(self, obj):
        return obj.student.get_full_name() or obj.student.username

    def get_student_email(self, obj):
        return obj.student.email

    def get_course_title(self, obj):
        return obj.course.title

    def get_batch_name(self, obj):
        return obj.batch.name if obj.batch else ''

    def get_issued_by_name(self, obj):
        if obj.issued_by:
            return obj.issued_by.get_full_name() or obj.issued_by.username
        return 'System'
