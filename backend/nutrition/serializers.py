from rest_framework import serializers
from .models import NutritionLog


class NutritionLogSerializer(serializers.ModelSerializer):
    water_percent = serializers.IntegerField(read_only=True)
    calorie_percent = serializers.IntegerField(read_only=True)

    class Meta:
        model = NutritionLog
        fields = [
            'id',
            'date',
            'calories',
            'protein_g',
            'carbs_g',
            'fat_g',
            'water_ml',
            'calorie_target',
            'protein_target_g',
            'carbs_target_g',
            'fat_target_g',
            'water_target_ml',
            'water_percent',
            'calorie_percent',
            'notes',
            'updated_at',
        ]
        read_only_fields = ['id', 'updated_at']


class QuickLogSerializer(serializers.Serializer):
    water_ml_delta = serializers.IntegerField(required=False, default=0)
    calories_delta = serializers.IntegerField(required=False, default=0)
    protein_g_delta = serializers.IntegerField(required=False, default=0)
    carbs_g_delta = serializers.IntegerField(required=False, default=0)
    fat_g_delta = serializers.IntegerField(required=False, default=0)
