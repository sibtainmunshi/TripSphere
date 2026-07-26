import uuid

from django.conf import settings
from django.db import models


class Trip(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='trips')
    name = models.CharField(max_length=200)
    destination = models.CharField(max_length=200)
    start_date = models.DateField()
    end_date = models.DateField()
    # A plain headcount hint — the AI planner only ever knows "4 travelers",
    # never their identities, so it can't populate real TripMember rows.
    # The serializer reports whichever is larger: this hint or the number of
    # actually-named members, so neither path under-reports the real count.
    member_count = models.PositiveIntegerField(default=1)
    trip_type = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    budget = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    lat = models.FloatField(null=True, blank=True)
    lon = models.FloatField(null=True, blank=True)
    cover_image_url = models.URLField(blank=True)
    invite_link = models.URLField(blank=True)
    archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def get_or_create_owner_member(self):
        """Expenses/settlements attribute every trip member — including the
        owner — to a real TripMember row. The owner never gets one created
        automatically today (TripSerializer.create() only makes rows for
        invited members), so this lazily creates it on first use — covers
        trips created before this existed too, no data migration needed."""
        member, _ = self.members.get_or_create(
            email=self.owner.email,
            defaults={'name': self.owner.name or self.owner.email, 'status': 'owner'},
        )
        return member


class TripMember(models.Model):
    STATUS_CHOICES = (
        ('invited', 'Invited'),
        ('owner', 'Owner'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='members')
    email = models.EmailField()
    name = models.CharField(max_length=150, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='invited')

    def __str__(self):
        return self.email
