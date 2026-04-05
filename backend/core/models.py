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
    ROLE_CHOICES = [
        ('ADMIN', 'Admin'),
        ('STUDENT', 'Student'),
        ('ACADEMIC_SUPERVISOR', 'Academic Supervisor'),
        ('WORKPLACE_SUPERVISOR', 'Workplace Supervisor'),
    ]

    username = None  # Remove the username field
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    must_change_password = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['role']

    objects = CustomUserManager()

    def __str__(self):
        return f"{self.email} ({self.role})"
