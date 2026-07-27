from django.db.models import Q
from django.shortcuts import get_object_or_404

from rest_framework.response import Response

from notifications.services import notify_member, notify_trip_members
from travel.views import TripScopedViewSet
from workspace.models import Trip

from .models import Budget, Expense, Settlement
from .serializers import BudgetSerializer, ExpenseSerializer, SettlementSerializer
from .services import recompute_settlements


def _resolve_actor_member(trip, request):
    if trip.owner_id == request.user.id:
        return trip.get_or_create_owner_member()
    return trip.members.get(user=request.user)


class BudgetViewSet(TripScopedViewSet):
    queryset = Budget.objects.all()
    serializer_class = BudgetSerializer

    def create(self, request, *args, **kwargs):
        # One budget per trip (OneToOneField) — posting again just updates
        # the existing one instead of erroring, so the frontend can always
        # "save" without checking whether a budget already exists first.
        trip = get_object_or_404(Trip, id=request.data.get('trip'))
        existing = self.get_queryset().filter(trip_id=trip.id).first()
        if existing:
            serializer = self.get_serializer(existing, data=request.data)
            serializer.is_valid(raise_exception=True)
            budget = serializer.save()
            response = Response(serializer.data)
        else:
            response = super().create(request, *args, **kwargs)
            budget = Budget.objects.get(id=response.data['id'])

        actor = _resolve_actor_member(trip, request)
        notify_trip_members(
            trip, actor.id, 'budget_updated',
            f'{actor.name or actor.email} set the budget to ₹{budget.total_budget:,.0f}',
        )
        return response


class ExpenseViewSet(TripScopedViewSet):
    queryset = Expense.objects.select_related('paid_by').all()
    serializer_class = ExpenseSerializer

    def perform_create(self, serializer):
        expense = serializer.save()
        recompute_settlements(expense.trip)
        payer_name = expense.paid_by.name or expense.paid_by.email
        label = expense.description or expense.category
        notify_trip_members(
            expense.trip, expense.paid_by_id, 'expense_added',
            f'{payer_name} added an expense: ₹{expense.amount:,.0f} for {label}',
        )

    def perform_update(self, serializer):
        expense = serializer.save()
        recompute_settlements(expense.trip)

    def perform_destroy(self, instance):
        trip = instance.trip
        instance.delete()
        recompute_settlements(trip)


class SettlementViewSet(TripScopedViewSet):
    """Read-only except for the status toggle — settlement rows are always
    derived from real expense data (see budget/services.py), never
    hand-created or hand-deleted through this API. amount/members are
    read_only on the serializer, so a PATCH can only ever change status."""

    queryset = Settlement.objects.select_related('from_member', 'to_member').all()
    serializer_class = SettlementSerializer
    http_method_names = ['get', 'patch', 'head', 'options']

    def list(self, request, *args, **kwargs):
        trip_id = request.query_params.get('trip')
        if trip_id:
            trip = get_object_or_404(
                Trip.objects.filter(Q(owner=request.user) | Q(members__user=request.user)).distinct(),
                id=trip_id,
            )
            recompute_settlements(trip)
        return super().list(request, *args, **kwargs)

    def perform_update(self, serializer):
        was_paid = serializer.instance.status == 'paid'
        settlement = serializer.save()
        if settlement.status == 'paid' and not was_paid:
            # Either side can be the one who actually clicks "mark paid" —
            # notify whichever end of the settlement ISN'T the actor, never
            # the actor themselves.
            if settlement.from_member.user_id == self.request.user.id:
                actor, recipient = settlement.from_member, settlement.to_member
            else:
                actor, recipient = settlement.to_member, settlement.from_member
            notify_member(
                settlement.trip, recipient, 'settlement_paid',
                f'{actor.name or actor.email} marked ₹{settlement.amount:,.0f} as paid',
            )
