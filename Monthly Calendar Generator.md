/*

This script generates a traditional monthly calendar in a 7-column grid for a specified month and year. Cells are sized to fill roughly a full screen with room to write notes inside each day.

## Features
- 7-column grid (Sunday → Saturday)
- Day-of-week column headers
- Month and year title centered above the grid
- Weekend days (Saturday & Sunday) highlighted
- Shaded empty cells for incomplete first/last weeks

## Customizable Colors

Select two rectangles before running the script:
- The **fill and stroke of the first rectangle** will be applied to weekday cells.
- The **fill of the second rectangle** will be used for weekend cells.

If no rectangles are selected, the default schema is used (white weekdays, light gray weekends).

```javascript
*/

// -------------------------------------
// Constants
// -------------------------------------

const CELL_WIDTH  = 196;    // Wide enough to write in
const CELL_HEIGHT = 182;    // Tall enough to write in
const START_X     = 0;
const START_Y     = 0;
const TITLE_HEIGHT  = 98;   // Vertical space for the month/year title
const HEADER_HEIGHT = 56;   // Vertical space for the day-name row

// Colors
let COLOR_WEEKDAY = "#ffffff";
let COLOR_WEEKEND = "#e8eaed";
let COLOR_EMPTY   = "#f4f5f7";  // Filler cells outside the month
let COLOR_TEXT    = "#000000";
const COLOR_STROKE = "#d0d4db";
let STROKE_WIDTH  = 1;
let FILLSTYLE     = "solid";
const ROUGHNESS   = 0;         // 0 = Architect
const FONT_FAMILY = 3;         // 1=Virgil 2=Helvetica 3=Cascadia 4=Little One

// Font sizes
const FONT_SIZE_TITLE  = 70;
const FONT_SIZE_HEADER = 36;
const FONT_SIZE_DAY    = 42;

// Calendar constants
const SATURDAY = 6;
const SUNDAY   = 0;

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// -------------------------------------
// User prompts
// -------------------------------------

const now = new Date();

let requestedYear = now.getFullYear();
requestedYear = parseFloat(await utils.inputPrompt("Year?", requestedYear, requestedYear));
if (isNaN(requestedYear)) { new Notice("Invalid year"); return; }

let requestedMonth = now.getMonth() + 1; // present as 1–12
requestedMonth = parseFloat(await utils.inputPrompt("Month (1–12)?", requestedMonth, requestedMonth));
if (isNaN(requestedMonth) || requestedMonth < 1 || requestedMonth > 12) {
  new Notice("Invalid month — enter a number from 1 to 12");
  return;
}
requestedMonth -= 1; // convert to 0-indexed for Date API

// -------------------------------------
// Pick up style from selected elements
// -------------------------------------

const elements = ea.getViewSelectedElements();
if (elements.length >= 1) {
  COLOR_WEEKDAY = elements[0].backgroundColor;
  FILLSTYLE     = elements[0].fillStyle;
  STROKE_WIDTH  = elements[0].strokeWidth;
}
if (elements.length >= 2) {
  COLOR_WEEKEND = elements[1].backgroundColor;
}

// -------------------------------------
// Helpers
// -------------------------------------

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay(); // 0=Sun … 6=Sat
}

// Approximate pixel width of a string at a given font size
function approxTextWidth(text, fontSize) {
  return text.length * fontSize * 0.55;
}

// -------------------------------------
// Layout calculations
// -------------------------------------

const daysInMonth    = getDaysInMonth(requestedYear, requestedMonth);
const firstDayOfWeek = getFirstDayOfMonth(requestedYear, requestedMonth);
const totalWidth     = CELL_WIDTH * 7;
const gridStartY     = START_Y + TITLE_HEIGHT + HEADER_HEIGHT;

// -------------------------------------
// Draw title
// -------------------------------------

ea.style.fontSize    = FONT_SIZE_TITLE;
ea.style.strokeColor = COLOR_TEXT;
ea.style.fontFamily  = FONT_FAMILY;

const title  = `${MONTH_NAMES[requestedMonth]} ${requestedYear}`;
const titleX = START_X + (totalWidth - approxTextWidth(title, FONT_SIZE_TITLE)) / 2;
ea.addText(titleX, START_Y + 20, title);

// -------------------------------------
// Draw day-of-week headers
// -------------------------------------

ea.style.fontSize = FONT_SIZE_HEADER;

for (let col = 0; col < 7; col++) {
  const label = DAY_NAMES[col];
  const x     = START_X + col * CELL_WIDTH;
  const textX = x + (CELL_WIDTH - approxTextWidth(label, FONT_SIZE_HEADER)) / 2;
  ea.addText(textX, START_Y + TITLE_HEIGHT + 16, label);
}

// -------------------------------------
// Cell drawing helper
// -------------------------------------

function drawCell(col, row, bgColor, dayNumber) {
  const x = START_X + col * CELL_WIDTH;
  const y = gridStartY + row * CELL_HEIGHT;

  ea.style.backgroundColor = bgColor;
  ea.style.strokeColor     = COLOR_STROKE;
  ea.style.strokeWidth     = STROKE_WIDTH;
  ea.style.fillStyle       = FILLSTYLE;
  ea.style.roughness       = ROUGHNESS;
  ea.addRect(x, y, CELL_WIDTH, CELL_HEIGHT);

  if (dayNumber !== null) {
    ea.style.fontSize    = FONT_SIZE_DAY;
    ea.style.strokeColor = COLOR_TEXT;
    ea.style.fontFamily  = FONT_FAMILY;
    ea.addText(x + 14, y + 14, String(dayNumber));
  }
}

// -------------------------------------
// Draw cells
// -------------------------------------

// Leading empty cells (days before the 1st)
for (let i = 0; i < firstDayOfWeek; i++) {
  drawCell(i, 0, COLOR_EMPTY, null);
}

// Day cells
for (let day = 1; day <= daysInMonth; day++) {
  const cellIndex = firstDayOfWeek + day - 1;
  const col       = cellIndex % 7;
  const row       = Math.floor(cellIndex / 7);
  const dayOfWeek = new Date(requestedYear, requestedMonth, day).getDay();
  const isWeekend = dayOfWeek === SATURDAY || dayOfWeek === SUNDAY;
  drawCell(col, row, isWeekend ? COLOR_WEEKEND : COLOR_WEEKDAY, day);
}

// Trailing empty cells (remainder of last week row)
const lastCellIndex = firstDayOfWeek + daysInMonth - 1;
const lastCol       = lastCellIndex % 7;
const lastRow       = Math.floor(lastCellIndex / 7);
for (let col = lastCol + 1; col < 7; col++) {
  drawCell(col, lastRow, COLOR_EMPTY, null);
}

// -------------------------------------

await ea.addElementsToView(false, false, true);
