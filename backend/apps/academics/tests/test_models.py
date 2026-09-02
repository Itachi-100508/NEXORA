from django.test import TestCase
from django.contrib.auth import get_user_model
from django.db.utils import IntegrityError
from django.core.exceptions import ValidationError

from apps.academics.models import (
    AcademicYear,
    Department,
    Program,
    Semester,
    Classroom,
    Section,
    Subject,
    StudentProfile,
    TeacherProfile,
)

User = get_user_model()


class AcademicModelTests(TestCase):
    def setUp(self):
        # Academic Year
        self.year = AcademicYear.objects.create(name="2026-27")

        # Department
        self.dept = Department.objects.create(code="CSE", name="Computer Science and Engineering")

        # Program
        self.program = Program.objects.create(
            department=self.dept,
            code="BTECH-CSE",
            name="B.Tech Computer Science and Engineering",
            duration_years=4
        )

        # Semester
        self.semester = Semester.objects.create(
            program=self.program,
            number=5,
            name="Semester 5"
        )

        # Classroom
        self.classroom = Classroom.objects.create(
            academic_year=self.year,
            program=self.program,
            semester=self.semester,
            name="B.Tech CSE Semester 5",
            code="CSE-S5-2026"
        )

        # Section
        self.section = Section.objects.create(
            classroom=self.classroom,
            name="Section A",
            code="A",
            capacity=60
        )

        # Subject
        self.subject = Subject.objects.create(
            department=self.dept,
            code="CS501",
            name="Database Management Systems",
            credits=4
        )

        # Users
        self.student_user = User.objects.create_user(
            username="student_test",
            email="student_test@example.com",
            password="StudentPassword123!",
            role=User.Role.STUDENT
        )
        self.teacher_user = User.objects.create_user(
            username="teacher_test",
            email="teacher_test@example.com",
            password="TeacherPassword123!",
            role=User.Role.TEACHER
        )

        # Profiles
        self.student_profile = StudentProfile.objects.create(
            user=self.student_user,
            enrollment_number="2026CSE001",
            roll_number="01",
            classroom=self.classroom,
            section=self.section
        )
        self.teacher_profile = TeacherProfile.objects.create(
            user=self.teacher_user,
            employee_id="EMP001",
            designation="Assistant Professor",
            department=self.dept
        )

    def test_01_model_creations_and_string_representations(self):
        self.assertEqual(str(self.year), "2026-27")
        self.assertEqual(str(self.dept), "CSE - Computer Science and Engineering")
        self.assertEqual(str(self.program), "BTECH-CSE - B.Tech Computer Science and Engineering")
        self.assertEqual(str(self.semester), "Semester 5 - BTECH-CSE")
        self.assertEqual(str(self.classroom), "B.Tech CSE Semester 5 (CSE-S5-2026)")
        self.assertEqual(str(self.section), "B.Tech CSE Semester 5 - Section A")
        self.assertEqual(str(self.subject), "CS501 - Database Management Systems")
        self.assertIn("2026CSE001", str(self.student_profile))
        self.assertIn("EMP001", str(self.teacher_profile))

    def test_02_academic_year_uniqueness(self):
        with self.assertRaises(IntegrityError):
            AcademicYear.objects.create(name="2026-27")

    def test_03_department_code_uniqueness(self):
        with self.assertRaises(IntegrityError):
            Department.objects.create(code="CSE", name="Duplicate Dept")

    def test_04_program_code_uniqueness(self):
        with self.assertRaises(IntegrityError):
            Program.objects.create(department=self.dept, code="BTECH-CSE", name="Duplicate Program")

    def test_05_semester_unique_per_program(self):
        with self.assertRaises(IntegrityError):
            Semester.objects.create(program=self.program, number=5, name="Duplicate Sem 5")

    def test_06_section_unique_per_classroom(self):
        with self.assertRaises(IntegrityError):
            Section.objects.create(classroom=self.classroom, name="Section A Dup", code="A")

    def test_07_subject_code_uniqueness(self):
        with self.assertRaises(IntegrityError):
            Subject.objects.create(department=self.dept, code="CS501", name="Duplicate DBMS")

    def test_08_student_enrollment_uniqueness(self):
        another_user = User.objects.create_user(
            username="student_test2",
            email="student_test2@example.com",
            password="StudentPassword123!",
            role=User.Role.STUDENT
        )
        with self.assertRaises(IntegrityError):
            StudentProfile.objects.create(user=another_user, enrollment_number="2026CSE001", roll_number="02")

    def test_09_teacher_employee_id_uniqueness(self):
        another_teacher = User.objects.create_user(
            username="teacher_test2",
            email="teacher_test2@example.com",
            password="TeacherPassword123!",
            role=User.Role.TEACHER
        )
        with self.assertRaises(IntegrityError):
            TeacherProfile.objects.create(user=another_teacher, employee_id="EMP001")

    def test_10_student_profile_role_validation(self):
        teacher_as_student_user = User.objects.create_user(
            username="teacher_as_student",
            email="tas@example.com",
            password="Password123!",
            role=User.Role.TEACHER
        )
        sp = StudentProfile(user=teacher_as_student_user, enrollment_number="2026CSE999", roll_number="99")
        with self.assertRaises(ValidationError):
            sp.clean()

    def test_11_teacher_profile_role_validation(self):
        student_as_teacher_user = User.objects.create_user(
            username="student_as_teacher",
            email="sat@example.com",
            password="Password123!",
            role=User.Role.STUDENT
        )
        tp = TeacherProfile(user=student_as_teacher_user, employee_id="EMP999")
        with self.assertRaises(ValidationError):
            tp.clean()
