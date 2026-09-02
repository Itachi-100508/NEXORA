from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.academics.models import Department, TeacherProfile

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds initial demo teacher accounts and profiles.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.MIGRATE_HEADING("Seeding PR-TERRA Demo Teachers..."))

        dept_cse, _ = Department.objects.get_or_create(
            code="CSE",
            defaults={"name": "Computer Science and Engineering"}
        )

        teachers_data = [
            {
                "username": "teacher",
                "email": "teacher@prterra.local",
                "password": "TeacherPassword123!",
                "first_name": "Demo",
                "last_name": "Teacher1",
                "employee_id": "EMP001",
                "designation": "Assistant Professor",
            },
            {
                "username": "teacher2",
                "email": "teacher2@prterra.local",
                "password": "TeacherPassword123!",
                "first_name": "Demo",
                "last_name": "Teacher2",
                "employee_id": "EMP002",
                "designation": "Associate Professor",
            },
        ]

        for tdata in teachers_data:
            user, u_created = User.objects.get_or_create(
                username=tdata["username"],
                defaults={
                    "email": tdata["email"],
                    "first_name": tdata["first_name"],
                    "last_name": tdata["last_name"],
                    "role": User.Role.TEACHER,
                }
            )
            user.email = tdata["email"]
            user.first_name = tdata["first_name"]
            user.last_name = tdata["last_name"]
            user.role = User.Role.TEACHER
            user.set_password(tdata["password"])
            user.save()

            profile, p_created = TeacherProfile.objects.get_or_create(
                user=user,
                defaults={
                    "employee_id": tdata["employee_id"],
                    "designation": tdata["designation"],
                    "department": dept_cse,
                }
            )
            action_str = "Created" if p_created else "Updated"
            self.stdout.write(
                self.style.SUCCESS(f"  [{action_str}] Teacher: {user.username} ({profile.employee_id}) | Dept: {dept_cse.code}")
            )

        self.stdout.write(self.style.SUCCESS("\nDemo teachers seeding completed successfully."))
