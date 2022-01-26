from django.urls import path
from pdf_editor import views

urlpatterns = [
    path('', views.home, name='home'),
    path('pdf_editor/', views.pdf_editor_home, name='pdf_editor_home'),
    path('pdf_editor/submit', views.submit, name='submit'),
    path('pdf_editor/<str:hash_code>', views.view, name='view')
]