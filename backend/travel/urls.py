from rest_framework.routers import DefaultRouter

from .views import (
    RestaurantReservationViewSet,
    StayBookingViewSet,
    TransportBookingViewSet,
    TravelDocumentViewSet,
)

router = DefaultRouter()
router.register('travel/stays', StayBookingViewSet, basename='stay-booking')
router.register('travel/transport', TransportBookingViewSet, basename='transport-booking')
router.register('travel/restaurants', RestaurantReservationViewSet, basename='restaurant-reservation')
router.register('travel/documents', TravelDocumentViewSet, basename='travel-document')

urlpatterns = router.urls
