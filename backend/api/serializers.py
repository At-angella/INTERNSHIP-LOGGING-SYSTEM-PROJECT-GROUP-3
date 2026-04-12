from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from core.models import (
    CustomUser, AcademicDepartment, Workplace, InternshipPlacement,
    WeeklyLog, SupervisorReview, EvaluationCriteria, Evaluation, AuditLog
)

# USER SERIALIZERS

class UserSerializer(serializers.ModelSerializer):
    """
    Basic user info — used for showing who the student is inside
    a placement, or who the reviewer is inside a review.
    Read-only, never used for creating users.
    """
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = CustomUser
        fields = (
            'id', 'email', 'first_name', 'last_name',
            'role', 'role_display', 'phone_number', 'is_active'
        )
        read_only_fields = fields

class StudentSerializer(serializers.ModelSerializer):
    """
    Detailed student profile — used when viewing a student's
    full profile including academic details.
    """
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = CustomUser
        fields = (
            'id', 'email', 'first_name', 'last_name', 'role', 'role_display',
            'phone_number', 'student_id', 'registration_number',
            'college', 'program', 'is_active', 'date_joined'
        )
        read_only_fields = fields

class AcademicSupervisorSerializer(serializers.ModelSerializer):
    """
    Detailed academic supervisor profile and used when admin views supervisor list.
    """
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = CustomUser
        fields = (
            'id', 'email', 'first_name', 'last_name', 'role', 'role_display',
            'phone_number', 'staff_id', 'faculty', 'department',
            'specialization', 'max_students', 'is_active', 'date_joined'
        )
        read_only_fields = fields

class WorkplaceSupervisorSerializer(serializers.ModelSerializer):
    """
    Detailed workplace supervisor profile.
    """
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = CustomUser
        fields = (
            'id', 'email', 'first_name', 'last_name', 'role', 'role_display',
            'phone_number', 'job_title', 'workplace_department',
            'years_of_experience', 'is_active', 'date_joined'
        )
        read_only_fields = fields

# AUTHENTICATION SERIALIZERS

class StudentRegistrationSerializer(serializers.ModelSerializer):
    """
    Students register themselves — no admin needed.
    """
    password = serializers.CharField(
        write_only=True,
        min_length=8,
    )
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = (
            'email', 'first_name', 'last_name', 'phone_number',
            'student_id', 'registration_number', 'college', 'program',
            'password', 'confirm_password'
        )

    def validate_email(self, value):
        if not value.endswith('@students.mak.ac.ug'):
            raise serializers.ValidationError(
                "Must use your university student email (@students.mak.ac.ug)."
            )
        return value

    def validate_student_id(self, value):
        if CustomUser.objects.filter(student_id=value).exists():
            raise serializers.ValidationError(
                "A student with this student ID already exists."
            )
        return value

    def validate_registration_number(self, value):
        if CustomUser.objects.filter(registration_number=value).exists():
            raise serializers.ValidationError(
                "A student with this registration number already exists."
            )
        return value

    def validate(self, data):
        if data['password'] != data.pop('confirm_password'):
            raise serializers.ValidationError({
                'confirm_password': "Passwords do not match."
            })
        try:
            validate_password(data['password'])
        except ValidationError as e:
            raise serializers.ValidationError({'password': list(e.messages)})
        return data

    def create(self, validated_data):
        password = validated_data.pop('password')
        user, _ = CustomUser.objects.create_user(
            role='STUDENT',
            **validated_data
        )
        user.set_password(password)
        user.save()
        return user
    
# ACADEMIC DEPARTMENT & WORKPLACE

