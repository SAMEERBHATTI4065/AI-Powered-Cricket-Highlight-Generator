from django.db import models
from django.contrib.auth.models import User
import uuid
import secrets

class AnalysisSession(models.Model):
    # Optional link to a registered user (null = anonymous/guest session)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='sessions')
    session_id = models.CharField(max_length=100, unique=True)
    video_title = models.CharField(max_length=255, blank=True, null=True)  # Original filename for display
    summary_text = models.TextField(blank=True, null=True)
    events_json = models.JSONField(default=list)
    video_path = models.CharField(max_length=500, blank=True, null=True)
    share_token = models.CharField(max_length=64, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.share_token:
            self.share_token = secrets.token_urlsafe(16)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Session {self.session_id} ({self.user or 'guest'})"


class EmailVerificationCode(models.Model):
    """Stores 6-digit OTP codes for email verification during signup."""
    email = models.EmailField()
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def is_expired(self):
        from django.utils import timezone
        return (timezone.now() - self.created_at).total_seconds() > 600  # 10 minutes

    def __str__(self):
        return f"OTP for {self.email} ({'used' if self.is_used else 'active'})"
