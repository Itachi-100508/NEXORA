from django.contrib import admin
from .models import (
    AcademicYear,
    Department,
    Program,
    Semester,
    Classroom,
    Section,
    Subject,
    StudentProfile,
    TeacherProfile,
    TeacherAssignment,
)


@admin.register(AcademicYear)
class AcademicYearAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'start_date', 'end_date', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name',)


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'code', 'name', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('code', 'name')


@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ('id', 'code', 'name', 'department', 'duration_years', 'is_active')
    list_filter = ('department', 'is_active')
    search_fields = ('code', 'name', 'department__code')


@admin.register(Semester)
class SemesterAdmin(admin.ModelAdmin):
    list_display = ('id', 'program', 'number', 'name', 'created_at')
    list_filter = ('program',)
    search_fields = ('name', 'program__code')


@admin.register(Classroom)
class ClassroomAdmin(admin.ModelAdmin):
    list_display = ('id', 'code', 'name', 'program', 'semester', 'academic_year', 'is_active')
    list_filter = ('academic_year', 'program', 'semester', 'is_active')
    search_fields = ('code', 'name')


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ('id', 'classroom', 'code', 'name', 'capacity', 'is_active')
    list_filter = ('classroom', 'is_active')
    search_fields = ('code', 'name', 'classroom__code')


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('id', 'code', 'name', 'department', 'semester', 'credits', 'is_active')
    list_filter = ('department', 'semester', 'is_active')
    search_fields = ('code', 'name', 'department__code', 'semester__name')


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'enrollment_number', 'roll_number', 'user', 'classroom', 'section', 'is_active')
    list_filter = ('classroom', 'section', 'is_active')
    search_fields = ('enrollment_number', 'roll_number', 'user__username', 'user__email')


@admin.register(TeacherProfile)
class TeacherProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'employee_id', 'user', 'designation', 'department', 'is_active')
    list_filter = ('department', 'is_active')
    search_fields = ('employee_id', 'designation', 'user__username', 'user__email')


@admin.register(TeacherAssignment)
class TeacherAssignmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'teacher', 'subject', 'section', 'academic_year', 'is_active', 'created_at')
    list_filter = ('academic_year', 'subject', 'section', 'is_active')
    search_fields = ('teacher__employee_id', 'teacher__user__username', 'subject__code', 'subject__name', 'section__name')
