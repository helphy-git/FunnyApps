/*

This script generates a traditional monthly calendar in a 7-column grid. It supports small / medium / large sizing and can render multiple consecutive months tiled in a configurable column layout.

## Features
- 7-column grid (Sunday → Saturday)
- Three size presets: S (compact overview), M (default), L (write-in)
- Render 1–12 consecutive months, tiled in a grid
- Weekend days highlighted; shaded empty cells for incomplete weeks
- Year wraps automatically when months span a year boundary

## Customizable Colors

Select two rectangles before running the script:
- The **fill and stroke of the first rectangle** will be applied to weekday cells.
- The **fill of the second rectangle** will be used for weekend cells.

If no rectangles are selected, the default schema is used (white weekdays, light gray weekends).

```javascript
*/

// -------------------------------------
// Size presets  (all values scale together)
// -------------------------------------
//   S  →  80 px cells  — fits many months on screen, thin fonts
//   M  → 196 px cells  — default, comfortable reading
//   L  → 280 px cells  — large write-in cells

const SIZES = {
  S: { CELL_WIDTH: 80,  CELL_HEIGHT: 70,  TITLE_HEIGHT: 40,  HEADER_HEIGHT: 22, FONT_TITLE: 28, FONT_HEADER: 14, FONT_DAY: 16, PAD: 4  },
  M: { CELL_WIDTH: 196, CELL_HEIGHT: 182, TITLE_HEIGHT: 98,  HEADER_HEIGHT: 56, FONT_TITLE: 70, FONT_HEADER: 36, FONT_DAY: 42, PAD: 10 },
  L: { CELL_WIDTH: 280, CELL_HEIGHT: 260, TITLE_HEIGHT: 140, HEADER_HEIGHT: 80, FONT_TITLE: 100, FONT_HEADER: 52, FONT_DAY: 60, PAD: 14 },
};

// -------------------------------------
// Fixed style constants
// -------------------------------------

let COLOR_WEEKDAY = "#ffffff";
let COLOR_WEEKEND = "#e8eaed";
const COLOR_EMPTY  = "#f4f5f7";
const COLOR_TEXT   = "#000000";
const COLOR_STROKE = "#d0d4db";
let STROKE_WIDTH   = 1;
let FILLSTYLE      = "solid";
const ROUGHNESS    = 0;     // 0 = Architect
const FONT_FAMILY  = 3;     // 1=Virgil 2=Helvetica 3=Cascadia 4=Little One

const SATURDAY = 6;
const SUNDAY   = 0;

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

// -------------------------------------
// Prompts
// -------------------------------------

const now = new Date();

// Size
let sizeInput = await utils.inputPrompt("Size? (S / M / L)", "M", "M");
sizeInput = sizeInput.trim().toUpperCase();
if (!SIZES[sizeInput]) { new Notice("Invalid size — enter S, M, or L"); return; }
const SZ = SIZES[sizeInput];

// Year
let requestedYear = now.getFullYear();
requestedYear = parseFloat(await utils.inputPrompt("Starting year?", requestedYear, requestedYear));
if (isNaN(requestedYear)) { new Notice("Invalid year"); return; }

// Starting month
let startMonth = now.getMonth() + 1; // show as 1–12
startMonth = parseFloat(await utils.inputPrompt("Starting month (1–12)?", startMonth, startMonth));
if (isNaN(startMonth) || startMonth < 1 || startMonth > 12) {
  new Notice("Invalid month — enter 1 to 12");
  return;
}
startMonth -= 1; // convert to 0-indexed

// How many months
let monthCount = 1;
monthCount = parseFloat(await utils.inputPrompt("How many months? (1–12)", "1", "1"));
if (isNaN(monthCount) || monthCount < 1 || monthCount > 12) {
  new Notice("Enter a number from 1 to 12");
  return;
}
monthCount = Math.round(monthCount);

// Columns (only ask if more than one month)
let numCols = 1;
if (monthCount > 1) {
  const defaultCols = Math.min(monthCount, 3);
  numCols = parseFloat(await utils.inputPrompt(`Columns? (1–${monthCount})`, defaultCols, defaultCols));
  if (isNaN(numCols) || numCols < 1 || numCols > monthCount) {
    new Notice("Invalid column count");
    return;
  }
  numCols = Math.round(numCols);
}

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
  return new Date(year, month, 1).getDay();
}

