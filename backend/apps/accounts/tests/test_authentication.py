from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class AuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.username = "auth_user"
        self.email = "auth@example.com"
        self.password = "AuthPassword123!"

        self.user = User.objects.create_user(
            username=self.username,
            email=self.email,
            password=self.password,
            first_name="Auth",
            last_name="Tester",
            role=User.Role.STUDENT
        )

    def test_01_anonymous_request_rejected(self):
        res = self.client.get('/api/auth/me/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_02_invalid_jwt_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer InvalidJwtTokenString123')
        res = self.client.get('/api/auth/me/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_03_valid_jwt_accepted(self):
        login_res = self.client.post('/api/auth/login/', {
            "username": self.username,
            "password": self.password
        }, format='json')
        access_token = login_res.data["access"]

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        res = self.client.get('/api/auth/me/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["username"], self.username)
        self.assertEqual(res.data["role"], "STUDENT")

    def test_04_token_refresh(self):
        login_res = self.client.post('/api/auth/login/', {
            "username": self.username,
            "password": self.password
        }, format='json')
        refresh_token = login_res.data["refresh"]

        res = self.client.post('/api/auth/token/refresh/', {
            "refresh": refresh_token
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)

    def test_05_logout_blacklists_refresh_token(self):
        login_res = self.client.post('/api/auth/login/', {
            "username": self.username,
            "password": self.password
        }, format='json')
        access_token = login_res.data["access"]
        refresh_token = login_res.data["refresh"]

        # Logout
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        logout_res = self.client.post('/api/auth/logout/', {
            "refresh": refresh_token
        }, format='json')
        self.assertEqual(logout_res.status_code, status.HTTP_200_OK)

        # Reuse blacklisted refresh token
        self.client.credentials()
        refresh_res = self.client.post('/api/auth/token/refresh/', {
            "refresh": refresh_token
        }, format='json')
        self.assertEqual(refresh_res.status_code, status.HTTP_401_UNAUTHORIZED)
