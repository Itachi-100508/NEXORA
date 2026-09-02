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
from apps.marks.models import MarkEntry
from apps.reports.services import generate_result_pdf, AnalyticsService, AIAnalyticsService

User = get_user_model()


class ReportsAndAnalyticsTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser('admin', 'admin@example.com', 'AdminPass123', role='ADMIN')
        self.teacher_user = User.objects.create_user('teacher1', 'teacher1@example.com', 'TeacherPass123', role='TEACHER')
        self.teacher = TeacherProfile.objects.create(user=self.teacher_user, employee_id="EMP101")

        self.dept = Department.objects.create(name="Computer Science", code="CS")
        self.prog = Program.objects.create(department=self.dept, name="B.Tech CS", code="BTCS")
        self.ay = AcademicYear.objects.create(name="2025-2026")
        self.sem = Semester.objects.create(program=self.prog, number=5, name="Semester 5")
        self.classroom = Classroom.objects.create(academic_year=self.ay, program=self.prog, semester=self.sem, name="S5 CS", code="CS-S5")
        self.sec_a = Section.objects.create(classroom=self.classroom, name="A", code="SEC-A")

        self.student_user = User.objects.create_user('student1', 'student1@example.com', 'StudentPass123', role='STUDENT', first_name="Rahul", last_name="Kumar")
        self.student = StudentProfile.objects.create(user=self.student_user, roll_number="101", section=self.sec_a)

        self.other_student_user = User.objects.create_user('student2', 'student2@example.com', 'StudentPass123', role='STUDENT', first_name="Amit", last_name="Singh")
        self.other_student = StudentProfile.objects.create(user=self.other_student_user, roll_number="102", section=self.sec_a)

        self.sub_dbms = Subject.objects.create(code="CS501", name="DBMS", credits=4)
        self.sub_cn = Subject.objects.create(code="CS503", name="CN", credits=4)

        self.exam = Exam.objects.create(
            academic_year=self.ay,
            semester=self.sem,
            name="Semester 5 Examination",
            code="EXAM-S5",
            status=Exam.Status.ACTIVE
        )

        es1 = ExamSubject.objects.create(exam=self.exam, subject=self.sub_dbms)
        ec1 = ExamComponent.objects.create(exam_subject=es1, name="Theory", code="TH", maximum_marks=Decimal('100.00'), weightage=Decimal('100.00'))
        MarkEntry.objects.create(student=self.student, exam_component=ec1, obtained_marks=Decimal('90.00'), entered_by=self.teacher_user)

        es2 = ExamSubject.objects.create(exam=self.exam, subject=self.sub_cn)
        ec2 = ExamComponent.objects.create(exam_subject=es2, name="Theory", code="TH", maximum_marks=Decimal('100.00'), weightage=Decimal('100.00'))
        MarkEntry.objects.create(student=self.student, exam_component=ec2, obtained_marks=Decimal('45.00'), entered_by=self.teacher_user)

        self.student_client = APIClient()
        self.student_client.force_authenticate(user=self.student_user)

        self.other_student_client = APIClient()
        self.other_student_client.force_authenticate(user=self.other_student_user)

    def test_pdf_endpoint_returns_application_pdf(self):
        """Test GET /api/results/{student_id}/{exam_id}/pdf/ returns Content-Type: application/pdf"""
        res = self.student_client.get(f'/api/results/{self.student.id}/{self.exam.id}/pdf/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res['Content-Type'], 'application/pdf')

    def test_student_cannot_access_other_student_pdf(self):
        """Student A cannot access Student B's PDF (403 Forbidden)"""
        res = self.other_student_client.get(f'/api/results/{self.student.id}/{self.exam.id}/pdf/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_ai_analytics_student_insights(self):
        """Test AIAnalyticsService weak/strong subject detection, risk level, and recommendations"""
        analysis = AIAnalyticsService.analyze_student(self.student, self.exam)
        self.assertIn("DBMS", analysis["strong_subjects"])
        self.assertIn("CN", analysis["weak_subjects"])
        self.assertIsNotNone(analysis["summary"])
        self.assertGreater(len(analysis["recommendations"]), 0)
        self.assertEqual(analysis["trend"]["status"], "INSUFFICIENT_DATA")
