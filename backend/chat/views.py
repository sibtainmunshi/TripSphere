from travel.views import TripScopedViewSet

from .models import Message
from .serializers import MessageSerializer


class MessageViewSet(TripScopedViewSet):
    """A real trip group chat — simple polling (the frontend re-fetches
    every few seconds), no WebSockets/Django Channels needed for this. No
    edit/delete on messages, matching a plain chat log."""

    queryset = Message.objects.select_related('sender').all()
    serializer_class = MessageSerializer
    http_method_names = ['get', 'post', 'head', 'options']
