from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    notifType = serializers.CharField(source='notif_type', read_only=True)
    isRead = serializers.BooleanField(source='is_read', required=False)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Notification
        fields = ('id', 'trip', 'notifType', 'message', 'isRead', 'createdAt')
        read_only_fields = ('id', 'trip', 'notifType', 'message', 'createdAt')
