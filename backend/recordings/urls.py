from django.urls import path
from .views import recording_list_create

urlpatterns = [
    path('', recording_list_create, name='recording-list-create'),
]
