const fs = require('fs');
const path = require('path');
const https = require('https');
const httpMod = require('http');
let XLSX; try { XLSX = require('xlsx'); } catch {}

// Optional remote/local data sources
let __remoteCSV = process.env.CHEM_CSV_URL || null;
let __remoteXLSX = process.env.CHEM_XLSX_URL || null;
const __localXLSXPath = process.env.CHEM_XLSX_PATH || path.join(__dirname, '../data/chemistry_questions.xlsx');

let __csvList = null;   // parsed list from remote CSV
let __xlsxList = null;  // parsed list from xlsx (local or remote)


/**
 * Load chemistry questions from JSON file
 * @returns {Array} Array of chemistry question objects
 */
function loadChemistryQuestions() {
  try {
    const filePath = path.join(__dirname, '../data/chemistry_questions.json');
    const rawData = fs.readFileSync(filePath, 'utf8');
    const questions = JSON.parse(rawData);

    console.log(`Successfully loaded ${questions.length} chemistry questions`);
    return questions;
  } catch (error) {
    console.error('Error loading chemistry questions:', error);
    throw error;
  }
}

/**
 * Validate chemistry question structure
 * @param {Object} question - Chemistry question object
 * @returns {boolean} True if valid
 */
function validateQuestion(question) {
  if (!question.formula || typeof question.formula !== 'string') {
    return false;
  }
  if (!question.name || typeof question.name !== 'string') {
    return false;
  }
  if (!question.labels || typeof question.labels !== 'object') {
    return false;
  }

  const labels = question.labels;
  if (!labels.acidBase || !labels.hydrolysisElectrolysis || !labels.state || !labels.other) {
    return false;
  }
  if (!Array.isArray(labels.reactions)) {
    return false;
  }
  return true;
}

// --- Minimal CSV parser (handles quotes and commas) ---
function parseCSV(text){
  // Strip UTF-8 BOM if present to avoid header corruption in first cell
  if (text && text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
  }
  const rows=[]; let i=0; let field=''; let row=[]; let inQuotes=false;
  while(i<text.length){
    const c=text[i];
    if(inQuotes){
      if(c==='"'){
        if(text[i+1]==='"'){ field+='"'; i+=2; continue; } else { inQuotes=false; i++; continue; }
      } else { field+=c; i++; continue; }
    } else {
      if(c==='"'){ inQuotes=true; i++; continue; }
      if(c===','){ row.push(field); field=''; i++; continue; }
      if(c==='\n'){ row.push(field); rows.push(row); row=[]; field=''; i++; continue; }
      if(c==='\r'){ i++; continue; }
      field+=c; i++; continue;
    }
  }
  if(field.length>0 || row.length>0){ row.push(field); rows.push(row); }
  return rows;
}

function mapCSVRowsToQuestions(rows){
  if(!rows || rows.length===0) return [];
  const header = rows[0].map(h=>String(h||'').trim());
  // Expect: 化学式, 名称, 酸碱性, 水解/电解, 状态, 反应, 其他性质
  const idx = (k)=> header.findIndex(h=>h===k);
  const iFormula=idx('化学式'), iName=idx('名称'), iAcid=idx('酸碱性'), iHyd=idx('水解/电解'), iState=idx('状态'), iReac=idx('反应'), iOther=idx('其他性质');
  const list=[];
  for(let r=1;r<rows.length;r++){
    const row = rows[r]; if(!row || row.length===0) continue;
    const formula = String(row[iFormula]||'').trim(); if(!formula) continue;
    const name = String(row[iName]||'').trim();
    const acidBase = String(row[iAcid]||'').trim();
    const hyd = String(row[iHyd]||'').trim();
    const state = String(row[iState]||'').trim();
    const reactions = String(row[iReac]||'').split('/').map(s=>s.trim()).filter(Boolean);
    const other = String(row[iOther]||'').trim();
    const q={ formula, name, labels:{ acidBase, hydrolysisElectrolysis: hyd, state, reactions, other } };
    if(validateQuestion(q)) list.push(q);
  }
  return list;
}

function fetchText(url){
  return new Promise((resolve, reject)=>{
    try{
      const mod = url.startsWith('https')? https: httpMod;
      mod.get(url, (res)=>{
        if(res.statusCode>=300 && res.statusCode<400 && res.headers.location){
          // follow redirect once
          return fetchText(res.headers.location).then(resolve, reject);
        }
        if(res.statusCode!==200){ return reject(new Error('HTTP '+res.statusCode)); }
        let data=''; res.setEncoding('utf8');
        res.on('data', chunk=> data+=chunk);
        res.on('end', ()=> resolve(data));
      }).on('error', reject);
    }catch(e){ reject(e); }
  });
}

