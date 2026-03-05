# Teacher Log Google Apps Script

This repository includes `apps_script_teacher_log.gs` and `Sidebar.html` for a Google Sheet-based class logger.

## What it supports
- **Status** per log entry (`Planned`, `Done`, `Skipped`, `Late`, `Cancelled`).
- **Auto class selection from timetable** based on selected `Date + Time Slot`.
- Sidebar shows the **last log note** for the selected class, including that class date and time slot.
- Non-destructive setup for `Classes`, `Timetable`, and `Archive`.
- Safe `Archive` schema upgrade (adds missing headers without deleting old data).

## Timetable format (important)
Use sheet name **`Timetable`** with range **`A2:G10`**:
- `A2:A10` = class start time (HH:MM)
- `B2:B10` = class end time (HH:MM)
- `C2:G10` = class/group name by weekday columns:
  - `C` Monday
  - `D` Tuesday
  - `E` Wednesday
  - `F` Thursday
  - `G` Friday

The script treats **group and class as the same value** and auto-selects the **Class** dropdown in the sidebar.

## Sheet structure
- `Classes`: `Class Name`
- `Archive`: `Date | Time Slot | Class | Group | Status | Log Entry / Notes`

> Note: `Group` column is kept only for compatibility and is saved equal to `Class`.

## Quick start
1. Open your Google Sheet.
2. Open **Extensions → Apps Script**.
3. Add/paste `apps_script_teacher_log.gs` and `Sidebar.html`.
4. Run `setupSystem()` once.
5. Reload the sheet and open **⭐ Teacher Log → Open Logger Sidebar**.
