import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import ChatMessage

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.room_group_name = f'chat_{self.user_id}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        
        # Optionally mark user as online here if needed

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        action = text_data_json.get('action')

        if action == 'status_update':
            message_ids = text_data_json.get('message_ids', [])
            status = text_data_json.get('status')
            sender_id = text_data_json.get('sender_id')

            if message_ids and status in ['delivered', 'read']:
                await self.update_message_status(message_ids, status)
                
                # Notify the sender that their messages were delivered/read
                await self.channel_layer.group_send(
                    f'chat_{sender_id}',
                    {
                        'type': 'chat_status',
                        'message_ids': message_ids,
                        'status': status,
                        'receiver_id': self.user_id
                    }
                )
        elif action == 'typing':
            receiver_email = text_data_json.get('receiver_email')
            
            if receiver_email:
                # Look up receiver user ID from email
                receiver = await self.get_user_by_email(receiver_email)
                sender = await self.get_user_by_id(self.user_id)
                if receiver and sender:
                    await self.channel_layer.group_send(
                        f'chat_{receiver.id}',
                        {
                            'type': 'chat_typing',
                            'sender_id': self.user_id,
                            'sender_email': sender.email,
                        }
                    )

    # Receive message from room group
    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'message': event['message']
        }))

    async def chat_status(self, event):
        # Send status update to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'status_update',
            'message_ids': event['message_ids'],
            'status': event['status'],
            'receiver_id': event.get('receiver_id')
        }))

    async def chat_typing(self, event):
        # Send typing event to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'sender_id': event['sender_id'],
            'sender_email': event.get('sender_email', ''),
        }))

    @database_sync_to_async
    def get_user_by_email(self, email):
        try:
            return User.objects.get(email=email)
        except User.DoesNotExist:
            return None

    @database_sync_to_async
    def get_user_by_id(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None

    @database_sync_to_async
    def update_message_status(self, message_ids, status):
        now = timezone.now()
        for msg_id in message_ids:
            try:
                msg = ChatMessage.objects.get(id=msg_id)
                # Only update if moving forward in status (sent -> delivered -> read)
                if status == 'delivered' and msg.status == 'sent':
                    msg.status = status
                    msg.delivered_at = now
                    msg.save()
                elif status == 'read' and msg.status in ['sent', 'delivered']:
                    msg.status = status
                    msg.is_read = True
                    msg.read_at = now
                    msg.save()
            except ChatMessage.DoesNotExist:
                pass

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.room_group_name = f'notifications_{self.user_id}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        # Join global notifications group
        await self.channel_layer.group_add(
            'notifications_global',
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        # Leave global notifications group
        await self.channel_layer.group_discard(
            'notifications_global',
            self.channel_name
        )

    # Receive message from room group
    async def send_notification(self, event):
        notification = event['notification']
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'new_notification',
            'notification': notification
        }))
