from django.urls import path
from .views import TodayNutritionView, QuickLogView, NutritionHistoryView

urlpatterns = [
    path('today/', TodayNutritionView.as_view(), name='nutrition-today'),
    path('quick-add/', QuickLogView.as_view(), name='nutrition-quick-add'),
    path('history/', NutritionHistoryView.as_view(), name='nutrition-history'),
]
