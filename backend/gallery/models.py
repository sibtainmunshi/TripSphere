import uuid

from django.db import models

from workspace.models import Trip, TripMember


def media_upload_path(instance, filename):
    return f'gallery/{instance.trip_id}/{filename}'


class Media(models.Model):
    MEDIA_TYPE_CHOICES = (
        ('photo', 'Photo'),
        ('video', 'Video'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='media_items')
    uploader = models.ForeignKey(TripMember, on_delete=models.CASCADE, related_name='uploaded_media')
    file = models.FileField(upload_to=media_upload_path)
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPE_CHOICES, default='photo')
    caption = models.CharField(max_length=300, blank=True)
    is_favorite = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.media_type} for {self.trip.name}'
