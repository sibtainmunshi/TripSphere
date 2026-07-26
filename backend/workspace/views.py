from rest_framework import permissions, viewsets
from rest_framework.response import Response

from .models import Trip
from .serializers import TripSerializer


class TripViewSet(viewsets.ModelViewSet):
    serializer_class = TripSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Trip.objects.filter(owner=self.request.user)

    def list(self, request, *args, **kwargs):
        # The frontend only ever reads trip data through this list endpoint
        # (cached in the Zustand trip store), never a per-trip GET — so this
        # is the one place that needs to lazily backfill the owner's
        # TripMember row for trips created before that existed, otherwise
        # budget/expense features would never see the owner as attributable.
        queryset = self.filter_queryset(self.get_queryset())
        for trip in queryset:
            trip.get_or_create_owner_member()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
