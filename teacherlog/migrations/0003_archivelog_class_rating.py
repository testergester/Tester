from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('teacherlog', '0002_seed_default_timetable'),
    ]

    operations = [
        migrations.AddField(
            model_name='archivelog',
            name='class_rating',
            field=models.PositiveSmallIntegerField(default=5),
        ),
    ]
