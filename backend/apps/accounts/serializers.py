from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for returning safe user profile information including application role.
    Excludes sensitive data such as password hashes.
    """
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'name',
            'role',
            'is_active',
            'is_staff',
            'date_joined',
        )
        read_only_fields = fields

    def get_name(self, obj):
        full_name = f"{obj.first_name} {obj.last_name}".strip()
        return full_name if full_name else obj.username


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT Token Obtain Pair Serializer that adds user profile information
    to the token response and allows login with username or email.
    """
    def validate(self, attrs):
        # Allow login using email in the 'username' field if applicable
        username_or_email = attrs.get(self.username_field)
        if username_or_email and '@' in username_or_email:
            try:
                user_obj = User.objects.get(email__iexact=username_or_email)
                attrs[self.username_field] = user_obj.username
            except User.DoesNotExist:
                pass

        data = super().validate(attrs)

        # Check if user is active
        if not self.user.is_active:
            raise serializers.ValidationError({"detail": "User account is disabled."})

        # Append safe user information (including role) to authentication payload
        data['user'] = UserSerializer(self.user).data
        return data


class LogoutSerializer(serializers.Serializer):
    """
    Serializer to validate the refresh token for blacklisting on logout.
    """
    refresh = serializers.CharField(required=True)
