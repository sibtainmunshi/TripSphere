from .models import Notification


def notify_trip_members(trip, exclude_member_id, notif_type, message):
    """Create one Notification per trip member who's actually joined, except
    the one who caused the event — nobody needs to be told about their own
    action. Invited-but-not-joined members are skipped since they have no
    account yet to read a notification through."""
    recipients = trip.members.exclude(id=exclude_member_id).filter(user__isnull=False)
    Notification.objects.bulk_create(
        [
            Notification(trip=trip, recipient=member, notif_type=notif_type, message=message)
            for member in recipients
        ]
    )


def notify_member(trip, recipient, notif_type, message):
    """Single-recipient version — for events with exactly one addressee,
    like a settlement being marked paid."""
    if recipient.user_id is None:
        return None
    return Notification.objects.create(trip=trip, recipient=recipient, notif_type=notif_type, message=message)
