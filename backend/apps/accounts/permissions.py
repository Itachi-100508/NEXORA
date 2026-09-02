from rest_framework.permissions import BasePermission
from django.contrib.auth import get_user_model

User = get_user_model()


class IsAdmin(BasePermission):
    """
    Allows access only to authenticated users with the ADMIN role or Django superusers.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role == User.Role.ADMIN or request.user.is_superuser)
        )


class IsTeacher(BasePermission):
    """
    Allows access only to authenticated users with the TEACHER role.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == User.Role.TEACHER
        )


class IsStudent(BasePermission):
    """
    Allows access only to authenticated users with the STUDENT role.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == User.Role.STUDENT
        )


class IsAdminOrTeacher(BasePermission):
    """
    Allows access to authenticated users with either ADMIN or TEACHER roles.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role in [User.Role.ADMIN, User.Role.TEACHER] or request.user.is_superuser)
        )


class IsTeacherAssigned(BasePermission):
    """
    Allows access only to authenticated users with role TEACHER who have an active TeacherAssignment
    matching the target subject_id, section_id/class_id, and academic_year_id.
    Evaluates request.user against the database; ignores client-supplied teacher_id parameters.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated and request.user.role == User.Role.TEACHER):
            return False

        subject_id = request.query_params.get('subject_id') or (request.data.get('subject_id') if isinstance(request.data, dict) else None)
        section_id = request.query_params.get('section_id') or (request.data.get('section_id') if isinstance(request.data, dict) else None)
        class_id = request.query_params.get('class_id') or (request.data.get('class_id') if isinstance(request.data, dict) else None)
        academic_year_id = request.query_params.get('academic_year_id') or (request.data.get('academic_year_id') if isinstance(request.data, dict) else None)

        if not subject_id:
            return False

        from apps.academics.models import TeacherAssignment, TeacherProfile
        try:
            profile = TeacherProfile.objects.get(user=request.user)
        except TeacherProfile.DoesNotExist:
            return False

        qs = TeacherAssignment.objects.filter(
            teacher=profile,
            subject_id=subject_id,
            is_active=True
        )

        if section_id:
            qs = qs.filter(section_id=section_id)
        elif class_id:
            qs = qs.filter(section__classroom_id=class_id)

        if academic_year_id:
            qs = qs.filter(academic_year_id=academic_year_id)

        return qs.exists()
