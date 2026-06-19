from django.urls import path
from .views import (
    send_otp, verify_otp, add_admin, admin_login_direct, trainer_login_direct, logout_user, change_password, 
    AdminAnalyticsView,
    reset_password, add_student, student_login, list_students, 
    update_student, delete_student, approve_student, approve_all_students,
    get_trainer_dashboard, list_courses, create_course, update_course, delete_course,
    get_course, create_lesson, update_lesson, delete_lesson,
    get_messages, send_message, list_admins, unread_counts,
    admin_detail, list_trainers, trainer_detail, list_enrollments, enrollment_detail,
    ai_chat, ai_summarize_pdf, ai_get_recommendations, ai_chat_history,
    list_student_exams, get_exam_details, submit_exam, get_leaderboard
)
from .trainer_admin_views import (
    manage_course_assignment, manage_course_assignment_detail,
    trainer_my_courses, trainer_my_students
)
from .assignment_views import (
    assignments_view, submissions_view, grade_submission, assignment_detail_view,
    ai_assignment_feedback, student_assignment_history, admin_assignment_analytics,
    update_submission_status
)
from .study_planner_views import (
    student_goals, generate_study_plan, get_study_plans, update_task_status, get_progress
)
from .fee_views import (
    fee_analytics, student_fees_view, student_fee_detail,
    collect_fee, payment_history, get_receipt, student_fee_summary,
    manage_installments, auto_assign_fees
)
from .certificate_views import (
    certificates_view, certificate_detail, verify_certificate,
    increment_download,    certificate_analytics,
    auto_generate_certificates,
    certificate_templates
)

from .notification_views import (
    get_notifications,
    get_unread_notifications,
    mark_notifications_read,
    delete_notifications,
    notification_settings,
    send_global_notification
)
from .resume_views import (
    get_resume, update_resume, get_ats_score, generate_summary, download_resume,
    restore_version, delete_version, import_platform_data, delete_resume
)

