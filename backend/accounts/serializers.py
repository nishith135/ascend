from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    """Read serializer for the full user profile (used in GET /me)."""

    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    xp_for_next_level = serializers.IntegerField(read_only=True)
    xp_progress = serializers.IntegerField(read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'id', 'username', 'email',
            'level', 'xp', 'xp_for_next_level', 'xp_progress',
            'rank', 'current_streak', 'last_workout_date',
            'stat_str', 'stat_vit', 'stat_agi',
            'stat_end', 'stat_flx', 'stat_per',
            'fitness_goal', 'experience_level',
            'created_at',
        ]
        read_only_fields = [
            'id', 'level', 'xp', 'rank', 'current_streak',
            'last_workout_date', 'stat_str', 'stat_vit', 'stat_agi',
            'stat_end', 'stat_flx', 'stat_per', 'created_at',
        ]


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Write serializer for updating mutable profile fields."""

    class Meta:
        model = UserProfile
        fields = ['fitness_goal', 'experience_level']


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""

    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    fitness_goal = serializers.ChoiceField(
        choices=UserProfile.GOAL_CHOICES, default='strength'
    )
    experience_level = serializers.ChoiceField(
        choices=UserProfile.EXPERIENCE_CHOICES, default='beginner'
    )

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm',
                  'fitness_goal', 'experience_level']

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return data

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        fitness_goal = validated_data.pop('fitness_goal', 'strength')
        experience_level = validated_data.pop('experience_level', 'beginner')
        validated_data.pop('password_confirm')

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
        )

        # Update the auto-created profile with onboarding data
        user.profile.fitness_goal = fitness_goal
        user.profile.experience_level = experience_level
        user.profile.save()

        return user
