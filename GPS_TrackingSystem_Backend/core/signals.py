"""
Signal handlers for core app - handles admin creation tracking
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, AdminCreationRequest
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=User)
def track_admin_creation(sender, instance, created, **kwargs):
    """
    When an admin user is created, track it in AdminCreationRequest
    so the dev panel can be notified.
    """
    if created and instance.role == 'admin':
        try:
            # Create a tracking record for this admin creation
            AdminCreationRequest.objects.create(
                user=instance,
                name=instance.name,
                email=instance.email,
                registration_id=instance.registration_id,
                is_notified=False
            )
            logger.info(f"Admin creation tracked: {instance.email}")
        except Exception as e:
            logger.error(f"Failed to track admin creation: {str(e)}")
