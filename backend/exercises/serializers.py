from rest_framework import serializers
from .models import Exercise


class ExerciseSerializer(serializers.ModelSerializer):
    """Full exercise serializer for list and detail views."""

    muscle_group_display = serializers.CharField(
        source='get_muscle_group_display', read_only=True
    )
    equipment_display = serializers.CharField(
        source='get_equipment_display', read_only=True
    )
    default_stat_display = serializers.CharField(
        source='get_default_stat_display', read_only=True
    )

    class Meta:
        model = Exercise
        fields = [
            'id', 'name', 'muscle_group', 'muscle_group_display',
            'equipment', 'equipment_display',
            'default_stat', 'default_stat_display', 'description',
        ]
