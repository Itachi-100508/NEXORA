from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.academics.models import AcademicYear, Department, Program, Semester, Classroom, Section, Subject, TeacherProfile, TeacherAssignment
from apps.academics.services import is_teacher_assigned

User = get_user_model()


class TeacherAssignmentAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Users & Roles
        self.admin = User.objects.create_user(
            username="admin_asgn_api",
            email="admin_asgn_api@example.com",
            password="AdminPassword123!",
            role=User.Role.ADMIN,
            is_staff=True,
            is_superuser=True
        )
        self.teacher_user = User.objects.create_user(
            username="teacher_asgn_user",
            email="teacher_asgn_user@example.com",
            password="TeacherPassword123!",
            role=User.Role.TEACHER
        )
        self.teacher2_user = User.objects.create_user(
            username="teacher2_asgn_user",
            email="teacher2_asgn_user@example.com",
            password="TeacherPassword123!",
            role=User.Role.TEACHER
        )
        self.student_user = User.objects.create_user(
            username="student_asgn_user",
            email="student_asgn_user@example.com",
            password="StudentPassword123!",
            role=User.Role.STUDENT
        )

        # Academic Hierarchy
        self.ay_2026 = AcademicYear.objects.create(name="2026-27", is_active=True)
        self.ay_2025 = AcademicYear.objects.create(name="2025-26", is_active=True)

        self.dept_cs = Department.objects.create(code="CSE", name="Computer Science and Engineering")
        self.dept_me = Department.objects.create(code="ME", name="Mechanical Engineering")

        self.prog_cs = Program.objects.create(department=self.dept_cs, code="BTECH-CSE", name="B.Tech CSE")

        self.sem5 = Semester.objects.create(program=self.prog_cs, number=5, name="Semester 5")
        self.sem3 = Semester.objects.create(program=self.prog_cs, number=3, name="Semester 3")

        self.cls_cse5 = Classroom.objects.create(code="CSE-S5-2026", academic_year=self.ay_2026, program=self.prog_cs, semester=self.sem5, name="CSE 5th Semester")

        self.sec_a = Section.objects.create(classroom=self.cls_cse5, code="A", name="Section A")
        self.sec_b = Section.objects.create(classroom=self.cls_cse5, code="B", name="Section B")

        # Subjects
        self.subj_dbms = Subject.objects.create(code="CS501", name="Database Management Systems", department=self.dept_cs, semester=self.sem5, credits=4)
        self.subj_os = Subject.objects.create(code="CS502", name="Operating Systems", department=self.dept_cs, semester=self.sem5, credits=4)
        self.subj_sem3 = Subject.objects.create(code="CS301", name="Data Structures", department=self.dept_cs, semester=self.sem3, credits=4)

        # Teacher Profiles
        self.t1_profile = TeacherProfile.objects.create(user=self.teacher_user, employee_id="EMP501", department=self.dept_cs, designation="Assistant Professor")
        self.t2_profile = TeacherProfile.objects.create(user=self.teacher2_user, employee_id="EMP502", department=self.dept_cs, designation="Associate Professor")

        # Initial Assignment
        self.asgn1 = TeacherAssignment.objects.create(
            teacher=self.t1_profile,
            subject=self.subj_dbms,
            section=self.sec_a,
            academic_year=self.ay_2026,
            is_active=True
        )

        # Tokens
        self.admin_token = self._get_token("admin_asgn_api", "AdminPassword123!")
        self.teacher_token = self._get_token("teacher_asgn_user", "TeacherPassword123!")
        self.student_token = self._get_token("student_asgn_user", "StudentPassword123!")

    def _get_token(self, username, password):
        res = self.client.post('/api/auth/login/', {"username": username, "password": password}, format='json')
        return res.data["access"]

    # ==========================================
    # ASSIGNMENT CHECKER SERVICE UNIT TESTS
    # ==========================================

    def test_is_teacher_assigned_returns_true_for_valid_assignment(self):
        self.assertTrue(is_teacher_assigned(self.t1_profile, self.subj_dbms, self.sec_a, self.ay_2026))
        self.assertTrue(is_teacher_assigned(self.teacher_user, self.subj_dbms.id, self.sec_a.id, self.ay_2026.id))

    def test_is_teacher_assigned_returns_false_for_mismatches(self):
        # Wrong teacher
        self.assertFalse(is_teacher_assigned(self.t2_profile, self.subj_dbms, self.sec_a, self.ay_2026))
        # Wrong subject
        self.assertFalse(is_teacher_assigned(self.t1_profile, self.subj_os, self.sec_a, self.ay_2026))
        # Wrong section
        self.assertFalse(is_teacher_assigned(self.t1_profile, self.subj_dbms, self.sec_b, self.ay_2026))
        # Wrong academic year
        self.assertFalse(is_teacher_assigned(self.t1_profile, self.subj_dbms, self.sec_a, self.ay_2025))

    def test_is_teacher_assigned_returns_false_for_inactive_assignment(self):
        self.asgn1.is_active = False
        self.asgn1.save()
        self.assertFalse(is_teacher_assigned(self.t1_profile, self.subj_dbms, self.sec_a, self.ay_2026))

    # ==========================================
    # AUTHORIZATION GRID TESTS
    # ==========================================

    def test_admin_can_access_assignment_list(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.get('/api/assignments/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("results", res.data)

    def test_teacher_denied_assignment_list(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.teacher_token}')
        res = self.client.get('/api/assignments/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_denied_assignment_list(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        res = self.client.get('/api/assignments/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_denied_assignment_list(self):
        self.client.credentials()
        res = self.client.get('/api/assignments/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    # ==========================================
    # CRUD & ACTION PROHIBITION OPERATIONS
    # ==========================================

    def test_admin_create_assignment_success(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            "teacher_id": self.t2_profile.id,
            "subject_id": self.subj_os.id,
            "section_id": self.sec_a.id,
            "academic_year_id": self.ay_2026.id
        }
        res = self.client.post('/api/assignments/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["teacher"]["id"], self.t2_profile.id)
        self.assertEqual(res.data["subject"]["code"], "CS502")

    def test_admin_retrieve_assignment_detail(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.get(f'/api/assignments/{self.asgn1.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["teacher"]["employee_id"], "EMP501")

    def test_admin_update_assignment_deactivate(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.patch(f'/api/assignments/{self.asgn1.id}/', {"is_active": False}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(res.data["is_active"])

    def test_delete_endpoint_disallowed(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.delete(f'/api/assignments/{self.asgn1.id}/')
        self.assertEqual(res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    # ==========================================
    # VALIDATION & SECURITY TESTS
    # ==========================================

    def test_duplicate_assignment_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            "teacher_id": self.t1_profile.id,
            "subject_id": self.subj_dbms.id,
            "section_id": self.sec_a.id,
            "academic_year_id": self.ay_2026.id
        }
        res = self.client.post('/api/assignments/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_semester_mismatch_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            "teacher_id": self.t1_profile.id,
            "subject_id": self.subj_sem3.id,  # Semester 3 subject for Semester 5 section!
            "section_id": self.sec_a.id,
            "academic_year_id": self.ay_2026.id
        }
        res = self.client.post('/api/assignments/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("subject_id", res.data)

    def test_teacher_cannot_self_assign(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.teacher_token}')
        payload = {
            "teacher_id": self.t1_profile.id,
            "subject_id": self.subj_os.id,
            "section_id": self.sec_a.id,
            "academic_year_id": self.ay_2026.id
        }
        res = self.client.post('/api/assignments/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
