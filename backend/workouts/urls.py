from django.urls import path
from .views import (
    TemplateListCreateView,
    TemplateDetailView,
    SessionListCreateView,
    SessionDetailView,
    SessionFinishView,
    SetLogCreateView,
    SetLogDeleteView,
    DashboardStatsView,
)

urlpatterns = [
    # Templates
    path('templates/', TemplateListCreateView.as_view(), name='template-list-create'),
    path('templates/<int:pk>/', TemplateDetailView.as_view(), name='template-detail'),

    # Sessions
    path('sessions/', SessionListCreateView.as_view(), name='session-list-create'),
    path('sessions/<int:pk>/', SessionDetailView.as_view(), name='session-detail'),
    path('sessions/<int:pk>/finish/', SessionFinishView.as_view(), name='session-finish'),

    # Set Logs
    path('sessions/<int:session_id>/sets/', SetLogCreateView.as_view(), name='set-log-create'),
    path('sessions/<int:session_id>/sets/<int:set_id>/', SetLogDeleteView.as_view(), name='set-log-delete'),

    # Dashboard
    path('dashboard/', DashboardStatsView.as_view(), name='dashboard-stats'),
]
