from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import AssignmentSubmission, ExamResult, Enrollment, Notification
from .notification_serializers import NotificationSerializer

@receiver(post_save, sender=AssignmentSubmission)
def assignment_submission_notification(sender, instance, created, **kwargs):
    if created or instance.status == 'resubmitted':
        trainer = instance.assignment.batch.trainer
        if trainer:
            Notification.objects.create(
                user=trainer,
                title="New Assignment Submission",
                message=f"Student {instance.student.username} has submitted '{instance.assignment.title}'.",
                notification_type='assignment',
                priority='info'
            )
    else:
        if instance.status == 'evaluated':
            Notification.objects.create(
                user=instance.student,
                title="Assignment Graded",
                message=f"Your submission for '{instance.assignment.title}' has been graded. Score: {instance.score}/{instance.assignment.max_score}.",
                notification_type='assignment',
                priority='success'
            )
        elif instance.status == 'rework':
            Notification.objects.create(
                user=instance.student,
                title="Assignment Needs Rework",
                message=f"Your submission for '{instance.assignment.title}' needs rework. Please check the feedback.",
                notification_type='assignment',
                priority='warning'
            )

@receiver(post_save, sender=ExamResult)
def exam_result_notification(sender, instance, created, **kwargs):
    if created:
        status = "Passed" if instance.passed else "Failed"
        priority = 'success' if instance.passed else 'warning'
        Notification.objects.create(
            user=instance.student,
            title=f"Exam Result: {status}",
            message=f"You scored {instance.score}/{instance.total_marks} in '{instance.exam.title}'.",
            notification_type='exam',
            priority=priority
        )

@receiver(post_save, sender=Enrollment)
def enrollment_notification(sender, instance, created, **kwargs):
    if created:
        Notification.objects.create(
            user=instance.student,
            title="Course Enrollment",
            message=f"You have been successfully enrolled in '{instance.batch.name}' ({instance.batch.course.title}).",
            notification_type='course',
            priority='info'
        )

@receiver(post_save, sender=Notification)
def send_notification_websocket(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        group_name = f'notifications_{instance.user.id}' if instance.user else 'notifications_global'
        
        # Serialize the notification
        serializer = NotificationSerializer(instance)
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'send_notification',
                'notification': serializer.data
            }
        )
