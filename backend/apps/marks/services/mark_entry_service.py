from decimal import Decimal
from django.db import transaction, IntegrityError
from django.core.exceptions import ValidationError, PermissionDenied

from apps.academics.models import StudentProfile
from apps.examinations.models import ExamComponent
from apps.marks.models import MarkEntry
from apps.audit.services import log_action
from .marks_validator import MarksValidator


@transaction.atomic
def create_or_update_mark_entry(user, student_id, exam_component_id, obtained_marks, exam_subject_id=None, request=None):
    """
    Service layer function to validate and record (create or update) a MarkEntry.
    Routes validation through MarksValidator (Phase 15).
    Logs audit events for CREATE and UPDATE actions (Phase 21).
    Handles database IntegrityError safely if concurrent requests occur (Rule 6).
    """
    # Resolve Student
    try:
        student = StudentProfile.objects.select_related('user', 'section', 'section__classroom', 'section__classroom__semester').get(id=student_id)
    except StudentProfile.DoesNotExist:
        raise ValidationError({"student_id": ["Selected student profile does not exist."]})

    # Resolve ExamComponent
    try:
        comp = ExamComponent.objects.select_related(
            'exam_subject',
            'exam_subject__exam',
            'exam_subject__exam__academic_year',
            'exam_subject__exam__semester',
            'exam_subject__subject'
        ).get(id=exam_component_id)
    except ExamComponent.DoesNotExist:
        raise ValidationError({"exam_component_id": ["Selected examination component does not exist."]})

    if exam_subject_id and comp.exam_subject_id != int(exam_subject_id):
        raise ValidationError({"exam_component_id": ["ExamComponent does not match the provided ExamSubject."]})

    # Check if update
    existing_entry = MarkEntry.objects.filter(student=student, exam_component=comp).first()
    is_update = existing_entry is not None
    old_obtained = str(existing_entry.obtained_marks) if existing_entry else None

    # Run MarksValidator (7 Rules)
    obtained_dec = MarksValidator.validate(
        user=user,
        student=student,
        exam_component=comp,
        obtained_marks=obtained_marks,
        is_update=is_update
    )

    # Upsert within transaction.atomic
    try:
        if existing_entry:
            existing_entry.obtained_marks = obtained_dec
            existing_entry.updated_by = user
            existing_entry.is_active = True
            existing_entry.save()

            log_action(
                user=user,
                action='UPDATE',
                entity_type='MarkEntry',
                entity_id=existing_entry.id,
                description=f"Updated mark entry for {student.user.get_full_name()} ({comp.name}) from {old_obtained} to {obtained_dec}",
                old_data={"obtained_marks": old_obtained},
                new_data={"obtained_marks": str(obtained_dec)},
                request=request
            )
            return existing_entry, False
        else:
            mark_entry, created = MarkEntry.objects.get_or_create(
                student=student,
                exam_component=comp,
                defaults={
                    "obtained_marks": obtained_dec,
                    "entered_by": user,
                    "is_active": True,
                }
            )
            if not created:
                mark_entry.obtained_marks = obtained_dec
                mark_entry.updated_by = user
                mark_entry.is_active = True
                mark_entry.save()

            act_name = 'CREATE' if created else 'UPDATE'
            log_action(
                user=user,
                action=act_name,
                entity_type='MarkEntry',
                entity_id=mark_entry.id,
                description=f"Recorded mark entry for {student.user.get_full_name()} ({comp.name}): {obtained_dec}",
                old_data={"obtained_marks": old_obtained} if not created else None,
                new_data={"obtained_marks": str(obtained_dec)},
                request=request
            )
            return mark_entry, created
    except IntegrityError:
        # Fallback for concurrent duplicate creation
        mark_entry = MarkEntry.objects.get(student=student, exam_component=comp)
        old_val = str(mark_entry.obtained_marks)
        mark_entry.obtained_marks = obtained_dec
        mark_entry.updated_by = user
        mark_entry.is_active = True
        mark_entry.save()

        log_action(
            user=user,
            action='UPDATE',
            entity_type='MarkEntry',
            entity_id=mark_entry.id,
            description=f"Updated mark entry for {student.user.get_full_name()} ({comp.name}) to {obtained_dec}",
            old_data={"obtained_marks": old_val},
            new_data={"obtained_marks": str(obtained_dec)},
            request=request
        )
        return mark_entry, False
