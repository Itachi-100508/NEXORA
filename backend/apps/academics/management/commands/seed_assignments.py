from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.academics.models import AcademicYear, Department, Program, Semester, Classroom, Section, Subject, TeacherProfile, TeacherAssignment

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds initial demo teacher assignments.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.MIGRATE_HEADING("Seeding PR-TERRA Demo Teacher Assignments..."))

        ay_2026, _ = AcademicYear.objects.get_or_create(name="2026-27", defaults={"is_active": True})
        dept_cse, _ = Department.objects.get_or_create(code="CSE", defaults={"name": "Computer Science and Engineering"})
        prog_btech, _ = Program.objects.get_or_create(code="BTECH-CSE", defaults={"department": dept_cse, "name": "B.Tech CSE", "duration_years": 4})
        sem_5, _ = Semester.objects.get_or_create(program=prog_btech, number=5, defaults={"name": "Semester 5"})
        cls_cse5, _ = Classroom.objects.get_or_create(code="CSE-S5-2026", defaults={"academic_year": ay_2026, "program": prog_btech, "semester": sem_5, "name": "CSE 5th Semester"})
        sec_a, _ = Section.objects.get_or_create(classroom=cls_cse5, code="A", defaults={"name": "Section A"})
        sec_b, _ = Section.objects.get_or_create(classroom=cls_cse5, code="B", defaults={"name": "Section B"})

        subj_dbms, _ = Subject.objects.get_or_create(code="CS501", defaults={"name": "Database Management Systems", "department": dept_cse, "semester": sem_5, "credits": 4})
        subj_os, _ = Subject.objects.get_or_create(code="CS502", defaults={"name": "Operating Systems", "department": dept_cse, "semester": sem_5, "credits": 4})

        # Fetch TeacherProfiles
        t1_user, _ = User.objects.get_or_create(username="teacher", defaults={"role": User.Role.TEACHER, "first_name": "Demo", "last_name": "Teacher1"})
        t1_profile, _ = TeacherProfile.objects.get_or_create(user=t1_user, defaults={"employee_id": "EMP001", "department": dept_cse, "designation": "Assistant Professor"})

        t2_user, _ = User.objects.get_or_create(username="teacher2", defaults={"role": User.Role.TEACHER, "first_name": "Demo", "last_name": "Teacher2"})
        t2_profile, _ = TeacherProfile.objects.get_or_create(user=t2_user, defaults={"employee_id": "EMP002", "department": dept_cse, "designation": "Associate Professor"})

        assignments_data = [
            (t1_profile, subj_dbms, sec_a, ay_2026),
            (t2_profile, subj_os, sec_a, ay_2026),
            (t1_profile, subj_dbms, sec_b, ay_2026),
        ]

        for teacher, subject, section, academic_year in assignments_data:
            assignment, created = TeacherAssignment.objects.get_or_create(
                teacher=teacher,
                subject=subject,
                section=section,
                academic_year=academic_year,
                defaults={"is_active": True}
            )
            assignment.is_active = True
            assignment.save()

            action_str = "Created" if created else "Updated"
            self.stdout.write(
                self.style.SUCCESS(f"  [{action_str}] Assignment: {teacher.user.username} -> {subject.code} @ {section.name} [{academic_year.name}]")
            )

        self.stdout.write(self.style.SUCCESS("\nDemo teacher assignments seeding completed successfully."))
