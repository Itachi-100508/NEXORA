from decimal import Decimal
from django.core.exceptions import ValidationError, PermissionDenied
from django.contrib.auth import get_user_model

from apps.academics.models import StudentProfile, TeacherAssignment
from apps.academics.services import is_teacher_assigned
from apps.examinations.models import Exam, ExamSubject, ExamComponent

User = get_user_model()


class MarksValidator:
    """
    Reusable validation engine for student mark entries (Phase 15).
    Enforces the 7 mandatory rules:
    - Rule 1: Marks cannot be negative (obtained_marks >= 0)
    - Rule 2: Marks cannot exceed component maximum (obtained_marks <= component.maximum_marks)
    - Rule 3: Student must belong to correct academic context/semester
    - Rule 4: Teacher must be assigned via TeacherAssignment (bypassed for ADMIN)
    - Rule 5: Exam status must be ACTIVE
    - Rule 6: Duplicate mark entry handling / unique student + component rule
    - Rule 7: Locked or published result validation hook
    """

    @classmethod
    def check_locked_or_published_state(cls, exam, student=None):
        """
        Rule 7: Validation hook checking whether the examination/result is locked or published.
        If parent exam status is COMPLETED or locked, modifications are rejected.
        """
        if not exam:
            return

        if exam.status == Exam.Status.COMPLETED:
            raise ValidationError({"detail": "This result is locked and cannot be modified normally."})

    @classmethod
    def validate(cls, user, student, exam_component, obtained_marks, is_update=False):
        """
        Executes all 7 validation rules against user, student, exam_component, and obtained_marks.
        Raises ValidationError or PermissionDenied if any rule fails.
        """
        # Rule 4 (Part A): Authentication & Role Check
        if not user or not user.is_authenticated:
            raise PermissionDenied("Authentication credentials were not provided.")

        if user.role not in [User.Role.ADMIN, User.Role.TEACHER] and not user.is_superuser:
            raise PermissionDenied("You do not have permission to record student marks.")

        # Rule 3: Student Active Status & Academic Context Validation
        if not student:
            raise ValidationError({"student_id": ["Selected student profile does not exist."]})
        if not student.is_active or not student.user.is_active:
            raise ValidationError({"student_id": ["Selected student profile is inactive."]})

        # Rule 5: Exam & Component Validation (Exam must be ACTIVE, Component must be active)
        if not exam_component:
            raise ValidationError({"exam_component_id": ["Selected examination component does not exist."]})
        if not exam_component.is_active:
            raise ValidationError({"detail": "This examination component is inactive."})

        exam_subject = exam_component.exam_subject
        if not exam_subject:
            raise ValidationError({"exam_component_id": ["Examination subject mapping does not exist."]})

        exam = exam_subject.exam
        if not exam:
            raise ValidationError({"exam_component_id": ["Parent examination does not exist."]})

        # Rule 5: Exam status must be ACTIVE
        if exam.status != Exam.Status.ACTIVE:
            raise ValidationError({"detail": "Marks can only be entered while the examination is active."})

        # Rule 7: Locked or Published State Hook
        cls.check_locked_or_published_state(exam, student)

        # Rule 3: Student Academic Context Check (Semester Match)
        if student.section and student.section.classroom and student.section.classroom.semester:
            if student.section.classroom.semester != exam.semester:
                raise ValidationError({"student_id": ["Student does not belong to the academic context of this examination."]})

        # Rule 4 (Part B): Teacher Assignment Authorization
        if user.role == User.Role.TEACHER and not user.is_superuser:
            if not hasattr(user, 'teacher_profile'):
                raise PermissionDenied({"detail": "You do not have permission to record student marks."})

            tp = user.teacher_profile
            sub = exam_subject.subject
            ay = exam.academic_year
            sec = student.section

            if not sec or not is_teacher_assigned(tp, sub, sec, ay):
                raise PermissionDenied({"detail": "You are not assigned to this subject/class."})

        # Rule 1: Marks Cannot Be Negative
        try:
            obtained_dec = Decimal(str(obtained_marks))
        except Exception:
            raise ValidationError({"obtained_marks": ["Invalid decimal value for obtained marks."]})

        if obtained_dec < Decimal('0.00'):
            raise ValidationError({"obtained_marks": ["Marks cannot be negative."]})

        # Rule 2: Marks Cannot Exceed Component Maximum
        if obtained_dec > exam_component.maximum_marks:
            raise ValidationError({"obtained_marks": ["Marks cannot exceed the maximum marks for this component."]})

        return obtained_dec
