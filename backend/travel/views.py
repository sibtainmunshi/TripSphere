from rest_framework import permissions, viewsets
from rest_framework.parsers import FormParser, MultiPartParser

from .models import RestaurantReservation, StayBooking, TransportBooking, TravelDocument
from .serializers import (
    RestaurantReservationSerializer,
    StayBookingSerializer,
    TransportBookingSerializer,
    TravelDocumentSerializer,
)


class TripScopedViewSet(viewsets.ModelViewSet):
    """Every Travel Hub record belongs to exactly one trip and is only ever
    visible to that trip's owner — scoped here once rather than repeated
    per model. list() also accepts ?trip=<id> to fetch one trip's records."""

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = self.queryset.filter(trip__owner=self.request.user)
        trip_id = self.request.query_params.get('trip')
        if trip_id:
            queryset = queryset.filter(trip_id=trip_id)
        return queryset


class StayBookingViewSet(TripScopedViewSet):
    queryset = StayBooking.objects.all()
    serializer_class = StayBookingSerializer


class TransportBookingViewSet(TripScopedViewSet):
    queryset = TransportBooking.objects.all()
    serializer_class = TransportBookingSerializer


class RestaurantReservationViewSet(TripScopedViewSet):
    queryset = RestaurantReservation.objects.all()
    serializer_class = RestaurantReservationSerializer


class TravelDocumentViewSet(TripScopedViewSet):
    queryset = TravelDocument.objects.all()
    serializer_class = TravelDocumentSerializer
    parser_classes = [MultiPartParser, FormParser]
