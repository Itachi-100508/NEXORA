from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from .models import StudentProfile, TeacherProfile, Department, Section, Classroom, Subject, Semester, AcademicYear, TeacherAssignment

User = get_user_model()


class StudentListSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = StudentProfile
        fields = [
            'id',
            'name',
            'first_name',
            'last_name',
            'username',
            'email',
            'enrollment_number',
            'roll_number',
            'is_active',
        ]

    def get_name(self, obj):
        if obj.user:
            full_name = obj.user.get_full_name().strip()
            return full_name if full_name else obj.user.username
        return ""

    def get_class_display(self, obj):
        if obj.section and obj.section.classroom:
            return obj.section.classroom.name
        elif obj.classroom:
            return obj.classroom.name
        return ""

    def get_section_display(self, obj):
        if obj.section:
            return obj.section.name
        return ""

    def get_semester_display(self, obj):
        if obj.section and obj.section.classroom and obj.section.classroom.semester:
            return obj.section.classroom.semester.number
        elif obj.classroom and obj.classroom.semester:
            return obj.classroom.semester.number
        return None

    def get_department_display(self, obj):
        if (obj.section and obj.section.classroom and obj.section.classroom.program
                and obj.section.classroom.program.department):
            return obj.section.classroom.program.department.name
        elif obj.classroom and obj.classroom.program and obj.classroom.program.department:
            return obj.classroom.program.department.name
        return ""

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['class'] = self.get_class_display(instance)
        ret['section'] = self.get_section_display(instance)
        ret['semester'] = self.get_semester_display(instance)
        ret['department'] = self.get_department_display(instance)
        ret['admission_year'] = instance.admission_year
        return ret


class StudentDetailSerializer(StudentListSerializer):
    class_id = serializers.SerializerMethodField()
    section_id = serializers.SerializerMethodField()
    semester_id = serializers.SerializerMethodField()
    department_id = serializers.SerializerMethodField()

    class Meta(StudentListSerializer.Meta):
        fields = StudentListSerializer.Meta.fields + [
            'class_id',
            'section_id',
            'semester_id',
            'department_id',
            'admission_year',
            'date_of_birth',
            'created_at',
            'updated_at',
        ]

    def get_class_id(self, obj):
        if obj.section and obj.section.classroom:
            return obj.section.classroom.id
        return obj.classroom.id if obj.classroom else None

    def get_section_id(self, obj):
        return obj.section.id if obj.section else None

    def get_semester_id(self, obj):
        if obj.section and obj.section.classroom and obj.section.classroom.semester:
            return obj.section.classroom.semester.id
        return obj.classroom.semester.id if (obj.classroom and obj.classroom.semester) else None

    def get_department_id(self, obj):
        if (obj.section and obj.section.classroom and obj.section.classroom.program
                and obj.section.classroom.program.department):
            return obj.section.classroom.program.department.id
        return obj.classroom.program.department.id if (obj.classroom and obj.classroom.program and obj.classroom.program.department) else None


class StudentCreateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default='')
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default='')

    enrollment_number = serializers.CharField(max_length=50)
    roll_number = serializers.CharField(max_length=50)
    classroom_id = serializers.IntegerField(required=False, allow_null=True)
    section_id = serializers.IntegerField(required=False, allow_null=True)
    admission_year = serializers.IntegerField(required=False, allow_null=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_enrollment_number(self, value):
        if StudentProfile.objects.filter(enrollment_number=value).exists():
            raise serializers.ValidationError("A student with this enrollment number already exists.")
        return value

    def validate_section_id(self, value):
        if value is not None and not Section.objects.filter(id=value).exists():
            raise serializers.ValidationError("Selected section does not exist.")
        return value

    def validate_classroom_id(self, value):
        if value is not None and not Classroom.objects.filter(id=value).exists():
            raise serializers.ValidationError("Selected classroom does not exist.")
        return value

    def create(self, validated_data):
        username = validated_data.pop('username')
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        first_name = validated_data.pop('first_name', '')
        last_name = validated_data.pop('last_name', '')

        enrollment_number = validated_data.pop('enrollment_number')
        roll_number = validated_data.pop('roll_number')
        section_id = validated_data.pop('section_id', None)
        classroom_id = validated_data.pop('classroom_id', None)
        admission_year = validated_data.pop('admission_year', None)
        date_of_birth = validated_data.pop('date_of_birth', None)

        section = Section.objects.get(id=section_id) if section_id else None
        classroom = section.classroom if (section and section.classroom) else (Classroom.objects.get(id=classroom_id) if classroom_id else None)

        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                role=User.Role.STUDENT
            )
            student_profile = StudentProfile.objects.create(
                user=user,
                enrollment_number=enrollment_number,
                roll_number=roll_number,
                section=section,
                classroom=classroom,
                admission_year=admission_year,
                date_of_birth=date_of_birth
            )
        return student_profile


class StudentUpdateSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', required=False, allow_blank=True, default='')
    last_name = serializers.CharField(source='user.last_name', required=False, allow_blank=True, default='')
    email = serializers.EmailField(source='user.email', required=False)
    roll_number = serializers.CharField(max_length=50, required=False)
    enrollment_number = serializers.CharField(max_length=50, required=False)
    classroom_id = serializers.IntegerField(required=False, allow_null=True)
    section_id = serializers.IntegerField(required=False, allow_null=True)
    admission_year = serializers.IntegerField(required=False, allow_null=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = StudentProfile
        fields = [
            'first_name',
            'last_name',
            'email',
            'roll_number',
            'enrollment_number',
            'section_id',
            'classroom_id',
            'admission_year',
            'date_of_birth',
            'is_active',
        ]

    def validate_email(self, value):
        user = self.instance.user if self.instance else None
        if User.objects.filter(email=value).exclude(id=user.id if user else 0).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_roll_number(self, value):
        profile = self.instance
        if profile and StudentProfile.objects.filter(roll_number=value).exclude(id=profile.id).exists():
            raise serializers.ValidationError("This roll number is already in use.")
        return value

    def validate_enrollment_number(self, value):
        profile = self.instance
        if profile and StudentProfile.objects.filter(enrollment_number=value).exclude(id=profile.id).exists():
            raise serializers.ValidationError("This enrollment number is already in use.")
        return value

    def validate_section_id(self, value):
        if value is not None and not Section.objects.filter(id=value).exists():
            raise serializers.ValidationError("Selected section does not exist.")
        return value

    def validate_classroom_id(self, value):
        if value is not None and not Classroom.objects.filter(id=value).exists():
            raise serializers.ValidationError("Selected classroom does not exist.")
        return value

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user

        if 'first_name' in user_data:
            user.first_name = user_data['first_name']
        if 'last_name' in user_data:
            user.last_name = user_data['last_name']
        if 'email' in user_data:
            email = user_data['email']
            if user.email != email and User.objects.filter(email=email).exclude(id=user.id).exists():
                raise serializers.ValidationError({"email": "A user with this email already exists."})
            user.email = email
        user.save()

        # Handle roll_number and enrollment_number
        if 'roll_number' in validated_data:
            instance.roll_number = validated_data['roll_number']
        if 'enrollment_number' in validated_data:
            instance.enrollment_number = validated_data['enrollment_number']

        # Handle section selection
        section_id = validated_data.pop('section_id', None)
        if section_id is not None:
            section = Section.objects.get(id=section_id)
            instance.section = section
            if section.classroom:
                instance.classroom = section.classroom

        # Handle classroom selection (if section is not provided)
        classroom_id = validated_data.pop('classroom_id', None)
        if classroom_id is not None:
            instance.classroom_id = classroom_id
            if not instance.section or instance.section.classroom_id != classroom_id:
                instance.section = None  # Clear section if classroom changes

        # Handle other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance


# ============================================================
# TEACHER MANAGEMENT SERIALIZERS (PHASE 07)
# ============================================================

class TeacherListSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    department = serializers.CharField(source='department.name', default='', read_only=True)
    department_id = serializers.IntegerField(source='department.id', read_only=True, allow_null=True)

    class Meta:
        model = TeacherProfile
        fields = [
            'id',
            'name',
            'first_name',
            'last_name',
            'username',
            'email',
            'employee_id',
            'department',
            'department_id',
            'designation',
            'is_active',
        ]

    def get_name(self, obj):
        if obj.user:
            full_name = obj.user.get_full_name().strip()
            return full_name if full_name else obj.user.username
        return ""


class TeacherDetailSerializer(TeacherListSerializer):
    class Meta(TeacherListSerializer.Meta):
        fields = TeacherListSerializer.Meta.fields + [
            'joining_date',
            'created_at',
            'updated_at',
        ]


class TeacherCreateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default='')
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default='')

    employee_id = serializers.CharField(max_length=50)
    department_id = serializers.IntegerField(required=False, allow_null=True)
    designation = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    joining_date = serializers.DateField(required=False, allow_null=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_employee_id(self, value):
        if TeacherProfile.objects.filter(employee_id=value).exists():
            raise serializers.ValidationError("A teacher with this employee ID already exists.")
        return value

    def validate_department_id(self, value):
        if value is not None and not Department.objects.filter(id=value).exists():
            raise serializers.ValidationError("Selected department does not exist.")
        return value

    def create(self, validated_data):
        username = validated_data.pop('username')
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        first_name = validated_data.pop('first_name', '')
        last_name = validated_data.pop('last_name', '')

        employee_id = validated_data.pop('employee_id')
        department_id = validated_data.pop('department_id', None)
        designation = validated_data.pop('designation', '')
        joining_date = validated_data.pop('joining_date', None)

        department = Department.objects.get(id=department_id) if department_id else None

        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                role=User.Role.TEACHER
            )
            teacher_profile = TeacherProfile.objects.create(
                user=user,
                employee_id=employee_id,
                department=department,
                designation=designation,
                joining_date=joining_date
            )
        return teacher_profile


class TeacherUpdateSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', required=False)
    last_name = serializers.CharField(source='user.last_name', required=False)
    email = serializers.EmailField(source='user.email', required=False)
    department_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = TeacherProfile
        fields = [
            'first_name',
            'last_name',
            'email',
            'employee_id',
            'department_id',
            'designation',
            'joining_date',
            'is_active',
        ]

    def validate_employee_id(self, value):
        if TeacherProfile.objects.filter(employee_id=value).exclude(id=self.instance.id).exists():
            raise serializers.ValidationError("A teacher with this employee ID already exists.")
        return value

    def validate_department_id(self, value):
        if value is not None and not Department.objects.filter(id=value).exists():
            raise serializers.ValidationError("Selected department does not exist.")
        return value

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user

        if 'first_name' in user_data:
            user.first_name = user_data['first_name']
        if 'last_name' in user_data:
            user.last_name = user_data['last_name']
        if 'email' in user_data:
            user.email = user_data['email']
        user.save()

        department_id = validated_data.pop('department_id', None)
        if department_id is not None:
            department = Department.objects.get(id=department_id) if department_id else None
            instance.department = department

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance


# ============================================================
# SUBJECT MANAGEMENT SERIALIZERS (PHASE 08)
# ============================================================

class SubjectListSerializer(serializers.ModelSerializer):
    department = serializers.CharField(source='department.name', default='', read_only=True)
    department_id = serializers.IntegerField(source='department.id', read_only=True, allow_null=True)
    semester = serializers.SerializerMethodField(method_name='get_semester_number')
    semester_id = serializers.IntegerField(source='semester.id', read_only=True, allow_null=True)

    class Meta:
        model = Subject
        fields = [
            'id',
            'code',
            'name',
            'department',
            'department_id',
            'semester',
            'semester_id',
            'credits',
            'is_active',
        ]

    def get_semester_number(self, obj):
        return obj.semester.number if obj.semester else None


class SubjectDetailSerializer(SubjectListSerializer):
    class Meta(SubjectListSerializer.Meta):
        fields = SubjectListSerializer.Meta.fields + [
            'description',
            'created_at',
            'updated_at',
        ]


