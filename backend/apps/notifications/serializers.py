from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id',
            'title',
            'message',
            'notification_type',
            'is_read',
            'related_entity_type',
            'related_entity_id',
            'created_at',
        ]
        read_only_fields = ['id', 'title', 'message', 'notification_type', 'related_entity_type', 'related_entity_id', 'created_at']


class NotificationUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['is_read']
