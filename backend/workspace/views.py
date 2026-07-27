from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import validate_email
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from chat.services import post_system_message
from notifications.services import notify_trip_members

from .models import Trip, TripMember
from .serializers import TripMemberSerializer, TripSerializer


class TripViewSet(viewsets.ModelViewSet):
    serializer_class = TripSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Owner sees everything; a joined member sees (and only sees) the
        # trips they've actually joined — real access, not just an email on
        # a members list. distinct() because the Q-join can otherwise
        # duplicate a trip once per matching member row.
        return Trip.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        ).distinct()

    def list(self, request, *args, **kwargs):
        # The frontend only ever reads trip data through this list endpoint
        # (cached in the Zustand trip store), never a per-trip GET — so this
        # is the one place that needs to lazily backfill the owner's
        # TripMember row for trips created before that existed, otherwise
        # budget/expense features would never see the owner as attributable.
        queryset = self.filter_queryset(self.get_queryset())
        for trip in queryset:
            if trip.owner_id == request.user.id:
                trip.get_or_create_owner_member()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='add-member')
    def add_member(self, request, pk=None):
        # Adding people wasn't possible after trip creation at all before —
        # TripSerializer.update() explicitly ignores a members field. Only
        # the owner can invite; a joined member can't invite further people
        # on the owner's behalf.
        trip = self.get_object()
        if trip.owner_id != request.user.id:
            return Response({'detail': 'Only the trip owner can invite members.'}, status=status.HTTP_403_FORBIDDEN)

        email = (request.data.get('email') or '').strip().lower()
        name = (request.data.get('name') or '').strip()
        try:
            validate_email(email)
        except DjangoValidationError:
            return Response({'email': ['Enter a valid email address.']}, status=status.HTTP_400_BAD_REQUEST)
        if trip.members.filter(email__iexact=email).exists():
            return Response({'email': ['This person is already on the trip.']}, status=status.HTTP_400_BAD_REQUEST)

        member = TripMember.objects.create(trip=trip, email=email, name=name)
        return Response(
            TripMemberSerializer(member, context={'request': request}).data, status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'], url_path='remove-member')
    def remove_member(self, request, pk=None):
        trip = self.get_object()
        if trip.owner_id != request.user.id:
            return Response({'detail': 'Only the trip owner can remove members.'}, status=status.HTTP_403_FORBIDDEN)

        member = get_object_or_404(TripMember, id=request.data.get('memberId'), trip=trip)
        if member.status == 'owner':
            return Response({'detail': "Can't remove the trip owner."}, status=status.HTTP_400_BAD_REQUEST)
        member.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class JoinPreviewView(APIView):
    """Public — lets someone see what they're being invited to before they
    sign up/log in, without exposing anything beyond the basics (no budget,
    no other members, nothing sensitive)."""

    permission_classes = [permissions.AllowAny]

    def get(self, request, token):
        member = get_object_or_404(TripMember, invite_token=token)
        trip = member.trip
        return Response(
            {
                'tripName': trip.name,
                'destination': trip.destination,
                'startDate': trip.start_date,
                'endDate': trip.end_date,
                'invitedName': member.name,
                'alreadyJoined': member.user_id is not None,
            }
        )


class JoinTripView(APIView):
    """Links the authenticated user's real account to this invite's
    TripMember row — this is the one moment real trip access gets granted.
    Anyone holding the token can join with whichever account they're logged
    in as; the token itself is the capability, not an exact email match —
    matches how most real invite links work (someone invited at a work
    email should still be able to join with their personal account)."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, token):
        member = get_object_or_404(TripMember, invite_token=token)
        member.user = request.user
        member.status = 'joined'
        member.save(update_fields=['user', 'status'])
        member_name = member.name or member.email
        message = f'{member_name} joined the trip'
        notify_trip_members(member.trip, member.id, 'member_joined', message)
        post_system_message(member.trip, message)
        return Response(TripSerializer(member.trip, context={'request': request}).data)
