/**
 * Teacher Log with timetable auto-selection.
 *
 * TIMETABLE LAYOUT (sheet: "Timetable", range A2:G10):
 * - Col A: Class start time (HH:MM)
 * - Col B: Class end time (HH:MM)
 * - Col C: Monday class/group name
 * - Col D: Tuesday class/group name
 * - Col E: Wednesday class/group name
 * - Col F: Thursday class/group name
 * - Col G: Friday class/group name
 *
 * NOTE: "Group" and "Class" are treated as the same value.
 */

const STATUS_OPTIONS = ['Planned', 'Done', 'Skipped', 'Late', 'Cancelled'];
const ARCHIVE_HEADERS = ['Date', 'Time Slot', 'Class', 'Group', 'Status', 'Lesson Title', 'Log Entry / Notes'];
const TIMETABLE_SHEET_NAME = 'Timetable';
const TIMETABLE_DATA_START_ROW = 2;
const TIMETABLE_DATA_ROWS = 9; // A2:G10
const TIMETABLE_DATA_COLS = 7; // A:G

function setupSystem() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let classSheet = ss.getSheetByName('Classes');
  if (!classSheet) {
    classSheet = ss.insertSheet('Classes');
    classSheet.getRange('A1').setValue('Class Name').setFontWeight('bold').setBackground('#cfe2f3');
    console.log("Created 'Classes' sheet.");
  } else {
    console.log("'Classes' sheet already exists. Skipping to protect data.");
  }

  let timetableSheet = ss.getSheetByName(TIMETABLE_SHEET_NAME);
  if (!timetableSheet) {
    timetableSheet = ss.insertSheet(TIMETABLE_SHEET_NAME);
    timetableSheet
      .getRange('A1:G1')
      .setValues([['Start', 'End', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']])
      .setFontWeight('bold')
      .setBackground('#d9ead3');
    timetableSheet.setFrozenRows(1);
    timetableSheet.setColumnWidths(1, 7, 120);
    console.log("Created 'Timetable' sheet with A:G format.");
  } else {
    console.log("'Timetable' sheet already exists. Skipping to protect data.");
  }

  ensureArchiveSheetSchema_(ss);
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('⭐ Teacher Log').addItem('Open Logger Sidebar', 'showSidebar').addToUi();
}

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar').setTitle('Class Log').setWidth(640);
  SpreadsheetApp.getUi().showSidebar(html);
}

function getClassList() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Classes');
  if (!sheet) return [];

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  return sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat().filter(String).sort();
}

function getStatusList() {
  return STATUS_OPTIONS.slice();
}

function getTimeSlotListFromTimetable() {
  const rows = getTimetableRows_();
  const slots = [];

  rows.forEach((row) => {
    const start = formatTimeString_(row[0]);
    const end = formatTimeString_(row[1]);
    if (!start || !end) return;
    slots.push(`${start} - ${end}`);
  });

  return uniqueList_(slots);
}

/**
 * Returns className/groupName for selected date + timeSlot, based on A2:G10 timetable matrix.
 */
function getClassGroupFromTimetable(dateInput, timeSlot) {
  const result = getClassFromTimetable_(dateInput, timeSlot);
  return { className: result, groupName: result };
}

/**
 * Returns last archived note for a class/group including date + time slot.
 */
function getLastLogForClass(classNameInput) {
  const className = String(classNameInput || '').trim();
  if (!className) return null;

  const archive = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Archive');
  if (!archive) return null;

  const lastRow = archive.getLastRow();
  if (lastRow < 2) return null;

  const rows = archive.getRange(2, 1, lastRow - 1, 7).getDisplayValues();

  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const [date, timeSlot, rowClass, rowGroup, status, lessonTitle, note] = rows[i];
    if (normalizeText(rowClass) === normalizeText(className) || normalizeText(rowGroup) === normalizeText(className)) {
      return {
        date: String(date || ''),
        timeSlot: String(timeSlot || ''),
        className: String(rowClass || rowGroup || ''),
        status: String(status || ''),
        lessonTitle: String(lessonTitle || ''),
        notes: String(note || '')
      };
    }
  }

  return null;
}

function saveLog(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const archive = ensureArchiveSheetSchema_(ss);

  const normalizedDate = normalizeDateInput(data.date);
  const normalizedTimeSlot = String(data.timeSlot || '').trim();
  const lessonTitle = String(data.lessonTitle || data.lesson_title || '').trim();
  const notes = String(data.notes || data.logEntry || '').trim();

  let className = String(data.className || data.class || '').trim();
  if (!className) {
    className = getClassFromTimetable_(normalizedDate, normalizedTimeSlot);
  }

  const groupName = className;
  const status = normalizeStatus(data.status);

  archive.appendRow([normalizedDate, normalizedTimeSlot, className, groupName, status, lessonTitle, notes]);

  return {
    message: 'Log saved successfully!',
    saved: {
      date: normalizedDate,
      timeSlot: normalizedTimeSlot,
      className: className,
      status: status,
      lessonTitle: lessonTitle,
      notes: notes
    }
  };
}

