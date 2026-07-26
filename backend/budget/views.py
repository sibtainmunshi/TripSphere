from django.db.models import Q
from django.shortcuts import get_object_or_404

from rest_framework.response import Response

from travel.views import TripScopedViewSet
from workspace.models import Trip

from .models import Budget, Expense, Settlement
from .serializers import BudgetSerializer, ExpenseSerializer, SettlementSerializer
from .services import recompute_settlements


class BudgetViewSet(TripScopedViewSet):
    queryset = Budget.objects.all()
    serializer_class = BudgetSerializer

    def create(self, request, *args, **kwargs):
        # One budget per trip (OneToOneField) — posting again just updates
        # the existing one instead of erroring, so the frontend can always
        # "save" without checking whether a budget already exists first.
        existing = self.get_queryset().filter(trip_id=request.data.get('trip')).first()
        if existing:
            serializer = self.get_serializer(existing, data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        return super().create(request, *args, **kwargs)


class ExpenseViewSet(TripScopedViewSet):
    queryset = Expense.objects.select_related('paid_by').all()
    serializer_class = ExpenseSerializer

    def perform_create(self, serializer):
        expense = serializer.save()
        recompute_settlements(expense.trip)

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
