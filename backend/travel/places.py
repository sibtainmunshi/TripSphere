import os

import pandas as pd
from django.conf import settings

DATA_DIR = os.path.join(settings.BASE_DIR, 'travel', 'data')

_airports_df = None
_stations_df = None


def _load_airports():
    global _airports_df
    if _airports_df is None:
        path = os.path.join(DATA_DIR, 'airports.csv')
        _airports_df = pd.read_csv(path) if os.path.exists(path) else pd.DataFrame()
    return _airports_df


def _load_stations():
    global _stations_df
    if _stations_df is None:
        path = os.path.join(DATA_DIR, 'stations.csv')
        _stations_df = pd.read_csv(path) if os.path.exists(path) else pd.DataFrame()
    return _stations_df


def search_airports(query, limit=15):
    df = _load_airports()
    if df.empty or not query:
        return []
    mask = df['name'].str.contains(query, case=False, na=False) | df['city'].str.contains(query, case=False, na=False)
    matches = df[mask].head(limit)
    return [
        {'label': f"{row['name']} ({row['iata']}) — {row['city']}, {row['country']}", 'value': f"{row['city']} ({row['iata']})"}
        for _, row in matches.iterrows()
    ]


def search_stations(query, limit=15):
    df = _load_stations()
    if df.empty or not query:
        return []
    mask = df['name'].str.contains(query, case=False, na=False) | df['code'].str.contains(query, case=False, na=False)
    matches = df[mask].head(limit)
    return [{'label': f"{row['name']} ({row['code']})", 'value': f"{row['name']} ({row['code']})"} for _, row in matches.iterrows()]
