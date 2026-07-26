from decimal import Decimal

from django.db.models import Sum

from .models import Expense, Settlement

TWO_PLACES = Decimal('0.01')


def compute_net_balances(trip):
    """Positive net = this member is owed money; negative = they owe money.
    Every trip member (including the owner, via get_or_create_owner_member)
    is treated as an equal participant — matches 2.md's own example ("Ahmed
    paid ₹2,000, 4 Members, Each member owes ₹500")."""
    trip.get_or_create_owner_member()
    members = list(trip.members.all())
    if not members:
        return {}

    total_expenses = Expense.objects.filter(trip=trip).aggregate(total=Sum('amount'))['total'] or Decimal('0')
    fair_share = (total_expenses / len(members)).quantize(TWO_PLACES)

    paid_by_member = {
        row['paid_by']: row['total']
        for row in Expense.objects.filter(trip=trip).values('paid_by').annotate(total=Sum('amount'))
    }

    return {member.id: paid_by_member.get(member.id, Decimal('0')) - fair_share for member in members}


def simplify_debts(balances):
    """Standard debt-simplification (Splitwise-style): resolves N members'
    net balances into the minimum number of "X pays Y" transactions, instead
    of everyone settling with everyone individually."""
    creditors = sorted(
        ((member_id, amount) for member_id, amount in balances.items() if amount > 0),
        key=lambda pair: pair[1],
        reverse=True,
    )
    debtors = sorted(
        ((member_id, -amount) for member_id, amount in balances.items() if amount < 0),
        key=lambda pair: pair[1],
        reverse=True,
    )

    transactions = []
    i = j = 0
    creditors = [list(pair) for pair in creditors]
    debtors = [list(pair) for pair in debtors]
    while i < len(debtors) and j < len(creditors):
        debtor_id, owed = debtors[i]
        creditor_id, due = creditors[j]
        amount = min(owed, due)
        if amount > Decimal('0.005'):
            transactions.append((debtor_id, creditor_id, amount.quantize(TWO_PLACES)))
        debtors[i][1] -= amount
        creditors[j][1] -= amount
        if debtors[i][1] <= Decimal('0.005'):
            i += 1
        if creditors[j][1] <= Decimal('0.005'):
            j += 1
    return transactions


def recompute_settlements(trip):
    """Regenerates this trip's Settlement rows from its real expense data.
    Call after any expense is created, updated or deleted. A pair whose
    amount hasn't changed keeps whatever status it already had (so marking
    something paid sticks); a pair whose amount changed resets to pending,
    since a stale "paid" label would no longer reflect what's actually
    owed. Pairs that no longer owe anything are removed entirely."""
    balances = compute_net_balances(trip)
    transactions = simplify_debts(balances)

    existing = {(s.from_member_id, s.to_member_id): s for s in Settlement.objects.filter(trip=trip)}
    keep_ids = []
    for from_id, to_id, amount in transactions:
        current = existing.get((from_id, to_id))
        if current and current.amount == amount:
            keep_ids.append(current.id)
            continue
        settlement, _ = Settlement.objects.update_or_create(
            trip=trip,
            from_member_id=from_id,
            to_member_id=to_id,
            defaults={'amount': amount, 'status': 'pending'},
        )
        keep_ids.append(settlement.id)

    Settlement.objects.filter(trip=trip).exclude(id__in=keep_ids).delete()
    return Settlement.objects.filter(trip=trip).select_related('from_member', 'to_member')
