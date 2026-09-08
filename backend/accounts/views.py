from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer, UserProfileSerializer, UserProfileUpdateSerializer


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ — Create a new user account."""

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Return JWT tokens so the user is logged in immediately
        refresh = RefreshToken.for_user(user)
        profile_data = UserProfileSerializer(user.profile).data

        return Response({
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'profile': profile_data,
        }, status=status.HTTP_201_CREATED)


class MeView(APIView):
    """
    GET  /api/auth/me/ — Retrieve current user profile.
    PATCH /api/auth/me/ — Update mutable profile fields.
    """

    def get(self, request):
        serializer = UserProfileSerializer(request.user.profile)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserProfileUpdateSerializer(
            request.user.profile, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        # Return the full profile after update
        return Response(UserProfileSerializer(request.user.profile).data)
