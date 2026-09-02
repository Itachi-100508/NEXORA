from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'action', 'entity_type', 'entity_id', 'description', 'ip_address', 'created_at')
    list_filter = ('action', 'entity_type', 'created_at')
    search_fields = ('description', 'entity_type', 'entity_id', 'user__first_name', 'user__last_name', 'user__username', 'ip_address')
    readonly_fields = ('user', 'action', 'entity_type', 'entity_id', 'description', 'old_data', 'new_data', 'ip_address', 'created_at')

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False
