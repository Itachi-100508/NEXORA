from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User model for PR-TERRA extending Django's AbstractUser.
    Supports application roles (ADMIN, TEACHER, STUDENT) for role-based access control.
    """
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Admin'
        TEACHER = 'TEACHER', 'Teacher'
        STUDENT = 'STUDENT', 'Student'

    email = models.EmailField('email address', unique=True)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.STUDENT,
        help_text='Application role for access control'
    )
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} [{self.role}] ({self.email})"
