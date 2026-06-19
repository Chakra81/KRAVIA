"""
JWT Refresh Token Rotation Views
- /api/token/refresh/  → handled by Simple JWT (rotates + blacklists old token)
- /api/auth/logout/    → blacklist current refresh token
- /api/auth/logout-all/ → blacklist ALL tokens for user (logout from all devices)
"""
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User


@api_view(['POST'])
def jwt_logout(request):
    """
    Blacklist the provided refresh token (single device logout).
    Frontend must send: { "refresh": "<refresh_token>" }
    """
    try:
        from rest_framework_simplejwt.tokens import RefreshToken
        from rest_framework_simplejwt.exceptions import TokenError

        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'error': 'Refresh token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)

    except Exception:
        # Token already blacklisted or invalid — still treat as logged out
        return Response({'message': 'Logged out.'}, status=status.HTTP_200_OK)


@api_view(['POST'])
def jwt_logout_all_devices(request):
    """
    Blacklist ALL outstanding refresh tokens for a user (logout from all devices).
    Frontend must send: { "email": "<user_email>" }
    """
    try:
        from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken

        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.get(email=email)
        tokens = OutstandingToken.objects.filter(user=user)
        count = 0
        for token in tokens:
            _, created = BlacklistedToken.objects.get_or_create(token=token)
            if created:
                count += 1

        return Response({
            'message': f'Logged out from all devices. {count} session(s) terminated.'
        }, status=status.HTTP_200_OK)

    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
