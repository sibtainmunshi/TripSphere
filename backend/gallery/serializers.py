from rest_framework import serializers

from travel.serializers import TripOwnedSerializer

from .models import Media

IMAGE_EXTENSIONS = ('.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif')
VIDEO_EXTENSIONS = ('.mp4', '.mov', '.webm', '.avi', '.mkv')


class MediaSerializer(TripOwnedSerializer):
    uploaderId = serializers.UUIDField(source='uploader.id', read_only=True)
    uploaderName = serializers.SerializerMethodField()
    mediaType = serializers.CharField(source='media_type', read_only=True)
    isFavorite = serializers.BooleanField(source='is_favorite', required=False)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Media
        fields = (
            'id', 'trip', 'uploaderId', 'uploaderName', 'file', 'mediaType',
            'caption', 'isFavorite', 'createdAt',
        )
        read_only_fields = ('id', 'uploaderId', 'uploaderName', 'mediaType', 'createdAt')

    def get_uploaderName(self, obj):
        return obj.uploader.name or obj.uploader.email

    def validate_file(self, file):
        name = file.name.lower()
        if not name.endswith(IMAGE_EXTENSIONS + VIDEO_EXTENSIONS):
            raise serializers.ValidationError('Only photo or video files are supported.')
        return file

    def create(self, validated_data):
        request = self.context['request']
        trip = validated_data['trip']
        # Uploader is always resolved from the authenticated user, never
        # client-supplied — the gallery's "Mine" filter depends on this
        # being genuine, the same reasoning chat messages use for `sender`.
        if trip.owner_id == request.user.id:
            uploader = trip.get_or_create_owner_member()
        else:
            uploader = trip.members.get(user=request.user)
        file = validated_data['file']
        media_type = 'video' if file.name.lower().endswith(VIDEO_EXTENSIONS) else 'photo'
        return Media.objects.create(
            trip=trip,
            uploader=uploader,
            file=file,
            media_type=media_type,
            caption=validated_data.get('caption', ''),
        )
