from rest_framework import serializers

from travel.serializers import TripOwnedSerializer
from workspace.models import TripMember

from .models import Budget, Expense, Settlement


class BudgetSerializer(TripOwnedSerializer):
    totalBudget = serializers.DecimalField(source='total_budget', max_digits=12, decimal_places=2)
    categoryBudgets = serializers.JSONField(source='category_budgets', required=False)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)

    class Meta:
        model = Budget
        fields = ('id', 'trip', 'totalBudget', 'categoryBudgets', 'createdAt', 'updatedAt')
        read_only_fields = ('id', 'createdAt', 'updatedAt')


class ExpenseSerializer(TripOwnedSerializer):
    paidBy = serializers.PrimaryKeyRelatedField(source='paid_by', queryset=TripMember.objects.all())
    paidByName = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Expense
        fields = ('id', 'trip', 'paidBy', 'paidByName', 'amount', 'category', 'description', 'date', 'createdAt')
        read_only_fields = ('id', 'paidByName', 'createdAt')

    def get_paidByName(self, obj):
        return obj.paid_by.name or obj.paid_by.email

    def validate(self, attrs):
        trip = attrs.get('trip') or getattr(self.instance, 'trip', None)
        paid_by = attrs.get('paid_by') or getattr(self.instance, 'paid_by', None)
        if trip and paid_by and paid_by.trip_id != trip.id:
            raise serializers.ValidationError({'paidBy': "This member doesn't belong to this trip."})
        return attrs


class SettlementSerializer(serializers.ModelSerializer):
    """Read-mostly — settlements are computed from expenses (see
    budget/services.py), never hand-created. The only writable field is
    status, for the "mark as paid" toggle."""

    fromMemberId = serializers.UUIDField(source='from_member.id', read_only=True)
    fromMemberName = serializers.SerializerMethodField()
    toMemberId = serializers.UUIDField(source='to_member.id', read_only=True)
    toMemberName = serializers.SerializerMethodField()
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)

    class Meta:
        model = Settlement
        fields = (
            'id', 'trip', 'fromMemberId', 'fromMemberName', 'toMemberId', 'toMemberName',
            'amount', 'status', 'updatedAt',
        )
        read_only_fields = ('id', 'trip', 'fromMemberId', 'fromMemberName', 'toMemberId', 'toMemberName', 'amount', 'updatedAt')

    def get_fromMemberName(self, obj):
        return obj.from_member.name or obj.from_member.email

    def get_toMemberName(self, obj):
        return obj.to_member.name or obj.to_member.email
