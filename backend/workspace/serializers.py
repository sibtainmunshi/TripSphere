from rest_framework import serializers

from .models import Trip, TripMember


class TripMemberSerializer(serializers.ModelSerializer):
    joined = serializers.SerializerMethodField()
    inviteToken = serializers.SerializerMethodField()

    class Meta:
        model = TripMember
        fields = ('id', 'email', 'name', 'status', 'joined', 'inviteToken')
        read_only_fields = ('id', 'status', 'joined', 'inviteToken')

    def get_joined(self, obj):
        return obj.user_id is not None

    def get_inviteToken(self, obj):
        # Only the trip owner can see (and therefore share) another member's
        # invite token — a joined member seeing a pending member's token
        # could pass it along to someone the owner never actually invited.
        request = self.context.get('request')
        if request and request.user.is_authenticated and obj.trip.owner_id == request.user.id:
            return str(obj.invite_token)
        return None


class TripSerializer(serializers.ModelSerializer):
    members = TripMemberSerializer(many=True, required=False)
    memberCount = serializers.IntegerField(source='member_count', required=False, default=1)
    startDate = serializers.DateField(source='start_date')
    endDate = serializers.DateField(source='end_date')
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    tripType = serializers.CharField(source='trip_type', required=False, allow_blank=True)
    coverImageUrl = serializers.URLField(source='cover_image_url', required=False, allow_blank=True)
    inviteLink = serializers.URLField(source='invite_link', required=False, allow_blank=True)

    class Meta:
        model = Trip
        fields = (
            'id', 'name', 'destination', 'startDate', 'endDate', 'createdAt',
            'archived', 'lat', 'lon', 'memberCount', 'coverImageUrl',
            'tripType', 'description', 'budget', 'members', 'inviteLink',
        )
        read_only_fields = ('id', 'createdAt')

    def validate(self, attrs):
        start_date = attrs.get('start_date', getattr(self.instance, 'start_date', None))
        end_date = attrs.get('end_date', getattr(self.instance, 'end_date', None))
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({'endDate': 'End date cannot be before the start date.'})

        budget = attrs.get('budget')
        if budget is not None and budget < 0:
            raise serializers.ValidationError({'budget': 'Budget cannot be negative.'})

        members_data = attrs.get('members')
        if members_data:
            request = self.context.get('request')
            seen_emails = set()
            if request and request.user.is_authenticated:
                seen_emails.add(request.user.email.lower())
            for member in members_data:
                email = (member.get('email') or '').lower()
                if not email:
                    continue
                if email in seen_emails:
                    raise serializers.ValidationError({'members': f'"{member.get("email")}" is already a member of this trip.'})
                seen_emails.add(email)

        return attrs

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        # Report whichever is larger: the stated headcount hint, or the
        # actually-named members (which now always includes the owner's own
        # row — see Trip.get_or_create_owner_member) — never under-report
        # either path.
        rep['memberCount'] = max(instance.member_count, instance.members.count())
        return rep

    def create(self, validated_data):
        members_data = validated_data.pop('members', [])
        trip = Trip.objects.create(owner=self.context['request'].user, **validated_data)
        # Every trip member — including the owner — is a real TripMember row,
        # so budget/expense features can attribute things to anyone in the
        # trip uniformly rather than treating the owner as a special case.
        trip.get_or_create_owner_member()
        for member_data in members_data:
            TripMember.objects.create(trip=trip, **member_data)
        return trip

    def update(self, instance, validated_data):
        validated_data.pop('members', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
