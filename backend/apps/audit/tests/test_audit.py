from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

from apps.audit.models import AuditLog
from apps.audit.services import log_action

User = get_user_model()


class AuditLogTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser('admin', 'admin@example.com', 'AdminPass123', role='ADMIN')
        self.user = User.objects.create_user('user1', 'user1@example.com', 'Pass12345', role='TEACHER')

        self.audit1 = log_action(
            user=self.user,
            action='CREATE',
            entity_type='MarkEntry',
            entity_id=10,
            description="Created mark entry",
            new_data={"obtained_marks": "25.00"}
        )

        self.admin_client = APIClient()
        self.admin_client.force_authenticate(user=self.admin)

        self.user_client = APIClient()
        self.user_client.force_authenticate(user=self.user)

    def test_admin_can_access_audit_logs_read_only(self):
        res = self.admin_client.get('/api/audit-logs/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 1)

    def test_non_admin_forbidden_from_audit_logs(self):
        res = self.user_client.get('/api/audit-logs/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_audit_logs_are_immutable_via_api(self):
        res_post = self.admin_client.post('/api/audit-logs/', {"action": "CREATE"}, format='json')
        self.assertEqual(res_post.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        res_del = self.admin_client.delete(f'/api/audit-logs/{self.audit1.id}/')
        self.assertEqual(res_del.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
