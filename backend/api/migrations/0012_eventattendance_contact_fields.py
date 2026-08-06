from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0011_biblestudy_small_group_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='eventattendance',
            name='contact_email',
            field=models.EmailField(blank=True, default='', max_length=254),
        ),
        migrations.AddField(
            model_name='eventattendance',
            name='contact_name',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
        migrations.AddField(
            model_name='eventattendance',
            name='contact_phone',
            field=models.CharField(blank=True, default='', max_length=50),
        ),
        migrations.AddField(
            model_name='eventattendance',
            name='notes',
            field=models.TextField(blank=True, default=''),
        ),
    ]
