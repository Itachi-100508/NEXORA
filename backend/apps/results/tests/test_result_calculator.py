from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model

from apps.academics.models import (
    Department, Program, Semester, Classroom, Section, Subject,
    AcademicYear, StudentProfile, TeacherProfile, TeacherAssignment
)
from apps.examinations.models import Exam, ExamSubject, ExamComponent
from apps.marks.models import MarkEntry
from apps.results.services import ResultCalculator, GradeCalculator

User = get_user_model()


class ResultCalculatorTests(TestCase):
    def setUp(self):
        self.teacher_user = User.objects.create_user('teacher1', 'teacher1@example.com', 'TeacherPass123', role='TEACHER')
        self.dept = Department.objects.create(name="Computer Science", code="CS")
        self.prog = Program.objects.create(department=self.dept, name="B.Tech CS", code="BTCS")
        self.ay = AcademicYear.objects.create(name="2025-2026")
        self.sem = Semester.objects.create(program=self.prog, number=5, name="Semester 5")
        self.classroom = Classroom.objects.create(academic_year=self.ay, program=self.prog, semester=self.sem, name="S5 CS", code="CS-S5")
        self.sec_a = Section.objects.create(classroom=self.classroom, name="A", code="SEC-A")

        self.student_user = User.objects.create_user('student1', 'student1@example.com', 'StudentPass123', role='STUDENT')
        self.student = StudentProfile.objects.create(user=self.student_user, roll_number="101", section=self.sec_a)

        self.sub_dbms = Subject.objects.create(code="CS501", name="DBMS", credits=4)
        self.sub_os = Subject.objects.create(code="CS502", name="OS", credits=4)
        self.sub_cn = Subject.objects.create(code="CS503", name="CN", credits=4)
        self.sub_ai = Subject.objects.create(code="CS504", name="AI", credits=4)

        self.exam = Exam.objects.create(
            academic_year=self.ay,
            semester=self.sem,
            name="Semester 5 Examination",
            code="EXAM-S5",
            status=Exam.Status.ACTIVE
        )

        for sub, score in [(self.sub_dbms, Decimal('93.00')), (self.sub_os, Decimal('82.00')), (self.sub_cn, Decimal('88.00')), (self.sub_ai, Decimal('91.00'))]:
            es = ExamSubject.objects.create(exam=self.exam, subject=sub)
            ec = ExamComponent.objects.create(exam_subject=es, name="Theory", code="TH", maximum_marks=Decimal('100.00'), weightage=Decimal('100.00'))
            MarkEntry.objects.create(student=self.student, exam_component=ec, obtained_marks=score, entered_by=self.teacher_user)

    def test_grade_calculator_7_tier_scale(self):
        """Test GradeCalculator 7-tier scale mapping"""
        self.assertEqual(GradeCalculator.get_grade_info(Decimal('95.00')), ('A+', Decimal('10.0'), 'PASS'))
        self.assertEqual(GradeCalculator.get_grade_info(Decimal('85.00')), ('A', Decimal('9.0'), 'PASS'))
        self.assertEqual(GradeCalculator.get_grade_info(Decimal('75.00')), ('B+', Decimal('8.0'), 'PASS'))
        self.assertEqual(GradeCalculator.get_grade_info(Decimal('65.00')), ('B', Decimal('7.0'), 'PASS'))
        self.assertEqual(GradeCalculator.get_grade_info(Decimal('55.00')), ('C', Decimal('6.0'), 'PASS'))
        self.assertEqual(GradeCalculator.get_grade_info(Decimal('45.00')), ('D', Decimal('5.0'), 'PASS'))
        self.assertEqual(GradeCalculator.get_grade_info(Decimal('35.00')), ('F', Decimal('0.0'), 'FAIL'))

    def test_result_calculator_user_prompt_example(self):
        """
        Verify exact prompt example:
        DBMS = 93, OS = 82, CN = 88, AI = 91
        Expected: Total = 354, Maximum = 400, Percentage = 88.50%
        """
        res = ResultCalculator.calculate_exam_result(self.student, self.exam)
        self.assertEqual(res["total_marks"], "354.00")
        self.assertEqual(res["maximum_marks"], "400.00")
        self.assertEqual(res["percentage"], "88.50")
        self.assertEqual(res["status"], "PASS")
