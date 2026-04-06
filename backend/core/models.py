from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta
import secrets
import string

# Create your models here.

# USER MANAGEMENT MODELS

class CustomUserManager(BaseUserManager):
    ROLE_EMAIL_DOMAINS = {
        'ADMIN': '@mak.ac.ug',
        'STUDENT': '@student.mak.ac.ug',
        'ACADAMIC_SUPERVISOR': '@mak.ac.ug',
        'WORKPLACE_SUPERVISOR': '@mak.ac.ug',
    }
    ADMIN_ONLY_ROLES = {'ACADEMIC_SUPERVISOR', 'WORKPLACE_SUPERVISOR'}

    def _vadidate_email_domain(self, email, role):
        required_domain = self.ROLE_EMAIL_DOMAINS.get(role)

        if not required_domain:
            raise ValidationError(f"Invalid role: {role} ")
        if not email.endswith(required_domain):
            raise ValidationError(f"Email domain for role {role} must end with {required_domain}: {email}")
        
    def _generate_temp_password(self, length=8):
        characters = string.ascii_letters + string.digits + string.punctuation
        temp_password = ''.join(secrets.choice(characters) for _ in range(length))
        return temp_password
        
    def create_user(self, email, password=None, created_by=None, **extra_fields):
        if not email:
            raise ValueError("Email must be provided")
        
        role = extra_fields.get('role')
        if not role:
            raise ValueError("Role must be provided")
        
        # Only admins can register both academic supervisors and workplace supervisors
        if role in self.ADMIN_ONLY_ROLES:
            if created_by is None:
                raise ValueError(f"{role} must be created by an admin user.")
            if not isinstance(created_by, self.model):
                raise ValueError("created_by must be an instance of CustomUser.")
            if created_by.role != 'ADMIN':
                raise ValueError(f"{role} must be created by an admin user.")
        
        email = self.normalize_email(email)
        self._vadidate_email_domain(email, role)

        # Auto-generate a temporary password if none provided
        generated_password = None
        if password is None and role in self.ADMIN_ONLY_ROLES:
            generated_password = self._generate_temp_password()
            password = generated_password

        user = self.model(email=email, must_change_password=True if role in self.ADMIN_ONLY_ROLES else False, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)

        # Returning both user and the plain-text temp password so admin can share it
        if generated_password:
            return user, generated_password
        return user, None
    
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')

        if extra_fields.get('is_staff') is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get('is_superuser') is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        
        return self.create_user(email, password, **extra_fields)
    
