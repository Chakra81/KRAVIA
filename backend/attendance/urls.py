from django.urls import path
from .views import join_session, leave_session, attendance_analytics

urlpatterns = [
    path('join/', join_session, name='join-session'),
    path('leave/', leave_session, name='leave-session'),
    path('analytics/', attendance_analytics, name='attendance-analytics'),
]
