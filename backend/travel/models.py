import uuid

from django.db import models

from workspace.models import Trip


class StayBooking(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='stays')
    hotel_name = models.CharField(max_length=200)
    # Populated when picked from the real OpenStreetMap search (see
    # api/views.py's NearbyPlacesView) — blank when hand-typed, since not
    # every place is on OSM.
    address = models.CharField(max_length=300, blank=True)
    check_in = models.DateField()
    check_out = models.DateField()
    confirmation_number = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['check_in']

    def __str__(self):
        return self.hotel_name


class TransportBooking(models.Model):
    MODE_CHOICES = (
        ('flight', 'Flight'),
        ('train', 'Train'),
        ('bus', 'Bus'),
        ('car', 'Car'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='transport_bookings')
    mode = models.CharField(max_length=10, choices=MODE_CHOICES)
    operator = models.CharField(max_length=150, blank=True)
    from_location = models.CharField(max_length=150)
    to_location = models.CharField(max_length=150)
    departure_at = models.DateTimeField()
    arrival_at = models.DateTimeField(null=True, blank=True)
    confirmation_number = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['departure_at']

    def __str__(self):
        return f'{self.mode}: {self.from_location} -> {self.to_location}'


class RestaurantReservation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='restaurant_reservations')
    restaurant_name = models.CharField(max_length=200)
    address = models.CharField(max_length=300, blank=True)
    reservation_at = models.DateTimeField()
    party_size = models.PositiveIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['reservation_at']

    def __str__(self):
        return self.restaurant_name


class TravelDocument(models.Model):
    DOCUMENT_TYPE_CHOICES = (
        ('hotel_confirmation', 'Hotel Confirmation'),
        ('flight_ticket', 'Flight Ticket'),
        ('train_ticket', 'Train Ticket'),
        ('bus_ticket', 'Bus Ticket'),
        ('other', 'Other'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=200)
    document_type = models.CharField(max_length=30, choices=DOCUMENT_TYPE_CHOICES, default='other')
    file = models.FileField(upload_to='travel_documents/')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title
