from rest_framework import viewsets, status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import Notification, NotificationSettings
from .notification_serializers import NotificationSerializer, NotificationSettingsSerializer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def get_user_from_request(request):
    email = request.query_params.get('email') or request.data.get('email')
    if email:
        return User.objects.filter(email=email).first()
    if request.user.is_authenticated:
        return request.user
@api_view(['GET'])
def get_notifications(request):
    user = get_user_from_request(request)
    if not user:
        return Response({'error': 'Authentication required. Please provide an email.'}, status=status.HTTP_401_UNAUTHORIZED)
        
    notifications = Notification.objects.filter(user=user).order_by('-created_at', '-id')
    
    # Optional filtering
    notif_type = request.GET.get('type', None)
    is_read = request.GET.get('is_read', None)
    
    if notif_type:
        notifications = notifications.filter(notification_type=notif_type)
        
    if is_read is not None:
        if is_read.lower() == 'true':
            notifications = notifications.filter(is_read=True)
        elif is_read.lower() == 'false':
            notifications = notifications.filter(is_read=False)
            
    serializer = NotificationSerializer(notifications, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_unread_notifications(request):
    user = get_user_from_request(request)
    if not user:
        return Response({'error': 'Authentication required. Please provide an email.'}, status=status.HTTP_401_UNAUTHORIZED)
        
    notifications = Notification.objects.filter(user=user, is_read=False).order_by('-created_at', '-id')
    serializer = NotificationSerializer(notifications, many=True)
    return Response({
        'count': notifications.count(),
        'notifications': serializer.data
    })

@api_view(['POST'])
def mark_notifications_read(request):
    user = get_user_from_request(request)
    if not user:
        return Response({'error': 'Authentication required. Please provide an email.'}, status=status.HTTP_401_UNAUTHORIZED)
        
    action = request.data.get('action')
    notification_ids = request.data.get('notification_ids', [])
    
    if action == 'all':
        Notification.objects.filter(user=user, is_read=False).update(is_read=True)
        return Response({'message': 'All notifications marked as read'})
    elif notification_ids:
        Notification.objects.filter(id__in=notification_ids, user=user).update(is_read=True)
        return Response({'message': f'{len(notification_ids)} notifications marked as read'})
    else:
        return Response({'error': 'Please provide notification_ids or action="all"'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def delete_notifications(request):
    user = get_user_from_request(request)
    if not user:
        return Response({'error': 'Authentication required. Please provide an email.'}, status=status.HTTP_401_UNAUTHORIZED)
        
    action = request.data.get('action')
    notification_ids = request.data.get('notification_ids', [])
    
    if action == 'all':
        Notification.objects.filter(user=user).delete()
        return Response({'message': 'All notifications deleted'})
    elif notification_ids:
        Notification.objects.filter(id__in=notification_ids, user=user).delete()
        return Response({'message': f'{len(notification_ids)} notifications deleted'})
    else:
        return Response({'error': 'Please provide notification_ids or action="all"'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT'])
def notification_settings(request):
    user = get_user_from_request(request)
    if not user:
        return Response({'error': 'Authentication required. Please provide an email.'}, status=status.HTTP_401_UNAUTHORIZED)
        
    settings, created = NotificationSettings.objects.get_or_create(user=user)
    
    if request.method == 'GET':
        serializer = NotificationSettingsSerializer(settings)
        return Response(serializer.data)
        
    elif request.method == 'PUT':
        serializer = NotificationSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def send_global_notification(request):
    user = get_user_from_request(request)
    if not user or not hasattr(user, 'profile') or user.profile.role != 'admin':
        return Response({'error': 'Admin authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)
        
    title = request.data.get('title')
    message = request.data.get('message')
    notification_type = request.data.get('type', 'info')
    
    if not title or not message:
        return Response({'error': 'Title and message are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
    users = User.objects.all()
    notifications = [Notification(user=u, title=title, message=message, notification_type=notification_type) for u in users]
    Notification.objects.bulk_create(notifications)
    
    channel_layer = get_channel_layer()
    if channel_layer:
        notif_data = {
            'id': 0,
            'title': title,
            'message': message,
            'type': notification_type,
            'created_at': 'Just now',
            'is_read': False
        }
        async_to_sync(channel_layer.group_send)(
            'notifications_global',
            {
                'type': 'send_notification',
                'notification': notif_data
            }
        )
        
    return Response({'message': 'Global notification sent successfully'})
