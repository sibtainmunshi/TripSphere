import uuid

from django.db import models

from workspace.models import Trip, TripMember

# Fixed small set per 2.md's spec (Stay/Food/Transport/Activities/Shopping/
# Miscellaneous) — not user-defined, so a JSON mapping on Budget is simpler
# than a separate always-6-rows-per-trip category model.
CATEGORY_CHOICES = (
    ('stay', 'Stay'),
    ('food', 'Food'),
    ('transport', 'Transport'),
    ('activities', 'Activities'),
    ('shopping', 'Shopping'),
    ('miscellaneous', 'Miscellaneous'),
)


class Budget(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # related_name is 'budget_plan', not 'budget' — Trip already has a plain
    # `budget` DecimalField (a simple hint set at trip creation, e.g. from
    # the AI planner), which this more detailed category-by-category budget
    # coexists with rather than replaces.
    trip = models.OneToOneField(Trip, on_delete=models.CASCADE, related_name='budget_plan')
    total_budget = models.DecimalField(max_digits=12, decimal_places=2)
    # {"stay": "5000.00", "food": "3000.00", ...} — only categories the user
    # actually allocated show up; missing ones just mean "not budgeted yet".
    category_budgets = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Budget for {self.trip.name}'


class Expense(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='expenses')
    paid_by = models.ForeignKey(TripMember, on_delete=models.CASCADE, related_name='expenses_paid')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.CharField(max_length=200, blank=True)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f'{self.category}: {self.amount}'


class Settlement(models.Model):
    """A single "X owes Y ₹Z" line — always recomputed from real Expense
    data (see budget/services.py), never hand-entered. A settlement already
    marked paid keeps that status across a recompute as long as the amount
    hasn't changed; if new expenses change what's actually owed, it resets
    to pending rather than keeping a "paid" label that no longer reflects
    reality."""

    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('paid', 'Paid'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='settlements')
    from_member = models.ForeignKey(TripMember, on_delete=models.CASCADE, related_name='settlements_owed')
    to_member = models.ForeignKey(TripMember, on_delete=models.CASCADE, related_name='settlements_owed_to')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('trip', 'from_member', 'to_member')

    def __str__(self):
        return f'{self.from_member_id} owes {self.to_member_id}: {self.amount}'
