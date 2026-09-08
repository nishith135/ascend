from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User

from .serializers import RegisterSerializer, UserProfileSerializer, UserProfileUpdateSerializer


class LoginView(APIView):
    """
    POST /api/auth/login/
    Accepts { username_or_email, password }.
    Tries username first; falls back to email lookup so users can log in either way.
    Returns JWT access + refresh tokens plus the full profile.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        identifier = request.data.get('username', '').strip()
        password = request.data.get('password', '')

        if not identifier or not password:
            return Response(
                {'detail': 'Username/email and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Try authenticating directly (works if identifier is a username)
        user = authenticate(request, username=identifier, password=password)

        # If that failed, check if identifier looks like an email and look up the username
        if user is None and '@' in identifier:
            try:
                matched = User.objects.get(email__iexact=identifier)
                user = authenticate(request, username=matched.username, password=password)
            except User.DoesNotExist:
                pass

        if user is None:
            return Response(
                {'detail': 'No active account found with the given credentials.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        refresh = RefreshToken.for_user(user)
        profile_data = UserProfileSerializer(user.profile).data

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'profile': profile_data,
        })


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
