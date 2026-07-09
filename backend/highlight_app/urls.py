"""
URL configuration for highlight_app.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('', views.upload_view, name='upload'),
    path('process/', views.process_view, name='process'),
    path('result/<str:session_id>/', views.result_view, name='result'),
]
