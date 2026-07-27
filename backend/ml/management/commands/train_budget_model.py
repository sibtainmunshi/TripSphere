"""Trains the budget-prediction model on ml/data/budget_training_data.csv
(generate it first with `generate_budget_training_data`) and saves the fitted
pipeline to ml/trained_models/budget_model.joblib.

Run with: python manage.py train_budget_model
"""
import os

import joblib
import pandas as pd
from django.conf import settings
from django.core.management.base import BaseCommand
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

DATA_PATH = os.path.join(settings.BASE_DIR, 'ml', 'data', 'budget_training_data.csv')
MODEL_PATH = os.path.join(settings.BASE_DIR, 'ml', 'trained_models', 'budget_model.joblib')

CATEGORICAL_FEATURES = ['destination_tier', 'travel_style']
NUMERIC_FEATURES = ['duration_days', 'travelers']


class Command(BaseCommand):
    help = 'Trains and saves the budget prediction model.'

    def handle(self, *args, **options):
        if not os.path.exists(DATA_PATH):
            self.stderr.write('No training data found — run `generate_budget_training_data` first.')
            return

        df = pd.read_csv(DATA_PATH)
        X = df[CATEGORICAL_FEATURES + NUMERIC_FEATURES]
        y = df['total_budget']

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        preprocessor = ColumnTransformer(
            transformers=[('categorical', OneHotEncoder(handle_unknown='ignore'), CATEGORICAL_FEATURES)],
            remainder='passthrough',
        )
        pipeline = Pipeline(
            steps=[
                ('preprocess', preprocessor),
                ('model', RandomForestRegressor(n_estimators=200, max_depth=8, random_state=42)),
            ]
        )
        pipeline.fit(X_train, y_train)

        predictions = pipeline.predict(X_test)
        mae = mean_absolute_error(y_test, predictions)
        r2 = r2_score(y_test, predictions)

        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        joblib.dump(pipeline, MODEL_PATH)

        # Plain ASCII here — the Windows console's default codepage can't
        # encode rupee/superscript-2 symbols and would crash this command
        # after the model is already saved.
        self.stdout.write(self.style.SUCCESS(f'Trained on {len(X_train)} rows, tested on {len(X_test)} rows.'))
        self.stdout.write(f'Mean Absolute Error: Rs {mae:,.0f}')
        self.stdout.write(f'R2 score: {r2:.3f}')
        self.stdout.write(self.style.SUCCESS(f'Saved model to {MODEL_PATH}'))
