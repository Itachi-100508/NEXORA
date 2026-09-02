from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class AuditLog(models.Model):
    """
    Centralized, append-only Audit Logging System (Phase 21).
    Records critical examination system actions (CREATE, UPDATE, DELETE, APPROVE, REJECT, LOGIN, LOGOUT, PUBLISH, CORRECTION_REQUEST).
    Never modified or deleted through normal API operations.
    """
    class Action(models.TextChoices):
        CREATE = 'CREATE', 'Create'
        UPDATE = 'UPDATE', 'Update'
        DELETE = 'DELETE', 'Delete'
        APPROVE = 'APPROVE', 'Approve'
        REJECT = 'REJECT', 'Reject'
        LOGIN = 'LOGIN', 'Login'
        LOGOUT = 'LOGOUT', 'Logout'
        PUBLISH = 'PUBLISH', 'Publish'
        CORRECTION_REQUEST = 'CORRECTION_REQUEST', 'Correction Request'

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs'
    )
    action = models.CharField(
        max_length=30,
        choices=Action.choices,
        db_index=True
    )
    entity_type = models.CharField(
        max_length=50,
        db_index=True,
        help_text="Name of the affected entity class (e.g. MarkEntry, MarkCorrectionRequest, Exam)"
    )
    entity_id = models.CharField(
        max_length=50,
        db_index=True,
        help_text="Primary key of the affected entity"
    )
    description = models.TextField(blank=True)
    old_data = models.JSONField(null=True, blank=True)
    new_data = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at', 'id']
        verbose_name = "Audit Log"
        verbose_name_plural = "Audit Logs"
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['entity_type', 'entity_id']),
            models.Index(fields=['action', 'created_at']),
        ]

    def __str__(self):
        user_str = self.user.get_full_name() if self.user else "System"
        return f"Audit #{self.id}: {self.action} on {self.entity_type} #{self.entity_id} by {user_str} at {self.created_at.strftime('%Y-%m-%d %H:%M')}"
