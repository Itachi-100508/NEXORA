from django.core.management.base import BaseCommand
from apps.academics.models import AcademicYear, Department, Program, Semester, Subject
from apps.examinations.models import Exam, ExamSubject


class Command(BaseCommand):
    help = 'Seeds initial demo exam subjects.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.MIGRATE_HEADING("Seeding PR-TERRA Demo Exam Subjects..."))

        ay_2026, _ = AcademicYear.objects.get_or_create(name="2026-27", defaults={"is_active": True})
        dept_cse, _ = Department.objects.get_or_create(code="CSE", defaults={"name": "Computer Science and Engineering"})
        prog_btech, _ = Program.objects.get_or_create(code="BTECH-CSE", defaults={"department": dept_cse, "name": "B.Tech CSE", "duration_years": 4})
        sem_5, _ = Semester.objects.get_or_create(program=prog_btech, number=5, defaults={"name": "Semester 5"})

        exam_sem5, _ = Exam.objects.get_or_create(
            name="Semester 5 End Semester Examination",
            academic_year=ay_2026,
            semester=sem_5,
            defaults={"description": "Final end sem exams for Sem 5", "status": Exam.Status.DRAFT}
        )

        subjects_data = [
            ("CS501", "Database Management Systems", 100, 40, 1),
            ("CS502", "Operating Systems", 100, 40, 2),
            ("CS503", "Computer Networks", 100, 40, 3),
            ("CS504", "Artificial Intelligence", 100, 40, 4),
            ("CS505", "Software Engineering", 100, 40, 5),
        ]

        for code, name, max_m, pass_m, order in subjects_data:
            subject, _ = Subject.objects.get_or_create(
                code=code,
                defaults={"name": name, "department": dept_cse, "semester": sem_5, "credits": 4}
            )

            exam_sub, created = ExamSubject.objects.get_or_create(
                exam=exam_sem5,
                subject=subject,
                defaults={
                    "maximum_marks": max_m,
                    "passing_marks": pass_m,
                    "display_order": order,
                    "is_active": True,
                }
            )
            action_str = "Created" if created else "Existing"
            self.stdout.write(
                self.style.SUCCESS(f"  [{action_str}] ExamSubject: {exam_sem5.name} -> {subject.code} ({max_m} Max / {pass_m} Pass)")
            )

        self.stdout.write(self.style.SUCCESS("\nDemo exam subjects seeding completed successfully."))
