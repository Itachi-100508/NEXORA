from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.academics.models import AcademicYear, Department, Program, Semester
from apps.examinations.models import Exam

User = get_user_model()


class ExaminationAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # User accounts & roles
        self.admin = User.objects.create_user(
            username="admin_exam_api",
            email="admin_exam_api@example.com",
            password="AdminPassword123!",
            role=User.Role.ADMIN,
            is_staff=True,
            is_superuser=True
        )
        self.teacher_user = User.objects.create_user(
            username="teacher_exam_api",
            email="teacher_exam_api@example.com",
            password="TeacherPassword123!",
            role=User.Role.TEACHER
        )
        self.student_user = User.objects.create_user(
            username="student_exam_api",
            email="student_exam_api@example.com",
            password="StudentPassword123!",
            role=User.Role.STUDENT
        )

        # Academic Hierarchy
        self.ay_2026 = AcademicYear.objects.create(name="2026-27", is_active=True)
        self.ay_2025 = AcademicYear.objects.create(name="2025-26", is_active=True)

        self.dept_cs = Department.objects.create(code="CSE", name="Computer Science and Engineering")
        self.prog_cs = Program.objects.create(department=self.dept_cs, code="BTECH-CSE", name="B.Tech CSE")

        self.sem5 = Semester.objects.create(program=self.prog_cs, number=5, name="Semester 5")
        self.sem3 = Semester.objects.create(program=self.prog_cs, number=3, name="Semester 3")

        # Initial Demo Exam
        self.exam_sem5 = Exam.objects.create(
            name="Semester 5 End Semester Examination",
            description="End sem exams for sem 5",
            academic_year=self.ay_2026,
            semester=self.sem5,
            status=Exam.Status.DRAFT
        )

        # Tokens
        self.admin_token = self._get_token("admin_exam_api", "AdminPassword123!")
        self.teacher_token = self._get_token("teacher_exam_api", "TeacherPassword123!")
        self.student_token = self._get_token("student_exam_api", "StudentPassword123!")

    def _get_token(self, username, password):
        res = self.client.post('/api/auth/login/', {"username": username, "password": password}, format='json')
        return res.data["access"]

    # ==========================================
    # AUTHORIZATION GRID TESTS
    # ==========================================

    def test_admin_can_list_exams(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.get('/api/exams/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("results", res.data)

    def test_teacher_denied_exam_list(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.teacher_token}')
        res = self.client.get('/api/exams/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_denied_exam_list(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        res = self.client.get('/api/exams/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_denied_exam_list(self):
        self.client.credentials()
        res = self.client.get('/api/exams/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    # ==========================================
    # CRUD OPERATIONS & DEFAULT STATUS
    # ==========================================

    def test_admin_create_exam_defaults_to_draft(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            "name": "Semester 3 End Semester Examination",
            "description": "End sem exams for sem 3",
            "academic_year_id": self.ay_2026.id,
            "semester_id": self.sem3.id
        }
        res = self.client.post('/api/exams/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["status"], "DRAFT")
        self.assertEqual(res.data["status_display"], "Draft")
        self.assertEqual(res.data["academic_year"], "2026-27")
        self.assertEqual(res.data["semester"], 3)

    def test_admin_retrieve_exam_detail(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.get(f'/api/exams/{self.exam_sem5.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["name"], "Semester 5 End Semester Examination")

    def test_delete_endpoint_disallowed(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.delete(f'/api/exams/{self.exam_sem5.id}/')
        self.assertEqual(res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    # ==========================================
    # LIFECYCLE TRANSITIONS & IMMUTABILITY
    # ==========================================

    def test_valid_lifecycle_draft_to_active_to_completed(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')

        # 1. DRAFT -> ACTIVE
        res1 = self.client.patch(f'/api/exams/{self.exam_sem5.id}/', {"status": "ACTIVE"}, format='json')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertEqual(res1.data["status"], "ACTIVE")

        # 2. ACTIVE -> COMPLETED
        res2 = self.client.patch(f'/api/exams/{self.exam_sem5.id}/', {"status": "COMPLETED"}, format='json')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(res2.data["status"], "COMPLETED")

    def test_invalid_transition_draft_to_completed_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.patch(f'/api/exams/{self.exam_sem5.id}/', {"status": "COMPLETED"}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("status", res.data)

    def test_invalid_transition_completed_to_active_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        self.exam_sem5.status = Exam.Status.COMPLETED
        self.exam_sem5.save()

        res = self.client.patch(f'/api/exams/{self.exam_sem5.id}/', {"status": "ACTIVE"}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_completed_exam_modification_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        self.exam_sem5.status = Exam.Status.COMPLETED
        self.exam_sem5.save()

        res = self.client.patch(f'/api/exams/{self.exam_sem5.id}/', {"name": "Changed Name"}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_active_exam_academic_context_change_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        self.exam_sem5.status = Exam.Status.ACTIVE
        self.exam_sem5.save()

        res = self.client.patch(f'/api/exams/{self.exam_sem5.id}/', {"semester_id": self.sem3.id}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    # ==========================================
    # VALIDATION RULES & CONSTRAINTS
    # ==========================================

    def test_duplicate_exam_name_per_academic_context_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            "name": "Semester 5 End Semester Examination",
            "academic_year_id": self.ay_2026.id,
            "semester_id": self.sem5.id
        }
        res = self.client.post('/api/exams/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_single_active_exam_rule(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')

        # Make exam_sem5 ACTIVE
        self.exam_sem5.status = Exam.Status.ACTIVE
        self.exam_sem5.save()

        # Create another exam for sem5 in DRAFT
        exam2 = Exam.objects.create(
            name="Semester 5 Retake Examination",
            academic_year=self.ay_2026,
            semester=self.sem5,
            status=Exam.Status.DRAFT
        )

        # Attempt to activate exam2
        res = self.client.patch(f'/api/exams/{exam2.id}/', {"status": "ACTIVE"}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_empty_name_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            "name": "   ",
            "academic_year_id": self.ay_2026.id,
            "semester_id": self.sem5.id
        }
        res = self.client.post('/api/exams/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    # ==========================================
    # SEARCH & FILTERING TESTS
    # ==========================================

    def test_search_exams(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.get('/api/exams/?search=Semester 5')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["results"]), 1)

    def test_filter_by_academic_year_and_semester_and_status(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        url = f'/api/exams/?academic_year_id={self.ay_2026.id}&semester_id={self.sem5.id}&status=DRAFT'
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["results"]), 1)
