from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.academics.models import AcademicYear, Department, Program, Semester, Subject, Classroom, Section, StudentProfile, TeacherProfile, TeacherAssignment
from apps.examinations.models import Exam, ExamSubject, ExamComponent
from apps.marks.models import MarkEntry

User = get_user_model()


class MarkEntryAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Users & Roles
        self.admin = User.objects.create_user(
            username="admin_mark_api",
            email="admin_mark_api@example.com",
            password="AdminPassword123!",
            role=User.Role.ADMIN,
            is_staff=True,
            is_superuser=True
        )

        self.teacher_user = User.objects.create_user(
            username="teacher_mark_api",
            email="teacher_mark_api@example.com",
            password="TeacherPassword123!",
            role=User.Role.TEACHER
        )
        self.teacher_profile = TeacherProfile.objects.create(
            user=self.teacher_user,
            employee_id="TCH-MARK-001"
        )

        self.teacher_unassigned = User.objects.create_user(
            username="teacher_unassigned_mark",
            email="teacher_unassigned_mark@example.com",
            password="TeacherPassword123!",
            role=User.Role.TEACHER
        )
        self.teacher_unassigned_profile = TeacherProfile.objects.create(
            user=self.teacher_unassigned,
            employee_id="TCH-MARK-002"
        )

        self.student_user = User.objects.create_user(
            username="student_mark_api",
            email="student_mark_api@example.com",
            password="StudentPassword123!",
            role=User.Role.STUDENT,
            first_name="Rahul",
            last_name="Kumar"
        )

        # Academic Hierarchy
        self.ay_2026 = AcademicYear.objects.create(name="2026-27", is_active=True)
        self.dept_cs = Department.objects.create(code="CSE", name="Computer Science and Engineering")
        self.prog_cs = Program.objects.create(department=self.dept_cs, code="BTECH-CSE", name="B.Tech CSE")
        self.sem5 = Semester.objects.create(program=self.prog_cs, number=5, name="Semester 5")

        self.classroom = Classroom.objects.create(semester=self.sem5, name="CSE 5th Sem Class A")
        self.section_a = Section.objects.create(classroom=self.classroom, name="A", code="A")
        self.section_b = Section.objects.create(classroom=self.classroom, name="B", code="B")

        self.student_profile = StudentProfile.objects.create(
            user=self.student_user,
            roll_number="CSE-2026-001",
            enrollment_number="ENR-2026-001",
            section=self.section_a
        )

        # Subject & ACTIVE Exam
        self.subj_dbms = Subject.objects.create(code="CS501", name="Database Management Systems", department=self.dept_cs, semester=self.sem5, credits=4)

        # Teacher Assignment for Teacher 1 (assigned to DBMS, Section A, AY 2026-27)
        self.assignment = TeacherAssignment.objects.create(
            teacher=self.teacher_profile,
            subject=self.subj_dbms,
            section=self.section_a,
            academic_year=self.ay_2026,
            is_active=True
        )

        self.exam_active = Exam.objects.create(
            name="Semester 5 End Semester Examination",
            academic_year=self.ay_2026,
            semester=self.sem5,
            status=Exam.Status.ACTIVE
        )

        self.exam_draft = Exam.objects.create(
            name="Semester 5 Mid Semester Examination",
            academic_year=self.ay_2026,
            semester=self.sem5,
            status=Exam.Status.DRAFT
        )

        self.es_dbms_active = ExamSubject.objects.create(
            exam=self.exam_active,
            subject=self.subj_dbms,
            maximum_marks=100.00,
            passing_marks=40.00
        )

        self.es_dbms_draft = ExamSubject.objects.create(
            exam=self.exam_draft,
            subject=self.subj_dbms,
            maximum_marks=100.00,
            passing_marks=40.00
        )

        # Active & Inactive Components
        self.comp_internal = ExamComponent.objects.create(
            exam_subject=self.es_dbms_active,
            name="Internal",
            code="INTERNAL",
            maximum_marks=30.00,
            passing_marks=12.00,
            display_order=1,
            is_active=True
        )

        self.comp_inactive = ExamComponent.objects.create(
            exam_subject=self.es_dbms_active,
            name="Lab",
            code="LAB",
            maximum_marks=20.00,
            passing_marks=8.00,
            display_order=2,
            is_active=False
        )

        self.comp_draft = ExamComponent.objects.create(
            exam_subject=self.es_dbms_draft,
            name="Internal",
            code="INTERNAL",
            maximum_marks=30.00,
            passing_marks=12.00,
            display_order=1,
            is_active=True
        )

        # Initial MarkEntry
        self.mark_entry_dbms = MarkEntry.objects.create(
            student=self.student_profile,
            exam_component=self.comp_internal,
            obtained_marks=Decimal('25.00'),
            entered_by=self.admin,
            is_active=True
        )

        # Tokens
        self.admin_token = self._get_token("admin_mark_api", "AdminPassword123!")
        self.teacher_token = self._get_token("teacher_mark_api", "TeacherPassword123!")
        self.teacher_unassigned_token = self._get_token("teacher_unassigned_mark", "TeacherPassword123!")
        self.student_token = self._get_token("student_mark_api", "StudentPassword123!")

    def _get_token(self, username, password):
        res = self.client.post('/api/auth/login/', {"username": username, "password": password}, format='json')
        return res.data["access"]

    # ==========================================
    # AUTHORIZATION & SCOPING GRID TESTS
    # ==========================================

    def test_admin_can_list_all_mark_entries(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.get('/api/mark-entries/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["results"]), 1)

    def test_assigned_teacher_can_list_mark_entries(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.teacher_token}')
        res = self.client.get('/api/mark-entries/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["results"]), 1)

    def test_unassigned_teacher_receives_empty_mark_entries(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.teacher_unassigned_token}')
        res = self.client.get('/api/mark-entries/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["results"]), 0)

    def test_student_denied_mark_entries_access(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        res = self.client.get('/api/mark-entries/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_denied_mark_entries_access(self):
        self.client.credentials()
        res = self.client.get('/api/mark-entries/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    # ==========================================
    # CREATE & UPDATE TESTS
    # ==========================================

    def test_assigned_teacher_can_create_mark_entry(self):
        user2 = User.objects.create_user(username="student2", email="student2@example.com", password="Password123!", role=User.Role.STUDENT)
        stud2 = StudentProfile.objects.create(user=user2, roll_number="CSE-2026-002", enrollment_number="ENR-2026-002", section=self.section_a)

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.teacher_token}')
        payload = {
            "student_id": stud2.id,
            "exam_component_id": self.comp_internal.id,
            "obtained_marks": 28.50
        }
        res = self.client.post('/api/mark-entries/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(float(res.data["obtained_marks"]), 28.5)
        self.assertEqual(res.data["entered_by"]["id"], self.teacher_user.id)

    def test_unassigned_teacher_create_mark_entry_rejected(self):
        user2 = User.objects.create_user(username="student3", email="student3@example.com", password="Password123!", role=User.Role.STUDENT)
        stud3 = StudentProfile.objects.create(user=user2, roll_number="CSE-2026-003", enrollment_number="ENR-2026-003", section=self.section_a)

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.teacher_unassigned_token}')
        payload = {
            "student_id": stud3.id,
            "exam_component_id": self.comp_internal.id,
            "obtained_marks": 20.00
        }
        res = self.client.post('/api/mark-entries/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_teacher_create_mark_entry_unassigned_section_rejected(self):
        user_sec_b = User.objects.create_user(username="student_sec_b", email="secb@example.com", password="Password123!", role=User.Role.STUDENT)
        stud_sec_b = StudentProfile.objects.create(user=user_sec_b, roll_number="CSE-2026-004", enrollment_number="ENR-2026-004", section=self.section_b)

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.teacher_token}')
        payload = {
            "student_id": stud_sec_b.id,
            "exam_component_id": self.comp_internal.id,
            "obtained_marks": 20.00
        }
        res = self.client.post('/api/mark-entries/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    # ==========================================
    # VALIDATION RULES & EXAM LOCKS
    # ==========================================

    def test_duplicate_mark_entry_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            "student_id": self.student_profile.id,
            "exam_component_id": self.comp_internal.id,
            "obtained_marks": 20.00
        }
        res = self.client.post('/api/mark-entries/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_obtained_marks_exceeding_max_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            "student_id": self.student_profile.id,
            "exam_component_id": self.comp_internal.id,
            "obtained_marks": 35.00
        }
        res = self.client.post('/api/mark-entries/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_negative_obtained_marks_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            "student_id": self.student_profile.id,
            "exam_component_id": self.comp_internal.id,
            "obtained_marks": -5.00
        }
        res = self.client.post('/api/mark-entries/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_mark_entry_on_draft_exam_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            "student_id": self.student_profile.id,
            "exam_component_id": self.comp_draft.id,
            "obtained_marks": 20.00
        }
        res = self.client.post('/api/mark-entries/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_mark_entry_on_inactive_component_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            "student_id": self.student_profile.id,
            "exam_component_id": self.comp_inactive.id,
            "obtained_marks": 15.00
        }
        res = self.client.post('/api/mark-entries/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_mark_update_on_completed_exam_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        self.exam_active.status = Exam.Status.COMPLETED
        self.exam_active.save()

        res = self.client.patch(f'/api/mark-entries/{self.mark_entry_dbms.id}/', {"obtained_marks": 28}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_endpoint_disallowed(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.delete(f'/api/mark-entries/{self.mark_entry_dbms.id}/')
        self.assertEqual(res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    # ==========================================
    # SEARCH & FILTERING TESTS
    # ==========================================

    def test_search_mark_entries(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.get('/api/mark-entries/?search=Rahul')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["results"]), 1)

    def test_filter_by_student_and_component(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        url = f'/api/mark-entries/?student_id={self.student_profile.id}&exam_component_id={self.comp_internal.id}'
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["results"]), 1)
