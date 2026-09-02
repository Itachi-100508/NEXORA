from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.academics.models import AcademicYear, Department, Program, Semester, Subject
from apps.examinations.models import Exam, ExamSubject, ExamComponent

User = get_user_model()


class ExamComponentAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Users & Roles
        self.admin = User.objects.create_user(
            username="admin_excomp_api",
            email="admin_excomp_api@example.com",
            password="AdminPassword123!",
            role=User.Role.ADMIN,
            is_staff=True,
            is_superuser=True
        )
        self.teacher_user = User.objects.create_user(
            username="teacher_excomp_api",
            email="teacher_excomp_api@example.com",
            password="TeacherPassword123!",
            role=User.Role.TEACHER
        )
        self.student_user = User.objects.create_user(
            username="student_excomp_api",
            email="student_excomp_api@example.com",
            password="StudentPassword123!",
            role=User.Role.STUDENT
        )

        # Academic Hierarchy
        self.ay_2026 = AcademicYear.objects.create(name="2026-27", is_active=True)
        self.dept_cs = Department.objects.create(code="CSE", name="Computer Science and Engineering")
        self.prog_cs = Program.objects.create(department=self.dept_cs, code="BTECH-CSE", name="B.Tech CSE")
        self.sem5 = Semester.objects.create(program=self.prog_cs, number=5, name="Semester 5")

        # Subject & Draft Exam
        self.subj_dbms = Subject.objects.create(code="CS501", name="Database Management Systems", department=self.dept_cs, semester=self.sem5, credits=4)
        self.exam_draft = Exam.objects.create(
            name="Semester 5 End Semester Examination",
            academic_year=self.ay_2026,
            semester=self.sem5,
            status=Exam.Status.DRAFT
        )
        self.es_dbms = ExamSubject.objects.create(
            exam=self.exam_draft,
            subject=self.subj_dbms,
            maximum_marks=100.00,
            passing_marks=40.00
        )

        # Initial Component (Internal = 30)
        self.comp_internal = ExamComponent.objects.create(
            exam_subject=self.es_dbms,
            name="Internal",
            code="INTERNAL",
            maximum_marks=30.00,
            passing_marks=12.00,
            display_order=1
        )

        # Tokens
        self.admin_token = self._get_token("admin_excomp_api", "AdminPassword123!")
        self.teacher_token = self._get_token("teacher_excomp_api", "TeacherPassword123!")
        self.student_token = self._get_token("student_excomp_api", "StudentPassword123!")

    def _get_token(self, username, password):
        res = self.client.post('/api/auth/login/', {"username": username, "password": password}, format='json')
        return res.data["access"]

    # ==========================================
    # AUTHORIZATION GRID TESTS
    # ==========================================

    def test_admin_can_list_exam_components(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.get('/api/exam-components/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("results", res.data)

    def test_teacher_denied_exam_component_list(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.teacher_token}')
        res = self.client.get('/api/exam-components/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_denied_exam_component_list(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        res = self.client.get('/api/exam-components/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_denied_exam_component_list(self):
        self.client.credentials()
        res = self.client.get('/api/exam-components/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    # ==========================================
    # CRUD OPERATIONS & PROHIBITION
    # ==========================================

    def test_admin_create_exam_component_success(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            "exam_subject_id": self.es_dbms.id,
            "name": "External",
            "code": "external",  # Should be normalized to uppercase EXTERNAL
            "maximum_marks": 50.00,
            "passing_marks": 20.00,
            "display_order": 2
        }
        res = self.client.post('/api/exam-components/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["code"], "EXTERNAL")
        self.assertEqual(float(res.data["maximum_marks"]), 50.0)

    def test_admin_retrieve_exam_component_detail(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.get(f'/api/exam-components/{self.comp_internal.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["code"], "INTERNAL")

    def test_admin_update_exam_component_success(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.patch(f'/api/exam-components/{self.comp_internal.id}/', {"passing_marks": 15}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(float(res.data["passing_marks"]), 15.0)

    def test_delete_endpoint_disallowed(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.delete(f'/api/exam-components/{self.comp_internal.id}/')
        self.assertEqual(res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    # ==========================================
    # MARKS & SUM VALIDATION TESTS
    # ==========================================

    def test_duplicate_component_code_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            "exam_subject_id": self.es_dbms.id,
            "name": "Internal duplicate",
            "code": "INTERNAL",  # Duplicate!
            "maximum_marks": 20,
            "passing_marks": 8
        }
        res = self.client.post('/api/exam-components/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_passing_marks_greater_than_max_marks_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            "exam_subject_id": self.es_dbms.id,
            "name": "External",
            "maximum_marks": 50,
            "passing_marks": 55  # Pass > Max!
        }
        res = self.client.post('/api/exam-components/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_component_sum_overflow_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        # Current internal=30. Adding 80 makes 110 > 100 subject max!
        payload = {
            "exam_subject_id": self.es_dbms.id,
            "name": "External Overflow",
            "maximum_marks": 80,
            "passing_marks": 32
        }
        res = self.client.post('/api/exam-components/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    # ==========================================
    # PARTIAL CONFIG & ACTIVATION LOCK TESTS
    # ==========================================

    def test_partial_component_total_allowed_in_draft_but_blocks_activation(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')

        # 1. Add External = 50. Active total = 30 + 50 = 80 < 100.
        res1 = self.client.post('/api/exam-components/', {
            "exam_subject_id": self.es_dbms.id,
            "name": "External",
            "maximum_marks": 50,
            "passing_marks": 20
        }, format='json')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        # 2. Attempt Exam activation (DRAFT -> ACTIVE). Should FAIL because 80 != 100!
        res_act_fail = self.client.patch(f'/api/exams/{self.exam_draft.id}/', {"status": "ACTIVE"}, format='json')
        self.assertEqual(res_act_fail.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("invalid_subjects", res_act_fail.data)

        # 3. Add Practical = 20. Active total = 30 + 50 + 20 = 100.
        res2 = self.client.post('/api/exam-components/', {
            "exam_subject_id": self.es_dbms.id,
            "name": "Practical",
            "maximum_marks": 20,
            "passing_marks": 8
        }, format='json')
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)

        # 4. Attempt Exam activation now. Should SUCCEED!
        res_act_pass = self.client.patch(f'/api/exams/{self.exam_draft.id}/', {"status": "ACTIVE"}, format='json')
        self.assertEqual(res_act_pass.status_code, status.HTTP_200_OK)
        self.assertEqual(res_act_pass.data["status"], "ACTIVE")

    # ==========================================
    # ACTIVE / COMPLETED EXAM LOCK TESTS
    # ==========================================

    def test_create_component_on_active_exam_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        self.exam_draft.status = Exam.Status.ACTIVE
        self.exam_draft.save()

        payload = {
            "exam_subject_id": self.es_dbms.id,
            "name": "New Component",
            "maximum_marks": 10
        }
        res = self.client.post('/api/exam-components/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_component_on_completed_exam_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        self.exam_draft.status = Exam.Status.COMPLETED
        self.exam_draft.save()

        res = self.client.patch(f'/api/exam-components/{self.comp_internal.id}/', {"is_active": False}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    # ==========================================
    # SEARCH & FILTERING TESTS
    # ==========================================

    def test_search_exam_components(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.get('/api/exam-components/?search=INTERNAL')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["results"]), 1)

    def test_filter_by_exam_subject_and_active(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        url = f'/api/exam-components/?exam_subject_id={self.es_dbms.id}&is_active=true'
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["results"]), 1)
