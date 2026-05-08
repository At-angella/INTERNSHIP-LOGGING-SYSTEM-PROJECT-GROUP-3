from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta
import secrets
import string

# Create your models here.

# USER MANAGEMENT MODELS

class CustomUserManager(BaseUserManager):\1

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
    staff_id = models.CharField(max_length=20, unique=True, null=True, blank=True, help_text="University staff ID e.g. STF/2024/001")
    faculty = models.CharField(max_length=255, null=True, blank=True, help_text="Faculty/College the supervisor belongs to")
    department = models.CharField(max_length=255, null=True, blank=True, help_text="Official department within the university e.g. Computer Science, Electrical Engineering")
    specialization = models.CharField(max_length=255, null=True, blank=True, help_text="Area of specialization e.g. Software Engineering, Data Science")
    max_students = models.PositiveIntegerField(null=True, blank=True, default=0, help_text="Maximum number of interns this supervisor can handle at once")

    # Workplace Supervisor fields 
    job_title = models.CharField(max_length=255, null=True, blank=True, help_text="Supervisor's position at the workplace e.g. Senior Software Engineer")
    workplace_department = models.CharField(max_length=255, null=True, blank=True,help_text="Department within the workplace e.g. IT, Finance, HR")
    years_of_experience = models.PositiveIntegerField(null=True, blank=True,help_text="Years of professional experience")


    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

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
            value = getattr(self, field, None)
            if value is not None and value != '' and value != 0:
                raise ValidationError({
                    field: f"This field is not applicable to '{self.get_role_display()}'."
                })

    def save(self, *args, **kwargs):
        if not self.is_superuser:
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
            # ── Shared ───────────────────────────────────────────────
            models.Index(fields=['email']),
            models.Index(fields=['role']),
            models.Index(fields=['phone_number']),

            # ── Student ──────────────────────────────────────────────
            models.Index(fields=['student_id']),
            models.Index(fields=['registration_number']),
            models.Index(fields=['college']),
            models.Index(fields=['program']),

            # ── Academic Supervisor ──────────────────────────────────
            models.Index(fields=['staff_id']),
            models.Index(fields=['faculty']),
            models.Index(fields=['specialization']),
            models.Index(fields=['max_students']),

            # ── Workplace Supervisor ─────────────────────────────────
            models.Index(fields=['workplace_department']),
            models.Index(fields=['years_of_experience']),

            # ── Composite indexes (multi-field queries) ───────────────
            models.Index(fields=['role', 'faculty'],          name='idx_role_faculty'),
            models.Index(fields=['role', 'specialization'],   name='idx_role_specialization'),
            models.Index(fields=['role', 'max_students'],     name='idx_role_max_students'),
            models.Index(fields=['role', 'workplace_department'], name='idx_role_workplace_dept'),
        ]

# ACADEMIC DEPARTMENT MODEL

class AcademicDepartment(models.Model):
    name = models.CharField(max_length=255, unique=True, null=False, blank=False, help_text="Name of the academic department e.g. Computer Science")
    faculty = models.CharField(max_length=255, null=False, blank=False, help_text="Faculty/College the department belongs to e.g. CoCIS")
    head = models.OneToOneField(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name='department_head',
        limit_choices_to={'role': 'ACADEMIC_SUPERVISOR'}
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.faculty})"

    class Meta:
        verbose_name = "Academic Department"
        verbose_name_plural = "Academic Departments"
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['faculty']),
            models.Index(fields=['name', 'faculty'], name='idx_name_faculty'),
        ]

# INTERN WORKPLACE MODEL

class Workplace(models.Model):
    name = models.CharField(max_length=255, unique=True, null=False, blank=False, help_text="Name of the workplace e.g. XYZ Corporation")
    location = models.CharField(max_length=255, null=False, blank=False, help_text="Physical location of the workplace e.g. Kampala, Uganda")
    industry = models.CharField(max_length=255, null=False, blank=False, help_text="Industry sector e.g. Information Technology")
    contact_email = models.EmailField(null=False, blank=False, help_text="Contact email for internship coordination at the workplace")
    contact_phone = models.CharField(max_length=10, null=False, blank=False, help_text="Contact phone number for internship coordination at the workplace")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.location})"

    class Meta:
        verbose_name = "Intern Workpace"
        verbose_name_plural = "Intern Workplaces"
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['location']),
            models.Index(fields=['industry']),
        ]

# INTERNSHIP PLACEMENT MODEL

