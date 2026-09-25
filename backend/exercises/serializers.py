from rest_framework import serializers
from .models import Exercise


class ExerciseSerializer(serializers.ModelSerializer):
    """Full exercise serializer for list and detail views."""

    muscle_group_display = serializers.SerializerMethodField()
    equipment_display = serializers.SerializerMethodField()
    default_stat_display = serializers.CharField(
        source='get_default_stat_display', read_only=True
    )

    class Meta:
        model = Exercise
        fields = [
            'id', 'name', 'muscle_group', 'muscle_group_display',
            'category', 'force', 'mechanic', 'level',
            'equipment', 'equipment_display',
            'primary_muscles', 'secondary_muscles',
            'instructions', 'description',
            'default_stat', 'default_stat_display',
            'stat_str', 'stat_vit', 'stat_agi', 'stat_end', 'stat_flx', 'stat_per',
        ]

    def get_muscle_group_display(self, obj):
        val = getattr(obj, 'muscle_group', None) or ''
        return val.replace('_', ' ').title() if val else ''

    def get_equipment_display(self, obj):
        val = getattr(obj, 'equipment', None) or ''
        return val.replace('_', ' ').title() if val else ''
