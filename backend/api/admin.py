from django.contrib import admin
from .models import Profile, Course, Batch, Enrollment, Lesson, ChatMessage
from .fee_models import StudentFee, Payment, Installment, Receipt
from .certificate_models import Certificate, CertificateTemplate
from .models import Notification, NotificationSettings

@admin.register(CertificateTemplate)
class CertificateTemplateAdmin(admin.ModelAdmin):
    list_display = ('title', 'institute_name', 'is_active', 'created_at')
    list_filter = ('is_active',)

@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ('certificate_id', 'student', 'course', 'status', 'issue_date', 'download_count')
    list_filter = ('status', 'course', 'auto_generated')
    search_fields = ('certificate_id', 'student__first_name', 'student__email', 'course__title')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'notification_type', 'priority', 'is_read', 'created_at')
    list_filter = ('notification_type', 'priority', 'is_read', 'created_at')
    search_fields = ('title', 'message', 'user__username')

@admin.register(NotificationSettings)
class NotificationSettingsAdmin(admin.ModelAdmin):
    list_display = ('user', 'email_notifications', 'push_notifications', 'in_app_notifications')
    search_fields = ('user__email', 'user__first_name')

@admin.register(StudentFee)
class StudentFeeAdmin(admin.ModelAdmin):
    list_display = ('student', 'course', 'total_fee', 'paid_amount', 'status', 'due_date')
    list_filter = ('status', 'course', 'payment_type')
    search_fields = ('student__first_name', 'student__email', 'course__title')

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('transaction_id', 'student', 'amount', 'payment_method', 'payment_date', 'status')
    list_filter = ('status', 'payment_method', 'payment_date')
    search_fields = ('transaction_id', 'student__first_name', 'student__email')

@admin.register(Installment)
class InstallmentAdmin(admin.ModelAdmin):
    list_display = ('student_fee', 'installment_number', 'amount', 'due_date', 'status')
    list_filter = ('status',)

@admin.register(Receipt)
class ReceiptAdmin(admin.ModelAdmin):
    list_display = ('receipt_number', 'payment', 'generated_at')
    search_fields = ('receipt_number',)

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'receiver', 'message_snippet', 'timestamp')
    list_filter = ('timestamp', 'sender', 'receiver')
    search_fields = ('message', 'sender__email', 'receiver__email')
    
    def message_snippet(self, obj):
        return obj.message[:50]
    message_snippet.short_description = 'Message'

@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'created_at')
    list_filter = ('course',)
    search_fields = ('title', 'course__title')

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('get_username', 'get_full_name', 'role', 'is_approved')
    list_filter = ('role', 'is_approved')
    search_fields = ('user__username', 'user__email', 'user__first_name')
    
    def get_username(self, obj):
        return obj.user.username if obj.user else "No User"
    get_username.short_description = 'Username'
    
    def get_full_name(self, obj):
        if not obj.user: return "No User"
        return obj.user.get_full_name() or obj.user.first_name or obj.user.email
    get_full_name.short_description = 'Full Name'

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'duration_weeks', 'created_at')
    search_fields = ('title',)

@admin.register(Batch)
class BatchAdmin(admin.ModelAdmin):
    list_display = ('name', 'get_course_title', 'trainer', 'start_date', 'end_date')
    list_filter = ('course', 'trainer', 'start_date')
    search_fields = ('name', 'course__title', 'trainer__username')
    
    def get_course_title(self, obj):
        return obj.course.title
    get_course_title.short_description = 'Course'

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('get_student_name', 'get_batch_course', 'status', 'joined_date')
    list_filter = ('status', 'batch__course')
    search_fields = ('student__username', 'student__email', 'student__first_name', 'batch__name')
    
    def get_student_name(self, obj):
        return f"{obj.student.first_name} ({obj.student.email})"
    get_student_name.short_description = 'Student'
    
    def get_batch_course(self, obj):
        return obj.batch.course.title
    get_batch_course.short_description = 'Course'