class AcademicDepartmentSerializer(serializers.ModelSerializer):
    """
    Used for listing and creating academic departments.
    """
    head = UserSerializer(read_only=True)
    head_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.filter(role='ACADEMIC_SUPERVISOR'),
        source='head',
        write_only=True,
        required=False
    )
    placement_count = serializers.SerializerMethodField()

    class Meta:
        model = AcademicDepartment
        fields = (
            'id', 'name', 'faculty', 'description',
            'head', 'head_id', 'placement_count',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_placement_count(self, obj):
        return obj.placements.count()


class WorkplaceSerializer(serializers.ModelSerializer):
    """
    Used for listing and creating workplaces.
    """
    active_placements_count = serializers.SerializerMethodField()

    class Meta:
        model = Workplace
        fields = (
            'id', 'name', 'industry', 'address', 'contact_person',
            'contact_email', 'contact_phone', 'is_active',
            'active_placements_count', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_active_placements_count(self, obj):
        return obj.internship_placements.filter(status='ACTIVE').count()

# INTERNSHIP PLACEMENT SERIALIZERS

class InternshipPlacementSerializer(serializers.ModelSerializer):
    """
    Full placement detail with nested objects.
    """
    student = StudentSerializer(read_only=True)
    workplace = WorkplaceSerializer(read_only=True)
    academic_supervisor = AcademicSupervisorSerializer(read_only=True)
    workplace_supervisor = WorkplaceSupervisorSerializer(read_only=True)
    department = AcademicDepartmentSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    log_progress = serializers.SerializerMethodField()

    class Meta:
        model = InternshipPlacement
        fields = (
            'id', 'student', 'workplace', 'academic_supervisor',
            'workplace_supervisor', 'department', 'start_date', 'end_date',
            'status', 'status_display', 'position_title', 'description',
            'log_progress', 'created_at', 'updated_at', 'approved_at', 'approved_by'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'approved_at', 'approved_by')

    def get_log_progress(self, obj):
        """Shows approved and total logs"""
        total = obj.weekly_logs.count()
        approved = obj.weekly_logs.filter(status='APPROVED').count()
        return {
            'total_logs': total,
            'approved_logs': approved,
            'pending_logs': total - approved,
        }


class InternshipPlacementCreateSerializer(serializers.ModelSerializer):
    """
    Used for creating and updating placements.
    """
    class Meta:
        model = InternshipPlacement
        fields = (
            'student', 'workplace', 'academic_supervisor', 'workplace_supervisor',
            'department', 'start_date', 'end_date', 'position_title', 'description'
        )

    def validate_student(self, value):
        if value.role != 'STUDENT':
            raise serializers.ValidationError("Selected user is not a student.")
        return value

    def validate_academic_supervisor(self, value):
        if value.role != 'ACADEMIC_SUPERVISOR':
            raise serializers.ValidationError("Selected user is not an academic supervisor.")
        # Check supervisor capacity
        active_count = value.supervised_placements.filter(
            status__in=['APPROVED', 'ACTIVE']
        ).count()
        if value.max_students and active_count >= value.max_students:
            raise serializers.ValidationError(
                f"{value.get_full_name()} has reached their maximum student capacity "
                f"({value.max_students} students)."
            )
        return value

    def validate_workplace_supervisor(self, value):
        if value.role != 'WORKPLACE_SUPERVISOR':
            raise serializers.ValidationError("Selected user is not a workplace supervisor.")
        return value

    def validate(self, data):
        if data['start_date'] >= data['end_date']:
            raise serializers.ValidationError({
                'end_date': "End date must be after start date."
            })
        return data


class PlacementStatusUpdateSerializer(serializers.ModelSerializer):
    """
    Used specifically for approving or rejecting placements.
    """
    class Meta:
        model = InternshipPlacement
        fields = ('status',)

    def validate_status(self, value):
        allowed = ['APPROVED', 'REJECTED', 'ACTIVE', 'COMPLETED', 'CANCELLED']
        if value not in allowed:
            raise serializers.ValidationError(
                f"Status must be one of: {', '.join(allowed)}"
            )
        return value

    def update(self, instance, validated_data):
        request = self.context.get('request')
        instance.status = validated_data['status']
        if validated_data['status'] == 'APPROVED':
            instance.approved_by = request.user
        instance.save()
        return instance