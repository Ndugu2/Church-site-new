from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0010_adminauditlog'),
    ]

    operations = [
        migrations.AddField(
            model_name='biblestudy',
            name='registration_type',
            field=models.CharField(default='individual', max_length=30),
        ),
        migrations.AddField(
            model_name='biblestudy',
            name='preferred_meeting_day',
            field=models.CharField(blank=True, default='', max_length=40),
        ),
        migrations.AddField(
            model_name='biblestudy',
            name='preferred_meeting_time',
            field=models.CharField(blank=True, default='', max_length=40),
        ),
        migrations.AddField(
            model_name='biblestudy',
            name='preferred_group_format',
            field=models.CharField(blank=True, default='', max_length=30),
        ),
        migrations.AddField(
            model_name='biblestudy',
            name='small_group_notes',
            field=models.TextField(blank=True, default=''),
        ),
    ]
