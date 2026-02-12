# Teacher Log Google Apps Script

This repository includes `apps_script_teacher_log.gs`, an upgraded Google Apps Script backend for your teacher logger.

## Added features
- **Status support** for each log (`Planned`, `Done`, `Skipped`, `Late`, `Cancelled`).
- **Auto class/group selection from timetable** using `date + time slot`.
- Safe setup for `Classes`, `Timetable`, and `Archive` sheets.
- Safe **Archive auto-upgrade**: if `Archive` already exists, missing headers are added without deleting old data.
- Web app `doGet` actions for:
  - classes
  - metadata (classes + statuses)
  - timetable lookup

## Sheet structure
- `Classes`: `Class Name`
- `Timetable`: `Day | Time Slot | Class | Group`
- `Archive`: `Date | Time Slot | Class | Group | Status | Log Entry / Notes`

## Quick start
1. Open your Google Sheet.
2. Open **Extensions → Apps Script**.
3. Paste `apps_script_teacher_log.gs` code.
4. Run `setupSystem()` once.
5. Deploy as **Web app** if needed.

## Web app payload examples
### POST
```json
{
  "date": "2026-02-12",
  "timeSlot": "08:00-09:00",
  "className": "Math 7A",
  "groupName": "Group A",
  "status": "Done",
  "notes": "Completed chapter quiz"
}
```

Also supported for compatibility:
- `class` (same as `className`)
- `group` (same as `groupName`)
- `logEntry` (same as `notes`)


## Sidebar UI
- Add the provided sidebar HTML as a file named `Sidebar.html` in the same Apps Script project.
- The sidebar now supports `Status` and auto-fills `Class`/`Group` from `Timetable` when date/time changes.
