/**
 * Teacher Log + Timetable auto-fill system.
 *
 * SHEETS USED:
 * - Classes   : Col A = Class Name
 * - Timetable : Col A = Day, Col B = Time Slot, Col C = Class, Col D = Group
 * - Archive   : Date | Time Slot | Class | Group | Status | Log Entry / Notes
 */

const STATUS_OPTIONS = ['Planned', 'Done', 'Skipped', 'Late', 'Cancelled'];

/**
 * 1 - SAFE SETUP: Creates sheets only if they don't exist.
 * NEVER deletes your data.
 */
function setupSystem() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // --- A. Setup CLASSES Sheet ---
  let classSheet = ss.getSheetByName('Classes');

  if (!classSheet) {
    classSheet = ss.insertSheet('Classes');
    classSheet
      .getRange('A1')
      .setValue('Class Name')
      .setFontWeight('bold')
      .setBackground('#cfe2f3');
    console.log("Created 'Classes' sheet.");
  } else {
    console.log("'Classes' sheet already exists. Skipping to protect data.");
  }

  // --- B. Setup TIMETABLE Sheet ---
  let timetableSheet = ss.getSheetByName('Timetable');

  if (!timetableSheet) {
    timetableSheet = ss.insertSheet('Timetable');
    timetableSheet
      .getRange('A1:D1')
      .setValues([['Day', 'Time Slot', 'Class', 'Group']])
      .setFontWeight('bold')
      .setBackground('#d9ead3');
    timetableSheet.setFrozenRows(1);
    timetableSheet.setColumnWidths(1, 4, 140);

    const sample = [
      ['Monday', '08:00-09:00', 'Math 7A', 'Group A'],
      ['Monday', '09:00-10:00', 'Science 7A', 'Group B'],
      ['Tuesday', '10:00-11:00', 'English 7B', 'Group A']
    ];
    timetableSheet.getRange(2, 1, sample.length, sample[0].length).setValues(sample);
    console.log("Created 'Timetable' sheet.");
  } else {
    console.log("'Timetable' sheet already exists. Skipping to protect data.");
  }

  // --- C. Setup ARCHIVE Sheet ---
  let archiveSheet = ss.getSheetByName('Archive');

  if (!archiveSheet) {
    archiveSheet = ss.insertSheet('Archive');
    const headers = [['Date', 'Time Slot', 'Class', 'Group', 'Status', 'Log Entry / Notes']];
    archiveSheet.getRange('A1:F1').setValues(headers).setFontWeight('bold').setBackground('#fff2cc');
    archiveSheet.setFrozenRows(1);
    archiveSheet.setColumnWidths(1, 6, 150);
    archiveSheet.setColumnWidth(6, 400);
    console.log("Created 'Archive' sheet.");
  } else {
    console.log("'Archive' sheet already exists. Skipping to protect data.");
  }
}

/**
 * 2. MENU: Adds the button to the top bar.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('⭐ Teacher Log')
    .addItem('Open Logger Sidebar', 'showSidebar')
    .addToUi();
}

/**
 * 3. SIDEBAR: Shows the HTML form.
 */
function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar').setTitle('Class Log').setWidth(500);
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * 4. HELPER: Get list of classes for the dropdown.
 */
function getClassList() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Classes');
  if (!sheet) return [];

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  return data.flat().filter(String).sort();
}

/**
 * HELPER: Return list of valid statuses for a status dropdown.
 */
function getStatusList() {
  return STATUS_OPTIONS.slice();
}

/**
 * HELPER: Find class/group from timetable by day + time slot.
 */
function getClassGroupFromTimetable(dateInput, timeSlot) {
  const timetable = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Timetable');
  if (!timetable) return { className: '', groupName: '' };

  const lastRow = timetable.getLastRow();
  if (lastRow < 2) return { className: '', groupName: '' };

  const rows = timetable.getRange(2, 1, lastRow - 1, 4).getValues();
  const dayName = getDayName(dateInput);
  const normalizedSlot = normalizeText(timeSlot);

  for (const row of rows) {
    const [day, slot, className, groupName] = row;
    if (normalizeText(day) === normalizeText(dayName) && normalizeText(slot) === normalizedSlot) {
      return {
        className: className || '',
        groupName: groupName || ''
      };
    }
  }

  return { className: '', groupName: '' };
}

/**
 * 5. SAVE: Receives data from HTML and appends to Archive.
 * If class/group are missing, it auto-fills from timetable.
 */
function saveLog(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const archive = ss.getSheetByName('Archive');

  const timetableMatch = getClassGroupFromTimetable(data.date, data.timeSlot);
  const className = data.className || timetableMatch.className;
  const groupName = data.groupName || timetableMatch.groupName;

  archive.appendRow([
    data.date,
    data.timeSlot,
    className,
    groupName,
    normalizeStatus(data.status),
    data.notes || ''
  ]);

  return 'Log saved successfully!';
}

// --- WEB APP HANDLERS ---

/**
 * Handle GET requests.
 * - action=classes  -> returns class list
 * - action=metadata -> returns classes + statuses
 * - action=timetable&date=YYYY-MM-DD&timeSlot=08:00-09:00 -> class/group auto match
 */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'classes';

  if (action === 'metadata') {
    return jsonOutput({
      classes: getClassList(),
      statuses: getStatusList()
    });
  }

  if (action === 'timetable') {
    const date = e.parameter.date;
    const timeSlot = e.parameter.timeSlot;
    return jsonOutput(getClassGroupFromTimetable(date, timeSlot));
  }

  return jsonOutput(getClassList());
}

/**
 * Handle POST requests.
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');

    const result = saveLog({
      date: data.date,
      timeSlot: data.timeSlot,
      className: data.className,
      groupName: data.groupName,
      status: data.status,
      notes: data.notes
    });

    return jsonOutput({ status: 'success', message: result });
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

function getDayName(dateInput) {
  const tz = Session.getScriptTimeZone();

  if (!dateInput) {
    return Utilities.formatDate(new Date(), tz, 'EEEE');
  }

  const parsed = new Date(dateInput);
  if (Number.isNaN(parsed.getTime())) {
    return Utilities.formatDate(new Date(), tz, 'EEEE');
  }

  return Utilities.formatDate(parsed, tz, 'EEEE');
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}
