from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import JoinPreviewView, JoinTripView, TripViewSet

router = DefaultRouter()
router.register('trips', TripViewSet, basename='trip')

urlpatterns = router.urls + [
    path('join/<uuid:token>/', JoinPreviewView.as_view(), name='join-preview'),
    path('join/<uuid:token>/accept/', JoinTripView.as_view(), name='join-accept'),
]
