import os
import django
import sys

# Setup django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import CustomUser

print(f"Total Users in database: {CustomUser.objects.count()}")
for user in CustomUser.objects.all():
    print(f"ID: {user.id} | Email: {user.email} | Name: {user.get_full_name()} | Role: {user.role} | Active: {user.is_active}")
