from django.urls import path
from .views import ParseWorkoutView, QuestGenerateView, CoachView

urlpatterns = [
    path('parse-workout/', ParseWorkoutView.as_view(), name='ai-parse-workout'),
    path('quest-generate/', QuestGenerateView.as_view(), name='ai-quest-generate'),
    path('coach/', CoachView.as_view(), name='ai-coach'),
]
