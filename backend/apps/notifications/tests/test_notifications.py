from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

from apps.notifications.models import Notification
from apps.notifications.services import create_notification

User = get_user_model()


class NotificationTests(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user('user1', 'user1@example.com', 'Pass12345')
        self.user2 = User.objects.create_user('user2', 'user2@example.com', 'Pass12345')

        self.notif1 = create_notification(self.user1, "Title 1", "Message 1", Notification.NotificationType.SYSTEM)
        self.notif2 = create_notification(self.user1, "Title 2", "Message 2", Notification.NotificationType.MARKS)
        self.notif_user2 = create_notification(self.user2, "Title U2", "Message U2", Notification.NotificationType.SYSTEM)

        self.client1 = APIClient()
        self.client1.force_authenticate(user=self.user1)

        self.client2 = APIClient()
        self.client2.force_authenticate(user=self.user2)

    def test_user_can_only_see_own_notifications(self):
        res = self.client1.get('/api/notifications/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 2)

        res_detail = self.client1.get(f'/api/notifications/{self.notif_user2.id}/')
        self.assertEqual(res_detail.status_code, status.HTTP_404_NOT_FOUND)

    def test_unread_count_api(self):
        res = self.client1.get('/api/notifications/unread-count/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['unread_count'], 2)

    def test_mark_all_read_api(self):
        res = self.client1.post('/api/notifications/mark-all-read/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['updated_count'], 2)

        self.assertEqual(Notification.objects.filter(user=self.user1, is_read=False).count(), 0)
        self.assertEqual(Notification.objects.filter(user=self.user2, is_read=False).count(), 1)