async function reload(){
  // Prefer remote XLSX > remote CSV > local XLSX
  if (__remoteXLSX && XLSX){
    const ok = await reloadFromRemoteXLSX();
    if (ok) return true;
  }
  if (__remoteCSV){
    const text = await fetchText(__remoteCSV);
    const rows = parseCSV(text);
    const list = mapCSVRowsToQuestions(rows);
    __csvList = list;
    __chem_bag = [];
    console.log(`[chemistry] Remote CSV loaded: ${list.length} rows`);
    return true;
  }
  const okLocal = reloadFromLocalXLSX();
  return !!okLocal;
}


/**
 * Get all chemistry questions
 * @returns {Array} Array of all chemistry questions
 */
function getAllQuestions() {
  if (Array.isArray(__xlsxList) && __xlsxList.length>0) {
    return __xlsxList;
  }
  if (XLSX && fs.existsSync(__localXLSXPath)) {
    if (reloadFromLocalXLSX() && Array.isArray(__xlsxList) && __xlsxList.length>0) {
      return __xlsxList;
    }
  }
  if (Array.isArray(__csvList) && __csvList.length>0) {
    return __csvList;
  }
  const questions = loadChemistryQuestions();
  return questions.filter(validateQuestion);
}

// ===== Shuffle Bag (short-bag) for non-repeating random draw =====
let __chem_bag = [];
const __bagSize = Math.max(1, parseInt(process.env.CHEM_BAG_SIZE || '30', 10));
function __shuffle(arr){
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function __refillBag(){
  const all = getAllQuestions();
  const pool = all.slice();
  __shuffle(pool);
  __chem_bag = pool.slice(0, Math.min(__bagSize, pool.length));
}

// === XLSX helpers (optional) ===
function mapSheetRowsToQuestions(rows){
  return mapCSVRowsToQuestions(rows);
}

async function fetchBinary(url){
  return new Promise((resolve, reject)=>{
    try{
      const mod = url.startsWith('https')? https: httpMod;
      mod.get(url, (res)=>{
        if(res.statusCode>=300 && res.statusCode<400 && res.headers.location){
          return fetchBinary(res.headers.location).then(resolve,reject);
        }
        if(res.statusCode!==200){ return reject(new Error('HTTP '+res.statusCode)); }
        const chunks=[]; res.on('data',c=>chunks.push(c)); res.on('end',()=>resolve(Buffer.concat(chunks)));
      }).on('error', reject);
    }catch(e){ reject(e); }
  });
}

function reloadFromLocalXLSX(){
  if (!XLSX) return false;
  const candidates = [
    __localXLSXPath,
    path.join(__dirname, '../data/chemistry_questions_export.xlsx')
  ];
  const picked = candidates.find(p => p && fs.existsSync(p));
  if (!picked) return false;
  try{
    const wb = XLSX.readFile(picked);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header:1, defval:'' });
    __xlsxList = mapSheetRowsToQuestions(rows);
    __chem_bag = [];
    console.log(`[chemistry] Local XLSX loaded: ${__xlsxList.length} rows from ${path.basename(picked)}`);
    return true;
  }catch(e){ console.error('Local XLSX load error', e); return false; }
}

