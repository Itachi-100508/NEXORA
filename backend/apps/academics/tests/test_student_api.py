from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.academics.models import (
    AcademicYear,
    Department,
    Program,
    Semester,
    Classroom,
    Section,
    StudentProfile,
)

User = get_user_model()


class StudentAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Users for Roles
        self.admin = User.objects.create_user(
            username="admin_api",
            email="admin_api@example.com",
            password="AdminPassword123!",
            role=User.Role.ADMIN,
            is_staff=True,
            is_superuser=True
        )
        self.teacher = User.objects.create_user(
            username="teacher_api",
            email="teacher_api@example.com",
            password="TeacherPassword123!",
            role=User.Role.TEACHER
        )
        self.student_user = User.objects.create_user(
            username="student_api",
            email="student_api@example.com",
            password="StudentPassword123!",
            role=User.Role.STUDENT
        )

        # Academic Structure Setup
        self.year = AcademicYear.objects.create(name="2026-27")
        self.dept_cs = Department.objects.create(code="CSE", name="Computer Science and Engineering")
        self.dept_it = Department.objects.create(code="IT", name="Information Technology")

        self.program_cs = Program.objects.create(
            department=self.dept_cs,
            code="BTECH-CSE",
            name="B.Tech Computer Science and Engineering",
            duration_years=4
        )
        self.program_it = Program.objects.create(
            department=self.dept_it,
            code="BTECH-IT",
            name="B.Tech Information Technology",
            duration_years=4
        )

        self.sem5_cs = Semester.objects.create(program=self.program_cs, number=5, name="Semester 5")
        self.sem5_it = Semester.objects.create(program=self.program_it, number=5, name="Semester 5")

        self.class_cs = Classroom.objects.create(
            academic_year=self.year,
            program=self.program_cs,
            semester=self.sem5_cs,
            name="B.Tech CSE Semester 5",
            code="CSE-S5-2026"
        )
        self.class_it = Classroom.objects.create(
            academic_year=self.year,
            program=self.program_it,
            semester=self.sem5_it,
            name="B.Tech IT Semester 5",
            code="IT-S5-2026"
        )

        self.sec_cs_a = Section.objects.create(classroom=self.class_cs, code="A", name="Section A")
        self.sec_cs_b = Section.objects.create(classroom=self.class_cs, code="B", name="Section B")
        self.sec_it_a = Section.objects.create(classroom=self.class_it, code="A", name="Section A")

        # Create Initial Student Profile
        self.profile1 = StudentProfile.objects.create(
            user=self.student_user,
            enrollment_number="2026CSE001",
            roll_number="101",
            classroom=self.class_cs,
            section=self.sec_cs_a,
            admission_year=2026
        )

        # Tokens
        self.admin_token = self._get_token("admin_api", "AdminPassword123!")
        self.teacher_token = self._get_token("teacher_api", "TeacherPassword123!")
        self.student_token = self._get_token("student_api", "StudentPassword123!")

    def _get_token(self, username, password):
        res = self.client.post('/api/auth/login/', {"username": username, "password": password}, format='json')
        return res.data["access"]

    # ==========================================
    # AUTHORIZATION GRID TESTS
    # ==========================================

    def test_admin_can_access_student_list(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.get('/api/students/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("results", res.data)

    def test_teacher_denied_student_list(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.teacher_token}')
        res = self.client.get('/api/students/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_denied_student_list(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        res = self.client.get('/api/students/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_denied_student_list(self):
        self.client.credentials()
        res = self.client.get('/api/students/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    # ==========================================
    # CRUD OPERATIONS
    # ==========================================

    def test_admin_create_student_success(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            "username": "rahul_new",
            "email": "rahul@example.com",
            "password": "TemporaryPassword123!",
            "first_name": "Rahul",
            "last_name": "Kumar",
            "enrollment_number": "2026CSE002",
            "roll_number": "102",
            "section_id": self.sec_cs_a.id,
            "admission_year": 2026
        }
        res = self.client.post('/api/students/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["enrollment_number"], "2026CSE002")
        self.assertEqual(res.data["name"], "Rahul Kumar")
        self.assertNotIn("password", res.data)

        # Verify User and Profile created
        created_user = User.objects.get(username="rahul_new")
        self.assertEqual(created_user.role, "STUDENT")
        self.assertTrue(created_user.check_password("TemporaryPassword123!"))

    def test_admin_retrieve_student_detail(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.get(f'/api/students/{self.profile1.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["enrollment_number"], "2026CSE001")
        self.assertEqual(res.data["department"], "Computer Science and Engineering")
        self.assertEqual(res.data["section_id"], self.sec_cs_a.id)

    def test_admin_update_student_patch(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            "roll_number": "105",
            "section_id": self.sec_cs_b.id
        }
        res = self.client.patch(f'/api/students/{self.profile1.id}/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["roll_number"], "105")
        self.assertEqual(res.data["section_id"], self.sec_cs_b.id)

    def test_admin_deactivate_student_soft_delete(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.delete(f'/api/students/{self.profile1.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["message"], "Student deactivated successfully")

        # Verify soft-deactivation
        self.profile1.refresh_from_db()
        self.assertFalse(self.profile1.is_active)
        self.assertFalse(self.profile1.user.is_active)

    # ==========================================
    # SEARCH & FILTER TESTS
    # ==========================================

    def test_search_students_by_enrollment_and_name(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.get('/api/students/?search=2026CSE001')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["results"]), 1)

    def test_filter_students_by_class_and_department(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.get(f'/api/students/?class_id={self.class_cs.id}&department_id={self.dept_cs.id}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["results"]), 1)

        # Empty result for non-matching IT class
        res_empty = self.client.get(f'/api/students/?class_id={self.class_it.id}')
        self.assertEqual(res_empty.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_empty.data["results"]), 0)

    # ==========================================
    # VALIDATION & SECURITY TESTS
    # ==========================================

    def test_duplicate_enrollment_number_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            "username": "rahul_dup",
            "email": "dup@example.com",
            "password": "Password123!",
            "enrollment_number": "2026CSE001",  # Duplicate!
            "roll_number": "109"
        }
        res = self.client.post('/api/students/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("enrollment_number", res.data)

    def test_invalid_section_id_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            "username": "rahul_invalid_sec",
            "email": "sec@example.com",
            "password": "Password123!",
            "enrollment_number": "2026CSE999",
            "roll_number": "999",
            "section_id": 999999
        }
        res = self.client.post('/api/students/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("section_id", res.data)

    def test_role_escalation_attempt_ignored(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            "username": "hacker_student",
            "email": "hacker@example.com",
            "password": "Password123!",
            "enrollment_number": "2026CSE777",
            "roll_number": "777",
            "role": "ADMIN"  # Privilege escalation attempt!
        }
        res = self.client.post('/api/students/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        created_user = User.objects.get(username="hacker_student")
        self.assertEqual(created_user.role, "STUDENT")  # Enforced as STUDENT!
