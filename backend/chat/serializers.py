from rest_framework import serializers

from travel.serializers import TripOwnedSerializer

from .models import Message


class MessageSerializer(TripOwnedSerializer):
    senderId = serializers.SerializerMethodField()
    senderName = serializers.SerializerMethodField()
    isSystem = serializers.BooleanField(source='is_system', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Message
        fields = ('id', 'trip', 'senderId', 'senderName', 'isSystem', 'text', 'createdAt')
        read_only_fields = ('id', 'senderId', 'senderName', 'isSystem', 'createdAt')

    def get_senderId(self, obj):
        return obj.sender_id

    def get_senderName(self, obj):
        if obj.sender_id is None:
            return None
        return obj.sender.name or obj.sender.email

    def create(self, validated_data):
        request = self.context['request']
        trip = validated_data['trip']
        # The message is always sent as whichever TripMember row belongs to
        # the authenticated user for this trip — never a client-supplied
        # sender, so nobody can post pretending to be someone else.
        # get_or_create_owner_member covers the owner's row not existing yet
        # (e.g. an older trip whose owner hasn't been backfilled this
        # session); a joined member's row always already exists by the time
        # they can pass TripOwnedSerializer.validate_trip at all.
        if trip.owner_id == request.user.id:
            sender = trip.get_or_create_owner_member()
        else:
            sender = trip.members.get(user=request.user)
        return Message.objects.create(trip=trip, sender=sender, text=validated_data['text'])
