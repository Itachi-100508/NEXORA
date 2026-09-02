from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
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


class Command(BaseCommand):
    help = 'Seeds initial academic structure dataset (AcademicYear, Department, Program, Semester, Classroom, Section, Subject, StudentProfile, TeacherProfile).'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.MIGRATE_HEADING("Seeding PR-TERRA Academic Dataset..."))

        # 1. Academic Year
        academic_year, _ = AcademicYear.objects.get_or_create(
            name="2026-27"
        )
        self.stdout.write(self.style.SUCCESS(f"  [AcademicYear] {academic_year.name}"))

        # 2. Department
        dept, _ = Department.objects.get_or_create(
            code="CSE",
            defaults={"name": "Computer Science and Engineering", "description": "Department of Computer Science & Engineering"}
        )
        self.stdout.write(self.style.SUCCESS(f"  [Department] {dept.code} - {dept.name}"))

        # 3. Program
        program, _ = Program.objects.get_or_create(
            code="BTECH-CSE",
            defaults={
                "department": dept,
                "name": "B.Tech Computer Science and Engineering",
                "duration_years": 4
            }
        )
        self.stdout.write(self.style.SUCCESS(f"  [Program] {program.code} - {program.name}"))

        # 4. Semester
        semester, _ = Semester.objects.get_or_create(
            program=program,
            number=5,
            defaults={"name": "Semester 5"}
        )
        self.stdout.write(self.style.SUCCESS(f"  [Semester] {semester.name} ({program.code})"))

        # 5. Classroom
        classroom, _ = Classroom.objects.get_or_create(
            code="CSE-S5-2026",
            defaults={
                "academic_year": academic_year,
                "program": program,
                "semester": semester,
                "name": "B.Tech CSE Semester 5",
                "section": "A"
            }
        )
        self.stdout.write(self.style.SUCCESS(f"  [Classroom] {classroom.name} ({classroom.code})"))

        # 6. Sections
        sec_a, _ = Section.objects.get_or_create(classroom=classroom, code="A", defaults={"name": "Section A", "capacity": 60})
        sec_b, _ = Section.objects.get_or_create(classroom=classroom, code="B", defaults={"name": "Section B", "capacity": 60})
        self.stdout.write(self.style.SUCCESS(f"  [Sections] {sec_a.name}, {sec_b.name}"))

        # 7. Subjects
        subjects_data = [
            ("CS501", "Database Management Systems", 4),
            ("CS502", "Operating Systems", 4),
            ("CS503", "Computer Networks", 4),
            ("CS504", "Artificial Intelligence", 3),
        ]
        for scode, sname, scredits in subjects_data:
            subj, _ = Subject.objects.get_or_create(
                code=scode,
                defaults={"name": sname, "credits": scredits, "department": dept}
            )
            self.stdout.write(self.style.SUCCESS(f"  [Subject] {subj.code} - {subj.name} ({subj.credits} Credits)"))

        # 8. Teacher Profiles
        teachers_to_profile = [
            ("teacher", "EMP001", "Assistant Professor"),
            ("teacher2", "EMP002", "Associate Professor"),
        ]
        for t_username, emp_id, desig in teachers_to_profile:
            try:
                t_user = User.objects.get(username=t_username)
                if t_user.role == User.Role.TEACHER:
                    t_profile, _ = TeacherProfile.objects.get_or_create(
                        user=t_user,
                        defaults={"employee_id": emp_id, "designation": desig, "department": dept}
                    )
                    self.stdout.write(self.style.SUCCESS(f"  [TeacherProfile] {t_profile.employee_id} - {t_user.username}"))
            except User.DoesNotExist:
                pass

        # 9. Student Profiles
        students_data = [
            ("student", "2026CSE001", "01"),
            ("student1", "2026CSE002", "02"),
            ("student2", "2026CSE003", "03"),
            ("student3", "2026CSE004", "04"),
            ("student4", "2026CSE005", "05"),
            ("student5", "2026CSE006", "06"),
        ]
        for s_username, enroll, roll in students_data:
            s_user, _ = User.objects.get_or_create(
                username=s_username,
                defaults={
                    "email": f"{s_username}@prterra.local",
                    "first_name": s_username.capitalize(),
                    "last_name": "Student",
                    "role": User.Role.STUDENT
                }
            )
            if s_user.role == User.Role.STUDENT:
                s_profile, _ = StudentProfile.objects.get_or_create(
                    user=s_user,
                    defaults={
                        "enrollment_number": enroll,
                        "roll_number": roll,
                        "classroom": classroom,
                        "section": sec_a,
                        "admission_year": 2024
                    }
                )
                self.stdout.write(self.style.SUCCESS(f"  [StudentProfile] {s_profile.enrollment_number} - {s_user.username}"))

        self.stdout.write(self.style.SUCCESS("\nAcademic dataset seeding completed successfully."))
