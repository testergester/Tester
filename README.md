# Teacher Log Django App

This project is now a **Django web app** with an **SQL database (SQLite)**.

## Features
- Timetable-based auto class selection (`Date + Time Slot`)
- Status radio selector (`Planned`, `Done`, `Skipped`, `Late`, `Cancelled`)
- Text size controls (A− / A+ / Reset) for easier reading in wide logger
- Class rating (out of 5) for each class session
- Lesson title + notes logging
- "Last note for this class" preview showing:
  - browse older notes with Previous/Next slider controls
  - class/date/time
  - lesson title
  - note text
- JSON API endpoints for metadata, timetable lookup, last-log lookup, and save

## Tech stack
- Django
- SQLite (`db.sqlite3`)

## Data model
- `SchoolClass`: manual class list
- `TimetableEntry`: weekday/start/end/class mapping
- `ArchiveLog`: date, time slot, class/group, status, lesson title, notes

## Setup
1. Install dependencies:
   - `pip install -r requirements.txt`
2. Run migrations:
   - `python manage.py migrate`
   - (optional re-seed anytime) `python manage.py seed_timetable`
3. Create admin user (optional):
   - `python manage.py createsuperuser`
4. Start server:
   - `python manage.py runserver`
5. Open app:
   - `http://127.0.0.1:8000/`


## Default hard-coded timetable (seeded in DB)
After running migrations, the app seeds timetable entries to match your requested matrix (Mon-Thu, Friday empty slots), including values like:
- `11 B`, `9 D`, `9 A`, `8 B`, `9 B`
- `Masterclass / 8 D`, `masterclass / 10 D`, `masterclass`

This is done by migration `teacherlog/migrations/0002_seed_default_timetable.py`.

## API routes
- `GET /api/metadata`
- `GET /api/timetable?date=YYYY-MM-DD&timeSlot=HH:MM%20-%20HH:MM`
- `GET /api/last-log?className=...`
- `POST /api/save-log`
