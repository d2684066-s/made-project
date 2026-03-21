# Generated migration for AdminCreationRequest model

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0006_pendingadmin'),
    ]

    operations = [
        migrations.CreateModel(
            name='AdminCreationRequest',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('name', models.CharField(max_length=255)),
                ('email', models.EmailField(max_length=254)),
                ('registration_id', models.CharField(blank=True, max_length=50, null=True)),
                ('is_notified', models.BooleanField(default=False)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='admin_creation_request', to='core.user')),
            ],
            options={
                'ordering': ['-created_at'],
                'indexes': [models.Index(fields=['is_notified', '-created_at'], name='core_admin_is_noti_1a2b3c_idx')],
            },
        ),
    ]
