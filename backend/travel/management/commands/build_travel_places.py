"""Builds travel/data/airports.csv and travel/data/stations.csv from two
real sources, for the flight/train "real route" picker in TransportSection:

1. Airports: OpenFlights' public airports.dat (ODbL) — ~7000 real airports
   worldwide with real IATA codes and coordinates.
   https://github.com/jpatokal/openflights

2. Train stations: extracted from a Kaggle dataset of 2500+ real Indian
   Express/Passenger/Superfast train routes (MIT license) — every station
   any of those trains actually stops at, deduplicated by station code.
   https://www.kaggle.com/datasets/rohan26x/indian-express-train-dataset

Run with:
  python manage.py build_travel_places --airports <path to airports.dat> --trains <dir with the 3 train JSON files>
"""
import json
import os
import re

import pandas as pd
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

DATA_DIR = os.path.join(settings.BASE_DIR, 'travel', 'data')

AIRPORT_COLUMNS = [
    'id', 'name', 'city', 'country', 'iata', 'icao', 'lat', 'lon',
    'altitude', 'timezone', 'dst', 'tz', 'type', 'source',
]

STATION_NAME_RE = re.compile(r'^(.*?)\s*-\s*([A-Z0-9]+)$')


class Command(BaseCommand):
    help = 'Rebuilds travel/data/airports.csv and stations.csv from real source datasets.'

    def add_arguments(self, parser):
        parser.add_argument('--airports', required=True, help='Path to OpenFlights airports.dat')
        parser.add_argument('--trains', required=True, help='Directory containing EXP/PASS/SF-TRAINS.json')

    def handle(self, *args, **options):
        self._build_airports(options['airports'])
        self._build_stations(options['trains'])

    def _build_airports(self, path):
        if not os.path.exists(path):
            raise CommandError(f'File not found: {path}')
        df = pd.read_csv(path, header=None, names=AIRPORT_COLUMNS, na_values=['\\N'])
        # Only real, named, scheduled airports with a real IATA code —
        # drops heliports/closed/unnamed strips that would just be noise
        # in a "pick your departure airport" search.
        df = df[df['iata'].notna() & (df['type'] == 'airport')]
        out = df[['name', 'city', 'country', 'iata', 'lat', 'lon']].copy()
        out.to_csv(os.path.join(DATA_DIR, 'airports.csv'), index=False)
        self.stdout.write(self.style.SUCCESS(f'Wrote {len(out)} airports'))

    def _build_stations(self, directory):
        stations = {}
        for filename in ('EXP-TRAINS.json', 'PASS-TRAINS.json', 'SF-TRAINS.json'):
            path = os.path.join(directory, filename)
            if not os.path.exists(path):
                raise CommandError(f'File not found: {path}')
            with open(path, encoding='utf-8') as f:
                trains = json.load(f)
            for train in trains:
                for stop in train.get('trainRoute', []):
                    match = STATION_NAME_RE.match(stop.get('stationName', '').strip())
                    if not match:
                        continue
                    name, code = match.group(1).strip().title(), match.group(2).strip()
                    if code and code not in stations:
                        stations[code] = name

        out = pd.DataFrame(
            [{'name': name, 'code': code} for code, name in stations.items()]
        ).sort_values('name')
        out.to_csv(os.path.join(DATA_DIR, 'stations.csv'), index=False)
        self.stdout.write(self.style.SUCCESS(f'Wrote {len(out)} stations'))
