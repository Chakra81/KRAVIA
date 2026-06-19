from django.urls import path
from .views import (
    session_list_create, session_detail,
    start_session, end_session,
    upload_material, room_status,
)

urlpatterns = [
    path('', session_list_create, name='session-list-create'),
    path('<int:pk>/', session_detail, name='session-detail'),
    path('<int:pk>/start/', start_session, name='start-session'),
    path('<int:pk>/end/', end_session, name='end-session'),
    path('<int:pk>/materials/', upload_material, name='upload-material'),
    path('<int:pk>/room-status/', room_status, name='room-status'),   # NEW
]
