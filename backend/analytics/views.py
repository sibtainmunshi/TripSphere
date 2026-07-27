from django.db.models import Q
from django.shortcuts import get_object_or_404

from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from workspace.models import Trip

from .services import build_trip_analytics


class AnalyticsSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        trip_id = request.query_params.get('trip')
        trip = get_object_or_404(
            Trip.objects.filter(Q(owner=request.user) | Q(members__user=request.user)).distinct(),
            id=trip_id,
        )
        return Response(build_trip_analytics(trip))
