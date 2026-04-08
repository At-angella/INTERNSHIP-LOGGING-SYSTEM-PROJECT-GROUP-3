from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from django.utils import timezone
from core.models import (
    CustomUser, AcademicDepartment, Workplace, InternshipPlacement,
    WeeklyLog, SupervisorReview, EvaluationCriteria, Evaluation, AuditLog
)

# Register your models here.

# CUSTOM USER ADMIN

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'get_full_name', 'role', 'get_role_specific_id', 'is_active', 'must_change_password', 'date_joined')
    list_filter = ('role', 'is_active', 'must_change_password', 'faculty', 'college', 'date_joined')
    search_fields = ('email', 'first_name', 'last_name', 'student_id', 'registration_number', 'staff_id', 'workplace_department')
    ordering = ('-date_joined',)
    readonly_fields = ('date_joined', 'last_login')
    
    # Fieldsets for EDITING existing users
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'phone_number', 'role')}),

        # Student fields — collapsed by default, visible only when relevant
        ('Student Info', {
            'classes': ('collapse',),
            'fields': ('student_id', 'registration_number', 'college', 'program'),
        }),
        
        # Academic Supervisor fields
        ('Academic Supervisor Info', {
            'classes': ('collapse',),
            'fields': ('staff_id', 'faculty', 'department', 'specialization', 'max_students'),
        }),
        
        # Workplace Supervisor fields
        ('Workplace Supervisor Info', {
            'classes': ('collapse',),
            'fields': ( 'job_title', 'workplace_department', 'years_of_experience'),
        }),

        ('Permissions', {
            'classes': ('collapse',),
            'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions', 'must_change_password'),
        }),

        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    # Fieldsets for creating new users
    add_fieldsets = (
        ('Account Credentials', {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'role'),
        }),
        ('Personal Info', {
            'classes': ('wide',),
            'fields': ('first_name', 'last_name', 'phone_number'),
        }),
        ('Student Information', {
            'classes': ('wide', 'collapse',),
            'fields': ('student_id', 'registration_number','college', 'program',),
        }),
        ('Academic Supervisor Information', {
            'classes': ('wide', 'collapse',),
            'fields': ('staff_id', 'faculty', 'department','specialization', 'max_students',),
        }),
        ('Workplace Supervisor Information', {
            'classes': ('wide', 'collapse',),
            'fields': ('job_title', 'workplace_department','years_of_experience'),
        }),
    )
    
    # Custom list display methods
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
    get_full_name.short_description = "Full Name"

    def get_role_specific_id(self, obj):
        """Show the most relevant ID depending on the user's role."""
        if obj.role == 'STUDENT':
            return obj.registration_number or '—'
        elif obj.role == 'ACADEMIC_SUPERVISOR':
            return obj.staff_id or '—'
        elif obj.role == 'WORKPLACE_SUPERVISOR':
            return obj.job_title or '—'
        return '—'
    get_role_specific_id.short_description = "ID / Title"