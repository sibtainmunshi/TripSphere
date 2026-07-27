"""Generates a synthetic-but-realistic training dataset for the budget
prediction model. TripSphere is a new product without enough real historical
trip data yet to train on — this is deliberately labeled as synthetic, not
disguised as scraped/real bookings. random noise is added so the model has
to learn genuine signal rather than a perfect formula.

The budget/mid per-day cost assumptions are NOT guessed — they're the real
tercile means (bottom third / middle third of avg_daily_cost_inr) computed
from the 110-destination Kaggle dataset in destinations.csv (see
build_destinations_dataset). luxury stays an estimate since that source is
India-only and has no real coverage of international luxury destinations.

Run with: python manage.py generate_budget_training_data
"""
import os
import random

import numpy as np
import pandas as pd
from django.conf import settings
from django.core.management.base import BaseCommand

DESTINATION_TIERS = ['budget', 'mid', 'luxury']
TRAVEL_STYLES = ['backpacking', 'relaxed', 'adventure', 'luxury']

BASE_DAILY_COST = {'budget': 2085, 'mid': 2730, 'luxury': 8000}
STYLE_MULTIPLIER = {'backpacking': 0.6, 'relaxed': 1.0, 'adventure': 1.15, 'luxury': 1.8}

OUTPUT_PATH = os.path.join(settings.BASE_DIR, 'ml', 'data', 'budget_training_data.csv')


class Command(BaseCommand):
    help = 'Generates the synthetic training dataset for budget prediction.'

    def add_arguments(self, parser):
        parser.add_argument('--rows', type=int, default=400)
        parser.add_argument('--seed', type=int, default=42)

    def handle(self, *args, **options):
        random.seed(options['seed'])
        np.random.seed(options['seed'])
        rows = []
        for _ in range(options['rows']):
            tier = random.choice(DESTINATION_TIERS)
            style = random.choice(TRAVEL_STYLES)
            duration_days = random.randint(2, 14)
            travelers = random.randint(1, 8)
            noise = np.random.normal(1.0, 0.15)
            total_budget = (
                BASE_DAILY_COST[tier] * STYLE_MULTIPLIER[style] * duration_days * travelers * noise
            )
            rows.append(
                {
                    'destination_tier': tier,
                    'travel_style': style,
                    'duration_days': duration_days,
                    'travelers': travelers,
                    'total_budget': round(max(total_budget, 1000), -2),
                }
            )

        df = pd.DataFrame(rows)
        os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
        df.to_csv(OUTPUT_PATH, index=False)
        self.stdout.write(self.style.SUCCESS(f'Wrote {len(df)} rows to {OUTPUT_PATH}'))
