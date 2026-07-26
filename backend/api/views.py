import json
import logging
import time

import requests
from django.conf import settings
from django.core.cache import cache
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)

OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

# An alias Google keeps pointed at their current recommended flash model,
# rather than a fixed version — pinned model names get sunset for new
# projects over time (gemini-2.5-flash already returned a 404 "no longer
# available to new users" on a freshly created project during testing).
GEMINI_MODEL = 'gemini-flash-latest'
GEMINI_URL = f'https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent'

# Keeps the model's job scoped to a single, honest task: hold a natural
# conversation and extract these 4 fields. It never invents destination
# facts itself — the frontend independently verifies whatever destination
# it extracts against real geocoding/Wikipedia data before a trip is ever
# created, so a confident-sounding hallucination here can't produce a fake
# "real" place downstream.
CHAT_SYSTEM_INSTRUCTION = """You are the TripSphere AI trip planner — a warm, concise travel assistant \
inside the TripSphere app. Have a natural conversation to learn four things about the trip the user \
wants: destination (any real city/region/country), travel style (must be exactly one of: Relaxed, \
Adventurous, Cultural, Party), number of travelers (a whole number), and budget in Indian Rupees (a \
whole number). Ask for whatever is still missing, one or two things at a time, in whatever order feels \
natural given what the user says — you don't need to ask in a fixed order. If the user goes off-topic \
or just makes small talk, respond warmly and briefly, then steer back to planning. Keep replies short — \
2-3 sentences at most, like a chat message, never a long paragraph. Once you have all four fields, \
confirm them back to the user in the same reply and set readyToPlan to true. If the user changes their \
mind about something already collected, update it. Never invent a destination the user didn't mention. \
Also set nextField to exactly which one of destination/travelStyle/travelers/budget your reply is \
currently asking the user for — this MUST match what your reply text actually asks, since the app shows \
matching quick-reply buttons for it. Set nextField to null once readyToPlan is true."""

RESPONSE_SCHEMA = {
    'type': 'OBJECT',
    'properties': {
        'reply': {'type': 'STRING'},
        'destination': {'type': 'STRING', 'nullable': True},
        'travelStyle': {
            'type': 'STRING',
            'nullable': True,
            'enum': ['Relaxed', 'Adventurous', 'Cultural', 'Party'],
        },
        'travelers': {'type': 'INTEGER', 'nullable': True},
        'budget': {'type': 'INTEGER', 'nullable': True},
        'readyToPlan': {'type': 'BOOLEAN'},
        'nextField': {
            'type': 'STRING',
            'nullable': True,
            'enum': ['destination', 'travelStyle', 'travelers', 'budget'],
        },
    },
    'required': ['reply', 'readyToPlan'],
}

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


class ChatPlannerView(APIView):
    """Real conversational AI Trip Planner, backed by Gemini. Stateless by
    design — the frontend sends the full message history each turn and this
    just forwards it, so there's no server-side session to manage. Gemini's
    only job is holding the conversation and extracting 4 fields; it never
    gets treated as ground truth for whether a place is real — see
    destinationOptions.ts's enrichWithRealData for that independent check."""

    def post(self, request):
        if not settings.GEMINI_API_KEY:
            return Response(
                {'detail': 'The AI planner chat is not configured on this server.'},
                status=status.HTTP_501_NOT_IMPLEMENTED,
            )

        messages = request.data.get('messages')
        if not isinstance(messages, list) or not messages:
            return Response({'detail': 'messages is required.'}, status=status.HTTP_400_BAD_REQUEST)

        contents = []
        for message in messages:
            role = message.get('role')
            text = message.get('text')
            if role not in ('user', 'model') or not isinstance(text, str) or not text.strip():
                return Response({'detail': 'Each message needs a role of user/model and non-empty text.'}, status=status.HTTP_400_BAD_REQUEST)
            contents.append({'role': role, 'parts': [{'text': text}]})

        payload = {
            'systemInstruction': {'parts': [{'text': CHAT_SYSTEM_INSTRUCTION}]},
            'contents': contents,
            'generationConfig': {
                'responseMimeType': 'application/json',
                'responseSchema': RESPONSE_SCHEMA,
                # No thinkingConfig here — gemini-flash-latest currently
                # rejects it outright (400 INVALID_ARGUMENT) even though the
                # older pinned gemini-2.5-flash accepted it fine. The small
                # extra thinking-token cost without it is negligible either way.
            },
        }

        try:
            response = requests.post(
                GEMINI_URL,
                params={'key': settings.GEMINI_API_KEY},
                json=payload,
                timeout=20,
            )
            response.raise_for_status()
        except requests.RequestException:
            logger.exception('Gemini API request failed')
            return Response(
                {'detail': 'The AI planner is temporarily unavailable. Please try again.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        data = response.json()
        try:
            text = data['candidates'][0]['content']['parts'][0]['text']
            parsed = json.loads(text)
        except (KeyError, IndexError, ValueError):
            logger.error('Unexpected Gemini response shape: %s', data)
            return Response(
                {'detail': 'The AI planner is temporarily unavailable. Please try again.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(
            {
                'reply': parsed.get('reply', ''),
                'destination': parsed.get('destination'),
                'travelStyle': parsed.get('travelStyle'),
                'travelers': parsed.get('travelers'),
                'budget': parsed.get('budget'),
                'readyToPlan': bool(parsed.get('readyToPlan')),
                'nextField': parsed.get('nextField'),
            }
        )
