from .models import Message


def post_system_message(trip, text):
    """A real, automatic message in the chat log itself for key trip
    events (expense added, budget updated, photo uploaded, member joined,
    settlement paid) — per 2.md's Chat spec. No sender, since nobody
    actually typed it; the frontend renders is_system messages centered
    and unstyled like a system notice, not as a chat bubble."""
    return Message.objects.create(trip=trip, sender=None, is_system=True, text=text)
