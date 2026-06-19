import os
import django
import sys

# Set up django
sys.path.append(r'c:\Users\CHAKRAVENI\OneDrive\Desktop\my_new_project\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from live_sessions.models import LiveSession

for session in LiveSession.objects.all():
    print(f"ID: {session.id} | Title: {session.title} | start_time: {session.start_time} | end_time: {session.end_time}")
