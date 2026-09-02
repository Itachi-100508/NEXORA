from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

from apps.academics.models import (
    Department, Program, Semester, Classroom, Section, Subject,
    AcademicYear, StudentProfile, TeacherProfile, TeacherAssignment
)
from apps.examinations.models import Exam, ExamSubject, ExamComponent
from apps.marks.models import MarkEntry, MarkCorrectionRequest
from apps.marks.services import MarksValidator, create_or_update_mark_entry

User = get_user_model()


class MarksSystemTests(TestCase):
    def setUp(self):
        # 1. Users
        self.admin = User.objects.create_superuser('admin', 'admin@example.com', 'AdminPass123', role='ADMIN')
        self.teacher_user = User.objects.create_user('teacher1', 'teacher1@example.com', 'TeacherPass123', role='TEACHER', first_name="Dr.", last_name="Sharma")
        self.student_user = User.objects.create_user('student1', 'student1@example.com', 'StudentPass123', role='STUDENT', first_name="Rahul", last_name="Kumar")
        self.other_student_user = User.objects.create_user('student2', 'student2@example.com', 'StudentPass123', role='STUDENT', first_name="Amit", last_name="Singh")

        # 2. Profiles
        self.teacher = TeacherProfile.objects.create(user=self.teacher_user, employee_id="EMP101")

        # 3. Academics
        self.dept = Department.objects.create(name="Computer Science", code="CS")
        self.prog = Program.objects.create(department=self.dept, name="B.Tech CS", code="BTCS")
        self.ay = AcademicYear.objects.create(name="2025-2026")
        self.sem = Semester.objects.create(program=self.prog, number=5, name="Semester 5")
        self.classroom = Classroom.objects.create(academic_year=self.ay, program=self.prog, semester=self.sem, name="S5 CS", code="CS-S5")
        self.sec_a = Section.objects.create(classroom=self.classroom, name="A", code="SEC-A")
        self.sec_b = Section.objects.create(classroom=self.classroom, name="B", code="SEC-B")

        self.student = StudentProfile.objects.create(user=self.student_user, roll_number="101", section=self.sec_a)
        self.other_student = StudentProfile.objects.create(user=self.other_student_user, roll_number="102", section=self.sec_b)

        self.subject = Subject.objects.create(code="CS501", name="Database Systems", credits=4)

        # 4. Teacher Assignment
        self.assignment = TeacherAssignment.objects.create(
            teacher=self.teacher,
            subject=self.subject,
            section=self.sec_a,
            academic_year=self.ay,
            is_active=True
        )

        # 5. Exam & Components
        self.exam = Exam.objects.create(
            academic_year=self.ay,
            semester=self.sem,
            name="End Sem Exam",
            code="EXAM-S5",
            status=Exam.Status.ACTIVE
        )
        self.exam_sub = ExamSubject.objects.create(exam=self.exam, subject=self.subject)
        self.comp_internal = ExamComponent.objects.create(exam_subject=self.exam_sub, name="Internal", code="INT", maximum_marks=Decimal('30.00'), weightage=Decimal('30.00'))
        self.comp_external = ExamComponent.objects.create(exam_subject=self.exam_sub, name="External", code="EXT", maximum_marks=Decimal('70.00'), weightage=Decimal('70.00'))

        # API Clients
        self.admin_client = APIClient()
        self.admin_client.force_authenticate(user=self.admin)

        self.teacher_client = APIClient()
        self.teacher_client.force_authenticate(user=self.teacher_user)

        self.student_client = APIClient()
        self.student_client.force_authenticate(user=self.student_user)

    def test_marks_validator_bounds(self):
        """Test negative marks and over-maximum marks rejection"""
        from django.core.exceptions import ValidationError

        with self.assertRaises(ValidationError):
            MarksValidator.validate(self.teacher_user, self.student, self.comp_internal, Decimal('-5.00'))

        with self.assertRaises(ValidationError):
            MarksValidator.validate(self.teacher_user, self.student, self.comp_internal, Decimal('35.00'))

        valid_marks = MarksValidator.validate(self.teacher_user, self.student, self.comp_internal, Decimal('25.00'))
        self.assertEqual(valid_marks, Decimal('25.00'))

    def test_marks_entry_service_create_and_update(self):
        """Test service layer create or update MarkEntry"""
        entry, created = create_or_update_mark_entry(
            user=self.teacher_user,
            student_id=self.student.id,
            exam_component_id=self.comp_internal.id,
            obtained_marks=Decimal('25.00')
        )
        self.assertTrue(created)
        self.assertEqual(entry.obtained_marks, Decimal('25.00'))
        self.assertEqual(entry.entered_by, self.teacher_user)

        # Update
        updated_entry, created_again = create_or_update_mark_entry(
            user=self.teacher_user,
            student_id=self.student.id,
            exam_component_id=self.comp_internal.id,
            obtained_marks=Decimal('28.00')
        )
        self.assertFalse(created_again)
        self.assertEqual(updated_entry.obtained_marks, Decimal('28.00'))
        self.assertEqual(updated_entry.updated_by, self.teacher_user)

    def test_marks_api_post(self):
        """Test POST /api/marks/ endpoint"""
        payload = {
            "student_id": self.student.id,
            "exam_component_id": self.comp_internal.id,
            "obtained_marks": "22.50"
        }
        res = self.teacher_client.post('/api/marks/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['obtained_marks'], '22.50')

    def test_teacher_unassigned_section_rejection(self):
        """Teacher cannot enter marks for unassigned student (sec_b)"""
        payload = {
            "student_id": self.other_student.id,
            "exam_component_id": self.comp_internal.id,
            "obtained_marks": "20.00"
        }
        res = self.teacher_client.post('/api/marks/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_student_cannot_post_marks(self):
        """Student receives 403 when attempting to enter marks"""
        payload = {
            "student_id": self.student.id,
            "exam_component_id": self.comp_internal.id,
            "obtained_marks": "20.00"
        }
        res = self.student_client.post('/api/marks/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