function approxTextWidth(text, fontSize) {
  return text.length * fontSize * 0.55;
}

// -------------------------------------
// Single-month drawing function
// -------------------------------------

function drawMonth(year, month, ox, oy) {
  const daysInMonth    = getDaysInMonth(year, month);
  const firstDayOfWeek = getFirstDayOfMonth(year, month);
  const calWidth       = SZ.CELL_WIDTH * 7;
  const gridStartY     = oy + SZ.TITLE_HEIGHT + SZ.HEADER_HEIGHT;

  // Title
  ea.style.fontSize    = SZ.FONT_TITLE;
  ea.style.strokeColor = COLOR_TEXT;
  ea.style.fontFamily  = FONT_FAMILY;
  const title  = `${MONTH_NAMES[month]} ${year}`;
  const titleX = ox + (calWidth - approxTextWidth(title, SZ.FONT_TITLE)) / 2;
  ea.addText(titleX, oy + SZ.PAD, title);

  // Day-of-week headers
  ea.style.fontSize = SZ.FONT_HEADER;
  for (let col = 0; col < 7; col++) {
    const label = DAY_NAMES[col];
    const x     = ox + col * SZ.CELL_WIDTH;
    const textX = x + (SZ.CELL_WIDTH - approxTextWidth(label, SZ.FONT_HEADER)) / 2;
    ea.addText(textX, oy + SZ.TITLE_HEIGHT + SZ.PAD, label);
  }

  // Cell drawing helper (local, uses closure over ox/oy/gridStartY)
  function drawCell(col, row, bgColor, dayNumber) {
    const x = ox + col * SZ.CELL_WIDTH;
    const y = gridStartY + row * SZ.CELL_HEIGHT;

    ea.style.backgroundColor = bgColor;
    ea.style.strokeColor     = COLOR_STROKE;
    ea.style.strokeWidth     = STROKE_WIDTH;
    ea.style.fillStyle       = FILLSTYLE;
    ea.style.roughness       = ROUGHNESS;
    ea.addRect(x, y, SZ.CELL_WIDTH, SZ.CELL_HEIGHT);

    if (dayNumber !== null) {
      ea.style.fontSize    = SZ.FONT_DAY;
      ea.style.strokeColor = COLOR_TEXT;
      ea.style.fontFamily  = FONT_FAMILY;
      ea.addText(x + SZ.PAD, y + SZ.PAD, String(dayNumber));
    }
  }

  // Leading empty cells
  for (let i = 0; i < firstDayOfWeek; i++) {
    drawCell(i, 0, COLOR_EMPTY, null);
  }

  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const cellIndex = firstDayOfWeek + day - 1;
    const col       = cellIndex % 7;
    const row       = Math.floor(cellIndex / 7);
    const dow       = new Date(year, month, day).getDay();
    const isWeekend = dow === SATURDAY || dow === SUNDAY;
    drawCell(col, row, isWeekend ? COLOR_WEEKEND : COLOR_WEEKDAY, day);
  }

  // Trailing empty cells
  const lastIndex = firstDayOfWeek + daysInMonth - 1;
  const lastCol   = lastIndex % 7;
  const lastRow   = Math.floor(lastIndex / 7);
  for (let col = lastCol + 1; col < 7; col++) {
    drawCell(col, lastRow, COLOR_EMPTY, null);
  }
}

// -------------------------------------
// Tiled layout
// -------------------------------------

// Gap between calendars scaled to cell size
const CAL_GAP_X = Math.round(SZ.CELL_WIDTH  * 0.35);
const CAL_GAP_Y = Math.round(SZ.CELL_HEIGHT * 0.5);

// Tallest possible calendar = title + header + 6 week-rows
const MAX_CAL_HEIGHT = SZ.TITLE_HEIGHT + SZ.HEADER_HEIGHT + 6 * SZ.CELL_HEIGHT;

const calStepX = SZ.CELL_WIDTH * 7 + CAL_GAP_X;
const calStepY = MAX_CAL_HEIGHT    + CAL_GAP_Y;

for (let i = 0; i < monthCount; i++) {
  const month = (startMonth + i) % 12;
  const year  = requestedYear + Math.floor((startMonth + i) / 12);
  const gridCol = i % numCols;
  const gridRow = Math.floor(i / numCols);
  drawMonth(year, month, gridCol * calStepX, gridRow * calStepY);
}

// -------------------------------------

await ea.addElementsToView(false, false, true);
