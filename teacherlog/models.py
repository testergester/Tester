from django.db import models


class SchoolClass(models.Model):
    name = models.CharField(max_length=120, unique=True)

    def __str__(self):
        return self.name


class TimetableEntry(models.Model):
    WEEKDAY_CHOICES = [
        (1, 'Monday'),
        (2, 'Tuesday'),
        (3, 'Wednesday'),
        (4, 'Thursday'),
        (5, 'Friday'),
    ]

    start_time = models.TimeField()
    end_time = models.TimeField()
    weekday = models.PositiveSmallIntegerField(choices=WEEKDAY_CHOICES)
    class_name = models.CharField(max_length=120)

    class Meta:
        ordering = ['weekday', 'start_time']


class ArchiveLog(models.Model):
    date = models.DateField()
    time_slot = models.CharField(max_length=40)
    class_name = models.CharField(max_length=120)
    group_name = models.CharField(max_length=120, blank=True)
    status = models.CharField(max_length=30, default='Planned')
    lesson_title = models.CharField(max_length=200, blank=True)
    class_rating = models.PositiveSmallIntegerField(default=5)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']
