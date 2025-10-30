const fs = require('fs');
const path = require('path');

function loadJson(){
  const p = path.join(__dirname, '..', 'data', 'chemistry_questions.json');
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw);
}

function toCSVRow(arr){
  return arr.map(v => {
    let s = String(v==null? '': v);
    // Normalize slashes inside arrays/strings for multi-values
    s = s.replace(/\r?\n/g, ' ').trim();
    // Escape quotes
    if (s.includes('"') || s.includes(',') || s.includes('\n')) {
      s = '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }).join(',');
}

function exportCSV(){
  const list = loadJson();
  const header = ['化学式','名称','酸碱性','水解/电解','状态','反应','其他性质'];
  const lines = [toCSVRow(header)];
  for (const item of list) {
    const labels = item.labels || {};
    const reactions = Array.isArray(labels.reactions) ? labels.reactions.join('/') : '';
    const row = [
      item.formula||'',
      item.name||'',
      labels.acidBase||'',
      labels.hydrolysisElectrolysis||'',
      labels.state||'',
      reactions,
      labels.other||''
    ];
    lines.push(toCSVRow(row));
  }
  const outPath = path.join(__dirname, '..', 'data', 'chemistry_questions_export.csv');
  // Write with UTF-8 BOM so that Excel on Windows renders Chinese correctly
  const content = '\uFEFF' + lines.join('\n');
  fs.writeFileSync(outPath, content, 'utf8');
  console.log('CSV exported (UTF-8 with BOM):', outPath, `(${list.length} rows)`);
}

exportCSV();

