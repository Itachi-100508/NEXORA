from decimal import Decimal
from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model

from apps.academics.models import StudentProfile
from apps.examinations.models import Exam, ExamComponent

User = get_user_model()


class MarkEntry(models.Model):
    """
    Stores obtained marks for a specific Student and ExamComponent.
    Enforces obtained_marks <= ExamComponent.maximum_marks.
    Creation/editing is strictly allowed ONLY when parent Exam.status == ACTIVE.
    Tracks entered_by and optional updated_by user references.
    """
    student = models.ForeignKey(
        StudentProfile,
        on_delete=models.PROTECT,
        related_name='mark_entries'
    )
    exam_component = models.ForeignKey(
        ExamComponent,
        on_delete=models.PROTECT,
        related_name='mark_entries'
    )
    obtained_marks = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        help_text="Marks obtained by the student for this component"
    )
    entered_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='entered_marks',
        help_text="User (Teacher or Admin) who recorded these marks"
    )
    updated_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='updated_marks',
        null=True,
        blank=True,
        help_text="User who last updated these marks"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at', 'id']
        verbose_name = "Mark Entry"
        verbose_name_plural = "Mark Entries"
        constraints = [
            models.UniqueConstraint(
                fields=['student', 'exam_component'],
                name='unique_student_exam_component_mark'
            )
        ]
        indexes = [
            models.Index(fields=['student', 'exam_component']),
            models.Index(fields=['exam_component', 'is_active']),
            models.Index(fields=['entered_by']),
        ]

    def clean(self):
        super().clean()
        # Active component validation
        if self.exam_component and not self.exam_component.is_active:
            raise ValidationError({'exam_component': 'Cannot enter marks for an inactive ExamComponent.'})

        # Obtained marks boundary validation
        if self.obtained_marks is not None:
            if self.obtained_marks < 0:
                raise ValidationError({'obtained_marks': 'Obtained marks cannot be negative.'})
            if self.exam_component and self.obtained_marks > self.exam_component.maximum_marks:
                raise ValidationError({
                    'obtained_marks': f'Obtained marks ({self.obtained_marks}) cannot exceed component maximum marks ({self.exam_component.maximum_marks}).'
                })

        # Exam status lock validation
        if self.exam_component and self.exam_component.exam_subject and self.exam_component.exam_subject.exam:
            exam = self.exam_component.exam_subject.exam
            if exam.status == Exam.Status.DRAFT:
                raise ValidationError("Marks entry is not allowed while the examination is in DRAFT status.")
            if exam.status == Exam.Status.COMPLETED:
                raise ValidationError("Marks of a COMPLETED examination cannot be entered or modified.")

    def __str__(self):
        stud_name = self.student.user.get_full_name() if (self.student and self.student.user) else ""
        comp_name = self.exam_component.name if self.exam_component else ""
        max_m = self.exam_component.maximum_marks if self.exam_component else ""
        return f"{stud_name} - {comp_name} ({self.obtained_marks} / {max_m})"


class MarkCorrectionRequest(models.Model):
    """
    Phase 20 — Controlled Correction Request System.
    Teachers submit correction requests for locked/published marks.
    Admins approve or reject requests; approved requests update MarkEntry.obtained_marks atomically.
    """
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    mark_entry = models.ForeignKey(
        MarkEntry,
        on_delete=models.CASCADE,
        related_name='correction_requests'
    )
    requested_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='requested_corrections'
    )
    old_marks = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        help_text="Marks recorded at the time request was created"
    )
    requested_marks = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        help_text="Newly proposed marks"
    )
    reason = models.TextField(help_text="Justification for the mark correction request")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True
    )
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='reviewed_corrections',
        null=True,
        blank=True
    )
    review_comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at', 'id']
        verbose_name = "Mark Correction Request"
        verbose_name_plural = "Mark Correction Requests"
        indexes = [
            models.Index(fields=['mark_entry', 'status']),
            models.Index(fields=['requested_by', 'status']),
        ]

    def __str__(self):
        return f"Correction #{self.id} for Entry #{self.mark_entry_id}: {self.old_marks} -> {self.requested_marks} ({self.status})"
