/*
 Export chemistry question bank to an .xlsx file that Excel opens natively.
 Source: server/data/chemistry_questions.json
 Output: server/data/chemistry_questions_export.xlsx
*/

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

function loadJSON() {
  const jsonPath = path.join(__dirname, '..', 'data', 'chemistry_questions.json');
  const raw = fs.readFileSync(jsonPath, 'utf8');
  return JSON.parse(raw);
}

function toRow(q) {
  return {
    '化学式': q.formula || '',
    '名称': q.name || '',
    '酸碱性': q.labels?.acidBase || '',
    '水解/电解': q.labels?.hydrolysisElectrolysis || '',
    '状态': q.labels?.state || '',
    '反应': Array.isArray(q.labels?.reactions) ? q.labels.reactions.join('/') : '',
    '其他性质': q.labels?.other || ''
  };
}

function main() {
  const list = loadJSON();
  const rows = [
    { '化学式': '示例: CH3COOH', '名称': '乙酸', '酸碱性': '酸', '水解/电解': '可电离/弱电解质', '状态': '液体', '反应': '与碱反应/与金属反应', '其他性质': '具有酸味' },
    ...list.map(toRow)
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows, { header: ['化学式','名称','酸碱性','水解/电解','状态','反应','其他性质'] });
  XLSX.utils.book_append_sheet(wb, ws, '题库');
  const out = path.join(__dirname, '..', 'data', 'chemistry_questions_export.xlsx');
  XLSX.writeFile(wb, out, { bookType: 'xlsx' });
  console.log('XLSX exported:', out, `(${list.length} rows + 1 example)`);
}

if (require.main === module) {
  main();
}

