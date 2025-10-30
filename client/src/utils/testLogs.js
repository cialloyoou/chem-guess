// Utilities for persisting chemistry test logs in browser storage
// Each log entry shape:
// {
//   id: number,
//   startTime: number,
//   endTime: number,
//   durationSec: number,
//   answer: { formula: string, name: string },
//   guesses: Array<{ formula: string, name: string }>,
//   result: 'success' | 'fail',
//   reason?: 'timer' | 'attempts' | 'correct'
// }

const KEY = 'chem_test_logs';

export function loadTestLogs() {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveTestLogs(logs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(logs));
  } catch {}
}

export function addTestLog(entry, max = 200) {
  const now = Date.now();
  const withId = { id: now, ...(entry || {}) };
  const prev = loadTestLogs();
  const next = [withId, ...prev].slice(0, max);
  saveTestLogs(next);
  try { window.dispatchEvent(new Event('chem-logs-updated')); } catch {}
  return withId.id;
}

export function clearTestLogs() {
  saveTestLogs([]);
}

export function removeTestLog(id) {
  const prev = loadTestLogs();
  const next = prev.filter(x => x.id !== id);
  saveTestLogs(next);
}

