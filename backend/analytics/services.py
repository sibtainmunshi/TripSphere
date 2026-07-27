import pandas as pd

from budget.models import Budget, Expense


def build_trip_analytics(trip):
    """Real aggregation over this trip's actual Expense rows — no synthetic
    or placeholder numbers. Uses pandas (not just Django's .aggregate())
    since category/day/member breakdowns are naturally a groupby job, and
    this is also the project's one genuine EDA-style data-analysis surface
    per the Python syllabus mapping."""
    expenses = list(
        Expense.objects.filter(trip=trip).select_related('paid_by').values(
            'amount', 'category', 'date', 'paid_by__id', 'paid_by__name', 'paid_by__email',
        )
    )
    budget = Budget.objects.filter(trip=trip).first()
    total_budget = float(budget.total_budget) if budget else float(trip.budget or 0)

    if not expenses:
        return {
            'totalBudget': total_budget,
            'totalSpent': 0.0,
            'remaining': total_budget,
            'categoryBreakdown': [],
            'dailySpending': [],
            'mostExpensiveCategory': None,
            'memberContributions': [],
        }

    df = pd.DataFrame(expenses)
    df['amount'] = df['amount'].astype(float)

    total_spent = float(df['amount'].sum())

    by_category = df.groupby('category')['amount'].sum().sort_values(ascending=False)
    category_breakdown = [{'category': cat, 'amount': round(amt, 2)} for cat, amt in by_category.items()]
    most_expensive_category = by_category.index[0] if len(by_category) else None

    by_day = df.groupby(df['date'].astype(str))['amount'].sum().sort_index()
    daily_spending = [{'date': day, 'amount': round(amt, 2)} for day, amt in by_day.items()]

    df['payer_name'] = df['paid_by__name'].where(df['paid_by__name'].astype(bool), df['paid_by__email'])
    by_member = df.groupby(['paid_by__id', 'payer_name'])['amount'].sum().sort_values(ascending=False)
    member_contributions = [
        {'memberId': str(member_id), 'memberName': name, 'amount': round(amt, 2)}
        for (member_id, name), amt in by_member.items()
    ]

    return {
        'totalBudget': total_budget,
        'totalSpent': round(total_spent, 2),
        'remaining': round(total_budget - total_spent, 2),
        'categoryBreakdown': category_breakdown,
        'dailySpending': daily_spending,
        'mostExpensiveCategory': most_expensive_category,
        'memberContributions': member_contributions,
    }
