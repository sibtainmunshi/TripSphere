import uuid

from django.db import models

from workspace.models import Trip, TripMember


class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='messages')
    # Null only for system messages (see services.post_system_message) —
    # a real user message always has a real sender, never fabricated.
    sender = models.ForeignKey(
        TripMember, on_delete=models.CASCADE, related_name='sent_messages', null=True, blank=True,
    )
    is_system = models.BooleanField(default=False)
    text = models.CharField(max_length=2000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'{self.sender_id}: {self.text[:30]}'
