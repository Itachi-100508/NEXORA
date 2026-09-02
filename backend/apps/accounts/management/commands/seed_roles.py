from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.academics.models import AcademicYear, Department, Program, Semester, Classroom, Section, Subject, TeacherProfile, TeacherAssignment

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds initial demo accounts and teacher assignment test data.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.MIGRATE_HEADING("Seeding PR-TERRA Demo Roles and Assignments..."))

        demo_users = [
            {
                "username": "admin",
                "email": "admin@prterra.local",
                "password": "AdminPassword123!",
                "first_name": "System",
                "last_name": "Admin",
                "role": User.Role.ADMIN,
                "is_staff": True,
                "is_superuser": True,
            },
            {
                "username": "teacher",
                "email": "teacher@prterra.local",
                "password": "TeacherPassword123!",
                "first_name": "Demo",
                "last_name": "Teacher1",
                "role": User.Role.TEACHER,
                "is_staff": False,
                "is_superuser": False,
            },
            {
                "username": "teacher2",
                "email": "teacher2@prterra.local",
                "password": "TeacherPassword123!",
                "first_name": "Demo",
                "last_name": "Teacher2",
                "role": User.Role.TEACHER,
                "is_staff": False,
                "is_superuser": False,
            },
            {
                "username": "student",
                "email": "student@prterra.local",
                "password": "StudentPassword123!",
                "first_name": "Demo",
                "last_name": "Student",
                "role": User.Role.STUDENT,
                "is_staff": False,
                "is_superuser": False,
            },
        ]

        for udata in demo_users:
            user, created = User.objects.get_or_create(
                username=udata["username"],
                defaults={
                    "email": udata["email"],
                    "first_name": udata["first_name"],
                    "last_name": udata["last_name"],
                    "role": udata["role"],
                    "is_staff": udata["is_staff"],
                    "is_superuser": udata["is_superuser"],
                }
            )
            user.email = udata["email"]
            user.first_name = udata["first_name"]
            user.last_name = udata["last_name"]
            user.role = udata["role"]
            user.is_staff = udata["is_staff"]
            user.is_superuser = udata["is_superuser"]
            user.set_password(udata["password"])
            user.save()

            action_str = "Created" if created else "Updated"
            self.stdout.write(
                self.style.SUCCESS(f"  [{action_str}] User: {user.username} | Role: {user.role} | Email: {user.email}")
            )

        # Seed Demo Academic Entities
        ay_2026, _ = AcademicYear.objects.get_or_create(name="2026-27", defaults={"is_active": True})
        dept_cse, _ = Department.objects.get_or_create(code="CSE", defaults={"name": "Computer Science and Engineering"})
        prog_btech, _ = Program.objects.get_or_create(code="BTECH-CSE", defaults={"department": dept_cse, "name": "B.Tech CSE", "duration_years": 4})
        sem_5, _ = Semester.objects.get_or_create(program=prog_btech, number=5, defaults={"name": "Semester 5"})
        cls_cse5, _ = Classroom.objects.get_or_create(code="CSE-S5-2026", defaults={"academic_year": ay_2026, "program": prog_btech, "semester": sem_5, "name": "CSE 5th Semester"})
        sec_a, _ = Section.objects.get_or_create(classroom=cls_cse5, code="A", defaults={"name": "Section A"})
        subject, _ = Subject.objects.get_or_create(code="CSE501", defaults={"name": "DBMS", "department": dept_cse, "semester": sem_5})

        teacher1 = User.objects.get(username="teacher")
        t1_profile, _ = TeacherProfile.objects.get_or_create(user=teacher1, defaults={"employee_id": "EMP001", "department": dept_cse})

        assignment, created_assign = TeacherAssignment.objects.get_or_create(
            teacher=t1_profile,
            subject=subject,
            section=sec_a,
            academic_year=ay_2026,
            defaults={"is_active": True}
        )
        assign_str = "Created" if created_assign else "Existing"
        self.stdout.write(
            self.style.SUCCESS(f"  [{assign_str}] Assignment: {teacher1.username} -> {subject.code} ({subject.name}) @ {cls_cse5.name}")
        )

        self.stdout.write(self.style.SUCCESS("\nDemo roles and teacher assignments seeding completed successfully."))
