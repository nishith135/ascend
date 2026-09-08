from django.urls import path
from . import views

urlpatterns = [
    path('quests/today/', views.TodayQuestsView.as_view(), name='quests-today'),
    path('quests/<int:pk>/complete/', views.QuestCompleteView.as_view(), name='quest-complete'),
    path('achievements/', views.UserAchievementsView.as_view(), name='achievements'),
]
