from django.urls import include, path

from .views import NearbyAttractionsView

# Feature apps register their endpoints here as each milestone's UI is
# approved and its backend is built.
urlpatterns = [
    path('auth/', include('authentication.urls')),
    path('', include('workspace.urls')),
    path('', include('travel.urls')),
    path('attractions/', NearbyAttractionsView.as_view(), name='nearby-attractions'),
]
