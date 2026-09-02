from decimal import Decimal, ROUND_HALF_UP
from django.db.models import Prefetch

from apps.academics.models import StudentProfile
from apps.examinations.models import Exam, ExamSubject, ExamComponent
from apps.marks.models import MarkEntry


class ResultCalculator:
    """
    Automatic Result Calculation Engine (Phase 16).
    Calculates subject total, percentage, grade, pass/fail status, SGPA, and CGPA dynamically from MarkEntry records.
    Does NOT store calculations in a database model.
    """

    GRADE_SCALE = [
        (Decimal('90.00'), 'A+', 10),
        (Decimal('80.00'), 'A', 9),
        (Decimal('70.00'), 'B+', 8),
        (Decimal('60.00'), 'B', 7),
        (Decimal('50.00'), 'C', 6),
        (Decimal('40.00'), 'D', 5),
        (Decimal('0.00'), 'F', 0),
    ]

    @classmethod
    def calculate_percentage(cls, total_obtained, maximum_marks):
        """
        Calculates percentage as Decimal rounded to 2 decimal places.
        """
        if not maximum_marks or Decimal(str(maximum_marks)) == Decimal('0.00'):
            return Decimal('0.00')

        tot = Decimal(str(total_obtained))
        max_m = Decimal(str(maximum_marks))
        perc = (tot / max_m) * Decimal('100.00')
        return perc.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    @classmethod
    def calculate_grade_and_point(cls, percentage):
        """
        Maps percentage to grade and grade point using standard scale.
        90-100 -> A+ (10), 80-89.99 -> A (9), 70-79.99 -> B+ (8), 60-69.99 -> B (7),
        50-59.99 -> C (6), 40-49.99 -> D (5), Below 40 -> F (0)
        """
        p = Decimal(str(percentage))
        for threshold, grade, point in cls.GRADE_SCALE:
            if p >= threshold:
                return grade, point
        return 'F', 0

    @classmethod
    def calculate_subject_result(cls, student, exam_subject):
        """
        Calculates results for one student in one ExamSubject.
        Sums active ExamComponents and their MarkEntry records.
        Returns dictionary with total_marks, maximum_marks, percentage, grade, grade_point, component details, and status.
        """
        # Fetch active components
        active_components = exam_subject.components.filter(is_active=True).order_by('display_order', 'id')
        if not active_components.exists():
            return {
                "exam_subject_id": exam_subject.id,
                "subject": exam_subject.subject.name if exam_subject.subject else "",
                "subject_code": exam_subject.subject.code if exam_subject.subject else "",
                "credits": exam_subject.subject.credits if exam_subject.subject else 0,
                "total_marks": "0.00",
                "maximum_marks": str(exam_subject.maximum_marks),
                "percentage": "0.00",
                "grade": "F",
                "grade_point": 0,
                "status": "INCOMPLETE",
                "components": [],
            }

        mark_entries = {
            m.exam_component_id: m
            for m in MarkEntry.objects.filter(student=student, exam_component__in=active_components, is_active=True)
        }

        total_obtained = Decimal('0.00')
        total_maximum = Decimal('0.00')
        component_details = []
        is_incomplete = False
        component_failed = False

        for comp in active_components:
            comp_max = comp.maximum_marks
            total_maximum += comp_max

            entry = mark_entries.get(comp.id)
            if not entry:
                is_incomplete = True
                component_details.append({
                    "component_id": comp.id,
                    "name": comp.name,
                    "code": comp.code,
                    "maximum_marks": str(comp_max),
                    "obtained_marks": None,
                    "status": "MISSING",
                })
            else:
                obtained = entry.obtained_marks
                total_obtained += obtained

                comp_status = "PASS"
                if comp.passing_marks and obtained < comp.passing_marks:
                    comp_status = "FAIL"
                    component_failed = True

                component_details.append({
                    "component_id": comp.id,
                    "name": comp.name,
                    "code": comp.code,
                    "maximum_marks": str(comp_max),
                    "obtained_marks": str(obtained),
                    "status": comp_status,
                })

        if is_incomplete:
            return {
                "exam_subject_id": exam_subject.id,
                "subject": exam_subject.subject.name if exam_subject.subject else "",
                "subject_code": exam_subject.subject.code if exam_subject.subject else "",
                "credits": exam_subject.subject.credits if exam_subject.subject else 0,
                "total_marks": str(total_obtained),
                "maximum_marks": str(total_maximum),
                "percentage": "0.00",
                "grade": "F",
                "grade_point": 0,
                "status": "INCOMPLETE",
                "components": component_details,
            }

        percentage = cls.calculate_percentage(total_obtained, total_maximum)
        grade, point = cls.calculate_grade_and_point(percentage)

        # Subject Passing Rule: Must meet overall passing_marks and no failed components
        if component_failed or total_obtained < exam_subject.passing_marks:
            status = "FAIL"
            grade = "F"
            point = 0
        else:
            status = "PASS"

        return {
            "exam_subject_id": exam_subject.id,
            "subject": exam_subject.subject.name if exam_subject.subject else "",
            "subject_code": exam_subject.subject.code if exam_subject.subject else "",
            "credits": exam_subject.subject.credits if exam_subject.subject else 0,
            "total_marks": str(total_obtained),
            "maximum_marks": str(total_maximum),
            "percentage": str(percentage),
            "grade": grade,
            "grade_point": point,
            "status": status,
            "components": component_details,
        }

    @classmethod
    def calculate_exam_result(cls, student, exam):
        """
        Calculates overall examination result for one student in one Exam.
        Collects all active ExamSubjects, calculates subject results, overall totals, overall percentage, overall status, and SGPA.
        """
        exam_subjects = exam.exam_subjects.filter(is_active=True).select_related('subject').order_by('subject__code', 'id')

        subject_results = []
        overall_obtained = Decimal('0.00')
        overall_maximum = Decimal('0.00')
        has_incomplete = False
        has_fail = False

        total_credit_points = Decimal('0.00')
        total_credits = Decimal('0.00')

        for es in exam_subjects:
            sub_res = cls.calculate_subject_result(student, es)
            subject_results.append(sub_res)

            sub_obtained = Decimal(sub_res["total_marks"])
            sub_max = Decimal(sub_res["maximum_marks"])
            overall_obtained += sub_obtained
            overall_maximum += sub_max

            if sub_res["status"] == "INCOMPLETE":
                has_incomplete = True
            elif sub_res["status"] == "FAIL":
                has_fail = True

            credits = Decimal(str(sub_res.get("credits", 0)))
            if credits > Decimal('0.00'):
                point = Decimal(str(sub_res.get("grade_point", 0)))
                total_credit_points += (point * credits)
                total_credits += credits

        overall_percentage = cls.calculate_percentage(overall_obtained, overall_maximum)
        overall_grade, _ = cls.calculate_grade_and_point(overall_percentage)

        if has_incomplete:
            overall_status = "INCOMPLETE"
        elif has_fail:
            overall_status = "FAIL"
            overall_grade = "F"
        else:
            overall_status = "PASS"

        # Calculate SGPA
        if total_credits > Decimal('0.00'):
            sgpa = (total_credit_points / total_credits).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        else:
            sgpa = Decimal('0.00')

        return {
            "student_id": student.id,
            "student_name": student.user.get_full_name() if student.user else "",
            "roll_number": student.roll_number,
            "exam_id": exam.id,
            "exam_name": exam.name,
            "total_marks": str(overall_obtained),
            "maximum_marks": str(overall_maximum),
            "percentage": str(overall_percentage),
            "grade": overall_grade,
            "status": overall_status,
            "sgpa": str(sgpa),
            "total_credits": int(total_credits),
            "subjects": subject_results,
        }

    @classmethod
    def calculate_sgpa(cls, subject_results):
        """
        Helper method to calculate SGPA from a list of subject result dictionaries.
        """
        total_credit_points = Decimal('0.00')
        total_credits = Decimal('0.00')

        for sub in subject_results:
            credits = Decimal(str(sub.get("credits", 0)))
            if credits > Decimal('0.00'):
                point = Decimal(str(sub.get("grade_point", 0)))
                total_credit_points += (point * credits)
                total_credits += credits

        if total_credits > Decimal('0.00'):
            return (total_credit_points / total_credits).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        return Decimal('0.00')

    @classmethod
    def calculate_cgpa(cls, sgpa_list):
        """
        Helper method to calculate CGPA as the mean of semester SGPA values.
        """
        if not sgpa_list:
            return Decimal('0.00')

        valid_sgpas = [Decimal(str(s)) for s in sgpa_list if Decimal(str(s)) >= Decimal('0.00')]
        if not valid_sgpas:
            return Decimal('0.00')

        total = sum(valid_sgpas)
        count = Decimal(str(len(valid_sgpas)))
        return (total / count).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
