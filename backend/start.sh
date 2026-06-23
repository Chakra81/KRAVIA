#!/bin/bash

# Run database migrations
python manage.py migrate --noinput

# Create superuser if it doesn't already exist
python manage.py shell << 'EOF'
from django.contrib.auth.models import User
from api.models import Profile

email = 'gsna42474@gmail.com'
password = 'admin123'

if not User.objects.filter(email=email).exists():
    user = User.objects.create_superuser(username=email, email=email, password=password, first_name='Admin')
    Profile.objects.get_or_create(user=user, defaults={'role': 'admin', 'raw_password': password, 'is_approved': True})
    print(f"Superuser created: {email}")
else:
    user = User.objects.get(email=email)
    # Ensure profile exists with admin role
    profile, created = Profile.objects.get_or_create(user=user, defaults={'role': 'admin', 'raw_password': password, 'is_approved': True})
    if not created and profile.role != 'admin':
        profile.role = 'admin'
        profile.is_approved = True
        profile.save()
    print(f"Superuser already exists: {email}")
EOF

# Start server
exec gunicorn backend.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120