async function reloadFromRemoteXLSX(){
  if (!XLSX || !__remoteXLSX) return false;
  try{
    const buf = await fetchBinary(__remoteXLSX);
    const wb = XLSX.read(buf, { type:'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header:1, defval:'' });
    __xlsxList = mapSheetRowsToQuestions(rows);
    __chem_bag = [];
    console.log(`[chemistry] Remote XLSX loaded: ${__xlsxList.length} rows`);
    return true;
  }catch(e){ console.error('Remote XLSX load error', e); return false; }
}


/**
 * Get a random chemistry question
 * @returns {Object} Random chemistry question
 */
function getRandomQuestion() {
  if (!Array.isArray(__chem_bag) || __chem_bag.length === 0) {
    __refillBag();
  }
  if (__chem_bag.length === 0) {
    throw new Error('No valid chemistry questions available');
  }
  // draw from end for O(1)
  return __chem_bag.pop();
}

/**
 * Find a question by formula
 * @param {string} formula - Chemical formula to search for
 * @returns {Object|null} Chemistry question or null if not found
 */
function findQuestionByFormula(formula) {
  const questions = getAllQuestions();
  return questions.find(q => q.formula.toLowerCase() === formula.toLowerCase()) || null;
}

/**
 * Compare two label values and return feedback (chemistry-friendly)
 * - Exact match => 'correct'
 * - Group/keyword match => 'partial'
 * - Otherwise => 'wrong'
 */
function compareLabelValue(guessValue, correctValue) {
  if (!guessValue || !correctValue) {
    return 'wrong';
  }

  const norm = (s) => String(s).toLowerCase().trim();
  const guessLower = norm(guessValue);
  const correctLower = norm(correctValue);

  // Exact match
  if (guessLower === correctLower) {
    return 'correct';
  }

  // 1) Special handling: 酸碱性
  const isAcidBase = /(酸|碱|中性|两性)/.test(guessLower + correctLower);
  if (isAcidBase) {
    // 同为酸类或同为碱类判为 partial
    const isAcid = (s) => /酸/.test(s) && !/两性|中性/.test(s);
    const isBase = (s) => /碱/.test(s) && !/两性|中性/.test(s);
    if ((isAcid(guessLower) && isAcid(correctLower)) || (isBase(guessLower) && isBase(correctLower))) {
      return 'partial';
    }
    // 中性 / 两性 只有完全一致才算
  }

  // 2) Special handling: 水解/电解（按关键字判定近似）
  const coreTokens = (s) => {
    return s
      .replace(/不能|不可|不可|不/g, '')
      .split(/[\s\/]+/)
      .flatMap(t => t.split(/[，、,]/))
      .map(t => t.trim())
      .filter(Boolean);
  };
  const guessTokens = coreTokens(guessLower);
  const correctTokens = coreTokens(correctLower);

  // Exact token match already handled; check for keyword overlap like "水解"/"电解"
  const keywords = ['水解', '电解', '固体', '液体', '气体', '晶体', '溶液'];
  const hasKeywordOverlap = keywords.some(kw => guessLower.includes(kw) && correctLower.includes(kw));
  if (hasKeywordOverlap) {
    return 'partial';
  }

  // 3) Generic partial: token intersection (ignore 1-char tokens except 常见汉字)
  const filterToken = (w) => w.length > 1 || ['酸','碱'].includes(w);
  const guessWords = guessLower.split(/[\s\/]+/).map(w=>w.trim()).filter(filterToken);
  const correctWords = correctLower.split(/[\s\/]+/).map(w=>w.trim()).filter(filterToken);
  const sharedWords = guessWords.filter(word => correctWords.includes(word));
  if (sharedWords.length > 0) {
    return 'partial';
  }

  return 'wrong';
}

/**
 * Compare reaction arrays
 * @param {Array} guessReactions - User's guess reactions
 * @param {Array} correctReactions - Correct reactions
 * @returns {Array} Array of feedback for each reaction
 */
function compareReactions(guessReactions, correctReactions) {
  if (!Array.isArray(guessReactions) || !Array.isArray(correctReactions)) {
    return [];
  }

  return guessReactions.map(guessReaction => {
    // Check for exact match
    if (correctReactions.includes(guessReaction)) {
      return 'correct';
    }

    // Check for partial match
    const guessLower = guessReaction.toLowerCase();
    const hasPartialMatch = correctReactions.some(correctReaction => {
      const correctLower = correctReaction.toLowerCase();
      // Check if they share significant parts
      return guessLower.includes(correctLower.substring(0, correctLower.length / 2)) ||
             correctLower.includes(guessLower.substring(0, guessLower.length / 2));
    });

    return hasPartialMatch ? 'partial' : 'wrong';
  });
}

/**
 * Get overall feedback for reactions
 * @param {Array} reactionFeedbacks - Array of individual reaction feedbacks
 * @returns {string} 'correct', 'partial', or 'wrong'
 */
function getOverallReactionFeedback(reactionFeedbacks) {
  if (!reactionFeedbacks || reactionFeedbacks.length === 0) {
    return 'wrong';
  }

  const correctCount = reactionFeedbacks.filter(f => f === 'correct').length;
  const partialCount = reactionFeedbacks.filter(f => f === 'partial').length;

  if (correctCount === reactionFeedbacks.length) {
    return 'correct';
  }
  if (correctCount > 0 || partialCount > 0) {
    return 'partial';
  }
  return 'wrong';
}

module.exports = {
  loadChemistryQuestions,
  validateQuestion,
  getAllQuestions,
  getRandomQuestion,
  findQuestionByFormula,
  compareLabelValue,
  compareReactions,
  getOverallReactionFeedback,
  reload
};

