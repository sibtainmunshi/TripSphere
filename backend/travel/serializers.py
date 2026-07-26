from rest_framework import serializers

from workspace.models import Trip
from .models import RestaurantReservation, StayBooking, TransportBooking, TravelDocument


class TripOwnedSerializer(serializers.ModelSerializer):
    """Shared 'must actually have access to this trip' validation — every
    Travel Hub (and Budget) model is scoped to a single trip, and none of
    these records should be creatable against a trip the requester doesn't
    own or hasn't joined. Reused as-is by the budget app."""

    trip = serializers.PrimaryKeyRelatedField(queryset=Trip.objects.all())

    def validate_trip(self, trip):
        request = self.context.get('request')
        if not request:
            return trip
        has_access = trip.owner_id == request.user.id or trip.members.filter(user=request.user).exists()
        if not has_access:
            raise serializers.ValidationError("You don't have access to this trip.")
        return trip


class StayBookingSerializer(TripOwnedSerializer):
    hotelName = serializers.CharField(source='hotel_name')
    checkIn = serializers.DateField(source='check_in')
    checkOut = serializers.DateField(source='check_out')
    confirmationNumber = serializers.CharField(source='confirmation_number', required=False, allow_blank=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = StayBooking
        fields = ('id', 'trip', 'hotelName', 'checkIn', 'checkOut', 'confirmationNumber', 'notes', 'createdAt')
        read_only_fields = ('id', 'createdAt')


class TransportBookingSerializer(TripOwnedSerializer):
    fromLocation = serializers.CharField(source='from_location')
    toLocation = serializers.CharField(source='to_location')
    departureAt = serializers.DateTimeField(source='departure_at')
    arrivalAt = serializers.DateTimeField(source='arrival_at', required=False, allow_null=True)
    confirmationNumber = serializers.CharField(source='confirmation_number', required=False, allow_blank=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = TransportBooking
        fields = (
            'id', 'trip', 'mode', 'operator', 'fromLocation', 'toLocation',
            'departureAt', 'arrivalAt', 'confirmationNumber', 'notes', 'createdAt',
        )
        read_only_fields = ('id', 'createdAt')


class RestaurantReservationSerializer(TripOwnedSerializer):
    restaurantName = serializers.CharField(source='restaurant_name')
    reservationAt = serializers.DateTimeField(source='reservation_at')
    partySize = serializers.IntegerField(source='party_size', required=False, allow_null=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = RestaurantReservation
        fields = ('id', 'trip', 'restaurantName', 'reservationAt', 'partySize', 'notes', 'createdAt')
        read_only_fields = ('id', 'createdAt')


class TravelDocumentSerializer(TripOwnedSerializer):
    documentType = serializers.ChoiceField(source='document_type', choices=TravelDocument.DOCUMENT_TYPE_CHOICES)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = TravelDocument
        fields = ('id', 'trip', 'title', 'documentType', 'file', 'createdAt')
        read_only_fields = ('id', 'createdAt')
