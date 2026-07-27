from django.urls import path

from .views import BudgetPredictionView, DestinationRecommendationView

urlpatterns = [
    path('ml/predict-budget/', BudgetPredictionView.as_view(), name='ml-predict-budget'),
    path('ml/recommend-destinations/', DestinationRecommendationView.as_view(), name='ml-recommend-destinations'),
]
