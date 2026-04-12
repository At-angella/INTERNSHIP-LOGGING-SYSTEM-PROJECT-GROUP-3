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
