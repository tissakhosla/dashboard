#!/usr/bin/env node

const WORKER_URL = 'https://slog-api.tissa-music.workers.dev';

const MS_PER_DAY = 86400000;

const DAY_SHORT   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_LONG  = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];

const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  cyan:   '\x1b[36m',
  yellow: '\x1b[33m',
  blue:   '\x1b[34m',
  green:  '\x1b[32m',
};

function parseTimestamp(ts) {
  if (!ts) return null;
  const date = new Date(ts);
  return isNaN(date.getTime()) ? null : date;
}

function formatDuration(ms) {
  if (!ms || ms <= 0) return null;
  const totalMinutes = Math.round(ms / 60000);
  const h  = Math.floor(totalMinutes / 60);
  const m  = totalMinutes % 60;
  const mm = String(m).padStart(2, ' ');
  if (h === 0) return `${mm}m`;
  return `${h}h ${mm}m`;
}

function formatTime(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function dateLabel(date) {
  return `${DAY_SHORT[date.getDay()]} ${MONTH_SHORT[date.getMonth()]} ${date.getDate()}`;
}

// Prints individual sessions with time ranges. Used in client-filter mode.
function printSessions(title, sessions, indent = '') {
  if (sessions.length === 0) return false;
  if (title) console.log(`${indent}${C.yellow}${C.bold}${title}${C.reset}`);
  for (const session of sessions) {
    const range    = `${C.cyan}${formatTime(session.start)}–${formatTime(session.end)}${C.reset}`;
    const duration = `${C.bold}${(formatDuration(session.duration) || '00m').padStart(8)}${C.reset}`;
    const notes    = session.notes ? `  ${C.dim}${session.notes}${C.reset}` : '';
    console.log(`${indent}  ${range}  ${duration}${notes}`);
  }
  const total = sessions.reduce((sum, s) => sum + s.duration, 0);
  console.log(`${indent}  ${C.dim}${'─'.repeat(11)}${C.reset}  ${C.bold}${C.green}${(formatDuration(total) || '00m').padStart(8)}${C.reset}`);
  return true;
}

// Prints time totals aggregated by client. Used in the default summary view.
function printClientTotals(title, sessions, indent = '') {
  const byClient = {};
  let total = 0;
  for (const session of sessions) {
    byClient[session.client] = (byClient[session.client] || 0) + session.duration;
    total += session.duration;
  }
  if (total === 0) return false;
  if (title) console.log(`${indent}${C.yellow}${C.bold}${title}${C.reset}`);
  for (const client of Object.keys(byClient).sort()) {
    const dur = (formatDuration(byClient[client]) || '00m').padStart(8);
    console.log(`${indent}  ${C.dim}${client.padEnd(11)}${C.reset}  ${dur}`);
  }
  console.log(`${indent}  ${C.bold}${'Total'.padEnd(11)}  ${C.green}${(formatDuration(total) || '00m').padStart(8)}${C.reset}`);
  return true;
}

function sectionHeader(label) {
  console.log(`\n${C.bold}${C.cyan}${label}${C.reset}`);
}

async function main() {
  const clientFilter = process.argv[2] ?? null;

  const res = await fetch(WORKER_URL);
  if (!res.ok) { console.error('Failed to fetch:', res.status); process.exit(1); }
  const rows = await res.json();

  const sessions = [];
  for (let i = 0; i < rows.length; i++) {
    const [ts, client, notes] = rows[i];
    if (!client?.trim()) continue;
    const start    = parseTimestamp(ts);
    if (!start) continue;
    const end      = (i + 1 < rows.length ? parseTimestamp(rows[i + 1][0]) : null) ?? new Date();
    const duration = end - start;
    if (duration < 0) continue;
    sessions.push({ start, end, duration, client: client.trim(), notes: (notes || '').trim() });
  }

  const filteredSessions = clientFilter
    ? sessions.filter(s => s.client.toLowerCase() === clientFilter.toLowerCase())
    : sessions;

  const inRange     = (start, end) => filteredSessions.filter(s => s.start >= start && s.start < end);
  const printPeriod = clientFilter ? printSessions : printClientTotals;

  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // ── TODAY ────────────────────────────────────────────────────────────────
  sectionHeader(`TODAY  ${dateLabel(now)}`);
  if (!printPeriod(null, inRange(today, new Date(today.getTime() + MS_PER_DAY)))) {
    console.log(`  ${C.dim}—${C.reset}`);
  }

  // ── THIS WEEK (Mon–Sun) ──────────────────────────────────────────────────
  const dow        = (now.getDay() + 6) % 7; // 0=Mon
  const weekStart  = new Date(today.getTime() - dow * MS_PER_DAY);
  const weekEndDay = new Date(weekStart.getTime() + 6 * MS_PER_DAY);
  sectionHeader(`THIS WEEK  ${MONTH_SHORT[weekStart.getMonth()]} ${weekStart.getDate()} – ${MONTH_SHORT[weekEndDay.getMonth()]} ${weekEndDay.getDate()}`);

  for (let d = 0; d < 7; d++) {
    const dayStart = new Date(weekStart.getTime() + d * MS_PER_DAY);
    if (dayStart > now) break;
    const dayEnd = new Date(dayStart.getTime() + MS_PER_DAY);
    printPeriod(dateLabel(dayStart), inRange(dayStart, dayEnd), '  ');
  }
  printClientTotals('Week Total', inRange(weekStart, new Date(weekStart.getTime() + 7 * MS_PER_DAY)), '  ');

  // ── THIS MONTH ───────────────────────────────────────────────────────────
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  sectionHeader(`THIS MONTH  ${MONTH_LONG[now.getMonth()]} ${now.getFullYear()}`);

  for (let day = 1; day < 32; day += 7) {
    const wStart   = new Date(now.getFullYear(), now.getMonth(), day);
    if (wStart >= monthEnd || wStart > now) break;
    const wEnd     = new Date(now.getFullYear(), now.getMonth(), day + 7);
    const sliceEnd = wEnd < monthEnd ? wEnd : monthEnd;
    const lastDay  = new Date(sliceEnd.getTime() - MS_PER_DAY).getDate();
    const label    = `${MONTH_SHORT[now.getMonth()]} ${day}–${lastDay}`;
    printPeriod(label, inRange(wStart, sliceEnd), '  ');
  }
  printClientTotals('Month Total', inRange(monthStart, monthEnd), '  ');

  // ── THIS YEAR ────────────────────────────────────────────────────────────
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd   = new Date(now.getFullYear() + 1, 0, 1);
  sectionHeader(`THIS YEAR  ${now.getFullYear()}`);

  for (let m = 0; m < 12; m++) {
    const mStart = new Date(now.getFullYear(), m, 1);
    if (mStart > now) break;
    const mEnd = new Date(now.getFullYear(), m + 1, 1);
    printClientTotals(MONTH_LONG[m], inRange(mStart, mEnd), '  ');
  }
  printClientTotals('Year Total', inRange(yearStart, yearEnd), '  ');

  console.log();
}

main().catch(e => { console.error(e.message); process.exit(1); });
