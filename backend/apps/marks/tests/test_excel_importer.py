import io
import openpyxl
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
from apps.marks.services import import_marks_from_excel

User = get_user_model()


class ExcelImporterTests(TestCase):
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

        self.student_user = User.objects.create_user('student1', 'student1@example.com', 'StudentPass123', role='STUDENT')
        self.student = StudentProfile.objects.create(user=self.student_user, roll_number="101", section=self.sec_a)

        self.subject = Subject.objects.create(code="CS501", name="Database Systems", credits=4)
        self.assignment = TeacherAssignment.objects.create(
            teacher=self.teacher,
            subject=self.subject,
            section=self.sec_a,
            academic_year=self.ay,
            is_active=True
        )

        self.exam = Exam.objects.create(
            academic_year=self.ay,
            semester=self.sem,
            name="End Sem Exam",
            code="EXAM-S5",
            status=Exam.Status.ACTIVE
        )
        self.exam_sub = ExamSubject.objects.create(exam=self.exam, subject=self.subject)
        self.comp_internal = ExamComponent.objects.create(exam_subject=self.exam_sub, name="Internal", code="INT", maximum_marks=Decimal('30.00'), weightage=Decimal('30.00'))

        self.teacher_client = APIClient()
        self.teacher_client.force_authenticate(user=self.teacher_user)

    def create_excel_file(self, rows):
        wb = openpyxl.Workbook()
        ws = wb.active
        for r in rows:
            ws.append(r)
        buf = io.BytesIO()
        wb.save(buf)
        buf.seek(0)
        buf.name = 'marks.xlsx'
        return buf

    def test_valid_excel_import(self):
        rows = [
            ["roll_number", "subject_code", "component_code", "marks"],
            ["101", "CS501", "INT", 25.5]
        ]
        excel_file = self.create_excel_file(rows)
        res = import_marks_from_excel(excel_file, self.exam.id, self.teacher_user)

        self.assertTrue(res["success"])
        self.assertEqual(res["created"], 1)
        self.assertEqual(MarkEntry.objects.count(), 1)
        entry = MarkEntry.objects.first()
        self.assertEqual(entry.obtained_marks, Decimal('25.50'))

    def test_invalid_student_roll_number(self):
        rows = [
            ["roll_number", "subject_code", "component_code", "marks"],
            ["999", "CS501", "INT", 25.5]
        ]
        excel_file = self.create_excel_file(rows)
        res = import_marks_from_excel(excel_file, self.exam.id, self.teacher_user)

        self.assertFalse(res["success"])
        self.assertEqual(res["failed_rows"], 1)
        self.assertEqual(MarkEntry.objects.count(), 0) # Atomic rollback
