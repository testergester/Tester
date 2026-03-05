from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('api/metadata', views.metadata, name='metadata'),
    path('api/timetable', views.timetable_lookup, name='timetable_lookup'),
    path('api/last-log', views.last_log, name='last_log'),
    path('api/save-log', views.save_log, name='save_log'),
]
