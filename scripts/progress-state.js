#!/usr/bin/env node
/**
 * Minimal progress state helper.
 * Usage:
 *   node scripts/progress-state.js show
 *   node scripts/progress-state.js set key value
 *   node scripts/progress-state.js append-log "message text"
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const LOG_DIR = path.join(ROOT, 'project-log');
const STATE_FILE = path.join(LOG_DIR, 'progress_state.json');
const LOG_FILE = path.join(LOG_DIR, 'PROGRESS_LOG.md');

function ensureFiles() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
  if (!fs.existsSync(STATE_FILE)) {
    const obj = { schema_version: 1, last_update: new Date().toISOString(), current_branch: 'main', next_steps: [] };
    fs.writeFileSync(STATE_FILE, JSON.stringify(obj, null, 2));
  }
  if (!fs.existsSync(LOG_FILE)) {
    const header = '# Project Progress Log\n\n';
    fs.writeFileSync(LOG_FILE, header);
  }
}

function loadState() { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); }
function saveState(obj) {
  obj.last_update = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(obj, null, 2));
}
function appendLog(line) {
  const ts = new Date().toISOString().replace('T', ' ').replace('Z', ' UTC');
  fs.appendFileSync(LOG_FILE, `- ${ts} — ${line}\n`);
}

function main() {
  ensureFiles();
  const [cmd, key, ...rest] = process.argv.slice(2);
  if (!cmd || cmd === 'show') {
    console.log(loadState());
    return;
  }
  if (cmd === 'set') {
    if (!key || rest.length === 0) { console.error('Usage: set key value'); process.exit(1); }
    const value = rest.join(' ');
    const s = loadState();
    s[key] = value;
    saveState(s);
    appendLog(`set ${key} = ${value}`);
    console.log('OK');
    return;
  }
  if (cmd === 'append-log') {
    const msg = [key, ...rest].filter(Boolean).join(' ');
    if (!msg) { console.error('Usage: append-log "message"'); process.exit(1); }
    appendLog(msg);
    console.log('OK');
    return;
  }
  console.error('Unknown command');
  process.exit(1);
}

main();

