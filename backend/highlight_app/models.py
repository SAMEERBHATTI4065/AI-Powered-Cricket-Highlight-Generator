from django.db import models
import uuid
import secrets

class AnalysisSession(models.Model):
    session_id = models.CharField(max_length=100, unique=True)
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
        return f"Session {self.session_id}"
