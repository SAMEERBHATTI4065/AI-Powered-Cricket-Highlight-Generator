from django.contrib import admin
from .models import AnalysisSession


@admin.register(AnalysisSession)
class AnalysisSessionAdmin(admin.ModelAdmin):
    """Admin configuration for AnalysisSession model."""
    
    list_display = (
        'session_id',
        'event_count',
        'has_summary',
        'has_video',
        'created_at',
    )
    list_filter = ('created_at',)
    search_fields = ('session_id', 'summary_text')
    readonly_fields = ('share_token', 'created_at', 'formatted_events')
    
    fieldsets = (
        ('Session Info', {
            'fields': ('session_id', 'share_token', 'created_at')
        }),
        ('Video', {
            'fields': ('video_path',)
        }),
        ('AI Summary', {
            'fields': ('summary_text',),
            'classes': ('wide',)
        }),
        ('Detected Events (JSON)', {
            'fields': ('formatted_events',),
            'classes': ('wide',)
        }),
    )

    def event_count(self, obj):
        """Show number of events detected."""
        if obj.events_json:
            return len(obj.events_json)
        return 0
    event_count.short_description = 'Events'

    def has_summary(self, obj):
        """Show if AI summary exists."""
        return bool(obj.summary_text)
    has_summary.boolean = True
    has_summary.short_description = 'Summary?'

    def has_video(self, obj):
        """Show if highlight video exists."""
        return bool(obj.video_path)
    has_video.boolean = True
    has_video.short_description = 'Video?'

    def formatted_events(self, obj):
        """Display events JSON in readable format."""
        import json
        if obj.events_json:
            return json.dumps(obj.events_json, indent=2)
        return "No events"
    formatted_events.short_description = 'Events Data (JSON)'
