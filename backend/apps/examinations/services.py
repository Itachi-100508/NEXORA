from decimal import Decimal
from django.db.models import Sum


def get_component_total(exam_subject):
    """
    Returns the Decimal sum of maximum_marks for all active components of an ExamSubject.
    """
    if not exam_subject:
        return Decimal('0.00')

    result = exam_subject.components.filter(is_active=True).aggregate(total=Sum('maximum_marks'))['total']
    return result if result is not None else Decimal('0.00')


def is_exam_subject_component_configuration_valid(exam_subject):
    """
    Returns True if the sum of active component maximum_marks equals exam_subject.maximum_marks.
    """
    if not exam_subject or not exam_subject.is_active:
        return True

    total = get_component_total(exam_subject)
    return total == exam_subject.maximum_marks


def validate_exam_component_configuration(exam):
    """
    Validates that every active ExamSubject in the Exam has active component total equaling ExamSubject.maximum_marks.
    Returns a list of invalid exam subjects with expected vs configured details.
    """
    if not exam:
        return []

    invalid_subjects = []
    active_exam_subjects = exam.exam_subjects.filter(is_active=True).select_related('subject')

    for exam_subject in active_exam_subjects:
        total = get_component_total(exam_subject)
        if total != exam_subject.maximum_marks:
            sub_code = exam_subject.subject.code if exam_subject.subject else ""
            sub_name = exam_subject.subject.name if exam_subject.subject else ""
            invalid_subjects.append({
                "exam_subject_id": exam_subject.id,
                "subject": f"{sub_code} - {sub_name}".strip(" -"),
                "expected": str(exam_subject.maximum_marks),
                "configured": str(total)
            })

    return invalid_subjects