urlpatterns = [
    path('send-otp/', send_otp),
    path('verify-otp/', verify_otp),
    path('add-admin/', add_admin),
    path('admin-login-direct/', admin_login_direct),
    path('trainer-login-direct/', trainer_login_direct),
    path('logout/', logout_user),
    path('change-password/', change_password),
    path('reset-password/', reset_password),
    path('add-student/', add_student),
    path('student-login/', student_login),
    path('list-students/', list_students),
    path('list-admins/', list_admins),
    path('update-student/<int:pk>/', update_student, name='update-student'),
    path('delete-student/<int:pk>/', delete_student, name='delete-student'),
    path('approve-student/<int:pk>/', approve_student, name='approve-student'),
    path('approve-all-students/', approve_all_students, name='approve-all-students'),
    path('trainer-dashboard/', get_trainer_dashboard, name='trainer-dashboard'),
    path('list-courses/', list_courses, name='list-courses'),
    path('get-course/<int:pk>/', get_course, name='get-course'),
    path('create-course/', create_course, name='create-course'),
    path('update-course/<int:pk>/', update_course, name='update-course'),
    path('delete-course/<int:pk>/', delete_course, name='delete-course'),
    path('create-lesson/', create_lesson, name='create-lesson'),
    path('update-lesson/<int:pk>/', update_lesson, name='update-lesson'),
    path('delete-lesson/<int:pk>/', delete_lesson, name='delete-lesson'),
    path('get-messages/', get_messages, name='get-messages'),
    path('send-message/', send_message, name='send-message'),
    path('unread-counts/', unread_counts, name='unread-counts'),
    path('admin-detail/<int:pk>/', admin_detail, name='admin-detail'),
    path('list-trainers/', list_trainers, name='list-trainers'),
    path('trainer-detail/<int:pk>/', trainer_detail, name='trainer-detail'),
    path('list-enrollments/', list_enrollments, name='list-enrollments'),
    path('enrollment-detail/<int:pk>/', enrollment_detail, name='enrollment-detail'),
    
    # Trainer Management Endpoints
    path('course-assignments/', manage_course_assignment, name='course-assignments'),
    path('course-assignments/<int:pk>/', manage_course_assignment_detail, name='course-assignments-detail'),
    path('trainer/my-courses/', trainer_my_courses, name='trainer-my-courses'),
    path('trainer/my-students/', trainer_my_students, name='trainer-my-students'),
    
    # AI Assistant Endpoints
    path('ai/chat/', ai_chat, name='ai-chat'),
    path('ai/summarize/', ai_summarize_pdf, name='ai-summarize'),
    path('ai/recommend/', ai_get_recommendations, name='ai-recommend'),
    path('ai/history/', ai_chat_history, name='ai-history'),
    # Exam Endpoints
    path('student/exams/', list_student_exams, name='student-exams'),
    path('exam/start/<int:exam_id>/', get_exam_details, name='exam-details'),
    path('exam/submit/', submit_exam, name='exam-submit'),
    path('exam/leaderboard/', get_leaderboard, name='leaderboard'),
    path('exam/leaderboard/<str:domain>/', get_leaderboard, name='leaderboard-domain'),
    
    # Assignment Endpoints
    path('assignments/', assignments_view, name='assignments'),
    path('assignments/<int:assignment_id>/', assignment_detail_view, name='assignment-detail'),
    path('assignments/<int:assignment_id>/submissions/', submissions_view, name='submissions'),
    path('assignments/submissions/<int:submission_id>/grade/', grade_submission, name='grade-submission'),
    path('assignments/submissions/<int:submission_id>/status/', update_submission_status, name='submission-status'),
    path('assignments/submissions/<int:submission_id>/ai-feedback/', ai_assignment_feedback, name='ai-assignment-feedback'),
    path('assignments/history/', student_assignment_history, name='assignment-history'),
    path('assignments/analytics/', admin_assignment_analytics, name='assignment-analytics'),

    # Study Planner Endpoints
    path('study-plan/goals/', student_goals, name='student-goals'),
    path('study-plan/generate/', generate_study_plan, name='generate-study-plan'),
    path('study-plan/plans/', get_study_plans, name='get-study-plans'),
    path('study-plan/task/<int:task_id>/update/', update_task_status, name='update-task-status'),
    path('study-plan/progress/', get_progress, name='get-progress'),

    # ── Fee Management Endpoints ──────────────────────────────
    path('fees/', student_fees_view, name='fees-list'),
    path('fees/analytics/', fee_analytics, name='fee-analytics'),
    path('fees/collect/', collect_fee, name='fee-collect'),
    path('fees/history/', payment_history, name='payment-history'),
    path('fees/my/', student_fee_summary, name='student-fee-summary'),
    path('fees/auto-assign/', auto_assign_fees, name='auto-assign-fees'),
    path('fees/<int:fee_id>/', student_fee_detail, name='fee-detail'),
    path('fees/<int:fee_id>/installments/', manage_installments, name='fee-installments'),
    path('fees/receipt/<int:payment_id>/', get_receipt, name='fee-receipt'),

    # ── Certificate Endpoints ─────────────────────────────
    path('certificates/', certificates_view, name='certificates-list'),
    path('certificates/analytics/', certificate_analytics, name='cert-analytics'),
    path('certificates/auto-generate/', auto_generate_certificates, name='cert-auto-generate'),
    path('certificates/templates/', certificate_templates, name='cert-templates'),
    path('certificates/<int:cert_id>/', certificate_detail, name='cert-detail'),
    path('certificates/<int:cert_id>/download/', increment_download, name='cert-download'),
    path('certificates/verify/<str:certificate_id>/', verify_certificate, name='cert-verify'),

    # ── Notification Endpoints ─────────────────────────────
    path('notifications/', get_notifications, name='notifications-list'),
    path('notifications/unread/', get_unread_notifications, name='notifications-unread'),
    path('notifications/read/', mark_notifications_read, name='notifications-read'),
    path('notifications/delete/', delete_notifications, name='notifications-delete'),
    path('notifications/settings/', notification_settings, name='notifications-settings'),
    path('notifications/send-global/', send_global_notification, name='send-global-notification'),

    # ─────────────────────────────────────────────────────────
    # Analytics & Placements
    # ─────────────────────────────────────────────────────────
    path('admin-analytics/', AdminAnalyticsView.as_view(), name='admin-analytics'),

    # ─────────────────────────────────────────────────────────
    # Resume Builder & ATS
    # ─────────────────────────────────────────────────────────
    path('resume/', get_resume, name='resume-get'),
    path('resume/update/', update_resume, name='resume-update'),
    path('resume/ats-score/', get_ats_score, name='resume-ats-score'),
    path('resume/generate-summary/', generate_summary, name='resume-generate-summary'),
    path('resume/download/', download_resume, name='resume-download'),
    path('resume/restore-version/', restore_version, name='resume-restore-version'),
    path('resume/delete-version/<int:version_id>/', delete_version, name='resume-delete-version'),
    path('resume/import-data/', import_platform_data, name='resume-import-data'),
    path('resume/delete/', delete_resume, name='resume-delete'),
]

from rest_framework.routers import DefaultRouter
from .views import PlacementViewSet
router = DefaultRouter()
router.register(r'placements', PlacementViewSet, basename='placement')
urlpatterns += router.urls

# ─────────────────────────────────────────────────────────
# JWT REFRESH TOKEN ROTATION ENDPOINTS
# ─────────────────────────────────────────────────────────
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView
from .auth_views import jwt_logout, jwt_logout_all_devices
urlpatterns += [
    path('auth/token/', TokenObtainPairView.as_view(), name='token-obtain'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/logout/', jwt_logout, name='jwt-logout'),
    path('auth/logout-all/', jwt_logout_all_devices, name='jwt-logout-all'),
]

# ─────────────────────────────────────────────────────────
# TRAINER ANALYTICS DASHBOARD ENDPOINTS
# ─────────────────────────────────────────────────────────
from .analytics_views import (
    trainer_analytics_summary,
    trainer_student_progress,
    trainer_batch_enrollment_chart,
    trainer_assignment_stats,
)
urlpatterns += [
    path('trainer/analytics/summary/', trainer_analytics_summary, name='trainer-analytics-summary'),
    path('trainer/analytics/student-progress/', trainer_student_progress, name='trainer-student-progress'),
    path('trainer/analytics/batch-chart/', trainer_batch_enrollment_chart, name='trainer-batch-chart'),
    path('trainer/analytics/assignments/', trainer_assignment_stats, name='trainer-assignment-stats'),
]

# ─────────────────────────────────────────────────────────
# HEATMAP ENDPOINTS
# ─────────────────────────────────────────────────────────
from . import heatmap_views
urlpatterns += [
    path('heatmap/', heatmap_views.get_heatmap_data, name='get_heatmap_data'),
    path('heatmap/log/', heatmap_views.log_daily_activity, name='log_daily_activity'),
]
