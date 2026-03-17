from datetime import time
from django.core.management.base import BaseCommand
from teacherlog.models import TimetableEntry, SchoolClass

DEFAULT_ENTRIES = [
    (2, time(8, 0), time(8, 45), '11 B'),
    (3, time(8, 0), time(8, 45), '9 D'),
    (4, time(8, 0), time(8, 45), '11 B'),
    (1, time(8, 50), time(9, 35), '9 A'),
    (2, time(8, 50), time(9, 35), '8 B'),
    (3, time(8, 50), time(9, 35), '9 B'),
    (4, time(8, 50), time(9, 35), 'masterclass / 10 D'),
    (1, time(9, 40), time(10, 25), 'Masterclass / 8 D'),
    (2, time(9, 40), time(10, 25), '9 A'),
    (3, time(9, 40), time(10, 25), '11 A'),
    (4, time(9, 40), time(10, 25), '11 A'),
    (1, time(10, 30), time(11, 15), '10 B'),
    (2, time(10, 30), time(11, 15), '10 A'),
    (3, time(10, 30), time(11, 15), '8 D'),
    (4, time(10, 30), time(11, 15), '8 B'),
    (1, time(11, 20), time(12, 5), '9 D'),
    (2, time(11, 20), time(12, 5), '9 B'),
    (3, time(11, 20), time(12, 5), '8 B'),
    (4, time(11, 20), time(12, 5), '10 A'),
    (1, time(12, 10), time(12, 55), '9 B'),
    (2, time(12, 10), time(12, 55), '8 D'),
    (3, time(12, 10), time(12, 55), '9 A'),
    (4, time(12, 10), time(12, 55), '9 D'),
    (1, time(13, 0), time(13, 45), '10 A'),
    (2, time(13, 0), time(13, 45), '11 A'),
    (3, time(13, 0), time(13, 45), '10 B'),
    (4, time(13, 0), time(13, 45), 'masterclass'),
    (4, time(13, 50), time(14, 35), 'masterclass'),
]


class Command(BaseCommand):
    help = 'Seed the default timetable/classes shown in project README.'

    def handle(self, *args, **options):
        created = 0
        for weekday, start_time, end_time, class_name in DEFAULT_ENTRIES:
            _, entry_created = TimetableEntry.objects.get_or_create(
                weekday=weekday,
                start_time=start_time,
                end_time=end_time,
                class_name=class_name,
            )
            SchoolClass.objects.get_or_create(name=class_name)
            if entry_created:
                created += 1

        self.stdout.write(self.style.SUCCESS(f'Seed complete. Added {created} timetable rows.'))
