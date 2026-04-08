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

# WEEKLY LOG SIGNALS
# Maps log status to the correct audit action
LOG_STATUS_ACTION_MAP = {
    'SUBMITTED': 'LOG_SUBMITTED',
    'REVIEWED':  'LOG_REVIEWED',
    'APPROVED':  'LOG_APPROVED',
    'REJECTED':  'LOG_REJECTED',
}

@receiver(pre_save, sender=WeeklyLog)
def validate_log_state_transition(sender, instance, **kwargs):
    old = _get_old_instance(sender, instance)
    if not old:
        return

    old_status = old.status
    new_status = instance.status

    if old_status == new_status:
        return

    valid_transitions = {
        'DRAFT':     ['SUBMITTED'],
        'SUBMITTED': ['REVIEWED', 'REVISE'],
        'REVIEWED':  ['APPROVED', 'REJECTED'],
        'REVISE':    ['SUBMITTED'],
        'APPROVED':  [],
        'REJECTED':  ['REVISE'],
    }

    if new_status not in valid_transitions.get(old_status, []):
        raise ValidationError(
            f"Invalid state transition: '{old_status}' → '{new_status}'. "
            f"Allowed transitions from '{old_status}': "
            f"{valid_transitions.get(old_status, []) or 'none (terminal state)'}."
        )


@receiver(post_save, sender=WeeklyLog)
def log_weekly_log_changes(sender, instance, created, **kwargs):
    if created:
        AuditLog.objects.create(
            actor=instance.placement.student,
            action='LOG_CREATED',
            content_type='WeeklyLog',
            object_id=instance.id,
            old_value=None,
            new_value={
                'week_number': instance.week_number,
                'status': instance.status,
                'placement_id': instance.placement.id,
            }
        )
        return

    # Only log if status actually changed
    action = LOG_STATUS_ACTION_MAP.get(instance.status)
    if not action:
        return

    # Determine the actor based on who acts at each stage
    actor_map = {
        'LOG_SUBMITTED': instance.placement.student,
        'LOG_REVIEWED':  instance.placement.workplace_supervisor,
        'LOG_APPROVED':  instance.placement.academic_supervisor,
        'LOG_REJECTED':  instance.placement.academic_supervisor,
    }

    AuditLog.objects.create(
        actor=actor_map.get(action),
        action=action,
        content_type='WeeklyLog',
        object_id=instance.id,
        old_value={'status': instance.tracker.previous('status') if hasattr(instance, 'tracker') else None},
        new_value={
            'status': instance.status,
            'week_number': instance.week_number,
        }
    )

    # Auto-update timestamps based on status
    updates = {}
    if instance.status == 'SUBMITTED' and not instance.submitted_at:
        updates['submitted_at'] = timezone.now()
    elif instance.status == 'REVIEWED' and not instance.reviewed_at:
        updates['reviewed_at'] = timezone.now()
    elif instance.status == 'APPROVED' and not instance.approved_at:
        updates['approved_at'] = timezone.now()

    if updates:
        # update() to avoid triggering this signal again recursively
        WeeklyLog.objects.filter(pk=instance.pk).update(**updates)