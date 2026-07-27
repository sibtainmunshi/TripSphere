import os

import joblib
import numpy as np
import pandas as pd
from django.conf import settings

MODEL_PATH = os.path.join(settings.BASE_DIR, 'ml', 'trained_models', 'budget_model.joblib')
DESTINATIONS_PATH = os.path.join(settings.BASE_DIR, 'ml', 'data', 'destinations.csv')

# Tier boundaries calibrated from the real per-day-cost distribution in the
# 110-destination Kaggle dataset (see build_destinations_dataset) — the
# bottom/top terciles of real avg_budget_inr_per_person / avg_trip_duration_days,
# not guessed numbers.
TIER_BOUNDARY_LOW = 2398
TIER_BOUNDARY_HIGH = 3000

# Fallback for anything not in destinations.csv (mostly international
# destinations, since the Kaggle source is India-only) — same
# keyword-matching idea as the frontend's destinationEmoji.ts.
TIER_KEYWORDS = {
    'luxury': [
        'dubai', 'singapore', 'maldives', 'switzerland', 'paris', 'london', 'new york',
        'tokyo', 'europe', 'seychelles',
    ],
    'mid': ['thailand', 'sri lanka'],
}

_destinations_df = None


def _load_destinations():
    global _destinations_df
    if _destinations_df is None:
        _destinations_df = pd.read_csv(DESTINATIONS_PATH) if os.path.exists(DESTINATIONS_PATH) else pd.DataFrame()
    return _destinations_df


def _destination_tier(destination):
    value = destination.lower()

    # Prefer a real per-destination cost from destinations.csv over the
    # keyword fallback whenever the input actually names a place we have
    # real data for.
    df = _load_destinations()
    if not df.empty:
        matches = df[df['name'].str.lower().apply(lambda name: name in value or value in name)]
        if not matches.empty:
            cost = matches.iloc[0]['avg_daily_cost_inr']
            if cost <= TIER_BOUNDARY_LOW:
                return 'budget'
            if cost <= TIER_BOUNDARY_HIGH:
                return 'mid'
            return 'luxury'

    for tier, keywords in TIER_KEYWORDS.items():
        if any(keyword in value for keyword in keywords):
            return tier
    return 'budget'


_model = None


def _get_model():
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            return None
        _model = joblib.load(MODEL_PATH)
    return _model


def predict_budget(destination, duration_days, travelers, travel_style):
    model = _get_model()
    if model is None:
        return None
    tier = _destination_tier(destination)
    row = pd.DataFrame(
        [{'destination_tier': tier, 'travel_style': travel_style, 'duration_days': duration_days, 'travelers': travelers}]
    )
    predicted = float(model.predict(row)[0])
    # RandomForest's per-tree spread as an honest uncertainty band, rather
    # than presenting one number as if it were exact. Using the raw
    # min/max across 200 trees makes for a useless, outlier-dominated
    # range (individual trees are noisy) — one standard deviation around
    # the mean is a much more usable "roughly this much either way".
    transformed = model.named_steps['preprocess'].transform(row)
    tree_predictions = np.array([tree.predict(transformed)[0] for tree in model.named_steps['model'].estimators_])
    spread = float(tree_predictions.std())
    return {
        'predictedBudget': round(predicted, -2),
        'rangeMin': round(max(predicted - spread, 0), -2),
        'rangeMax': round(predicted + spread, -2),
        'destinationTier': tier,
    }


def recommend_destinations(budget_per_day, travel_style, month=None, limit=6):
    if not os.path.exists(DESTINATIONS_PATH):
        return []
    df = pd.read_csv(DESTINATIONS_PATH)
    df['style_tags_list'] = df['style_tags'].str.split(',')
    df['best_months_list'] = df['best_months'].str.split(',')

    def score(row):
        cost_fit = 1 - min(abs(row['avg_daily_cost_inr'] - budget_per_day) / max(budget_per_day, 1), 1)
        style_fit = 1.0 if travel_style in row['style_tags_list'] else 0.0
        month_fit = 1.0 if month and month in row['best_months_list'] else 0.5
        return cost_fit * 0.5 + style_fit * 0.35 + month_fit * 0.15

    df['score'] = df.apply(score, axis=1)
    top = df.sort_values('score', ascending=False).head(limit)
    return [
        {
            'name': row['name'],
            'avgDailyCost': int(row['avg_daily_cost_inr']),
            'styleTags': row['style_tags_list'],
            'bestMonths': row['best_months_list'],
            'matchScore': round(float(row['score']) * 100),
        }
        for _, row in top.iterrows()
    ]
