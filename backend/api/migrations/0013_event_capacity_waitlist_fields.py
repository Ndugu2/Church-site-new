from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0012_eventattendance_contact_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='capacity',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='event',
            name='category',
            field=models.CharField(default='General', max_length=100),
        ),
        migrations.AddField(
            model_name='event',
            name='waitlist_enabled',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='eventattendance',
            name='is_waitlisted',
            field=models.BooleanField(default=False),
        ),
    ]
