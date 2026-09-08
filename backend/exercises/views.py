from rest_framework import generics, filters, permissions
from .models import Exercise
from .serializers import ExerciseSerializer


class ExerciseListView(generics.ListAPIView):
    """
    GET /api/exercises/ — List all exercises.
    Supports search (?search=bench), and filtering by muscle_group and equipment
    via query params (?muscle_group=chest&equipment=barbell).
    """

    serializer_class = ExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']

    def get_queryset(self):
        queryset = Exercise.objects.all()

        muscle_group = self.request.query_params.get('muscle_group')
        if muscle_group:
            queryset = queryset.filter(muscle_group=muscle_group)

        equipment = self.request.query_params.get('equipment')
        if equipment:
            queryset = queryset.filter(equipment=equipment)

        return queryset


class ExerciseDetailView(generics.RetrieveAPIView):
    """GET /api/exercises/{id}/ — Single exercise detail."""

    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]
