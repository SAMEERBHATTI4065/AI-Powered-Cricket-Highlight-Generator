import os
import shutil
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from highlight_app.models import AnalysisSession

class Command(BaseCommand):
    help = 'Cleans up temporary processing files and old session data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        media_root = Path(settings.MEDIA_ROOT)
        
        # 1. Cleanup media/cricket_sessions/ folders (keep only the .mp4 highlights)
        sessions_dir = media_root / 'cricket_sessions'
        if sessions_dir.exists():
            self.stdout.write(f"Checking {sessions_dir} for temporary folders...")
            for item in sessions_dir.iterdir():
                if item.is_dir():
                    self.stdout.write(f"Found temp folder: {item.name}")
                    if not dry_run:
                        shutil.rmtree(item)
                        self.stdout.write(self.style.SUCCESS(f"Deleted {item.name}"))
        
        # 2. Cleanup media/uploads/
        uploads_dir = media_root / 'uploads'
        if uploads_dir.exists():
            self.stdout.write(f"Cleaning uploads directory: {uploads_dir}")
            for item in uploads_dir.iterdir():
                if item.is_file():
                    self.stdout.write(f"Found uploaded file: {item.name}")
                    if not dry_run:
                        os.remove(item)
                        self.stdout.write(self.style.SUCCESS(f"Deleted {item.name}"))

        # 3. Cleanup legacy directories (if any)
        legacy_dirs = [
            media_root / 'results',
            Path(os.getcwd()) / 'event_analysis',
            Path(os.getcwd()) / 'temp',
        ]
        
        for ld in legacy_dirs:
            if ld.exists():
                self.stdout.write(f"Cleaning legacy directory: {ld}")
                if not dry_run:
                    if ld.is_dir():
                        shutil.rmtree(ld)
                    else:
                        os.remove(ld)
                    self.stdout.write(self.style.SUCCESS(f"Removed legacy item: {ld.name}"))

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run complete. No files were deleted."))
        else:
            self.stdout.write(self.style.SUCCESS("Cleanup completed successfully."))
