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
    Subject,
    TeacherProfile,
    TeacherAssignment
)

User = get_user_model()


class RoleBasedPermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Admin User
        self.admin_user = User.objects.create_user(
            username="admin_user",
            email="admin@example.com",
            password="AdminPassword123!",
            role=User.Role.ADMIN,
            is_staff=True,
            is_superuser=True
        )

        # Teacher 1 (Assigned)
        self.teacher1 = User.objects.create_user(
            username="teacher1",
            email="teacher1@example.com",
            password="TeacherPassword123!",
            role=User.Role.TEACHER
        )

        # Teacher 2 (Unassigned)
        self.teacher2 = User.objects.create_user(
            username="teacher2",
            email="teacher2@example.com",
            password="TeacherPassword123!",
            role=User.Role.TEACHER
        )

        # Student User
        self.student_user = User.objects.create_user(
            username="student_user",
            email="student@example.com",
            password="StudentPassword123!",
            role=User.Role.STUDENT
        )

        # Academic Assignment Setup
        self.ay_2026 = AcademicYear.objects.create(name="2026-27", is_active=True)
        self.dept_cs = Department.objects.create(code="CSE", name="Computer Science")
        self.prog_cs = Program.objects.create(department=self.dept_cs, code="BTECH-CSE", name="B.Tech CSE")
        self.sem5 = Semester.objects.create(program=self.prog_cs, number=5, name="Semester 5")

        self.class_5a = Classroom.objects.create(code="CSE5A", name="CSE-5A", academic_year=self.ay_2026, program=self.prog_cs, semester=self.sem5)
        self.class_5b = Classroom.objects.create(code="CSE5B", name="CSE-5B", academic_year=self.ay_2026, program=self.prog_cs, semester=self.sem5)

        self.sec_a = Section.objects.create(classroom=self.class_5a, code="A", name="Section A")
        self.sec_b = Section.objects.create(classroom=self.class_5b, code="B", name="Section B")

        self.subject_dbms = Subject.objects.create(name="DBMS", code="CSE501", department=self.dept_cs, semester=self.sem5)
        self.subject_os = Subject.objects.create(name="Operating Systems", code="CSE502", department=self.dept_cs, semester=self.sem5)

        # Teacher Profiles
        self.t1_profile = TeacherProfile.objects.create(user=self.teacher1, employee_id="EMP001", department=self.dept_cs)
        self.t2_profile = TeacherProfile.objects.create(user=self.teacher2, employee_id="EMP002", department=self.dept_cs)

        # Assign teacher1 to DBMS @ CSE-5A (sec_a)
        self.assignment = TeacherAssignment.objects.create(
            teacher=self.t1_profile,
            subject=self.subject_dbms,
            section=self.sec_a,
            academic_year=self.ay_2026,
            is_active=True
        )

        # Obtain Access Tokens
        self.admin_token = self._get_token("admin_user", "AdminPassword123!")
        self.teacher1_token = self._get_token("teacher1", "TeacherPassword123!")
        self.teacher2_token = self._get_token("teacher2", "TeacherPassword123!")
        self.student_token = self._get_token("student_user", "StudentPassword123!")

    def _get_token(self, username, password):
        res = self.client.post('/api/auth/login/', {"username": username, "password": password}, format='json')
        return res.data["access"]

    # ==========================================
    # ADMIN TEST ENDPOINT (/api/auth/admin-test/)
    # ==========================================

    def test_admin_can_access_admin_test(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.get('/api/auth/admin-test/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["role"], "ADMIN")
        self.assertEqual(res.data["message"], "Admin authorization successful")

    def test_teacher_cannot_access_admin_test(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.teacher1_token}')
        res = self.client.get('/api/auth/admin-test/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_cannot_access_admin_test(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        res = self.client.get('/api/auth/admin-test/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    # ==========================================
    # TEACHER TEST ENDPOINT (/api/auth/teacher-test/)
    # ==========================================

    def test_teacher_can_access_teacher_test(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.teacher1_token}')
        res = self.client.get('/api/auth/teacher-test/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["role"], "TEACHER")
        self.assertEqual(res.data["message"], "Teacher authorization successful")

    def test_admin_cannot_access_teacher_test(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.get('/api/auth/teacher-test/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_cannot_access_teacher_test(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        res = self.client.get('/api/auth/teacher-test/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    # ==========================================
    # STUDENT TEST ENDPOINT (/api/auth/student-test/)
    # ==========================================

    def test_student_can_access_student_test(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        res = self.client.get('/api/auth/student-test/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["role"], "STUDENT")
        self.assertEqual(res.data["message"], "Student authorization successful")

    def test_admin_cannot_access_student_test(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.get('/api/auth/student-test/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_teacher_cannot_access_student_test(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.teacher1_token}')
        res = self.client.get('/api/auth/student-test/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    # ==========================================
    # ADMIN OR TEACHER ENDPOINT (/api/auth/admin-teacher-test/)
    # ==========================================

    def test_admin_can_access_admin_teacher_test(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.get('/api/auth/admin-teacher-test/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["message"], "Admin or Teacher authorization successful")

    def test_teacher_can_access_admin_teacher_test(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.teacher1_token}')
        res = self.client.get('/api/auth/admin-teacher-test/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["message"], "Admin or Teacher authorization successful")

    def test_student_cannot_access_admin_teacher_test(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        res = self.client.get('/api/auth/admin-teacher-test/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    # ==========================================
    # TEACHER ASSIGNMENT TESTS (/api/auth/teacher-assignment-test/)
    # ==========================================

    def test_assigned_teacher_allowed_for_assigned_subject_and_class(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.teacher1_token}')
        url = f'/api/auth/teacher-assignment-test/?subject_id={self.subject_dbms.id}&class_id={self.class_5a.id}'
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["message"], "Teacher assignment authorization successful")
        self.assertEqual(res.data["user_id"], self.teacher1.id)

    def test_unassigned_teacher_denied_for_assigned_subject_and_class(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.teacher2_token}')
        url = f'/api/auth/teacher-assignment-test/?subject_id={self.subject_dbms.id}&class_id={self.class_5a.id}'
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_assigned_teacher_denied_for_different_subject(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.teacher1_token}')
        url = f'/api/auth/teacher-assignment-test/?subject_id={self.subject_os.id}&class_id={self.class_5a.id}'
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_assigned_teacher_denied_for_different_class(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.teacher1_token}')
        url = f'/api/auth/teacher-assignment-test/?subject_id={self.subject_dbms.id}&class_id={self.class_5b.id}'
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_request_denied(self):
        self.client.credentials()
        res = self.client.get('/api/auth/admin-test/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
