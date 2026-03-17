import json
from datetime import datetime
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from .models import SchoolClass, TimetableEntry, ArchiveLog

STATUS_OPTIONS = ['Planned', 'Done', 'Skipped', 'Late', 'Cancelled']


def index(request):
    return render(request, 'teacherlog/sidebar.html')


def metadata(request):
    classes = list(SchoolClass.objects.values_list('name', flat=True).order_by('name'))
    time_slots = sorted(
        {
            f"{row.start_time.strftime('%H:%M')} - {row.end_time.strftime('%H:%M')}"
            for row in TimetableEntry.objects.all()
        }
    )
    return JsonResponse({'classes': classes, 'statuses': STATUS_OPTIONS, 'timeSlots': time_slots})


def timetable_lookup(request):
    date_raw = request.GET.get('date', '')
    time_slot = request.GET.get('timeSlot', '')
    class_name = get_class_from_timetable(date_raw, time_slot)
    return JsonResponse({'className': class_name, 'groupName': class_name})


def last_log(request):
    class_name = request.GET.get('className', '').strip()
    if not class_name:
      return JsonResponse({'data': None})

    row = ArchiveLog.objects.filter(class_name__iexact=class_name).first() or ArchiveLog.objects.filter(group_name__iexact=class_name).first()

    if not row:
        return JsonResponse({'data': None})

    return JsonResponse(
        {
            'data': {
                'date': row.date.isoformat(),
                'timeSlot': row.time_slot,
                'className': row.class_name or row.group_name,
                'status': row.status,
                'lessonTitle': row.lesson_title,
                'classRating': row.class_rating,
                'notes': row.notes,
            }
        }
    )


@csrf_exempt
def save_log(request):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'POST required'}, status=405)

    payload = json.loads(request.body or '{}')
    date_raw = payload.get('date') or datetime.utcnow().date().isoformat()
    time_slot = str(payload.get('timeSlot', '')).strip()
    status = str(payload.get('status', 'Planned')).strip() or 'Planned'
    lesson_title = str(payload.get('lessonTitle') or payload.get('lesson_title') or '').strip()
    notes = str(payload.get('notes') or payload.get('logEntry') or '').strip()

    class_rating_raw = payload.get('classRating', payload.get('class_rating', 5))
    try:
        class_rating = int(class_rating_raw)
    except (TypeError, ValueError):
        class_rating = 5
    class_rating = max(0, min(5, class_rating))

    class_name = str(payload.get('className') or payload.get('class') or '').strip()
    if not class_name:
        class_name = get_class_from_timetable(date_raw, time_slot)

    log = ArchiveLog.objects.create(
        date=datetime.fromisoformat(date_raw).date(),
        time_slot=time_slot,
        class_name=class_name,
        group_name=class_name,
        status=status if status in STATUS_OPTIONS else STATUS_OPTIONS[0],
        lesson_title=lesson_title,
        class_rating=class_rating,
        notes=notes,
    )

    return JsonResponse(
        {
            'status': 'success',
            'message': 'Log saved successfully!',
            'data': {
                'date': log.date.isoformat(),
                'timeSlot': log.time_slot,
                'className': log.class_name,
                'status': log.status,
                'lessonTitle': log.lesson_title,
                'classRating': log.class_rating,
                'notes': log.notes,
            },
        }
    )


def get_class_from_timetable(date_raw, time_slot):
    try:
        date_value = datetime.fromisoformat(date_raw).date()
    except ValueError:
        date_value = datetime.utcnow().date()

    weekday = date_value.isoweekday()
    if weekday > 5:
        return ''

    try:
        start_str = time_slot.split('-')[0].strip()
        slot_start = datetime.strptime(start_str, '%H:%M').time()
    except Exception:
        return ''

    entry = TimetableEntry.objects.filter(
        weekday=weekday,
        start_time__lte=slot_start,
        end_time__gt=slot_start,
    ).first()

    return entry.class_name if entry else ''
