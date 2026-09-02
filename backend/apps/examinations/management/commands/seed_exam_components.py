from django.core.management.base import BaseCommand
from apps.academics.models import AcademicYear, Department, Program, Semester, Subject
from apps.examinations.models import Exam, ExamSubject, ExamComponent


class Command(BaseCommand):
    help = 'Seeds initial demo exam components.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.MIGRATE_HEADING("Seeding PR-TERRA Demo Exam Components..."))

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

        # Subject 1: DBMS (100 Max: Internal 30, External 50, Practical 20)
        subj_dbms, _ = Subject.objects.get_or_create(code="CS501", defaults={"name": "Database Management Systems", "department": dept_cse, "semester": sem_5, "credits": 4})
        es_dbms, _ = ExamSubject.objects.get_or_create(exam=exam_sem5, subject=subj_dbms, defaults={"maximum_marks": 100, "passing_marks": 40})

        # Subject 2: Operating Systems (100 Max: Internal 20, External 80)
        subj_os, _ = Subject.objects.get_or_create(code="CS502", defaults={"name": "Operating Systems", "department": dept_cse, "semester": sem_5, "credits": 4})
        es_os, _ = ExamSubject.objects.get_or_create(exam=exam_sem5, subject=subj_os, defaults={"maximum_marks": 100, "passing_marks": 40})

        components_data = [
            # DBMS Components
            (es_dbms, "Internal", "INTERNAL", 30, 12, 1),
            (es_dbms, "External", "EXTERNAL", 50, 20, 2),
            (es_dbms, "Practical", "PRACTICAL", 20, 8, 3),

            # OS Components
            (es_os, "Internal", "INTERNAL", 20, 8, 1),
            (es_os, "External", "EXTERNAL", 80, 32, 2),
        ]

        for es, name, code, max_m, pass_m, order in components_data:
            comp, created = ExamComponent.objects.get_or_create(
                exam_subject=es,
                code=code,
                defaults={
                    "name": name,
                    "maximum_marks": max_m,
                    "passing_marks": pass_m,
                    "display_order": order,
                    "is_active": True,
                }
            )
            action_str = "Created" if created else "Existing"
            sub_code = es.subject.code if es.subject else ""
            self.stdout.write(
                self.style.SUCCESS(f"  [{action_str}] Component: {sub_code} -> {comp.name} [{comp.code}] ({max_m} Max / {pass_m} Pass)")
            )

        self.stdout.write(self.style.SUCCESS("\nDemo exam components seeding completed successfully."))
