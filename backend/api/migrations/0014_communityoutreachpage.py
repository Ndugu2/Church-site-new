from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0013_event_capacity_waitlist_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='CommunityOutreachPage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('page_key', models.CharField(default='community-outreach', max_length=80, unique=True)),
                ('hero_title', models.CharField(default='Community Outreach', max_length=255)),
                ('hero_subtitle', models.TextField(default='We visit the sick, comfort the grieving, and stand beside those in crisis — because love is not just a feeling, it is an action.')),
                ('stats', models.JSONField(default=list)),
                ('programs', models.JSONField(default=list)),
                ('upcoming_visits', models.JSONField(default=list)),
                ('testimonials', models.JSONField(default=list)),
                ('contact_points', models.JSONField(default=list)),
                ('is_published', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['page_key'],
            },
        ),
    ]