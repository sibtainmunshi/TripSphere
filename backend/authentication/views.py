import logging

from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode

logger = logging.getLogger(__name__)
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import User
from .serializers import EmailTokenObtainPairSerializer, RegisterSerializer, UserSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Log the new user straight in, matching the existing frontend flow
        # of setSession() immediately after signup.
        token_serializer = EmailTokenObtainPairSerializer(
            data={'email': request.data.get('email'), 'password': request.data.get('password')}
        )
        token_serializer.is_valid(raise_exception=True)
        return Response(token_serializer.validated_data, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class GoogleAuthView(APIView):
    """Verifies a Google Identity Services ID token and logs the user in,
    creating an account on first sign-in. No password is ever set for a
    Google-created account — Google itself remains the only way in."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        credential = request.data.get('credential')
        if not credential:
            return Response({'detail': 'Missing Google credential.'}, status=status.HTTP_400_BAD_REQUEST)
        if not settings.GOOGLE_CLIENT_ID:
            return Response(
                {'detail': 'Google sign-in is not configured on this server.'},
                status=status.HTTP_501_NOT_IMPLEMENTED,
            )

        try:
            payload = google_id_token.verify_oauth2_token(
                credential, google_requests.Request(), settings.GOOGLE_CLIENT_ID
            )
        except ValueError:
            return Response({'detail': 'Invalid Google credential.'}, status=status.HTTP_401_UNAUTHORIZED)

        email = payload.get('email')
        if not email:
            return Response({'detail': 'This Google account has no email to sign in with.'}, status=status.HTTP_400_BAD_REQUEST)

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email,
                'name': payload.get('name', ''),
                'avatar_url': payload.get('picture', ''),
            },
        )
        if created:
            user.set_unusable_password()
            user.save()
        else:
            # Keep the photo/name in sync with Google on every login rather
            # than only ever snapshotting them once at account creation.
            picture = payload.get('picture', '')
            name = payload.get('name', '')
            if picture and picture != user.avatar_url:
                user.avatar_url = picture
            if name and name != user.name:
                user.name = name
            user.save()

        refresh = RefreshToken.for_user(user)
        return Response(
            {'access': str(refresh.access_token), 'refresh': str(refresh), 'user': UserSerializer(user).data}
        )


class PasswordResetRequestView(APIView):
    """Always responds the same way regardless of whether the email exists —
    otherwise the endpoint becomes a way to check which emails have accounts."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '')
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            user = None

        # Google-only accounts have no password to reset — sending a link
        # they can't meaningfully use would just be confusing, not helpful.
        if user and user.has_usable_password():
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_link = f'{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}'
            try:
                send_mail(
                    subject='Reset your TripSphere password',
                    message=(
                        f'Hi {user.name or user.email},\n\n'
                        'Use the link below to reset your TripSphere password. '
                        "This link is single-use and expires soon.\n\n"
                        f'{reset_link}\n\n'
                        "If you didn't request this, you can safely ignore this email."
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                )
            except Exception:
                # A real delivery failure (e.g. the email provider rejecting
                # an unverified recipient/domain) should never surface as a
                # 500 to the user — log it server-side for a developer to
                # notice, but the response stays identical either way so
                # this endpoint still never reveals whether the send worked.
                logger.exception('Password reset email failed to send for user %s', user.id)

        return Response({'detail': 'If an account exists for this email, a reset link is on its way.'})


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        password = request.data.get('password')

        if not uid or not token or not password:
            return Response({'detail': 'Missing reset details.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(pk=force_str(urlsafe_base64_decode(uid)))
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if not user or not default_token_generator.check_token(user, token):
            return Response(
                {'detail': 'This reset link is invalid or has expired.'}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            validate_password(password, user=user)
        except DjangoValidationError as exc:
            return Response({'password': exc.messages}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(password)
        user.save()
        return Response({'detail': 'Password updated. You can now log in.'})
