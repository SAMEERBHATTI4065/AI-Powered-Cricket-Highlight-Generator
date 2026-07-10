from django.urls import path
from . import api_views
from . import auth_views

urlpatterns = [
    path('upload/', api_views.upload_video_api, name='api_upload'),
    path('status/<str:job_id>/', api_views.get_status_api, name='api_status'),
    path('results/<str:session_id>/', api_views.get_results_api, name='api_results'),
    path('results/<str:session_id>/share/', api_views.share_results_api, name='api_share'),
    path('results/<str:session_id>/download/highlight/', api_views.download_highlight_api, name='api_download_highlight'),
    path('results/<str:session_id>/stream/', api_views.stream_video_api, name='api_stream_video'),
    path('results/<str:session_id>/verify-token/', api_views.check_share_token, name='api_verify_token'),
    # Authentication
    path('auth/send-code/', auth_views.send_code_view, name='api_send_code'),
    path('auth/verify-code/', auth_views.verify_code_view, name='api_verify_code'),
    path('auth/register/', auth_views.register_view, name='api_register'),
    path('auth/login/', auth_views.login_view, name='api_login'),
    path('auth/google/', auth_views.google_login_view, name='api_google_login'),
    path('auth/logout/', auth_views.logout_view, name='api_logout'),
    path('auth/me/', auth_views.me_view, name='api_me'),
    # User History
    path('auth/history/', auth_views.history_view, name='api_history'),
    path('test-video-info/', api_views.test_video_info, name='api_test_video_info'),
    path('demo-video/', api_views.serve_demo_video, name='api_serve_demo_video'),
]


