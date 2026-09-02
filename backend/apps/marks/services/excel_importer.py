import openpyxl
from decimal import Decimal, InvalidOperation
from django.db import transaction

from apps.academics.models import StudentProfile, Subject
from apps.examinations.models import Exam, ExamSubject, ExamComponent
from apps.marks.models import MarkEntry
from apps.audit.services import log_action
from .mark_entry_service import create_or_update_mark_entry
from .marks_validator import MarksValidator


def import_marks_from_excel(file_obj, exam_id, user, request=None):
    """
    Service layer function to parse, validate, and import student marks from an Excel file (.xlsx).
    Ensures:
    1. File extension is .xlsx.
    2. Header contains required columns: roll_number, subject_code, component_code, marks.
    3. Exam exists and Exam.status == ACTIVE.
    4. Row resolution and validation via MarksValidator and create_or_update_mark_entry.
    5. Atomic transaction: rolls back all changes if any row contains errors.
    6. Returns structured summary payload with errors.
    """
    filename = getattr(file_obj, 'name', '')
    if not (filename.endswith('.xlsx') or filename.endswith('.xls')):
        return {
            "success": False,
            "total_rows": 0,
            "successful_rows": 0,
            "failed_rows": 1,
            "errors": [{"row": 0, "error": "Invalid file format. Only Excel files (.xlsx, .xls) are supported."}]
        }

    try:
        exam = Exam.objects.select_related('academic_year', 'semester').get(id=exam_id)
    except (Exam.DoesNotExist, ValueError, TypeError):
        return {
            "success": False,
            "total_rows": 0,
            "successful_rows": 0,
            "failed_rows": 1,
            "errors": [{"row": 0, "error": f"Examination with ID {exam_id} does not exist."}]
        }

    if exam.status != Exam.Status.ACTIVE:
        return {
            "success": False,
            "total_rows": 0,
            "successful_rows": 0,
            "failed_rows": 1,
            "errors": [{"row": 0, "error": f"Marks import is only allowed when examination status is ACTIVE (Current status: {exam.status})."}]
        }

    try:
        wb = openpyxl.load_workbook(file_obj, data_only=True)
        sheet = wb.active
    except Exception as e:
        return {
            "success": False,
            "total_rows": 0,
            "successful_rows": 0,
            "failed_rows": 1,
            "errors": [{"row": 0, "error": f"Failed to read Excel file: {str(e)}"}]
        }

    rows = list(sheet.iter_rows(values_only=True))
    if not rows:
        return {
            "success": False,
            "total_rows": 0,
            "successful_rows": 0,
            "failed_rows": 1,
            "errors": [{"row": 0, "error": "Excel file is empty."}]
        }

    raw_header = rows[0]
    if not raw_header or all(cell is None for cell in raw_header):
        return {
            "success": False,
            "total_rows": 0,
            "successful_rows": 0,
            "failed_rows": 1,
            "errors": [{"row": 1, "error": "Header row is missing or empty."}]
        }

    header_map = {}
    for idx, cell in enumerate(raw_header):
        if cell is not None:
            clean_cell = str(cell).strip().lower()
            header_map[clean_cell] = idx

    required_cols = ['roll_number', 'subject_code', 'component_code', 'marks']
    missing_cols = [col for col in required_cols if col not in header_map]

    if missing_cols:
        return {
            "success": False,
            "total_rows": 0,
            "successful_rows": 0,
            "failed_rows": 1,
            "errors": [{"row": 1, "error": f"Missing required columns in header: {', '.join(missing_cols)}"}]
        }

    roll_idx = header_map['roll_number']
    subj_idx = header_map['subject_code']
    comp_idx = header_map['component_code']
    marks_idx = header_map['marks']

    data_rows = rows[1:]
    total_data_rows = len(data_rows)

    if total_data_rows == 0:
        return {
            "success": False,
            "total_rows": 0,
            "successful_rows": 0,
            "failed_rows": 1,
            "errors": [{"row": 1, "error": "No data rows found below the header."}]
        }

    row_errors = []
    created_count = 0
    updated_count = 0

    try:
        with transaction.atomic():
            for i, row in enumerate(data_rows, start=2):
                if not row or all(cell is None for cell in row):
                    continue

                raw_roll = row[roll_idx] if roll_idx < len(row) else None
                raw_subj = row[subj_idx] if subj_idx < len(row) else None
                raw_comp = row[comp_idx] if comp_idx < len(row) else None
                raw_marks = row[marks_idx] if marks_idx < len(row) else None

                if raw_roll is None or str(raw_roll).strip() == "":
                    row_errors.append({"row": i, "error": "roll_number is missing."})
                    continue

                if raw_subj is None or str(raw_subj).strip() == "":
                    row_errors.append({"row": i, "error": "subject_code is missing."})
                    continue

                if raw_comp is None or str(raw_comp).strip() == "":
                    row_errors.append({"row": i, "error": "component_code is missing."})
                    continue

                if raw_marks is None or str(raw_marks).strip() == "":
                    row_errors.append({"row": i, "error": "marks value is missing."})
                    continue

                roll_number = str(raw_roll).strip()
                subject_code = str(raw_subj).strip()
                component_code = str(raw_comp).strip()

                try:
                    obtained_marks = Decimal(str(raw_marks).strip())
                except (InvalidOperation, TypeError, ValueError):
                    row_errors.append({"row": i, "error": f"Invalid marks value '{raw_marks}'. Must be numeric."})
                    continue

                # Resolve Student
                try:
                    student = StudentProfile.objects.select_related('user', 'section', 'section__classroom').get(
                        roll_number=roll_number,
                        is_active=True
                    )
                except StudentProfile.DoesNotExist:
                    row_errors.append({"row": i, "error": f"Student with roll number '{roll_number}' not found."})
                    continue

                # Resolve Subject
                try:
                    subject = Subject.objects.get(code=subject_code, is_active=True)
                except Subject.DoesNotExist:
                    row_errors.append({"row": i, "error": f"Subject with code '{subject_code}' not found."})
                    continue

                # Resolve ExamSubject
                try:
                    exam_subject = ExamSubject.objects.get(exam=exam, subject=subject, is_active=True)
                except ExamSubject.DoesNotExist:
                    row_errors.append({"row": i, "error": f"Subject '{subject_code}' is not included in examination '{exam.name}'."})
                    continue

                # Resolve ExamComponent
                try:
                    exam_component = ExamComponent.objects.get(
                        exam_subject=exam_subject,
                        code=component_code,
                        is_active=True
                    )
                except ExamComponent.DoesNotExist:
                    try:
                        exam_component = ExamComponent.objects.get(
                            exam_subject=exam_subject,
                            name__iexact=component_code,
                            is_active=True
                        )
                    except ExamComponent.DoesNotExist:
                        row_errors.append({"row": i, "error": f"Active component '{component_code}' not found for subject '{subject_code}' in examination '{exam.name}'."})
                        continue

                # Service layer upsert + validation
                try:
                    mark_entry, created = create_or_update_mark_entry(
                        user=user,
                        student_id=student.id,
                        exam_component_id=exam_component.id,
                        obtained_marks=obtained_marks,
                        exam_subject_id=exam_subject.id,
                        request=request
                    )
                    if created:
                        created_count += 1
                    else:
                        updated_count += 1
                except Exception as ex:
                    msg = str(ex.message_dict if hasattr(ex, 'message_dict') else (ex.message if hasattr(ex, 'message') else ex))
                    row_errors.append({"row": i, "error": msg})
                    continue

            if row_errors:
                raise ValueError("Excel import failed due to row-level validation errors.")

    except ValueError:
        return {
            "success": False,
            "total_rows": total_data_rows,
            "successful_rows": 0,
            "failed_rows": len(row_errors),
            "created": 0,
            "updated": 0,
            "errors": row_errors
        }

    return {
        "success": True,
        "total_rows": total_data_rows,
        "created": created_count,
        "updated": updated_count,
        "failed": 0,
        "errors": []
    }
