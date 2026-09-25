from rest_framework import generics, filters, permissions
from .models import Exercise
from .serializers import ExerciseSerializer


class ExerciseListView(generics.ListAPIView):
    """
    GET /api/exercises/ — List all exercises.
    Supports search (?search=bench), and filtering by muscle_group, equipment,
    category, mechanic, and force via query params.
    """

    serializer_class = ExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description', 'category', 'muscle_group']

    def get_queryset(self):
        queryset = Exercise.objects.all()

        muscle_group = self.request.query_params.get('muscle_group')
        if muscle_group:
            queryset = queryset.filter(muscle_group__iexact=muscle_group)

        equipment = self.request.query_params.get('equipment')
        if equipment:
            queryset = queryset.filter(equipment__iexact=equipment)

        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__iexact=category)

        mechanic = self.request.query_params.get('mechanic')
        if mechanic:
            queryset = queryset.filter(mechanic__iexact=mechanic)

        force = self.request.query_params.get('force')
        if force:
            queryset = queryset.filter(force__iexact=force)

        level = self.request.query_params.get('level')
        if level:
            queryset = queryset.filter(level__iexact=level)

        return queryset


class ExerciseDetailView(generics.RetrieveAPIView):
    """GET /api/exercises/{id}/ — Single exercise detail."""

    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]