class SubjectCreateSerializer(serializers.ModelSerializer):
    code = serializers.CharField(max_length=20)
    name = serializers.CharField(max_length=100)
    department_id = serializers.IntegerField(required=False, allow_null=True)
    semester_id = serializers.IntegerField(required=False, allow_null=True)
    credits = serializers.IntegerField(default=4)

    class Meta:
        model = Subject
        fields = [
            'code',
            'name',
            'description',
            'department_id',
            'semester_id',
            'credits',
            'is_active',
        ]

    def validate_code(self, value):
        normalized_code = value.strip().upper()
        if not normalized_code:
            raise serializers.ValidationError("Subject code cannot be empty.")
        if Subject.objects.filter(code=normalized_code).exists():
            raise serializers.ValidationError("A subject with this code already exists.")
        return normalized_code

    def validate_name(self, value):
        normalized_name = value.strip()
        if not normalized_name:
            raise serializers.ValidationError("Subject name cannot be empty.")
        return normalized_name

    def validate_credits(self, value):
        if value <= 0:
            raise serializers.ValidationError("Credits must be a positive integer greater than zero.")
        return value

    def validate_department_id(self, value):
        if value is not None and not Department.objects.filter(id=value).exists():
            raise serializers.ValidationError("Selected department does not exist.")
        return value

    def validate_semester_id(self, value):
        if value is not None and not Semester.objects.filter(id=value).exists():
            raise serializers.ValidationError("Selected semester does not exist.")
        return value

    def validate(self, data):
        dept_id = data.get('department_id')
        sem_id = data.get('semester_id')
        if dept_id and sem_id:
            dept = Department.objects.get(id=dept_id)
            sem = Semester.objects.get(id=sem_id)
            if sem.program and sem.program.department and sem.program.department != dept:
                raise serializers.ValidationError({"semester_id": "Selected semester does not belong to a program in the chosen department."})
        return data

    def create(self, validated_data):
        dept_id = validated_data.pop('department_id', None)
        sem_id = validated_data.pop('semester_id', None)

        department = Department.objects.get(id=dept_id) if dept_id else None
        semester = Semester.objects.get(id=sem_id) if sem_id else None

        subject = Subject.objects.create(
            department=department,
            semester=semester,
            **validated_data
        )
        return subject


# ============================================================
# TEACHER ASSIGNMENT SERIALIZERS (PHASE 09)
# ============================================================

class TeacherAssignmentListSerializer(serializers.ModelSerializer):
    teacher = serializers.SerializerMethodField()
    subject = serializers.SerializerMethodField()
    section = serializers.SerializerMethodField()
    academic_year = serializers.SerializerMethodField()

    class Meta:
        model = TeacherAssignment
        fields = [
            'id',
            'teacher',
            'subject',
            'section',
            'academic_year',
            'is_active',
            'assigned_at',
        ]

    def get_teacher(self, obj):
        if not obj.teacher:
            return None
        t_user = obj.teacher.user
        full_name = t_user.get_full_name().strip() if t_user else ""
        return {
            "id": obj.teacher.id,
            "name": full_name if full_name else (t_user.username if t_user else ""),
            "employee_id": obj.teacher.employee_id
        }

    def get_subject(self, obj):
        if not obj.subject:
            return None
        return {
            "id": obj.subject.id,
            "code": obj.subject.code,
            "name": obj.subject.name
        }

    def get_section(self, obj):
        if not obj.section:
            return None
        cls_name = obj.section.classroom.name if (obj.section.classroom) else ""
        return {
            "id": obj.section.id,
            "name": obj.section.name,
            "class": f"{cls_name}-{obj.section.name}" if cls_name else obj.section.name
        }

    def get_academic_year(self, obj):
        if not obj.academic_year:
            return None
        return {
            "id": obj.academic_year.id,
            "name": obj.academic_year.name
        }


class TeacherAssignmentDetailSerializer(TeacherAssignmentListSerializer):
    class Meta(TeacherAssignmentListSerializer.Meta):
        fields = TeacherAssignmentListSerializer.Meta.fields + [
            'created_at',
            'updated_at',
        ]


