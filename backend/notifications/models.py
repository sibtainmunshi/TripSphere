import uuid

from django.db import models

from workspace.models import Trip, TripMember


class Notification(models.Model):
    NOTIF_TYPE_CHOICES = (
        ('expense_added', 'Expense Added'),
        ('budget_updated', 'Budget Updated'),
        ('photo_uploaded', 'Photo Uploaded'),
        ('member_joined', 'Member Joined'),
        ('settlement_paid', 'Settlement Paid'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='notifications')
    # Who sees this notification — always a member who has actually joined
    # (see services.notify_trip_members), since an invited-but-not-joined
    # member has no account to ever read it through.
    recipient = models.ForeignKey(TripMember, on_delete=models.CASCADE, related_name='notifications')
    notif_type = models.CharField(max_length=20, choices=NOTIF_TYPE_CHOICES)
    message = models.CharField(max_length=300)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.message
