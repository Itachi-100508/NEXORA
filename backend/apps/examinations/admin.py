from django.contrib import admin
from .models import Exam, ExamSubject, ExamComponent


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'academic_year', 'semester', 'status', 'created_at')
    list_filter = ('academic_year', 'semester', 'status')
    search_fields = ('name', 'description', 'academic_year__name', 'semester__name')


@admin.register(ExamSubject)
class ExamSubjectAdmin(admin.ModelAdmin):
    list_display = ('id', 'exam', 'subject', 'maximum_marks', 'passing_marks', 'is_active', 'display_order')
    list_filter = ('exam', 'subject', 'is_active')
    search_fields = ('exam__name', 'subject__code', 'subject__name')


@admin.register(ExamComponent)
class ExamComponentAdmin(admin.ModelAdmin):
    list_display = ('id', 'exam_subject', 'name', 'code', 'maximum_marks', 'passing_marks', 'is_active', 'display_order')
    list_filter = ('exam_subject__exam', 'is_active')
    search_fields = ('name', 'code', 'exam_subject__subject__code', 'exam_subject__subject__name', 'exam_subject__exam__name')