class TeacherAssignmentCreateSerializer(serializers.ModelSerializer):
    teacher_id = serializers.IntegerField()
    subject_id = serializers.IntegerField()
    section_id = serializers.IntegerField()
    academic_year_id = serializers.IntegerField()

    class Meta:
        model = TeacherAssignment
        fields = [
            'teacher_id',
            'subject_id',
            'section_id',
            'academic_year_id',
            'is_active',
        ]

    def validate_teacher_id(self, value):
        try:
            profile = TeacherProfile.objects.get(id=value)
        except TeacherProfile.DoesNotExist:
            raise serializers.ValidationError("Selected teacher does not exist.")
        if not profile.is_active:
            raise serializers.ValidationError("Selected teacher profile is inactive.")
        if profile.user and profile.user.role != 'TEACHER':
            raise serializers.ValidationError("Assigned teacher user must have role TEACHER.")
        return value

    def validate_subject_id(self, value):
        try:
            subject = Subject.objects.get(id=value)
        except Subject.DoesNotExist:
            raise serializers.ValidationError("Selected subject does not exist.")
        if not subject.is_active:
            raise serializers.ValidationError("Selected subject is inactive.")
        return value

    def validate_section_id(self, value):
        try:
            section = Section.objects.get(id=value)
        except Section.DoesNotExist:
            raise serializers.ValidationError("Selected section does not exist.")
        if not section.is_active:
            raise serializers.ValidationError("Selected section is inactive.")
        return value

    def validate_academic_year_id(self, value):
        try:
            ay = AcademicYear.objects.get(id=value)
        except AcademicYear.DoesNotExist:
            raise serializers.ValidationError("Selected academic year does not exist.")
        if not ay.is_active:
            raise serializers.ValidationError("Selected academic year is inactive.")
        return value

    def validate(self, data):
        teacher_id = data.get('teacher_id')
        subject_id = data.get('subject_id')
        section_id = data.get('section_id')
        academic_year_id = data.get('academic_year_id')

        teacher = TeacherProfile.objects.get(id=teacher_id)
        subject = Subject.objects.get(id=subject_id)
        section = Section.objects.get(id=section_id)
        academic_year = AcademicYear.objects.get(id=academic_year_id)

        if TeacherAssignment.objects.filter(
            teacher=teacher,
            subject=subject,
            section=section,
            academic_year=academic_year
        ).exists():
            raise serializers.ValidationError("This teacher is already assigned to this subject and section for the selected academic year.")

        if section.classroom and section.classroom.academic_year != academic_year:
            raise serializers.ValidationError({"academic_year_id": "Assignment academic year must match section classroom academic year."})

        if subject.semester and section.classroom and section.classroom.semester:
            if subject.semester != section.classroom.semester:
                raise serializers.ValidationError({"subject_id": "Subject semester must match section classroom semester."})

        if (subject.department and section.classroom and section.classroom.program
                and section.classroom.program.department):
            if subject.department != section.classroom.program.department:
                raise serializers.ValidationError({"subject_id": "Subject department must match section classroom department."})

        return data

    def create(self, validated_data):
        teacher_id = validated_data.pop('teacher_id')
        subject_id = validated_data.pop('subject_id')
        section_id = validated_data.pop('section_id')
        academic_year_id = validated_data.pop('academic_year_id')

        teacher = TeacherProfile.objects.get(id=teacher_id)
        subject = Subject.objects.get(id=subject_id)
        section = Section.objects.get(id=section_id)
        academic_year = AcademicYear.objects.get(id=academic_year_id)

        assignment = TeacherAssignment.objects.create(
            teacher=teacher,
            subject=subject,
            section=section,
            academic_year=academic_year,
            **validated_data
        )
        return assignment


class TeacherAssignmentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeacherAssignment
        fields = [
            'is_active',
        ]


# ============================================================
# ACADEMIC STRUCTURE SERIALIZERS (Read-only for dropdowns)
# ============================================================

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'code', 'name']


class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = ['id', 'name', 'start_date', 'end_date']


class SemesterSerializer(serializers.ModelSerializer):
    program_code = serializers.CharField(source='program.code', read_only=True)
    program_name = serializers.CharField(source='program.name', read_only=True)

    class Meta:
        model = Semester
        fields = ['id', 'number', 'name', 'program', 'program_code', 'program_name']


class ClassroomSerializer(serializers.ModelSerializer):
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True, allow_null=True)
    program_code = serializers.CharField(source='program.code', read_only=True, allow_null=True)
    program_name = serializers.CharField(source='program.name', read_only=True, allow_null=True)
    semester_number = serializers.IntegerField(source='semester.number', read_only=True, allow_null=True)
    semester_name = serializers.CharField(source='semester.name', read_only=True, allow_null=True)
    department_name = serializers.SerializerMethodField()
    department_id = serializers.SerializerMethodField()

    class Meta:
        model = Classroom
        fields = [
            'id', 'name', 'code', 'section',
            'academic_year', 'academic_year_name',
            'program', 'program_code', 'program_name',
            'semester', 'semester_number', 'semester_name',
            'department_name', 'department_id'
        ]

    def get_department_name(self, obj):
        if obj.program and obj.program.department:
            return obj.program.department.name
        return None

    def get_department_id(self, obj):
        if obj.program and obj.program.department:
            return obj.program.department.id
        return None


class SectionSerializer(serializers.ModelSerializer):
    classroom_name = serializers.CharField(source='classroom.name', read_only=True)
    classroom_code = serializers.CharField(source='classroom.code', read_only=True)

    class Meta:
        model = Section
        fields = ['id', 'name', 'code', 'classroom', 'classroom_name', 'classroom_code', 'capacity']
