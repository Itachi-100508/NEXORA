from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom Django Admin interface for User management.
    Allows viewing, editing, and assigning application roles (ADMIN, TEACHER, STUDENT).
    """
    fieldsets = BaseUserAdmin.fieldsets + (
        ('PR-TERRA Role & Access', {'fields': ('role',)}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('PR-TERRA Role & Access', {'fields': ('email', 'role')}),
    )
    list_display = ('id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'is_staff', 'is_superuser')
    list_filter = ('role', 'is_active', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('id',)