class CustomUser(AbstractUser):

    """
    Custom user model with role-based access control.
    Roles:
    - STUDENT: Intern student (logs activities, views evaluations)
    - WORKPLACE_SUPERVISOR: Guides intern at workplace (reviews logs, provides feedback)
    - ACADEMIC_SUPERVISOR: Faculty supervisor (evaluates performance)
    - ADMIN: Internship administrator (manages placements, evaluations)
    """

    ROLE_CHOICES = [
        ('ADMIN', 'Admin'),
        ('STUDENT', 'Student'),
        ('ACADEMIC_SUPERVISOR', 'Academic Supervisor'),
        ('WORKPLACE_SUPERVISOR', 'Workplace Supervisor'),
    ]

    ROLE_EMAIL_DOMAINS = {
        'ADMIN': '@mak.ac.ug',
        'ACADEMIC_SUPERVISOR': '@mak.ac.ug',
        'WORKPLACE_SUPERVISOR': '@mak.ac.ug',
        'STUDENT': '@students.mak.ac.ug',
    }

    ADMIN_ONLY_ROLES = {'ACADEMIC_SUPERVISOR', 'WORKPLACE_SUPERVISOR'}

    # Fields needed for all the user model
    username = None
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    must_change_password = models.BooleanField(default=False)
    phone_number = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    #Student specific fields
    student_id = models.CharField(max_length=20, unique=True, null=False, blank=False, help_text="Student ID number e.g. 260012345")
    registration_number = models.CharField(max_length=20, unique=True, null=False, blank=False, help_text="Registration number e.g. 25/U/12345/EVE")
    college = models.CharField(max_length=100, null=False, blank=False, help_text="E.g. CoCIS, CoCIT, CoHES, CoNAS, CoVET")
    program = models.CharField(max_length=100, null=False, blank=False, help_text="E.g. BSc Computer Science")

    # Academic Supervisor fields
    staff_id = models.CharField(max_length=20, unique=True, null=False, blank=False, help_text="University staff ID e.g. STF/2024/001")
    faculty = models.CharField(max_length=255, null=False, blank=False, help_text="Faculty/College the supervisor belongs to")
    department = models.CharField(max_length=255, null=False,blank=False,help_text="Official department within the university e.g. Computer Science, Electrical Engineering")
    specialization = models.CharField(max_length=255, null=False, blank=False, help_text="Area of specialization e.g. Software Engineering, Data Science")
    max_students = models.PositiveIntegerField(null=False, blank=False, default=5, help_text="Maximum number of interns this supervisor can handle at once")

    # Workplace Supervisor fields 
    job_title = models.CharField(max_length=255, null=False, blank=False, help_text="Supervisor's position at the workplace e.g. Senior Software Engineer")
    workplace_department = models.CharField(max_length=255, null=False, blank=False,help_text="Department within the workplace e.g. IT, Finance, HR")
    years_of_experience = models.PositiveIntegerField(null=False, blank=False,help_text="Years of professional experience")


    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'role']

    objects = CustomUserManager()

    def clean(self):
        super().clean()

        # ── Email domain validation
        if self.email and self.role:
            required_domain = self.ROLE_EMAIL_DOMAINS.get(self.role)
            if required_domain and not self.email.endswith(required_domain):
                raise ValidationError({
                    'email': (
                        f"Email for '{self.get_role_display()}' must use "
                        f"'{required_domain}'. Got: '{self.email}'"
                    )
                })

        # Student-specific field enforcement
        if self.role == 'STUDENT':
            required_student_fields = {
                'student_id': self.student_id,
                'registration_number': self.registration_number,
                'college': self.college,
                'program': self.program,
                'phone_number': self.phone_number,
            }
            missing = [
                field for field, value in required_student_fields.items()
                if not value
            ]
            if missing:
                raise ValidationError({
                    field: "This field is required for students."
                    for field in missing
                })

        # Academic Supervisor field enforcement
        if self.role == 'ACADEMIC_SUPERVISOR':
            required_academic_fields = {
                'staff_id': self.staff_id,
                'faculty': self.faculty,
                'department': self.department,
                'specialization': self.specialization,
            }
            missing = [
                field for field, value in required_academic_fields.items()
                if not value
            ]
            if missing:
                raise ValidationError({
                    field: "This field is required for academic supervisors."
                    for field in missing
                })

        # Workplace Supervisor field enforcement
        if self.role == 'WORKPLACE_SUPERVISOR':
            required_workplace_fields = {
                'job_title': self.job_title,
                'workplace_department': self.workplace_department,
                'years_of_experience': self.years_of_experience,
            }
            missing = [
                field for field, value in required_workplace_fields.items()
                if not value
            ]
            if missing:
                raise ValidationError({
                    field: "This field is required for workplace supervisors."
                    for field in missing
                })

        # Non-students must NOT have student fields
        # supervisors/admins won't have stray student data
        student_only = ['student_id', 'registration_number', 'college', 'program']
        academic_only = ['staff_id', 'faculty', 'department', 'specialization', 'max_students']
        workplace_only = ['job_title', 'workplace_department', 'years_of_experience']
        role_field_map = {
            'STUDENT': academic_only + workplace_only,
            'ACADEMIC_SUPERVISOR': student_only + workplace_only,
            'WORKPLACE_SUPERVISOR': student_only + academic_only,
            'ADMIN': student_only + academic_only + workplace_only,
        }
        forbidden_fields = role_field_map.get(self.role, [])
        for field in forbidden_fields:
            if getattr(self, field):
                raise ValidationError({
                    field: f"This field is not applicable to '{self.get_role_display()}'."
                })

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        if self.role == 'STUDENT':
            return f"{self.get_full_name()} ({self.registration_number})"
        return f"{self.email} ({self.get_role_display()})"

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
            models.Index(fields=['student_id']),
            models.Index(fields=['registration_number']),
        ]
