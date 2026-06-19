import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from django.contrib.auth.models import User

for u in User.objects.all():
    print(u.email, getattr(u, 'profile', None) and u.profile.role)
