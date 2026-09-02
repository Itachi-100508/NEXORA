from decimal import Decimal
from django.db import models
from django.core.exceptions import ValidationError
from apps.academics.models import AcademicYear, Semester, Subject


class Exam(models.Model):
    """
    Represents an examination event for a specific AcademicYear and Semester.
    Tracks status lifecycle: DRAFT -> ACTIVE -> COMPLETED.
    """
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        ACTIVE = 'ACTIVE', 'Active'
        COMPLETED = 'COMPLETED', 'Completed'

    name = models.CharField(max_length=200, help_text="e.g. Semester 5 End Semester Examination")
    description = models.TextField(blank=True)
    academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.PROTECT,
        related_name='exams'
    )
    semester = models.ForeignKey(
        Semester,
        on_delete=models.PROTECT,
        related_name='exams'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Exam"
        verbose_name_plural = "Exams"
        constraints = [
            models.UniqueConstraint(
                fields=['name', 'academic_year', 'semester'],
                name='unique_exam_name_per_academic_context'
            )
        ]
        indexes = [
            models.Index(fields=['academic_year', 'semester', 'status']),
            models.Index(fields=['status']),
        ]

    def clean(self):
        super().clean()
        if self.academic_year and not self.academic_year.is_active:
            raise ValidationError({'academic_year': 'Cannot link exam to an inactive academic year.'})

        # Lifecycle transition validation on update
        if self.pk:
            old_exam = Exam.objects.get(pk=self.pk)
            # Completed exam immutability check
            if old_exam.status == Exam.Status.COMPLETED:
                if (self.name != old_exam.name or
                    self.academic_year != old_exam.academic_year or
                    self.semester != old_exam.semester or
                    self.status != old_exam.status or
                    self.description != old_exam.description):
                    raise ValidationError("Completed examinations cannot be modified.")

            # Active exam academic context protection
            if old_exam.status == Exam.Status.ACTIVE:
                if self.academic_year != old_exam.academic_year or self.semester != old_exam.semester:
                    raise ValidationError("Cannot change academic year or semester of an ACTIVE exam.")

            # Invalid status transition checks
            if old_exam.status == Exam.Status.DRAFT and self.status == Exam.Status.COMPLETED:
                raise ValidationError({'status': 'An exam must be ACTIVE before it can be COMPLETED.'})
            if old_exam.status == Exam.Status.COMPLETED and self.status in [Exam.Status.ACTIVE, Exam.Status.DRAFT]:
                raise ValidationError({'status': 'A COMPLETED exam cannot transition back to ACTIVE or DRAFT.'})

        # One ACTIVE exam per academic context rule
        if self.status == Exam.Status.ACTIVE:
            qs = Exam.objects.filter(
                academic_year=self.academic_year,
                semester=self.semester,
                status=Exam.Status.ACTIVE
            )
            if self.pk:
                qs = qs.exclude(pk=self.pk)
            if qs.exists():
                raise ValidationError({'status': 'An ACTIVE exam already exists for this Academic Year and Semester.'})

    def __str__(self):
        ay_name = self.academic_year.name if self.academic_year else ""
        sem_num = self.semester.number if self.semester else ""
        return f"{self.name} [{ay_name} - Sem {sem_num}] ({self.status})"


class ExamSubject(models.Model):
    """
    Junction table connecting Exam and Subject with exam-specific marks configuration.
    Stores maximum_marks and passing_marks.
    Editing/creation is only allowed when exam.status == DRAFT.
    """
    exam = models.ForeignKey(
        Exam,
        on_delete=models.PROTECT,
        related_name='exam_subjects'
    )
    subject = models.ForeignKey(
        Subject,
        on_delete=models.PROTECT,
        related_name='exam_subjects'
    )
    maximum_marks = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        help_text="Total maximum marks for this subject in this exam"
    )
    passing_marks = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        help_text="Minimum marks required to pass"
    )
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'id']
        verbose_name = "Exam Subject"
        verbose_name_plural = "Exam Subjects"
        constraints = [
            models.UniqueConstraint(
                fields=['exam', 'subject'],
                name='unique_exam_subject_per_exam'
            )
        ]
        indexes = [
            models.Index(fields=['exam', 'is_active']),
            models.Index(fields=['subject', 'is_active']),
        ]

    def clean(self):
        super().clean()
        # Mark validation
        if self.maximum_marks is not None and self.maximum_marks <= 0:
            raise ValidationError({'maximum_marks': 'Maximum marks must be greater than zero.'})
        if self.passing_marks is not None and self.passing_marks <= 0:
            raise ValidationError({'passing_marks': 'Passing marks must be greater than zero.'})
        if (self.maximum_marks is not None and self.passing_marks is not None
                and self.passing_marks > self.maximum_marks):
            raise ValidationError({'passing_marks': 'Passing marks cannot be greater than maximum marks.'})

        # Academic semester consistency check
        if self.exam and self.subject and self.subject.semester:
            if self.subject.semester != self.exam.semester:
                raise ValidationError({'subject': 'Subject semester must match the Exam semester.'})

        # Exam status validation
        if self.exam:
            if not self.pk:
                # Creation check
                if self.exam.status != Exam.Status.DRAFT:
                    raise ValidationError("Subjects cannot be added to an ACTIVE or COMPLETED examination.")
            else:
                # Update check
                old_record = ExamSubject.objects.get(pk=self.pk)
                if self.exam.status == Exam.Status.COMPLETED:
                    raise ValidationError("Subjects of a COMPLETED examination cannot be modified.")
                if self.exam.status == Exam.Status.ACTIVE:
                    if (self.subject != old_record.subject or
                        self.maximum_marks != old_record.maximum_marks or
                        self.passing_marks != old_record.passing_marks):
                        raise ValidationError("Cannot modify marks or subject for an ACTIVE examination.")

    def __str__(self):
        ex_name = self.exam.name if self.exam else ""
        sub_code = self.subject.code if self.subject else ""
        return f"{ex_name} - {sub_code} ({self.maximum_marks} Max / {self.passing_marks} Pass)"


