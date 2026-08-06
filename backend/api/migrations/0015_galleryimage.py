from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0014_communityoutreachpage'),
    ]

    operations = [
        migrations.CreateModel(
            name='GalleryImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('album', models.CharField(max_length=120)),
                ('title', models.CharField(max_length=255)),
                ('img_url', models.URLField(max_length=500)),
                ('is_published', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]