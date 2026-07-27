from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import predict_budget, recommend_destinations

VALID_STYLES = ('backpacking', 'relaxed', 'adventure', 'luxury')


class BudgetPredictionView(APIView):
    """ML should remain invisible to the user — this returns a plain
    number/range, no mention of models or confidence scores in the
    response; the frontend presents it as "our estimate", not "the AI
    says"."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        destination = (request.data.get('destination') or '').strip()
        travel_style = request.data.get('travelStyle')
        try:
            duration_days = int(request.data.get('durationDays'))
            travelers = int(request.data.get('travelers'))
        except (TypeError, ValueError):
            return Response({'detail': 'durationDays and travelers must be numbers.'}, status=status.HTTP_400_BAD_REQUEST)

        if not destination:
            return Response({'detail': 'destination is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if travel_style not in VALID_STYLES:
            return Response({'detail': f'travelStyle must be one of {VALID_STYLES}.'}, status=status.HTTP_400_BAD_REQUEST)
        if duration_days < 1 or travelers < 1:
            return Response({'detail': 'durationDays and travelers must be at least 1.'}, status=status.HTTP_400_BAD_REQUEST)

        result = predict_budget(destination, duration_days, travelers, travel_style)
        if result is None:
            return Response({'detail': 'Prediction model is not available yet.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response(result)


class DestinationRecommendationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        travel_style = request.data.get('travelStyle')
        month = request.data.get('month')
        try:
            budget_per_day = float(request.data.get('budgetPerDay'))
        except (TypeError, ValueError):
            return Response({'detail': 'budgetPerDay must be a number.'}, status=status.HTTP_400_BAD_REQUEST)

        if travel_style not in VALID_STYLES:
            return Response({'detail': f'travelStyle must be one of {VALID_STYLES}.'}, status=status.HTTP_400_BAD_REQUEST)
        if budget_per_day <= 0:
            return Response({'detail': 'budgetPerDay must be positive.'}, status=status.HTTP_400_BAD_REQUEST)

        results = recommend_destinations(budget_per_day, travel_style, month)
        return Response({'results': results})
