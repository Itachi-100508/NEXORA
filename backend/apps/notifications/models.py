from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Notification(models.Model):
    """
    Phase 25 — In-App Database Notification System.
    Stores user-specific notifications for backend events (EXAM, MARKS, CORRECTION, RESULT, SYSTEM).
    """
    class NotificationType(models.TextChoices):
        EXAM = 'EXAM', 'Exam'
        MARKS = 'MARKS', 'Marks'
        CORRECTION = 'CORRECTION', 'Correction'
        RESULT = 'RESULT', 'Result'
        SYSTEM = 'SYSTEM', 'System'

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications',
        db_index=True
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        default=NotificationType.SYSTEM,
        db_index=True
    )
    is_read = models.BooleanField(default=False, db_index=True)
    related_entity_type = models.CharField(max_length=50, blank=True, null=True)
    related_entity_id = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at', 'id']
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['notification_type', 'created_at']),
        ]

    def __str__(self):
        user_name = self.user.get_full_name() if self.user else "User"
        read_str = "Read" if self.is_read else "Unread"
        return f"[{self.notification_type}] {self.title} to {user_name} ({read_str})"
