from django.contrib import admin
from .models import MarkEntry, MarkCorrectionRequest


@admin.register(MarkEntry)
class MarkEntryAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'exam_component', 'obtained_marks', 'entered_by', 'is_active', 'created_at')
    list_filter = ('exam_component__exam_subject__exam', 'exam_component__exam_subject__subject', 'is_active')
    search_fields = (
        'student__user__first_name',
        'student__user__last_name',
        'student__roll_number',
        'exam_component__name',
        'exam_component__code',
        'exam_component__exam_subject__subject__code',
        'exam_component__exam_subject__subject__name',
        'exam_component__exam_subject__exam__name',
    )


@admin.register(MarkCorrectionRequest)
class MarkCorrectionRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'mark_entry', 'get_student', 'get_subject', 'old_marks', 'requested_marks', 'status', 'requested_by', 'reviewed_by', 'created_at')
    list_filter = ('status', 'requested_by', 'reviewed_by', 'created_at')
    search_fields = (
        'mark_entry__student__user__first_name',
        'mark_entry__student__user__last_name',
        'mark_entry__student__roll_number',
        'reason',
        'review_comment',
    )

    def get_student(self, obj):
        return obj.mark_entry.student.user.get_full_name() if (obj.mark_entry and obj.mark_entry.student and obj.mark_entry.student.user) else ""
    get_student.short_description = "Student"

    def get_subject(self, obj):
        return obj.mark_entry.exam_component.exam_subject.subject.name if (obj.mark_entry and obj.mark_entry.exam_component and obj.mark_entry.exam_component.exam_subject and obj.mark_entry.exam_component.exam_subject.subject) else ""
    get_subject.short_description = "Subject"
