"""Rebuilds ml/data/destinations.csv from two sources:

1. Real data: a Kaggle dataset of 110 Indian destinations (CC0-1.0 license)
   — https://www.kaggle.com/datasets/heyyaakassh/india-travel-destinations-by-weather-and-budget
   giving real avg_budget_inr_per_person, avg_trip_duration_days, category,
   season and audience data per destination.
2. Curated: a small hand-picked list of international destinations (Dubai,
   Singapore, Maldives, Europe, etc.) that the Kaggle dataset — being
   India-only — has no coverage for. These stay as reasonable real-world
   cost estimates, not Kaggle-sourced.

Run with: python manage.py build_destinations_dataset <path-to-kaggle-csv>
"""
import os

import pandas as pd
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

OUTPUT_PATH = os.path.join(settings.BASE_DIR, 'ml', 'data', 'destinations.csv')

MONTH_ORDER = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

# A destination's category (from the source data) is mapped onto this
# project's travel_style taxonomy — an editorial judgment call, not
# something the source data labels directly.
CATEGORY_STYLE_MAP = {
    'Adventure': 'adventure',
    'Wildlife': 'adventure',
    'Hill Station': 'relaxed',
    'Nature': 'relaxed',
    'Beach': 'relaxed',
    'Cultural': 'relaxed',
    'Spiritual': 'backpacking',
    'Wine': 'luxury',
}

# International destinations the India-only Kaggle dataset has no coverage
# for — kept as curated real-world cost estimates (see the original
# destinations.csv this project shipped with).
CURATED_INTERNATIONAL = [
    {'name': 'Dubai', 'avg_daily_cost_inr': 9500, 'style_tags': 'luxury,relaxed', 'best_months': 'Nov,Dec,Jan,Feb,Mar'},
    {'name': 'Singapore', 'avg_daily_cost_inr': 9000, 'style_tags': 'luxury,relaxed,adventure', 'best_months': 'Feb,Mar,Apr,Jun,Jul'},
    {'name': 'Bali', 'avg_daily_cost_inr': 6000, 'style_tags': 'relaxed,adventure,luxury', 'best_months': 'Apr,May,Jun,Jul,Aug,Sep'},
    {'name': 'Maldives', 'avg_daily_cost_inr': 14000, 'style_tags': 'luxury,relaxed', 'best_months': 'Nov,Dec,Jan,Feb,Mar,Apr'},
    {'name': 'Thailand', 'avg_daily_cost_inr': 5500, 'style_tags': 'relaxed,adventure,backpacking', 'best_months': 'Nov,Dec,Jan,Feb'},
    {'name': 'Nepal', 'avg_daily_cost_inr': 2200, 'style_tags': 'adventure,backpacking', 'best_months': 'Mar,Apr,May,Oct,Nov'},
    {'name': 'Sri Lanka', 'avg_daily_cost_inr': 4200, 'style_tags': 'relaxed,adventure', 'best_months': 'Dec,Jan,Feb,Mar'},
    {'name': 'Switzerland', 'avg_daily_cost_inr': 15000, 'style_tags': 'luxury,relaxed,adventure', 'best_months': 'Jun,Jul,Aug,Sep'},
    {'name': 'Paris', 'avg_daily_cost_inr': 13000, 'style_tags': 'luxury,relaxed', 'best_months': 'Apr,May,Jun,Sep,Oct'},
    {'name': 'London', 'avg_daily_cost_inr': 14000, 'style_tags': 'luxury,relaxed', 'best_months': 'May,Jun,Jul,Aug,Sep'},
    {'name': 'New York', 'avg_daily_cost_inr': 15000, 'style_tags': 'luxury,relaxed,adventure', 'best_months': 'Apr,May,Jun,Sep,Oct'},
]


def parse_month_range(text):
    text = text.strip()
    if text == 'Jan-Dec':
        return MONTH_ORDER
    start, end = text.split('-')
    start_idx, end_idx = MONTH_ORDER.index(start), MONTH_ORDER.index(end)
    if start_idx <= end_idx:
        return MONTH_ORDER[start_idx:end_idx + 1]
    return MONTH_ORDER[start_idx:] + MONTH_ORDER[:end_idx + 1]  # wraps across year-end


class Command(BaseCommand):
    help = 'Rebuilds destinations.csv from the real Kaggle India dataset plus curated international destinations.'

    def add_arguments(self, parser):
        parser.add_argument('kaggle_csv_path', type=str)

    def handle(self, *args, **options):
        path = options['kaggle_csv_path']
        if not os.path.exists(path):
            raise CommandError(f'File not found: {path}')

        source = pd.read_csv(path)
        source['per_day_cost'] = (source['avg_budget_inr_per_person'] / source['avg_trip_duration_days']).round().astype(int)
        low, high = source['per_day_cost'].quantile([0.33, 0.66])

        rows = []
        for _, row in source.iterrows():
            styles = set()
            for cat in row['category'].split(';'):
                if cat in CATEGORY_STYLE_MAP:
                    styles.add(CATEGORY_STYLE_MAP[cat])
            # Real cost signal reinforces the style tags — a cheap trip
            # reads as backpacking-friendly regardless of category, an
            # expensive one as luxury-viable, on top of whatever the
            # category itself implies.
            if row['per_day_cost'] <= low:
                styles.add('backpacking')
            if row['per_day_cost'] > high:
                styles.add('luxury')
            if not styles:
                styles.add('relaxed')

            rows.append(
                {
                    'name': row['destination'],
                    'avg_daily_cost_inr': int(row['per_day_cost']),
                    'style_tags': ','.join(sorted(styles)),
                    'best_months': ','.join(parse_month_range(row['months_best_for'])),
                }
            )

        for entry in CURATED_INTERNATIONAL:
            rows.append(entry)

        result = pd.DataFrame(rows)
        result.to_csv(OUTPUT_PATH, index=False)
        self.stdout.write(
            self.style.SUCCESS(
                f'Wrote {len(result)} destinations ({len(source)} from Kaggle, {len(CURATED_INTERNATIONAL)} curated) to {OUTPUT_PATH}'
            )
        )
