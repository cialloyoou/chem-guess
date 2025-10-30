const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE_PATH = path.join(DATA_DIR, 'leaderboard.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadScores() {
  try {
    ensureDir();
    if (!fs.existsSync(FILE_PATH)) return {};
    const raw = fs.readFileSync(FILE_PATH, 'utf8');
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return {};
    return data;
  } catch (e) {
    console.error('[leaderboard] load error:', e);
    return {};
  }
}

function saveScores(obj) {
  try {
    ensureDir();
    fs.writeFileSync(FILE_PATH, JSON.stringify(obj, null, 2), 'utf8');
  } catch (e) {
    console.error('[leaderboard] save error:', e);
  }
}

function sanitizeString(s, maxLen = 50) {
  return String(s || '')
    .replace(/[\n\r\t]/g, ' ')
    .trim()
    .slice(0, maxLen);
}

function normalizeRecord(input) {
  const machineId = sanitizeString(input.machineId, 120);
  const username = sanitizeString(input.username || '未命名', 40);
  const group = sanitizeString(input.group || '未分组', 40);
  let wins = Number(input.wins || 0);
  let total = Number(input.total || 0);
  wins = isFinite(wins) && wins >= 0 ? Math.floor(wins) : 0;
  total = isFinite(total) && total >= 0 ? Math.floor(total) : 0;
  if (wins > total) wins = total;
  return { machineId, username, group, wins, total };
}

function upsertScore(input) {
  const rec = normalizeRecord(input);
  if (!rec.machineId) throw new Error('machineId required');
  const db = loadScores();
  const prev = db[rec.machineId];
  // Accept client-side aggregated stats (wins/total overwrite)
  db[rec.machineId] = {
    machineId: rec.machineId,
    username: rec.username,
    group: rec.group,
    wins: rec.wins,
    total: rec.total,
    updatedAt: Date.now(),
  };
  saveScores(db);
  return db[rec.machineId];
}

function getLeaderboard(group) {
  const db = loadScores();
  const arr = Object.values(db);
  const filtered = group && group !== 'ALL' ? arr.filter(x => x.group === group) : arr;
  filtered.forEach(x => {
    x.accuracy = x.total > 0 ? x.wins / x.total : 0;
  });
  filtered.sort((a, b) => {
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.total - b.total;
  });
  return filtered.slice(0, 100);
}

function getGroupSummary() {
  const db = loadScores();
  const map = new Map();
  for (const r of Object.values(db)) {
    const k = r.group || '未分组';
    const v = map.get(k) || { group: k, wins: 0, total: 0 };
    v.wins += Number(r.wins || 0);
    v.total += Number(r.total || 0);
    map.set(k, v);
  }
  const list = Array.from(map.values()).map(v => ({
    ...v,
    accuracy: v.total > 0 ? v.wins / v.total : 0,
  }));
  list.sort((a, b) => {
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.total - b.total;
  });
  return list;
}

function getProfile(machineId) {
  const db = loadScores();
  return db[machineId] || null;
}

module.exports = {
  upsertScore,
  getLeaderboard,
  getGroupSummary,
  getProfile,
};

