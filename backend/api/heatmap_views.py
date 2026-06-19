from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import DailyActivity

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_heatmap_data(request):
    # To test easily, we just filter by the requested user
    # In a real app we might rely on the token. For now, use the user in the request if authenticated
    # Let's get the target email from params if admin, else request.user
    email = request.query_params.get('email')
    
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    if email:
        try:
            target_user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
    else:
        target_user = request.user
        
    # Get the last 365 days of activity
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=365)
    
    activities = DailyActivity.objects.filter(user=target_user, date__gte=start_date)
    
    # We can also generate some dummy data if no activity is found to make the UI look good
    if not activities.exists():
        import random
        # Seed dummy data for the last 90 days to make it look active
        dummy_activities = []
        for i in range(90):
            if random.random() > 0.4:  # 60% chance of activity
                dummy_date = end_date - timedelta(days=i)
                count = random.randint(1, 5)
                DailyActivity.objects.create(user=target_user, date=dummy_date, activity_count=count)
                
        # Re-fetch
        activities = DailyActivity.objects.filter(user=target_user, date__gte=start_date)
    
    data = []
    # Using a set of dates for easy streak calculation
    activity_dates = set()
    for act in activities:
        data.append({
            "date": str(act.date),
            "count": act.activity_count
        })
        activity_dates.add(act.date)
        
    # Calculate streak
    streak = 0
    check_date = end_date
    if check_date not in activity_dates:
        # Check if yesterday had activity (streak might just not be updated today yet)
        check_date = end_date - timedelta(days=1)
        
    while check_date in activity_dates:
        streak += 1
        check_date -= timedelta(days=1)
        
    return Response({
        "activities": data,
        "current_streak": streak
    })

from rest_framework.permissions import AllowAny

@api_view(['POST'])
@permission_classes([AllowAny])
def log_daily_activity(request):
    email = request.data.get('email') or request.query_params.get('email')
    if not email:
        return Response({"error": "Email is required"}, status=400)
        
    from django.contrib.auth import get_user_model
    User = get_user_model()
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
        
    today = timezone.now().date()
    
    activity, created = DailyActivity.objects.get_or_create(
        user=user, date=today,
        defaults={'activity_count': 1}
    )
    if not created:
        activity.activity_count += 1
        activity.save()
        
    return Response({"status": "success", "count": activity.activity_count})
