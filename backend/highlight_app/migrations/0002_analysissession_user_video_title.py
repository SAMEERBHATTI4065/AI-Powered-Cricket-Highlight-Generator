from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('highlight_app', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='analysissession',
            name='user',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='sessions',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name='analysissession',
            name='video_title',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
