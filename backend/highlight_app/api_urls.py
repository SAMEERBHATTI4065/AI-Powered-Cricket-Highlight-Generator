from django.urls import path
from . import api_views

urlpatterns = [
    path('upload/', api_views.upload_video_api, name='api_upload'),
    path('status/<str:job_id>/', api_views.get_status_api, name='api_status'),
    path('results/<str:session_id>/', api_views.get_results_api, name='api_results'),
    path('results/<str:session_id>/share/', api_views.share_results_api, name='api_share'),
    path('results/<str:session_id>/download/highlight/', api_views.download_highlight_api, name='api_download_highlight'),
    path('results/<str:session_id>/stream/', api_views.stream_video_api, name='api_stream_video'),
    path('results/<str:session_id>/verify-token/', api_views.check_share_token, name='api_verify_token'),
]
