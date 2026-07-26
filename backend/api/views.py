import logging
import time

import requests
from django.core.cache import cache
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)

OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

# Real OpenStreetMap tags for genuinely visitable places — deliberately
# excludes generic shops/amenities so the AI Planner only ever suggests
# actual tourist attractions, never fabricated or placeholder entries.
TAG_LABELS = {
    'tourism=attraction': 'Attraction',
    'tourism=museum': 'Museum',
    'tourism=viewpoint': 'Viewpoint',
    'tourism=gallery': 'Art Gallery',
    'tourism=artwork': 'Landmark',
    'tourism=zoo': 'Zoo',
    'tourism=theme_park': 'Theme Park',
    'natural=beach': 'Beach',
    'leisure=park': 'Park',
    'historic': 'Historic Site',
}


def _label_for(tags: dict) -> str:
    for key in ('tourism', 'natural', 'leisure'):
        value = tags.get(key)
        if value and f'{key}={value}' in TAG_LABELS:
            return TAG_LABELS[f'{key}={value}']
    if tags.get('historic'):
        return TAG_LABELS['historic']
    return 'Point of Interest'


class NearbyAttractionsView(APIView):
    """Proxies OpenStreetMap's Overpass API for real, named tourist
    attractions near a destination. Proxied through the backend (rather
    than called directly from the browser like geocoding.ts/weather.ts)
    because Overpass requires an identifying User-Agent header, and
    browsers refuse to let client-side fetch() set that header — it's a
    forbidden header name enforced by the browser itself, not a CORS
    setting Overpass could relax."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        try:
            lat = float(request.query_params.get('lat', ''))
            lon = float(request.query_params.get('lon', ''))
        except ValueError:
            return Response({'detail': 'lat and lon query params are required.'}, status=status.HTTP_400_BAD_REQUEST)

        radius = min(max(int(request.query_params.get('radius', 15000)), 1000), 30000)

        cache_key = f'attractions:{round(lat, 2)}:{round(lon, 2)}:{radius}'
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        query = f"""
        [out:json][timeout:25];
        (
          node["tourism"~"^(attraction|museum|viewpoint|gallery|artwork|zoo|theme_park)$"](around:{radius},{lat},{lon});
          node["historic"](around:{radius},{lat},{lon});
          node["natural"="beach"](around:{radius},{lat},{lon});
          node["leisure"="park"](around:{radius},{lat},{lon});
        );
        out body 40;
        """

        # The public Overpass instance is shared infrastructure and gets
        # overloaded under load (real 504s observed in testing) — one retry
        # after a short pause clears most of these transient failures rather
        # than surfacing an error for something that would work a second later.
        response = None
        last_error: requests.RequestException | None = None
        for attempt in range(2):
            try:
                response = requests.post(
                    OVERPASS_URL,
                    data={'data': query},
                    headers={'User-Agent': 'TripSphere/1.0 (student project; contact via GitHub repo)'},
                    timeout=20,
                )
                response.raise_for_status()
                last_error = None
                break
            except requests.RequestException as exc:
                last_error = exc
                response = None
                if attempt == 0:
                    time.sleep(1.5)

        if last_error is not None or response is None:
            logger.error('Overpass API request failed for lat=%s lon=%s: %s', lat, lon, last_error)
            return Response(
                {'detail': 'Could not load nearby attractions right now.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        elements = response.json().get('elements', [])

        seen_names = set()
        results = []
        for element in elements:
            tags = element.get('tags', {})
            name = tags.get('name')
            if not name or name.lower() in seen_names:
                continue
            seen_names.add(name.lower())
            results.append(
                {
                    'id': element['id'],
                    'name': name,
                    'category': _label_for(tags),
                    'lat': element['lat'],
                    'lon': element['lon'],
                }
            )
            if len(results) >= 10:
                break

        # Cache for a day — real attractions don't change hour to hour, and
        # this keeps repeated planner sessions from re-hitting Overpass for
        # the same destination (its usage policy asks for restrained use).
        cache.set(cache_key, results, 60 * 60 * 24)

        return Response(results)
