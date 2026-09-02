import secrets
from django.db import models
from apps.academics.models import StudentProfile
from apps.examinations.models import Exam


def generate_verification_token():
    return secrets.token_urlsafe(32)


class ResultVerification(models.Model):
    """
    Stores secure verification tokens for student examination results.
    Used for QR code verification without exposing internal IDs or passwords.
    """
    student = models.ForeignKey(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name='result_verifications'
    )
    exam = models.ForeignKey(
        Exam,
        on_delete=models.CASCADE,
        related_name='result_verifications'
    )
    verification_token = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        default=generate_verification_token,
        help_text="Cryptographically secure random verification token"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at', 'id']
        verbose_name = "Result Verification"
        verbose_name_plural = "Result Verifications"
        constraints = [
            models.UniqueConstraint(
                fields=['student', 'exam'],
                name='unique_student_exam_verification'
            )
        ]

    def __str__(self):
        return f"Verification: {self.student.roll_number} - {self.exam.name} ({self.verification_token[:8]}...)"