class ExamComponent(models.Model):
    """
    Defines configurable mark components (e.g. Internal, External, Practical, Midterm, Lab) for an ExamSubject.
    The sum of active component maximum_marks must not exceed ExamSubject.maximum_marks.
    Creation/editing is only allowed when ExamSubject.exam.status == DRAFT.
    """
    exam_subject = models.ForeignKey(
        ExamSubject,
        on_delete=models.PROTECT,
        related_name='components'
    )
    name = models.CharField(max_length=100, help_text="e.g. Internal, External, Practical")
    code = models.CharField(max_length=50, help_text="Normalized uppercase identifier e.g. INTERNAL, EXTERNAL")
    maximum_marks = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        help_text="Maximum marks allocated to this component"
    )
    passing_marks = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Optional passing marks requirement for this component"
    )
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'id']
        verbose_name = "Exam Component"
        verbose_name_plural = "Exam Components"
        constraints = [
            models.UniqueConstraint(
                fields=['exam_subject', 'code'],
                name='unique_exam_subject_component_code'
            )
        ]
        indexes = [
            models.Index(fields=['exam_subject', 'is_active']),
        ]

    def clean(self):
        super().clean()
        # Normalize code
        if self.code:
            self.code = self.code.strip().upper()
        elif self.name:
            self.code = self.name.strip().upper()

        # Mark boundary validation
        if self.maximum_marks is not None and self.maximum_marks <= 0:
            raise ValidationError({'maximum_marks': 'Maximum marks must be greater than zero.'})
        if self.passing_marks is not None:
            if self.passing_marks <= 0:
                raise ValidationError({'passing_marks': 'Passing marks must be greater than zero.'})
            if self.maximum_marks is not None and self.passing_marks > self.maximum_marks:
                raise ValidationError({'passing_marks': 'Passing marks cannot be greater than maximum marks.'})

        # Exam status lock validation
        if self.exam_subject and self.exam_subject.exam:
            exam = self.exam_subject.exam
            if not self.pk:
                if exam.status != Exam.Status.DRAFT:
                    raise ValidationError("Mark components cannot be added after the examination becomes active or completed.")
            else:
                old_rec = ExamComponent.objects.get(pk=self.pk)
                if exam.status == Exam.Status.COMPLETED:
                    raise ValidationError("Mark components of a COMPLETED examination cannot be modified.")
                if exam.status == Exam.Status.ACTIVE:
                    if (self.name != old_rec.name or
                        self.code != old_rec.code or
                        self.maximum_marks != old_rec.maximum_marks or
                        self.passing_marks != old_rec.passing_marks):
                        raise ValidationError("Mark components cannot be modified after the examination becomes active.")

        # Component sum overflow validation
        if self.exam_subject and self.is_active:
            from django.db.models import Sum
            qs = self.exam_subject.components.filter(is_active=True)
            if self.pk:
                qs = qs.exclude(pk=self.pk)
            current_sum = qs.aggregate(total=Sum('maximum_marks'))['total'] or Decimal('0.00')
            if (current_sum + self.maximum_marks) > self.exam_subject.maximum_marks:
                raise ValidationError({'maximum_marks': f'Active component marks sum ({current_sum + self.maximum_marks}) cannot exceed ExamSubject maximum marks ({self.exam_subject.maximum_marks}).'})

    def save(self, *args, **kwargs):
        if self.code:
            self.code = self.code.strip().upper()
        elif self.name:
            self.code = self.name.strip().upper()
        super().save(*args, **kwargs)

    def __str__(self):
        sub_code = self.exam_subject.subject.code if (self.exam_subject and self.exam_subject.subject) else ""
        return f"{sub_code} -> {self.name} ({self.maximum_marks} Max)"
