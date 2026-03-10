# Generated migration for Notification model

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_issue'),
    ]

    operations = [
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('student_phone', models.CharField(db_index=True, max_length=20)),
                ('notification_type', models.CharField(choices=[('accepted', 'Driver Accepted'), ('rejected', 'Request Rejected'), ('eta', 'ETA Update'), ('arrived', 'Driver Arrived'), ('in_progress', 'On The Way'), ('completed', 'Booking Completed')], max_length=20)),
                ('message', models.TextField()),
                ('driver_name', models.CharField(blank=True, max_length=255, null=True)),
                ('driver_phone', models.CharField(blank=True, max_length=20, null=True)),
                ('vehicle_number', models.CharField(blank=True, max_length=50, null=True)),
                ('is_read', models.BooleanField(default=False)),
                ('booking', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='core.booking')),
            ],
            options={
                'ordering': ['-created_at'],
                'indexes': [
                    models.Index(fields=['student_phone', 'created_at'], name='core_notif_student_phone_created_at_idx'),
                    models.Index(fields=['is_read'], name='core_notif_is_read_idx'),
                ],
            },
        ),
    ]
