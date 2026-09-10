from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import timedelta

from .models import NutritionLog
from .serializers import NutritionLogSerializer, QuickLogSerializer


class TodayNutritionView(APIView):
    """
    GET  /api/nutrition/today/   — Returns or creates today's nutrition log for the current user.
    PATCH /api/nutrition/today/  — Updates today's nutrition values or targets.
    """

    def get(self, request):
        today = timezone.localdate()
        log, _ = NutritionLog.objects.get_or_create(user=request.user, date=today)
        return Response(NutritionLogSerializer(log).data)

    def patch(self, request):
        today = timezone.localdate()
        log, _ = NutritionLog.objects.get_or_create(user=request.user, date=today)
        serializer = NutritionLogSerializer(log, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class QuickLogView(APIView):
    """
    POST /api/nutrition/quick-add/
    Incrementally adds water (Mana) or macronutrients to today's log.
    Accepts water_ml_delta, calories_delta, protein_g_delta, carbs_g_delta, fat_g_delta.
    """

    def post(self, request):
        serializer = QuickLogSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        today = timezone.localdate()
        log, _ = NutritionLog.objects.get_or_create(user=request.user, date=today)

        # Apply deltas ensuring non-negative values
        log.water_ml = max(0, log.water_ml + data.get('water_ml_delta', 0))
        log.calories = max(0, log.calories + data.get('calories_delta', 0))
        log.protein_g = max(0, log.protein_g + data.get('protein_g_delta', 0))
        log.carbs_g = max(0, log.carbs_g + data.get('carbs_g_delta', 0))
        log.fat_g = max(0, log.fat_g + data.get('fat_g_delta', 0))
        log.save()

        return Response(NutritionLogSerializer(log).data, status=status.HTTP_200_OK)


class NutritionHistoryView(APIView):
    """
    GET /api/nutrition/history/?days=7
    Returns past nutrition logs for charts and consistency tracking.
    """

    def get(self, request):
        days = int(request.query_params.get('days', 7))
        days = max(1, min(days, 30))
        today = timezone.localdate()
        start_date = today - timedelta(days=days - 1)

        logs = NutritionLog.objects.filter(
            user=request.user,
            date__gte=start_date,
            date__lte=today,
        ).order_by('date')

        # Index existing logs by ISO date
        log_map = {log.date.isoformat(): log for log in logs}

        # Build continuous date list for charts
        result = []
        for i in range(days):
            current_day = start_date + timedelta(days=i)
            day_str = current_day.isoformat()
            if day_str in log_map:
                result.append(NutritionLogSerializer(log_map[day_str]).data)
            else:
                result.append({
                    'date': day_str,
                    'calories': 0,
                    'protein_g': 0,
                    'carbs_g': 0,
                    'fat_g': 0,
                    'water_ml': 0,
                    'calorie_target': 2200,
                    'water_target_ml': 3000,
                    'water_percent': 0,
                    'calorie_percent': 0,
                })

        return Response(result)
