import os
from django.core.management.base import BaseCommand
from highlight_app.views import cleanup_old_sessions

class Command(BaseCommand):
    help = 'Manually cleanup old session results and temporary files to free up disk space'

    def add_arguments(self, parser):
        parser.add_argument(
            '--hours',
            type=int,
            default=1,
            help='Delete sessions older than this many hours (default: 1)',
        )

    def handle(self, *args, **options):
        hours = options['hours']
        self.stdout.write(f"Starting cleanup of sessions older than {hours} hour(s)...")
        
        try:
            cleanup_old_sessions(max_age_hours=hours)
            self.stdout.write(self.style.SUCCESS(f"Successfully cleaned up old sessions."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Cleanup failed: {e}"))