class InternshipPlacement(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
        ('REJECTED', 'Rejected'),
        ('CANCELLED', 'Cancelled'),
    ]

    student = models.ForeignKey(
        CustomUser,
        on_delete=models.PROTECT,
        related_name='internship_placements',
        limit_choices_to={'role': 'STUDENT'}
    )
    workplace = models.ForeignKey(
        Workplace,
        on_delete=models.PROTECT,
        related_name='internship_placements'
    )
    academic_supervisor = models.ForeignKey(
        CustomUser,
        on_delete=models.PROTECT,
        related_name='supervised_placements',
        limit_choices_to={'role': 'ACADEMIC_SUPERVISOR'}
    )
    workplace_supervisor = models.ForeignKey(
        CustomUser,
        on_delete=models.PROTECT,
        related_name='workplace_supervised_placements',
        limit_choices_to={'role': 'WORKPLACE_SUPERVISOR'}
    )
    academic_department = models.ForeignKey(
        AcademicDepartment,
        on_delete=models.PROTECT,
        related_name='placements'
    )
    
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='PENDING')
    
    position_title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_placements',
        limit_choices_to={'role': 'ADMIN'}
    )

    def clean(self):
        """Validate placement dates and avoid overlaps."""
        if self.start_date >= self.end_date:
            raise ValidationError("End date must be after start date.")
        
        # Check for overlapping placements for the same student
        overlapping = InternshipPlacement.objects.filter(
            student=self.student,
            status__in=['APPROVED', 'ACTIVE', 'COMPLETED']
        ).exclude(pk=self.pk).filter(
            start_date__lte=self.end_date,
            end_date__gte=self.start_date
        )
        
        if overlapping.exists():
            raise ValidationError(
                "Student already has an overlapping internship placement."
            )

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student.email} at {self.workplace.name}"

    class Meta:
        verbose_name_plural = "Internship Placements"
        indexes = [
            models.Index(fields=['student', 'status']),
            models.Index(fields=['start_date', 'end_date']),
            models.Index(fields=['status']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['student', 'workplace', 'start_date', 'end_date'],
                name='unique_student_workplace_period'
            )
        ]

# WEEKLY LOGBOOK MODEL

class WeeklyLog(models.Model):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SUBMITTED', 'Submitted for Review'),
        ('REVIEWED', 'Under Review'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('REVISE', 'Revision Required'),
    ]

    placement = models.ForeignKey(
        InternshipPlacement,
        on_delete=models.CASCADE,
        related_name='weekly_logs'
    )
    
    week_number = models.IntegerField()
    week_start_date = models.DateField()
    week_end_date = models.DateField()
    
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='DRAFT')
    
    # Log content
    activities_performed = models.TextField()
    skills_acquired = models.TextField()
    challenges_faced = models.TextField(blank=False)
    lessons_learned = models.TextField(blank=False)
    hours_worked = models.FloatField(default=0, help_text="Total hours worked in the week")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=False)
    reviewed_at = models.DateTimeField(null=True, blank=False)
    approved_at = models.DateTimeField(null=True, blank=False)

    def clean(self):
        """Validate week dates overlap with placement period."""
        if not (self.placement.start_date <= self.week_start_date and 
                self.week_end_date <= self.placement.end_date):
            raise ValidationError(
                "Week dates must fall within internship placement period."
            )

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Week {self.week_number} - {self.placement.student.email}"

    class Meta:
        verbose_name_plural = "Weekly Logs"
        ordering = ['-week_number']
        indexes = [
            models.Index(fields=['placement', 'week_number']),
            models.Index(fields=['status']),
            models.Index(fields=['submitted_at']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['placement', 'week_number'],
                name='unique_placement_week'
            )
        ]

# SUPERVISOR REVIEW MODEL

class SupervisorReview(models.Model):
    RATING_CHOICES = [
        (1, 'Poor'),
        (2, 'Below Average'),
        (3, 'Average'),
        (4, 'Good'),
        (5, 'Excellent'),
    ]

    log = models.OneToOneField(
        WeeklyLog,
        on_delete=models.CASCADE,
        related_name='supervisor_review'
    )
    reviewer = models.ForeignKey(
        CustomUser,
        on_delete=models.PROTECT,
        related_name='supervisor_reviews',
        limit_choices_to={'role': 'WORKPLACE_SUPERVISOR'}
    )
    
    performance_rating = models.IntegerField(choices=RATING_CHOICES)
    attendance_rating = models.IntegerField(choices=RATING_CHOICES)
    attitude_rating = models.IntegerField(choices=RATING_CHOICES)
    
    comments = models.TextField()
    recommendations = models.TextField(blank=True)
    
    # Approval workflow
    approval_status = models.CharField(
        max_length=15,
        choices=[
            ('APPROVED', 'Approved'),
            ('REJECTED', 'Rejected'),
            ('PENDING', 'Pending'),
        ],
        default='PENDING'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Review of Week {self.log.week_number} by {self.reviewer.email}"

    class Meta:
        verbose_name_plural = "Supervisor Reviews"
        indexes = [
            models.Index(fields=['approval_status']),
        ]

# EVALUATION CRITERIA MODEL

class EvaluationCriteria(models.Model):
    CATEGORY_CHOICES = [
        ('TECHNICAL', 'Technical Skills'),
        ('SOFT_SKILLS', 'Soft Skills'),
        ('ATTENDANCE', 'Attendance'),
        ('CONDUCT', 'Professional Conduct'),
    ]

    department = models.ForeignKey(
        AcademicDepartment,
        on_delete=models.CASCADE,
        related_name='evaluation_criteria'
    )
    
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.TextField()
    weight = models.FloatField(
        help_text="Weight in percentage (e.g., 40, 30, 30)"
    )
    max_score = models.FloatField(default=100)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.weight}%)"

    def clean(self):
        """Validate weight doesn't exceed 100%."""
        total_weight = self.department.evaluation_criteria.filter(
            is_active=True
        ).exclude(pk=self.pk).aggregate(
            total=models.Sum('weight')
        )['total'] or 0
        
        if total_weight + self.weight > 100:
            raise ValidationError(
                f"Total weight would exceed 100% (current: {total_weight}%)"
            )

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    class Meta:
        verbose_name_plural = "Evaluation Criteria"
        ordering = ['category', 'name']
        indexes = [
            models.Index(fields=['department', 'is_active']),
        ]

