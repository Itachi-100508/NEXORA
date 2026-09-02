from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.academics.models import AcademicYear, Department, Program, Semester, Subject
from apps.examinations.models import Exam, ExamSubject

User = get_user_model()


class ExamSubjectAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Users & Roles
        self.admin = User.objects.create_user(
            username="admin_exsub_api",
            email="admin_exsub_api@example.com",
            password="AdminPassword123!",
            role=User.Role.ADMIN,
            is_staff=True,
            is_superuser=True
        )
        self.teacher_user = User.objects.create_user(
            username="teacher_exsub_api",
            email="teacher_exsub_api@example.com",
            password="TeacherPassword123!",
            role=User.Role.TEACHER
        )
        self.student_user = User.objects.create_user(
            username="student_exsub_api",
            email="student_exsub_api@example.com",
            password="StudentPassword123!",
            role=User.Role.STUDENT
        )

        # Academic Hierarchy
        self.ay_2026 = AcademicYear.objects.create(name="2026-27", is_active=True)
        self.dept_cs = Department.objects.create(code="CSE", name="Computer Science and Engineering")
        self.prog_cs = Program.objects.create(department=self.dept_cs, code="BTECH-CSE", name="B.Tech CSE")

        self.sem5 = Semester.objects.create(program=self.prog_cs, number=5, name="Semester 5")
        self.sem3 = Semester.objects.create(program=self.prog_cs, number=3, name="Semester 3")

        # Subjects
        self.subj_dbms = Subject.objects.create(code="CS501", name="Database Management Systems", department=self.dept_cs, semester=self.sem5, credits=4)
        self.subj_os = Subject.objects.create(code="CS502", name="Operating Systems", department=self.dept_cs, semester=self.sem5, credits=4)
        self.subj_sem3 = Subject.objects.create(code="CS301", name="Data Structures", department=self.dept_cs, semester=self.sem3, credits=4)

        # Draft Exam
        self.exam_draft = Exam.objects.create(
            name="Semester 5 End Semester Examination",
            academic_year=self.ay_2026,
            semester=self.sem5,
            status=Exam.Status.DRAFT
        )

        # Active Exam
        self.exam_active = Exam.objects.create(
            name="Semester 3 Mid Semester Examination",
            academic_year=self.ay_2026,
            semester=self.sem3,
            status=Exam.Status.ACTIVE
        )

        # Initial ExamSubject for draft exam
        self.es_dbms = ExamSubject.objects.create(
            exam=self.exam_draft,
            subject=self.subj_dbms,
            maximum_marks=100.00,
            passing_marks=40.00,
            display_order=1
        )

        # Tokens
        self.admin_token = self._get_token("admin_exsub_api", "AdminPassword123!")
        self.teacher_token = self._get_token("teacher_exsub_api", "TeacherPassword123!")
        self.student_token = self._get_token("student_exsub_api", "StudentPassword123!")

    def _get_token(self, username, password):
        res = self.client.post('/api/auth/login/', {"username": username, "password": password}, format='json')
        return res.data["access"]

    # ==========================================
    # AUTHORIZATION GRID TESTS
    # ==========================================

    def test_admin_can_list_exam_subjects(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.get('/api/exam-subjects/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("results", res.data)

    def test_teacher_denied_exam_subject_list(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.teacher_token}')
        res = self.client.get('/api/exam-subjects/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_denied_exam_subject_list(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        res = self.client.get('/api/exam-subjects/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_denied_exam_subject_list(self):
        self.client.credentials()
        res = self.client.get('/api/exam-subjects/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    # ==========================================
    # CRUD OPERATIONS & PROHIBITION
    # ==========================================

    def test_admin_create_exam_subject_success(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            "exam_id": self.exam_draft.id,
            "subject_id": self.subj_os.id,
            "maximum_marks": 100,
            "passing_marks": 40,
            "display_order": 2
        }
        res = self.client.post('/api/exam-subjects/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["subject"]["code"], "CS502")
        self.assertEqual(float(res.data["maximum_marks"]), 100.0)

    def test_admin_retrieve_exam_subject_detail(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.get(f'/api/exam-subjects/{self.es_dbms.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["subject"]["code"], "CS501")

    def test_admin_update_exam_subject_draft_success(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.patch(f'/api/exam-subjects/{self.es_dbms.id}/', {"passing_marks": 35}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(float(res.data["passing_marks"]), 35.0)

    def test_delete_endpoint_disallowed(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.delete(f'/api/exam-subjects/{self.es_dbms.id}/')
        self.assertEqual(res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    # ==========================================
    # VALIDATION RULES
    # ==========================================

    def test_duplicate_subject_in_same_exam_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            "exam_id": self.exam_draft.id,
            "subject_id": self.subj_dbms.id,  # Already exists!
            "maximum_marks": 100,
            "passing_marks": 40
        }
        res = self.client.post('/api/exam-subjects/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_passing_marks_greater_than_max_marks_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            "exam_id": self.exam_draft.id,
            "subject_id": self.subj_os.id,
            "maximum_marks": 100,
            "passing_marks": 105  # Passing > Max!
        }
        res = self.client.post('/api/exam-subjects/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_zero_or_negative_marks_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            "exam_id": self.exam_draft.id,
            "subject_id": self.subj_os.id,
            "maximum_marks": 0,
            "passing_marks": 40
        }
        res = self.client.post('/api/exam-subjects/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_semester_mismatch_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            "exam_id": self.exam_draft.id,  # Sem 5 exam
            "subject_id": self.subj_sem3.id,  # Sem 3 subject!
            "maximum_marks": 100,
            "passing_marks": 40
        }
        res = self.client.post('/api/exam-subjects/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    # ==========================================
    # EXAM STATUS LOCK TESTS
    # ==========================================

    def test_create_exam_subject_on_active_exam_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            "exam_id": self.exam_active.id,  # ACTIVE exam!
            "subject_id": self.subj_sem3.id,
            "maximum_marks": 100,
            "passing_marks": 40
        }
        res = self.client.post('/api/exam-subjects/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_marks_on_active_exam_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')

        # Add subject to active exam via ORM directly
        es_active = ExamSubject.objects.create(
            exam=self.exam_active,
            subject=self.subj_sem3,
            maximum_marks=100,
            passing_marks=40
        )

        res = self.client.patch(f'/api/exam-subjects/{es_active.id}/', {"maximum_marks": 120}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_exam_subject_on_completed_exam_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        self.exam_draft.status = Exam.Status.COMPLETED
        self.exam_draft.save()

        res = self.client.patch(f'/api/exam-subjects/{self.es_dbms.id}/', {"is_active": False}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    # ==========================================
    # SEARCH & FILTERING TESTS
    # ==========================================

    def test_search_exam_subjects(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.get('/api/exam-subjects/?search=CS501')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["results"]), 1)

    def test_filter_by_exam_and_subject_and_active(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        url = f'/api/exam-subjects/?exam_id={self.exam_draft.id}&subject_id={self.subj_dbms.id}&is_active=true'
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["results"]), 1)
