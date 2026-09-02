from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.academics.models import Department, TeacherProfile

User = get_user_model()


class TeacherAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Users for Roles
        self.admin = User.objects.create_user(
            username="admin_teacher_api",
            email="admin_t_api@example.com",
            password="AdminPassword123!",
            role=User.Role.ADMIN,
            is_staff=True,
            is_superuser=True
        )
        self.teacher_user = User.objects.create_user(
            username="teacher_api_user",
            email="teacher_api_user@example.com",
            password="TeacherPassword123!",
            role=User.Role.TEACHER
        )
        self.student_user = User.objects.create_user(
            username="student_api_user",
            email="student_api_user@example.com",
            password="StudentPassword123!",
            role=User.Role.STUDENT
        )

        # Departments
        self.dept_cs = Department.objects.create(code="CSE", name="Computer Science and Engineering")
        self.dept_it = Department.objects.create(code="IT", name="Information Technology")

        # Initial Teacher Profile
        self.profile1 = TeacherProfile.objects.create(
            user=self.teacher_user,
            employee_id="EMP101",
            designation="Assistant Professor",
            department=self.dept_cs
        )

        # Tokens
        self.admin_token = self._get_token("admin_teacher_api", "AdminPassword123!")
        self.teacher_token = self._get_token("teacher_api_user", "TeacherPassword123!")
        self.student_token = self._get_token("student_api_user", "StudentPassword123!")

    def _get_token(self, username, password):
        res = self.client.post('/api/auth/login/', {"username": username, "password": password}, format='json')
        return res.data["access"]

    # ==========================================
    # AUTHORIZATION GRID TESTS
    # ==========================================

    def test_admin_can_access_teacher_list(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.get('/api/teachers/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("results", res.data)

    def test_teacher_denied_teacher_list(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.teacher_token}')
        res = self.client.get('/api/teachers/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_denied_teacher_list(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        res = self.client.get('/api/teachers/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_denied_teacher_list(self):
        self.client.credentials()
        res = self.client.get('/api/teachers/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    # ==========================================
    # CRUD & DEACTIVATION OPERATIONS
    # ==========================================

    def test_admin_create_teacher_success(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            "username": "dr_sharma",
            "email": "sharma@example.com",
            "password": "DemoPassword123!",
            "first_name": "Dr.",
            "last_name": "Sharma",
            "employee_id": "EMP102",
            "department_id": self.dept_cs.id,
            "designation": "Associate Professor",
            "joining_date": "2026-01-10"
        }
        res = self.client.post('/api/teachers/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["employee_id"], "EMP102")
        self.assertEqual(res.data["name"], "Dr. Sharma")
        self.assertNotIn("password", res.data)

        # Verify User and Profile created
        created_user = User.objects.get(username="dr_sharma")
        self.assertEqual(created_user.role, "TEACHER")
        self.assertTrue(created_user.check_password("DemoPassword123!"))

    def test_admin_retrieve_teacher_detail(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.get(f'/api/teachers/{self.profile1.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["employee_id"], "EMP101")
        self.assertEqual(res.data["department"], "Computer Science and Engineering")
        self.assertEqual(res.data["department_id"], self.dept_cs.id)

    def test_admin_update_teacher_patch(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            "designation": "Professor",
            "department_id": self.dept_it.id
        }
        res = self.client.patch(f'/api/teachers/{self.profile1.id}/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["designation"], "Professor")
        self.assertEqual(res.data["department_id"], self.dept_it.id)

    def test_admin_deactivate_teacher(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {"is_active": False}
        res = self.client.patch(f'/api/teachers/{self.profile1.id}/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(res.data["is_active"])

    def test_delete_endpoint_not_allowed(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.delete(f'/api/teachers/{self.profile1.id}/')
        self.assertEqual(res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    # ==========================================
    # SEARCH & FILTER TESTS
    # ==========================================

    def test_search_teachers_by_employee_id_and_designation(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.get('/api/teachers/?search=EMP101')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["results"]), 1)

    def test_filter_teachers_by_department(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.get(f'/api/teachers/?department_id={self.dept_cs.id}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["results"]), 1)

        # Empty result for IT department
        res_empty = self.client.get(f'/api/teachers/?department_id={self.dept_it.id}')
        self.assertEqual(res_empty.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_empty.data["results"]), 0)

    # ==========================================
    # VALIDATION & SECURITY TESTS
    # ==========================================

    def test_duplicate_employee_id_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            "username": "dr_dup",
            "email": "dup@example.com",
            "password": "Password123!",
            "employee_id": "EMP101",  # Duplicate!
            "department_id": self.dept_cs.id
        }
        res = self.client.post('/api/teachers/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("employee_id", res.data)

    def test_invalid_department_id_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            "username": "dr_invalid_dept",
            "email": "dept@example.com",
            "password": "Password123!",
            "employee_id": "EMP999",
            "department_id": 999999
        }
        res = self.client.post('/api/teachers/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("department_id", res.data)

    def test_role_escalation_attempt_ignored(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            "username": "hacker_teacher",
            "email": "hacker_t@example.com",
            "password": "Password123!",
            "employee_id": "EMP777",
            "department_id": self.dept_cs.id,
            "role": "ADMIN"  # Privilege escalation attempt!
        }
        res = self.client.post('/api/teachers/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        created_user = User.objects.get(username="hacker_teacher")
        self.assertEqual(created_user.role, "TEACHER")  # Enforced as TEACHER!
