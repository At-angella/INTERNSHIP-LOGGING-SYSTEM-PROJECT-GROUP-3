import os
import sys
import django

# Set up django environment
sys.path.append(r'c:\Users\HP 15S\Desktop\csc\sem 2\internship project\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from core.models import WeeklyLog
from api.serializers import WeeklyLogSerializer
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

User = get_user_model()

print("Users in DB:")
for u in User.objects.all():
    print(f"- {u.email} ({u.role})")

student = User.objects.filter(role='STUDENT').first()
if student:
    print(f"\nTesting for student: {student.email}")
    logs = WeeklyLog.objects.filter(placement__student=student)
    print(f"Found {logs.count()} logs.")
    
    factory = APIRequestFactory()
    request = factory.get('/api/logs/')
    request.user = student
    
    for log in logs:
        try:
            serializer = WeeklyLogSerializer(log, context={'request': request})
            data = serializer.data
            print(f"Log {log.id} serialized successfully.")
        except Exception as e:
            print(f"Error serializing log {log.id}:")
            import traceback
            traceback.print_exc()
else:
    print("No students found in DB.")
