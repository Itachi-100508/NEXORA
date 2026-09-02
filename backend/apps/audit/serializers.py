from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            'id',
            'user',
            'action',
            'entity_type',
            'entity_id',
            'description',
            'old_data',
            'new_data',
            'ip_address',
            'created_at',
        ]

    def get_user(self, obj):
        if not obj.user:
            return None
        return {
            "id": obj.user.id,
            "name": obj.user.get_full_name(),
            "username": obj.user.username,
            "role": obj.user.role,
        }
