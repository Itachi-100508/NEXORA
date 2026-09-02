from django.core.management.base import BaseCommand
from apps.academics.models import Department, Program, Semester, Subject


class Command(BaseCommand):
    help = 'Seeds initial demo subjects for Database Management Systems, Operating Systems, Computer Networks, and Artificial Intelligence.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.MIGRATE_HEADING("Seeding PR-TERRA Demo Subjects..."))

        dept_cse, _ = Department.objects.get_or_create(
            code="CSE",
            defaults={"name": "Computer Science and Engineering"}
        )
        prog_btech, _ = Program.objects.get_or_create(
            code="BTECH-CSE",
            defaults={"department": dept_cse, "name": "B.Tech Computer Science and Engineering", "duration_years": 4}
        )
        sem_5, _ = Semester.objects.get_or_create(
            program=prog_btech,
            number=5,
            defaults={"name": "Semester 5"}
        )

        subjects_data = [
            ("CS501", "Database Management Systems", "Database design, SQL, transactions, indexing", 4),
            ("CS502", "Operating Systems", "Processes, memory management, file systems, synchronization", 4),
            ("CS503", "Computer Networks", "OSI model, TCP/IP, routing protocols, socket programming", 3),
            ("CS504", "Artificial Intelligence", "Search algorithms, knowledge representation, machine learning", 3),
        ]

        for scode, sname, sdesc, scredits in subjects_data:
            subject, created = Subject.objects.get_or_create(
                code=scode,
                defaults={
                    "name": sname,
                    "description": sdesc,
                    "credits": scredits,
                    "department": dept_cse,
                    "semester": sem_5,
                    "is_active": True
                }
            )
            subject.name = sname
            subject.description = sdesc
            subject.credits = scredits
            subject.department = dept_cse
            subject.semester = sem_5
            subject.is_active = True
            subject.save()

            action_str = "Created" if created else "Updated"
            self.stdout.write(
                self.style.SUCCESS(f"  [{action_str}] Subject: {subject.code} - {subject.name} ({subject.credits} Credits) | Dept: {dept_cse.code} | Sem: {sem_5.number}")
            )

        self.stdout.write(self.style.SUCCESS("\nDemo subjects seeding completed successfully."))