function doGet(e) {
  const params = (e && e.parameter) || {};
  const action = params.action || 'classes';

  if (action === 'metadata') {
    return jsonOutput({
      classes: getClassList(),
      statuses: getStatusList(),
      timeSlots: getTimeSlotListFromTimetable()
    });
  }

  if (action === 'timetable') {
    return jsonOutput(getClassGroupFromTimetable(params.date, params.timeSlot));
  }

  if (action === 'timeslots') {
    return jsonOutput(getTimeSlotListFromTimetable());
  }

  return jsonOutput(getClassList());
}

function doPost(e) {
  try {
    const body = (e && e.postData && e.postData.contents) || '{}';
    const data = JSON.parse(body);
    const result = saveLog(data);
    return jsonOutput({ status: 'success', message: result.message, data: result.saved });
  } catch (error) {
    return jsonOutput({ status: 'error', message: error.toString() });
  }
}

function jsonOutput(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function normalizeStatus(input) {
  const status = String(input || '').trim();
  if (!status) return STATUS_OPTIONS[0];

  const matched = STATUS_OPTIONS.find((item) => normalizeText(item) === normalizeText(status));
  return matched || STATUS_OPTIONS[0];
}

function normalizeDateInput(dateInput) {
  const tz = Session.getScriptTimeZone();
  const parsed = dateInput ? new Date(dateInput) : new Date();
  if (Number.isNaN(parsed.getTime())) return Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  return Utilities.formatDate(parsed, tz, 'yyyy-MM-dd');
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function ensureArchiveSheetSchema_(ss) {
  let archiveSheet = ss.getSheetByName('Archive');

  if (!archiveSheet) {
    archiveSheet = ss.insertSheet('Archive');
    console.log("Created 'Archive' sheet.");
  }

  const existingHeaders = archiveSheet
    .getRange(1, 1, 1, Math.max(archiveSheet.getLastColumn(), ARCHIVE_HEADERS.length))
    .getValues()[0];

  for (let i = 0; i < ARCHIVE_HEADERS.length; i += 1) {
    const current = String(existingHeaders[i] || '').trim();
    if (!current) archiveSheet.getRange(1, i + 1).setValue(ARCHIVE_HEADERS[i]);
  }

  archiveSheet.getRange('A1:G1').setFontWeight('bold').setBackground('#fff2cc');
  archiveSheet.setFrozenRows(1);
  archiveSheet.setColumnWidths(1, 5, 150);
  archiveSheet.setColumnWidth(6, 220);
  archiveSheet.setColumnWidth(7, 420);

  return archiveSheet;
}

function getClassFromTimetable_(dateInput, timeSlot) {
  const rows = getTimetableRows_();
  const slotStart = extractStartTimeFromSlot_(timeSlot);
  if (!slotStart) return '';

  const dayColumnIndex = getDayColumnIndex_(dateInput);
  if (dayColumnIndex < 0) return '';

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const start = formatTimeString_(row[0]);
    const end = formatTimeString_(row[1]);
    if (!start || !end) continue;

    if (isTimeWithinRange_(slotStart, start, end)) {
      return String(row[dayColumnIndex] || '').trim();
    }
  }

  return '';
}

function getTimetableRows_() {
  const timetable = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TIMETABLE_SHEET_NAME);
  if (!timetable) return [];

  return timetable
    .getRange(TIMETABLE_DATA_START_ROW, 1, TIMETABLE_DATA_ROWS, TIMETABLE_DATA_COLS)
    .getDisplayValues();
}

function getDayColumnIndex_(dateInput) {
  const parsed = dateInput ? new Date(dateInput) : new Date();
  if (Number.isNaN(parsed.getTime())) return -1;

  const jsDay = parsed.getDay();
  if (jsDay < 1 || jsDay > 5) return -1;

  return jsDay + 1;
}

function extractStartTimeFromSlot_(timeSlot) {
  const raw = String(timeSlot || '').trim();
  if (!raw) return '';

  const parts = raw.split('-');
  if (!parts.length) return '';
  return formatTimeString_(parts[0]);
}

function formatTimeString_(value) {
  const raw = String(value || '').trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return '';

  const hh = String(Number(match[1])).padStart(2, '0');
  const mm = match[2];
  return `${hh}:${mm}`;
}

function isTimeWithinRange_(time, start, end) {
  const t = toMinutes_(time);
  const s = toMinutes_(start);
  const e = toMinutes_(end);
  if (t < 0 || s < 0 || e < 0) return false;
  return t >= s && t < e;
}

function toMinutes_(hhmm) {
  const parts = String(hhmm || '').split(':');
  if (parts.length !== 2) return -1;

  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return -1;

  return h * 60 + m;
}

function uniqueList_(arr) {
  const seen = {};
  const out = [];

  arr.forEach((item) => {
    const key = String(item || '').trim();
    if (!key || seen[key]) return;
    seen[key] = true;
    out.push(key);
  });

  return out;
}
