from .models import TeacherAssignment, TeacherProfile, Subject, Section, AcademicYear


def is_teacher_assigned(teacher, subject, section, academic_year):
    """
    Verifies if a teacher has an active TeacherAssignment for the given subject, section, and academic_year.

    Parameters:
    - teacher: TeacherProfile instance, User instance (with role=TEACHER), or integer ID.
    - subject: Subject instance or integer ID.
    - section: Section instance or integer ID.
    - academic_year: AcademicYear instance or integer ID.

    Returns:
    - True if an active (is_active=True) TeacherAssignment exists matching all criteria.
    - False otherwise.
    """
    if not teacher or not subject or not section or not academic_year:
        return False

    # Resolve TeacherProfile ID
    teacher_id = None
    if isinstance(teacher, int):
        teacher_id = teacher
    elif hasattr(teacher, 'teacher_profile') and teacher.teacher_profile:
        teacher_id = teacher.teacher_profile.id
    elif isinstance(teacher, TeacherProfile):
        teacher_id = teacher.id
    elif hasattr(teacher, 'id'):
        try:
            profile = TeacherProfile.objects.get(user=teacher)
            teacher_id = profile.id
        except TeacherProfile.DoesNotExist:
            return False

    if not teacher_id:
        return False

    subject_id = subject.id if hasattr(subject, 'id') else subject
    section_id = section.id if hasattr(section, 'id') else section
    academic_year_id = academic_year.id if hasattr(academic_year, 'id') else academic_year

    return TeacherAssignment.objects.filter(
        teacher_id=teacher_id,
        subject_id=subject_id,
        section_id=section_id,
        academic_year_id=academic_year_id,
        is_active=True
    ).exists()
