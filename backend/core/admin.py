from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from core.models import (
    CustomUser, AcademicDepartment, Workplace, InternshipPlacement,
    WeeklyLog, SupervisorReview, EvaluationCriteria, Evaluation, AuditLog
)


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'get_full_name', 'role', 'is_active')
    search_fields = ('email', 'first_name', 'last_name', 'student_id', 'registration_number', 'staff_id')
    list_filter = ('role', 'is_active')
    ordering = ('-date_joined',)

    # Custom fieldsets to organize fields based on user roles
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'phone_number', 'role')}),
        ('Student Info', {'classes': ('collapse',), 'fields': ('student_id', 'registration_number', 'college', 'program')}),
        ('Academic Supervisor Info', {'classes': ('collapse',), 'fields': ('staff_id', 'faculty', 'department', 'specialization', 'max_students')}),
        ('Workplace Supervisor Info', {'classes': ('collapse',), 'fields': ('job_title', 'workplace_department', 'years_of_experience')}),
        ('Permissions', {'classes': ('collapse',), 'fields': ('is_active', 'is_staff', 'is_superuser', 'must_change_password')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'role', 'first_name', 'last_name'),
        }),
    )

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
    get_full_name.short_description = "Full Name"


@admin.register(AcademicDepartment)
class AcademicDepartmentAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'head')
    search_fields = ('name', 'code')


@admin.register(Workplace)
class WorkplaceAdmin(admin.ModelAdmin):
    list_display = ('name', 'industry', 'contact_email', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name',)


@admin.register(InternshipPlacement)
class InternshipPlacementAdmin(admin.ModelAdmin):
    list_display = ('student', 'workplace', 'status', 'start_date', 'end_date')
    list_filter = ('status',)
    search_fields = ('student__email', 'student__registration_number', 'workplace__name')


@admin.register(WeeklyLog)
class WeeklyLogAdmin(admin.ModelAdmin):
    list_display = ('placement', 'week_number', 'status', 'submitted_at')
    list_filter = ('status',)
    search_fields = ('placement__student__email', 'placement__workplace__name')


@admin.register(SupervisorReview)
class SupervisorReviewAdmin(admin.ModelAdmin):
    list_display = ('log', 'reviewer', 'approval_status')
    list_filter = ('approval_status',)


@admin.register(EvaluationCriteria)
class EvaluationCriteriaAdmin(admin.ModelAdmin):
    list_display = ('name', 'department', 'category', 'weight', 'is_active')
    list_filter = ('category', 'is_active')


@admin.register(Evaluation)
class EvaluationAdmin(admin.ModelAdmin):
    list_display = ('placement', 'evaluator', 'total_weighted_score', 'final_grade', 'is_submitted')
    list_filter = ('is_submitted', 'final_grade')


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('action', 'actor', 'content_type', 'timestamp')
    readonly_fields = ('actor', 'action', 'content_type', 'object_id', 'old_value', 'new_value', 'ip_address', 'timestamp')

    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False