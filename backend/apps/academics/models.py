from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone


class AcademicYear(models.Model):
    """
    Represents an academic session/year (e.g. 2026-27).
    """
    name = models.CharField(max_length=20, unique=True, db_index=True, help_text="e.g. 2026-27")
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-name']
        verbose_name = "Academic Year"
        verbose_name_plural = "Academic Years"

    def __str__(self):
        return self.name


class Department(models.Model):
    """
    Represents an academic department (e.g. Computer Science and Engineering).
    """
    code = models.CharField(max_length=20, unique=True, db_index=True, help_text="e.g. CSE")
    name = models.CharField(max_length=100, help_text="e.g. Computer Science and Engineering")
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['code']
        verbose_name = "Department"
        verbose_name_plural = "Departments"

    def __str__(self):
        return f"{self.code} - {self.name}"


class Program(models.Model):
    """
    Represents an academic degree program within a Department (e.g. B.Tech CSE).
    """
    department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name='programs'
    )
    code = models.CharField(max_length=20, unique=True, db_index=True, help_text="e.g. BTECH-CSE")
    name = models.CharField(max_length=100, help_text="e.g. B.Tech Computer Science and Engineering")
    duration_years = models.PositiveIntegerField(default=4)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['code']
        verbose_name = "Program"
        verbose_name_plural = "Programs"

    def __str__(self):
        return f"{self.code} - {self.name}"


class Semester(models.Model):
    """
    Represents a specific semester within a Program (e.g. Semester 5).
    """
    program = models.ForeignKey(
        Program,
        on_delete=models.PROTECT,
        related_name='semesters'
    )
    number = models.PositiveIntegerField(help_text="e.g. 1 to 8")
    name = models.CharField(max_length=50, help_text="e.g. Semester 5")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('program', 'number')
        ordering = ['program', 'number']
        verbose_name = "Semester"
        verbose_name_plural = "Semesters"

    def __str__(self):
        return f"{self.name} - {self.program.code}"


class Classroom(models.Model):
    """
    Represents an academic class cohort for an AcademicYear, Program, and Semester.
    """
    academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.PROTECT,
        related_name='classrooms',
        null=True,
        blank=True
    )
    program = models.ForeignKey(
        Program,
        on_delete=models.PROTECT,
        related_name='classrooms',
        null=True,
        blank=True
    )
    semester = models.ForeignKey(
        Semester,
        on_delete=models.PROTECT,
        related_name='classrooms',
        null=True,
        blank=True
    )
    name = models.CharField(max_length=100, help_text="e.g. B.Tech CSE Semester 5")
    code = models.CharField(max_length=50, default='CLASS-01', db_index=True, help_text="e.g. CSE-S5-2026")
    section = models.CharField(max_length=10, blank=True, help_text="Backward compatibility section field")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('academic_year', 'program', 'semester', 'code')
        ordering = ['code']
        verbose_name = "Classroom"
        verbose_name_plural = "Classrooms"

    def clean(self):
        super().clean()
        if self.semester and self.program and self.semester.program != self.program:
            raise ValidationError({'semester': 'Semester must belong to the selected Program.'})

    def __str__(self):
        return f"{self.name} ({self.code})"


class Section(models.Model):
    """
    Represents a division/section of a Classroom (e.g. Section A).
    """
    classroom = models.ForeignKey(
        Classroom,
        on_delete=models.PROTECT,
        related_name='sections'
    )
    name = models.CharField(max_length=50, help_text="e.g. Section A")
    code = models.CharField(max_length=10, db_index=True, help_text="e.g. A")
    capacity = models.PositiveIntegerField(default=60)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('classroom', 'code')
        ordering = ['classroom', 'code']
        verbose_name = "Section"
        verbose_name_plural = "Sections"

    def __str__(self):
        return f"{self.classroom.name} - {self.name}"


class Subject(models.Model):
    """
    Represents an academic subject (e.g. Database Management Systems).
    """
    department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name='subjects',
        null=True,
        blank=True
    )
    semester = models.ForeignKey(
        Semester,
        on_delete=models.PROTECT,
        related_name='subjects',
        null=True,
        blank=True
    )
    code = models.CharField(max_length=20, unique=True, db_index=True, help_text="e.g. CS501")
    name = models.CharField(max_length=100, help_text="e.g. Database Management Systems")
    description = models.TextField(blank=True)
    credits = models.PositiveIntegerField(default=4)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['code']
        verbose_name = "Subject"
        verbose_name_plural = "Subjects"

    def clean(self):
        super().clean()
        if self.semester and self.department and self.semester.program and self.semester.program.department != self.department:
            raise ValidationError({'semester': 'Semester must belong to a program in the selected Department.'})

    def __str__(self):
        return f"{self.code} - {self.name}"


