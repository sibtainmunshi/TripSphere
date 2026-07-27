from django.urls import include, path

from .views import ChatPlannerView, NearbyAttractionsView

# Feature apps register their endpoints here as each milestone's UI is
# approved and its backend is built.
urlpatterns = [
    path('auth/', include('authentication.urls')),
    path('', include('workspace.urls')),
    path('', include('travel.urls')),
    path('', include('budget.urls')),
    path('', include('chat.urls')),
    path('', include('gallery.urls')),
    path('', include('notifications.urls')),
    path('attractions/', NearbyAttractionsView.as_view(), name='nearby-attractions'),
    path('chat-planner/', ChatPlannerView.as_view(), name='chat-planner'),
]
