from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    """Scoped to whichever TripMember row(s) belong to the requester — a
    notification is only ever visible to the person it was actually created
    for, never anyone else on the trip. No create/delete through the API;
    notifications are only ever generated server-side (see
    notifications/services.py) from real events elsewhere in the app."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationSerializer
    http_method_names = ['get', 'patch', 'post', 'head', 'options']

    def get_queryset(self):
        queryset = Notification.objects.filter(recipient__user=self.request.user)
        trip_id = self.request.query_params.get('trip')
        if trip_id:
            queryset = queryset.filter(trip_id=trip_id)
        return queryset

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        queryset = self.get_queryset().filter(is_read=False)
        trip_id = request.data.get('trip')
        if trip_id:
            queryset = queryset.filter(trip_id=trip_id)
        queryset.update(is_read=True)
        return Response(status=204)
