from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.core.exceptions import ValidationError
from django.utils import timezone
from core.models import (
    CustomUser, WeeklyLog, SupervisorReview,
    Evaluation, InternshipPlacement, AuditLog
)

# HELPERS FOR SIGNALS

def _get_actor(instance, field='student'):
    try:
        return getattr(instance, field, None)
    except Exception:
        return None


def _get_old_instance(sender, instance):
    if instance.pk:
        try:
            return sender.objects.get(pk=instance.pk)
        except sender.DoesNotExist:
            return None
    return None

# CUSTOM USER SIGNALS

@receiver(post_save, sender=CustomUser)
def log_user_created(sender, instance, created, **kwargs):
    #Log when a new user is created.
    if created:
        AuditLog.objects.create(
            actor=instance,
            action='USER_CREATED',
            content_type='CustomUser',
            object_id=instance.id,
            new_value={
                'email': instance.email,
                'role': instance.role,
            }
        )

@receiver(pre_save, sender=CustomUser)
def log_user_role_change(sender, instance, **kwargs):
    #Log when a user's role is changed.
    old = _get_old_instance(sender, instance)
    if old and old.role != instance.role:
        AuditLog.objects.create(
            actor=None,
            action='USER_ROLE_CHANGED',
            content_type='CustomUser',
            object_id=instance.id,
            old_value={'role': old.role},
            new_value={'role': instance.role}
        )

