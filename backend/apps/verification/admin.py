from django.contrib import admin
from .models import ResultVerification


@admin.register(ResultVerification)
class ResultVerificationAdmin(admin.ModelAdmin):
    list_display = ('student', 'exam', 'verification_token', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('student__user__first_name', 'student__user__last_name', 'student__roll_number', 'exam__name', 'verification_token')
    readonly_fields = ('verification_token', 'created_at', 'updated_at')
