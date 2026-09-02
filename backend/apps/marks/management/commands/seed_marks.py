from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.academics.models import AcademicYear, Department, Program, Semester, Subject, Classroom, Section, StudentProfile, TeacherProfile, TeacherAssignment
from apps.examinations.models import Exam, ExamSubject, ExamComponent
from apps.marks.models import MarkEntry

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds initial demo mark entries.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.MIGRATE_HEADING("Seeding PR-TERRA Demo Mark Entries..."))

        # Admin user as recorder
        admin_user, _ = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@example.com",
                "role": User.Role.ADMIN,
                "is_staff": True,
                "is_superuser": True
            }
        )

        ay_2026, _ = AcademicYear.objects.get_or_create(name="2026-27", defaults={"is_active": True})
        dept_cse, _ = Department.objects.get_or_create(code="CSE", defaults={"name": "Computer Science and Engineering"})
        prog_btech, _ = Program.objects.get_or_create(code="BTECH-CSE", defaults={"department": dept_cse, "name": "B.Tech CSE", "duration_years": 4})
        sem_5, _ = Semester.objects.get_or_create(program=prog_btech, number=5, defaults={"name": "Semester 5"})
        cls_5a, _ = Classroom.objects.get_or_create(semester=sem_5, name="CSE 5th Sem Class A")
        sec_a, _ = Section.objects.get_or_create(classroom=cls_5a, code="A", defaults={"name": "Section A"})

        # Students
        user_rahul, _ = User.objects.get_or_create(username="student_rahul", defaults={"first_name": "Rahul", "last_name": "Kumar", "email": "rahul@example.com", "role": User.Role.STUDENT})
        stud_rahul, _ = StudentProfile.objects.get_or_create(user=user_rahul, defaults={"roll_number": "CSE-2026-001", "enrollment_number": "ENR-2026-001", "section": sec_a})

        user_aman, _ = User.objects.get_or_create(username="student_aman", defaults={"first_name": "Aman", "last_name": "Sharma", "email": "aman@example.com", "role": User.Role.STUDENT})
        stud_aman, _ = StudentProfile.objects.get_or_create(user=user_aman, defaults={"roll_number": "CSE-2026-002", "enrollment_number": "ENR-2026-002", "section": sec_a})

        # Exam (Must be ACTIVE for marks entry)
        exam_sem5, _ = Exam.objects.get_or_create(
            name="Semester 5 End Semester Examination",
            academic_year=ay_2026,
            semester=sem_5,
            defaults={"description": "Final end sem exams for Sem 5", "status": Exam.Status.ACTIVE}
        )
        if exam_sem5.status != Exam.Status.ACTIVE:
            exam_sem5.status = Exam.Status.ACTIVE
            exam_sem5.save()

        # DBMS ExamSubject & Components
        subj_dbms, _ = Subject.objects.get_or_create(code="CS501", defaults={"name": "Database Management Systems", "department": dept_cse, "semester": sem_5, "credits": 4})
        es_dbms, _ = ExamSubject.objects.get_or_create(exam=exam_sem5, subject=subj_dbms, defaults={"maximum_marks": 100, "passing_marks": 40})

        comp_internal, _ = ExamComponent.objects.get_or_create(exam_subject=es_dbms, code="INTERNAL", defaults={"name": "Internal", "maximum_marks": 30, "passing_marks": 12, "display_order": 1})
        comp_external, _ = ExamComponent.objects.get_or_create(exam_subject=es_dbms, code="EXTERNAL", defaults={"name": "External", "maximum_marks": 50, "passing_marks": 20, "display_order": 2})
        comp_practical, _ = ExamComponent.objects.get_or_create(exam_subject=es_dbms, code="PRACTICAL", defaults={"name": "Practical", "maximum_marks": 20, "passing_marks": 8, "display_order": 3})

        marks_data = [
            (stud_rahul, comp_internal, 25.00),
            (stud_rahul, comp_external, 43.00),
            (stud_rahul, comp_practical, 18.00),
            (stud_aman, comp_internal, 22.00),
            (stud_aman, comp_external, 40.00),
            (stud_aman, comp_practical, 17.00),
        ]

        for student, comp, obtained in marks_data:
            entry, created = MarkEntry.objects.get_or_create(
                student=student,
                exam_component=comp,
                defaults={
                    "obtained_marks": obtained,
                    "entered_by": admin_user,
                    "is_active": True,
                }
            )
            action_str = "Created" if created else "Existing"
            stud_name = student.user.get_full_name()
            self.stdout.write(
                self.style.SUCCESS(f"  [{action_str}] MarkEntry: {stud_name} -> {comp.name} = {obtained}/{comp.maximum_marks}")
            )

        self.stdout.write(self.style.SUCCESS("\nDemo mark entries seeding completed successfully."))
