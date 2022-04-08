from django.urls import path
from ml_projects import views

urlpatterns = [
    path('', views.home, name='home'),
    path('predict_face/', views.predict_face, name='home'),
]