# EVALUATION MODEL

class Evaluation(models.Model):
    placement = models.OneToOneField(
        InternshipPlacement,
        on_delete=models.CASCADE,
        related_name='evaluation'
    )
    evaluator = models.ForeignKey(
        CustomUser,
        on_delete=models.PROTECT,
        related_name='evaluations',
        limit_choices_to={'role': 'ACADEMIC_SUPERVISOR'}
    )
    
    # Scores for each criteria
    technical_score = models.FloatField(null=True, blank=True)
    soft_skills_score = models.FloatField(null=True, blank=True)
    attendance_score = models.FloatField(null=True, blank=True)
    conduct_score = models.FloatField(null=True, blank=True)
    
    # Calculated weighted score
    total_weighted_score = models.FloatField(null=True, blank=True)
    final_grade = models.CharField(max_length=2, null=True, blank=True)  # A, B, C, etc.
    
    # Comments
    summary_comments = models.TextField(blank=True)
    recommendation = models.TextField(blank=True)
    
    # Status
    is_submitted = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=False)

    def calculate_total_score(self):
        """
        Calculate weighted total score based on active criteria weights.
        Formula: (Technical × 0.4) + (SoftSkills × 0.3) + (Attendance × 0.3)
        """
        criteria = self.placement.department.evaluation_criteria.filter(is_active=True)
        
        total = 0
        for criterion in criteria:
            category = criterion.category
            score = None
            
            if category == 'TECHNICAL':
                score = self.technical_score
            elif category == 'SOFT_SKILLS':
                score = self.soft_skills_score
            elif category == 'ATTENDANCE':
                score = self.attendance_score
            elif category == 'CONDUCT':
                score = self.conduct_score
            
            if score is not None:
                weight = criterion.weight / 100
                total += score * weight
        
        return round(total, 2)

    def determine_grade(self):
        """Convert numeric score to letter grade."""
        if self.total_weighted_score is None:
            return None
        
        score = self.total_weighted_score
        if score >= 90:
            return 'A'
        elif score >= 80:
            return 'B'
        elif score >= 70:
            return 'C'
        elif score >= 60:
            return 'D'
        else:
            return 'F'

    def save(self, *args, **kwargs):
        """Auto-calculate total score and grade on save."""
        self.total_weighted_score = self.calculate_total_score()
        self.final_grade = self.determine_grade()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Evaluation of {self.placement.student.email}"

    class Meta:
        indexes = [
            models.Index(fields=['placement']),
            models.Index(fields=['is_submitted']),
        ]

# AUDIT LOG MODEL

class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('LOG_CREATED', 'Weekly Log Created'),
        ('LOG_SUBMITTED', 'Weekly Log Submitted'),
        ('LOG_REVIEWED', 'Weekly Log Reviewed'),
        ('LOG_APPROVED', 'Weekly Log Approved'),
        ('LOG_REJECTED', 'Weekly Log Rejected'),
        ('REVIEW_COMPLETED', 'Supervisor Review Completed'),
        ('EVALUATION_CREATED', 'Evaluation Created'),
        ('EVALUATION_SUBMITTED', 'Evaluation Submitted'),
        ('PLACEMENT_APPROVED', 'Placement Approved'),
        ('PLACEMENT_REJECTED', 'Placement Rejected'),
        ('USER_CREATED', 'User Created'),
        ('USER_ROLE_CHANGED', 'User Role Changed'),
    ]

    actor = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name='audit_logs'
    )
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    
    content_type = models.CharField(max_length=50, help_text="e.g., 'WeeklyLog', 'Evaluation'")
    object_id = models.IntegerField()
    
    old_value = models.JSONField(null=True, blank=True)
    new_value = models.JSONField(null=True, blank=True)
    
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action} by {self.actor} at {self.timestamp}"

    class Meta:
        verbose_name_plural = "Audit Logs"
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['actor', 'timestamp']),
            models.Index(fields=['action']),
            models.Index(fields=['timestamp']),
        ]
