from django.contrib import admin

from .models import RestaurantReservation, StayBooking, TransportBooking, TravelDocument

admin.site.register(StayBooking)
admin.site.register(TransportBooking)
admin.site.register(RestaurantReservation)
admin.site.register(TravelDocument)
