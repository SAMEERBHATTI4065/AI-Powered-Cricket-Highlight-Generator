"""
URL configuration for cricket_highlights project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from highlight_app import api_views
from django.conf.urls.static import static
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('highlight_app.api_urls')),
    path('legacy/', include('highlight_app.urls')),
    path('logs/', include('highlight_app.urls')),  # Expose /logs/ directly
    path('s/<str:token>/', api_views.redirect_share_api, name='share_redirect'),
]

# Serve static/media files ONLY if they haven't been matched by index.html catch-all
# Actually, order matters. Static should come BEFORE catch-all.
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# FINAL CATCH-ALL for React
urlpatterns += [
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html'), name='react_app'),
]
