# seniordesign_project/accounts/urls.py
from django.urls import path
from .views import login_view

urlpatterns = [
    path("auth/login/", login_view),
]