class StudentProfile(models.Model):
    """
    Stores student-specific academic information linked to a User account (role=STUDENT).
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='student_profile'
    )
    enrollment_number = models.CharField(max_length=50, unique=True, db_index=True, help_text="e.g. 2026CSE001")
    roll_number = models.CharField(max_length=50, db_index=True, help_text="e.g. 01")
    date_of_birth = models.DateField(null=True, blank=True)
    classroom = models.ForeignKey(
        Classroom,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students'
    )
    section = models.ForeignKey(
        Section,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students'
    )
    admission_year = models.PositiveIntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['enrollment_number']
        verbose_name = "Student Profile"
        verbose_name_plural = "Student Profiles"

    def clean(self):
        super().clean()
        if self.user and hasattr(self.user, 'role') and self.user.role != 'STUDENT':
            raise ValidationError({'user': 'StudentProfile user must have role STUDENT.'})

    def __str__(self):
        full_name = self.user.get_full_name() or self.user.username if self.user else ""
        return f"{self.enrollment_number} - {full_name}"


class TeacherProfile(models.Model):
    """
    Stores teacher-specific academic information linked to a User account (role=TEACHER).
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='teacher_profile'
    )
    employee_id = models.CharField(max_length=50, unique=True, db_index=True, help_text="e.g. EMP001")
    designation = models.CharField(max_length=100, blank=True, help_text="e.g. Assistant Professor")
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='teachers'
    )
    joining_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['employee_id']
        verbose_name = "Teacher Profile"
        verbose_name_plural = "Teacher Profiles"

    def clean(self):
        super().clean()
        if self.user and hasattr(self.user, 'role') and self.user.role != 'TEACHER':
            raise ValidationError({'user': 'TeacherProfile user must have role TEACHER.'})

    def __str__(self):
        full_name = self.user.get_full_name() or self.user.username if self.user else ""
        return f"{self.employee_id} - {full_name}"


class TeacherAssignment(models.Model):
    """
    Connects a TeacherProfile to a Subject, Section, and AcademicYear.
    Establishes the explicit academic teaching relationship and security boundary for marks entry.
    """
    teacher = models.ForeignKey(
        TeacherProfile,
        on_delete=models.PROTECT,
        related_name='assignments',
        null=True,
        blank=True
    )
    subject = models.ForeignKey(
        Subject,
        on_delete=models.PROTECT,
        related_name='teacher_assignments',
        null=True,
        blank=True
    )
    section = models.ForeignKey(
        Section,
        on_delete=models.PROTECT,
        related_name='teacher_assignments',
        null=True,
        blank=True
    )
    academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.PROTECT,
        related_name='teacher_assignments',
        null=True,
        blank=True
    )
    is_active = models.BooleanField(default=True)
    assigned_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Teacher Assignment"
        verbose_name_plural = "Teacher Assignments"
        constraints = [
            models.UniqueConstraint(
                fields=['teacher', 'subject', 'section', 'academic_year'],
                name='unique_teacher_subject_section_academic_year'
            )
        ]
        indexes = [
            models.Index(fields=['teacher', 'subject', 'section', 'academic_year', 'is_active']),
            models.Index(fields=['subject', 'section', 'academic_year', 'is_active']),
        ]

    def clean(self):
        super().clean()
        if self.teacher and not self.teacher.is_active:
            raise ValidationError({'teacher': 'Cannot assign an inactive teacher.'})
        if self.teacher and self.teacher.user and self.teacher.user.role != 'TEACHER':
            raise ValidationError({'teacher': 'Assigned teacher user must have role TEACHER.'})
        if self.subject and not self.subject.is_active:
            raise ValidationError({'subject': 'Cannot assign an inactive subject.'})
        if self.section and not self.section.is_active:
            raise ValidationError({'section': 'Cannot assign an inactive section.'})
        if self.academic_year and not self.academic_year.is_active:
            raise ValidationError({'academic_year': 'Cannot assign an inactive academic year.'})

        if self.section and self.section.classroom and self.academic_year:
            if self.section.classroom.academic_year != self.academic_year:
                raise ValidationError({'academic_year': 'Assignment academic year must match section classroom academic year.'})

        if self.subject and self.subject.semester and self.section and self.section.classroom and self.section.classroom.semester:
            if self.subject.semester != self.section.classroom.semester:
                raise ValidationError({'subject': 'Subject semester must match section classroom semester.'})

        if (self.subject and self.subject.department and self.section and self.section.classroom
                and self.section.classroom.program and self.section.classroom.program.department):
            if self.subject.department != self.section.classroom.program.department:
                raise ValidationError({'subject': 'Subject department must match section classroom department.'})

    def __str__(self):
        t_name = self.teacher.user.get_full_name() or self.teacher.user.username if (self.teacher and self.teacher.user) else ""
        s_code = self.subject.code if self.subject else ""
        sec_name = self.section.name if self.section else ""
        ay_name = self.academic_year.name if self.academic_year else ""
        return f"{t_name} -> {s_code} ({sec_name}) [{ay_name}]"
