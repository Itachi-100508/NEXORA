from django.core.management.base import BaseCommand
from apps.academics.models import AcademicYear, Department, Program, Semester
from apps.examinations.models import Exam


class Command(BaseCommand):
    help = 'Seeds initial demo examinations.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.MIGRATE_HEADING("Seeding PR-TERRA Demo Examinations..."))

        ay_2026, _ = AcademicYear.objects.get_or_create(name="2026-27", defaults={"is_active": True})
        dept_cse, _ = Department.objects.get_or_create(code="CSE", defaults={"name": "Computer Science and Engineering"})
        prog_btech, _ = Program.objects.get_or_create(code="BTECH-CSE", defaults={"department": dept_cse, "name": "B.Tech CSE", "duration_years": 4})
        sem_5, _ = Semester.objects.get_or_create(program=prog_btech, number=5, defaults={"name": "Semester 5"})
        sem_3, _ = Semester.objects.get_or_create(program=prog_btech, number=3, defaults={"name": "Semester 3"})

        exams_data = [
            {
                "name": "Semester 5 End Semester Examination",
                "description": "Final end semester examination for B.Tech CSE Semester 5 students.",
                "academic_year": ay_2026,
                "semester": sem_5,
                "status": Exam.Status.DRAFT,
            },
            {
                "name": "Semester 3 End Semester Examination",
                "description": "Final end semester examination for B.Tech CSE Semester 3 students.",
                "academic_year": ay_2026,
                "semester": sem_3,
                "status": Exam.Status.DRAFT,
            },
        ]

        for edata in exams_data:
            exam, created = Exam.objects.get_or_create(
                name=edata["name"],
                academic_year=edata["academic_year"],
                semester=edata["semester"],
                defaults={
                    "description": edata["description"],
                    "status": edata["status"],
                }
            )
            action_str = "Created" if created else "Existing"
            self.stdout.write(
                self.style.SUCCESS(f"  [{action_str}] Exam: {exam.name} [{exam.academic_year.name} - Sem {exam.semester.number}] ({exam.status})")
            )

        self.stdout.write(self.style.SUCCESS("\nDemo examinations seeding completed successfully."))
