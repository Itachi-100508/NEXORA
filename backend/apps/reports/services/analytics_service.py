from decimal import Decimal, ROUND_HALF_UP
from django.db.models import Avg, Max, Min, Sum, Count, Q

from apps.academics.models import StudentProfile, Classroom, Section, Subject
from apps.examinations.models import Exam, ExamSubject, ExamComponent
from apps.marks.models import MarkEntry
from apps.results.services import ResultCalculator


class AnalyticsService:
    """
    Dynamic Academic Analytics Service (Phase 23).
    Calculates dynamic metrics for Exam, Subject, Class/Section, Grade distribution, Marks distribution, and Student Performance.
    Does NOT store analytics in a separate database model.
    """

    @classmethod
    def _quantize(cls, val):
        if val is None:
            return Decimal('0.00')
        return Decimal(str(val)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    @classmethod
    def get_exam_analytics(cls, exam, section_ids=None):
        """
        Calculates exam-wide performance metrics.
        If section_ids is provided (e.g. for Teacher scoping), filters students accordingly.
        """
        # Students in exam semester
        students_qs = StudentProfile.objects.select_related('user', 'section', 'section__classroom').filter(
            section__classroom__semester=exam.semester,
            is_active=True,
            user__is_active=True
        )

        if section_ids:
            students_qs = students_qs.filter(section_id__in=section_ids)

        students = list(students_qs)
        total_students = len(students)

        if total_students == 0:
            return {
                "exam": exam.name,
                "total_students": 0,
                "completed": 0,
                "incomplete": 0,
                "passed": 0,
                "failed": 0,
                "pass_percentage": "0.00",
                "average_percentage": "0.00",
                "highest_percentage": "0.00",
                "lowest_percentage": "0.00",
            }

        completed = 0
        incomplete = 0
        passed = 0
        failed = 0
        percentages = []

        for student in students:
            res = ResultCalculator.calculate_exam_result(student, exam)
            status = res["status"]
            perc = Decimal(res["percentage"])

            if status == "INCOMPLETE":
                incomplete += 1
            else:
                completed += 1
                percentages.append(perc)
                if status == "PASS":
                    passed += 1
                elif status == "FAIL":
                    failed += 1

        pass_percentage = cls._quantize((Decimal(passed) / Decimal(completed) * Decimal('100.00')) if completed > 0 else Decimal('0.00'))
        avg_percentage = cls._quantize((sum(percentages) / Decimal(len(percentages))) if percentages else Decimal('0.00'))
        highest_percentage = cls._quantize(max(percentages) if percentages else Decimal('0.00'))
        lowest_percentage = cls._quantize(min(percentages) if percentages else Decimal('0.00'))

        return {
            "exam": exam.name,
            "total_students": total_students,
            "completed": completed,
            "incomplete": incomplete,
            "passed": passed,
            "failed": failed,
            "pass_percentage": str(pass_percentage),
            "average_percentage": str(avg_percentage),
            "highest_percentage": str(highest_percentage),
            "lowest_percentage": str(lowest_percentage),
        }

    @classmethod
    def get_subject_analytics(cls, subject, exam, section_ids=None):
        """
        Calculates subject-wide metrics for a specific Exam and Subject.
        """
        try:
            exam_subject = ExamSubject.objects.select_related('exam', 'subject').get(exam=exam, subject=subject, is_active=True)
        except ExamSubject.DoesNotExist:
            return {
                "subject": subject.name,
                "total_students": 0,
                "completed": 0,
                "incomplete": 0,
                "passed": 0,
                "failed": 0,
                "average_marks": "0.00",
                "highest_marks": "0.00",
                "lowest_marks": "0.00",
                "average_percentage": "0.00",
                "pass_percentage": "0.00",
            }

        students_qs = StudentProfile.objects.select_related('user', 'section').filter(
            section__classroom__semester=exam.semester,
            is_active=True,
            user__is_active=True
        )

        if section_ids:
            students_qs = students_qs.filter(section_id__in=section_ids)

        students = list(students_qs)
        total_students = len(students)

        completed = 0
        incomplete = 0
        passed = 0
        failed = 0
        obtained_marks_list = []
        percentages = []

        for student in students:
            sub_res = ResultCalculator.calculate_subject_result(student, exam_subject)
            st = sub_res["status"]

            if st == "INCOMPLETE":
                incomplete += 1
            else:
                completed += 1
                tot = Decimal(sub_res["total_marks"])
                perc = Decimal(sub_res["percentage"])
                obtained_marks_list.append(tot)
                percentages.append(perc)

                if st == "PASS":
                    passed += 1
                elif st == "FAIL":
                    failed += 1

        pass_percentage = cls._quantize((Decimal(passed) / Decimal(completed) * Decimal('100.00')) if completed > 0 else Decimal('0.00'))
        avg_marks = cls._quantize((sum(obtained_marks_list) / Decimal(len(obtained_marks_list))) if obtained_marks_list else Decimal('0.00'))
        highest_marks = cls._quantize(max(obtained_marks_list) if obtained_marks_list else Decimal('0.00'))
        lowest_marks = cls._quantize(min(obtained_marks_list) if obtained_marks_list else Decimal('0.00'))
        avg_perc = cls._quantize((sum(percentages) / Decimal(len(percentages))) if percentages else Decimal('0.00'))

        return {
            "subject": subject.name,
            "code": subject.code,
            "exam": exam.name,
            "total_students": total_students,
            "completed": completed,
            "incomplete": incomplete,
            "passed": passed,
            "failed": failed,
            "average_marks": str(avg_marks),
            "highest_marks": str(highest_marks),
            "lowest_marks": str(lowest_marks),
            "average_percentage": str(avg_perc),
            "pass_percentage": str(pass_percentage),
        }

    @classmethod
    def get_class_analytics(cls, classroom, exam, section_ids=None):
        """
        Calculates performance metrics for all students belonging to a ClassRoom.
        """
        sections = classroom.sections.filter(is_active=True)
        if section_ids:
            sections = sections.filter(id__in=section_ids)

        students_qs = StudentProfile.objects.select_related('user', 'section').filter(
            section__in=sections,
            is_active=True,
            user__is_active=True
        )

        students = list(students_qs)
        total_students = len(students)

        completed = 0
        incomplete = 0
        passed = 0
        failed = 0
        percentages = []

        for student in students:
            res = ResultCalculator.calculate_exam_result(student, exam)
            status = res["status"]
            perc = Decimal(res["percentage"])

            if status == "INCOMPLETE":
                incomplete += 1
            else:
                completed += 1
                percentages.append(perc)
                if status == "PASS":
                    passed += 1
                elif status == "FAIL":
                    failed += 1

        pass_percentage = cls._quantize((Decimal(passed) / Decimal(completed) * Decimal('100.00')) if completed > 0 else Decimal('0.00'))
        avg_percentage = cls._quantize((sum(percentages) / Decimal(len(percentages))) if percentages else Decimal('0.00'))
        highest_percentage = cls._quantize(max(percentages) if percentages else Decimal('0.00'))
        lowest_percentage = cls._quantize(min(percentages) if percentages else Decimal('0.00'))

        return {
            "classroom": classroom.name,
            "exam": exam.name,
            "total_students": total_students,
            "completed": completed,
            "incomplete": incomplete,
            "passed": passed,
            "failed": failed,
            "pass_percentage": str(pass_percentage),
            "average_percentage": str(avg_percentage),
            "highest_percentage": str(highest_percentage),
            "lowest_percentage": str(lowest_percentage),
        }

    @classmethod
    def get_grade_distribution(cls, exam, section_ids=None):
        """
        Calculates grade distribution counts (A+, A, B+, B, C, D, F) across students in an exam.
        """
        students_qs = StudentProfile.objects.select_related('user', 'section').filter(
            section__classroom__semester=exam.semester,
            is_active=True,
            user__is_active=True
        )

        if section_ids:
            students_qs = students_qs.filter(section_id__in=section_ids)

        distribution = {
            "A+": 0,
            "A": 0,
            "B+": 0,
            "B": 0,
            "C": 0,
            "D": 0,
            "F": 0,
        }

        for student in students_qs:
            res = ResultCalculator.calculate_exam_result(student, exam)
            if res["status"] != "INCOMPLETE":
                grade = res["grade"]
                if grade in distribution:
                    distribution[grade] += 1
                else:
                    distribution["F"] += 1

        return distribution

    @classmethod
    def get_marks_distribution(cls, exam, section_ids=None):
        """
        Calculates percentage range breakdown (0-39, 40-49, 50-59, 60-69, 70-79, 80-89, 90-100).
        """
        students_qs = StudentProfile.objects.select_related('user', 'section').filter(
            section__classroom__semester=exam.semester,
            is_active=True,
            user__is_active=True
        )

        if section_ids:
            students_qs = students_qs.filter(section_id__in=section_ids)

        ranges = {
            "0-39": 0,
            "40-49": 0,
            "50-59": 0,
            "60-69": 0,
            "70-79": 0,
            "80-89": 0,
            "90-100": 0,
        }

        for student in students_qs:
            res = ResultCalculator.calculate_exam_result(student, exam)
            if res["status"] != "INCOMPLETE":
                p = float(res["percentage"])
                if p < 40:
                    ranges["0-39"] += 1
                elif p < 50:
                    ranges["40-49"] += 1
                elif p < 60:
                    ranges["50-59"] += 1
                elif p < 70:
                    ranges["60-69"] += 1
                elif p < 80:
                    ranges["70-79"] += 1
                elif p < 90:
                    ranges["80-89"] += 1
                else:
                    ranges["90-100"] += 1

        return ranges

    @classmethod
    def get_student_analytics(cls, student, exam):
        """
        Returns student performance summary dictionary via ResultCalculator.
        """
        return ResultCalculator.calculate_exam_result(student, exam)
