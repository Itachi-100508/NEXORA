from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.academics.models import Department, Program, Semester, Subject

User = get_user_model()


class SubjectAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Users for Roles
        self.admin = User.objects.create_user(
            username="admin_subj_api",
            email="admin_subj_api@example.com",
            password="AdminPassword123!",
            role=User.Role.ADMIN,
            is_staff=True,
            is_superuser=True
        )
        self.teacher_user = User.objects.create_user(
            username="teacher_subj_user",
            email="teacher_subj_user@example.com",
            password="TeacherPassword123!",
            role=User.Role.TEACHER
        )
        self.student_user = User.objects.create_user(
            username="student_subj_user",
            email="student_subj_user@example.com",
            password="StudentPassword123!",
            role=User.Role.STUDENT
        )

        # Departments & Programs
        self.dept_cs = Department.objects.create(code="CSE", name="Computer Science and Engineering")
        self.dept_it = Department.objects.create(code="IT", name="Information Technology")

        self.program_cs = Program.objects.create(department=self.dept_cs, code="BTECH-CSE", name="B.Tech CSE")
        self.program_it = Program.objects.create(department=self.dept_it, code="BTECH-IT", name="B.Tech IT")

        self.sem5_cs = Semester.objects.create(program=self.program_cs, number=5, name="Semester 5")
        self.sem5_it = Semester.objects.create(program=self.program_it, number=5, name="Semester 5")

        # Initial Subject
        self.subject1 = Subject.objects.create(
            code="CS501",
            name="Database Management Systems",
            credits=4,
            department=self.dept_cs,
            semester=self.sem5_cs
        )

        # Tokens
        self.admin_token = self._get_token("admin_subj_api", "AdminPassword123!")
        self.teacher_token = self._get_token("teacher_subj_user", "TeacherPassword123!")
        self.student_token = self._get_token("student_subj_user", "StudentPassword123!")

    def _get_token(self, username, password):
        res = self.client.post('/api/auth/login/', {"username": username, "password": password}, format='json')
        return res.data["access"]

    # ==========================================
    # AUTHORIZATION GRID TESTS
    # ==========================================

    def test_admin_can_access_subject_list(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.get('/api/subjects/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("results", res.data)

    def test_teacher_denied_subject_list(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.teacher_token}')
        res = self.client.get('/api/subjects/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_denied_subject_list(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        res = self.client.get('/api/subjects/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_denied_subject_list(self):
        self.client.credentials()
        res = self.client.get('/api/subjects/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    # ==========================================
    # CRUD & DISALLOWED METHODS
    # ==========================================

    def test_admin_create_subject_success(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            "code": " cs502 ",  # Will be normalized to CS502
            "name": " Operating Systems ",
            "department_id": self.dept_cs.id,
            "semester_id": self.sem5_cs.id,
            "credits": 4
        }
        res = self.client.post('/api/subjects/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["code"], "CS502")
        self.assertEqual(res.data["name"], "Operating Systems")
        self.assertEqual(res.data["credits"], 4)

    def test_admin_retrieve_subject_detail(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.get(f'/api/subjects/{self.subject1.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["code"], "CS501")
        self.assertEqual(res.data["department"], "Computer Science and Engineering")
        self.assertEqual(res.data["semester"], 5)

    def test_patch_and_delete_endpoints_disallowed(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        patch_res = self.client.patch(f'/api/subjects/{self.subject1.id}/', {"credits": 5}, format='json')
        self.assertEqual(patch_res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        delete_res = self.client.delete(f'/api/subjects/{self.subject1.id}/')
        self.assertEqual(delete_res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    # ==========================================
    # SEARCH, FILTER & ORDERING TESTS
    # ==========================================

    def test_search_subjects_by_code_and_name(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.get('/api/subjects/?search=CS501')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["results"]), 1)

    def test_filter_subjects_by_department_and_semester(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.get(f'/api/subjects/?department_id={self.dept_cs.id}&semester_id={self.sem5_cs.id}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["results"]), 1)

        # Empty result for IT department
        res_empty = self.client.get(f'/api/subjects/?department_id={self.dept_it.id}')
        self.assertEqual(res_empty.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_empty.data["results"]), 0)

    # ==========================================
    # VALIDATION TESTS
    # ==========================================

    def test_duplicate_code_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            "code": "CS501",  # Duplicate!
            "name": "Duplicate DBMS",
            "department_id": self.dept_cs.id,
            "credits": 4
        }
        res = self.client.post('/api/subjects/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("code", res.data)

    def test_zero_or_negative_credits_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            "code": "CS509",
            "name": "Invalid Credits Subj",
            "credits": 0  # Invalid!
        }
        res = self.client.post('/api/subjects/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("credits", res.data)

    def test_cross_field_department_semester_mismatch_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            "code": "CS510",
            "name": "Cross Mismatch",
            "department_id": self.dept_cs.id,
            "semester_id": self.sem5_it.id,  # Belongs to IT program!
            "credits": 3
        }
        res = self.client.post('/api/subjects/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("semester_id", res.data)
