from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum, Count, F
from django.utils import timezone
from datetime import timedelta

from .models import WorkoutTemplate, WorkoutSession, SetLog
from .serializers import (
    WorkoutTemplateListSerializer,
    WorkoutTemplateDetailSerializer,
    WorkoutSessionListSerializer,
    WorkoutSessionDetailSerializer,
    WorkoutSessionCreateSerializer,
    WorkoutSessionFinishSerializer,
    SetLogCreateSerializer,
    SetLogSerializer,
)


# ─── Templates ──────────────────────────────────────────────────────────────

class TemplateListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/workouts/templates/       — List user's templates.
    POST /api/workouts/templates/       — Create a new template.
    """

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return WorkoutTemplateDetailSerializer
        return WorkoutTemplateListSerializer

    def get_queryset(self):
        return WorkoutTemplate.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/workouts/templates/{id}/ — Template detail.
    PUT    /api/workouts/templates/{id}/ — Full update.
    DELETE /api/workouts/templates/{id}/ — Delete template.
    """
    serializer_class = WorkoutTemplateDetailSerializer

    def get_queryset(self):
        return WorkoutTemplate.objects.filter(user=self.request.user)


# ─── Sessions ───────────────────────────────────────────────────────────────

class SessionListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/workouts/sessions/  — List user's sessions (paginated, newest first).
    POST /api/workouts/sessions/  — Start a new session.
    """

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return WorkoutSessionCreateSerializer
        return WorkoutSessionListSerializer

    def get_queryset(self):
        return WorkoutSession.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        session = serializer.save(user=self.request.user)

        # If created from a template, set the session name to the template name
        if session.template and not self.request.data.get('name'):
            session.name = session.template.name
            session.save()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        # Return the full session detail
        session = serializer.instance
        detail_serializer = WorkoutSessionDetailSerializer(session)
        return Response(detail_serializer.data, status=status.HTTP_201_CREATED)


class SessionDetailView(generics.RetrieveAPIView):
    """GET /api/workouts/sessions/{id}/ — Session detail with all set logs."""
    serializer_class = WorkoutSessionDetailSerializer

    def get_queryset(self):
        return WorkoutSession.objects.filter(user=self.request.user)


class SessionFinishView(APIView):
    """PATCH /api/workouts/sessions/{id}/finish/ — Mark session as complete, calculate XP, check achievements."""

    def patch(self, request, pk):
        try:
            session = WorkoutSession.objects.get(pk=pk, user=request.user)
        except WorkoutSession.DoesNotExist:
            return Response(
                {"detail": "Session not found."}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = WorkoutSessionFinishSerializer(
            session, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        session = serializer.update(session, serializer.validated_data)

        from gamification.serializers import UserAchievementSerializer

        return Response({
            **WorkoutSessionDetailSerializer(session).data,
            'leveled_up': getattr(session, '_leveled_up', False),
            'ranked_up': getattr(session, '_ranked_up', False),
            'new_rank': getattr(session, '_new_rank', None),
            'new_level': getattr(session, '_new_level', None),
            'new_achievements': UserAchievementSerializer(
                getattr(session, '_new_achievements', []), many=True
            ).data,
        })


# ─── Set Logs ───────────────────────────────────────────────────────────────

class SetLogCreateView(APIView):
    """POST /api/workouts/sessions/{session_id}/sets/ — Log a set to an active session."""

    def post(self, request, session_id):
        try:
            session = WorkoutSession.objects.get(
                pk=session_id, user=request.user
            )
        except WorkoutSession.DoesNotExist:
            return Response(
                {"detail": "Session not found."}, status=status.HTTP_404_NOT_FOUND
            )

        if not session.is_active:
            return Response(
                {"detail": "Cannot add sets to a finished session."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = SetLogCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        set_log = serializer.save(session=session)

        return Response(SetLogSerializer(set_log).data, status=status.HTTP_201_CREATED)


class SetLogDeleteView(APIView):
    """DELETE /api/workouts/sessions/{session_id}/sets/{set_id}/ — Remove a set log."""

    def delete(self, request, session_id, set_id):
        try:
            set_log = SetLog.objects.get(
                pk=set_id,
                session__pk=session_id,
                session__user=request.user,
            )
        except SetLog.DoesNotExist:
            return Response(
                {"detail": "Set not found."}, status=status.HTTP_404_NOT_FOUND
            )

        if not set_log.session.is_active:
            return Response(
                {"detail": "Cannot modify a finished session."},
                status=status.HTTP_400_BAD_REQUEST
            )

        set_log.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── Dashboard Stats ────────────────────────────────────────────────────────

class DashboardStatsView(APIView):
    """
    GET /api/workouts/dashboard/ — Aggregated stats for the dashboard.
    Returns total workouts, total volume, XP earned this week,
    recent sessions, and workout counts by day for the last 7 days.
    """

    def get(self, request):
        user = request.user
        now = timezone.now()
        week_ago = now - timedelta(days=7)

        sessions = WorkoutSession.objects.filter(
            user=user, finished_at__isnull=False
        )

        # Totals
        total_sessions = sessions.count()
        total_xp_earned = sessions.aggregate(total=Sum('xp_earned'))['total'] or 0

        # This week
        week_sessions = sessions.filter(finished_at__gte=week_ago)
        week_xp = week_sessions.aggregate(total=Sum('xp_earned'))['total'] or 0
        week_count = week_sessions.count()

        # Total volume (across all sets in finished sessions)
        total_volume = SetLog.objects.filter(
            session__user=user,
            session__finished_at__isnull=False,
        ).aggregate(
            total=Sum(F('weight_kg') * F('reps'))
        )['total'] or 0

        # Recent 5 sessions
        recent = WorkoutSessionListSerializer(
            sessions[:5], many=True
        ).data

        # Workouts per day for last 7 days (for mini chart)
        daily_counts = []
        for i in range(7):
            day = (now - timedelta(days=6 - i)).date()
            count = sessions.filter(finished_at__date=day).count()
            daily_counts.append({'date': day.isoformat(), 'count': count})

        return Response({
            'total_sessions': total_sessions,
            'total_xp_earned': total_xp_earned,
            'total_volume_kg': float(total_volume),
            'week_sessions': week_count,
            'week_xp': week_xp,
            'recent_sessions': recent,
            'daily_counts': daily_counts,
        })
