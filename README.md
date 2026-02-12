# Teacher Log Google Apps Script

This repository now includes `apps_script_teacher_log.gs`, an upgraded Google Apps Script backend for your teacher logger.

## Added features
- **Status support** for each log (`Planned`, `Done`, `Skipped`, `Late`, `Cancelled`).
- **Auto class/group selection from timetable** using `date + time slot`.
- Safe setup for `Classes`, `Timetable`, and `Archive` sheets.
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

