from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from travel.views import TripScopedViewSet

from .models import Media
from .serializers import MediaSerializer


class MediaViewSet(TripScopedViewSet):
    queryset = Media.objects.select_related('uploader').all()
    serializer_class = MediaSerializer
    # Multipart for uploads, JSON for the favorite-toggle PATCH — unlike
    # TravelDocument (upload + delete only), Media also needs a plain JSON
    # body update.
    parser_classes = [MultiPartParser, FormParser, JSONParser]
