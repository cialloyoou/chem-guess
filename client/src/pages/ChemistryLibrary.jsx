import { useEffect, useMemo, useState } from 'react';
import { getAllChemistry } from '../utils/chemistry';
import '../styles/GuessesTable.css';

function isOrganicByName(name) {
  const n = String(name || '');
  return /(甲|乙|丙|丁|戊|己|庚|辛|壬|癸|苯|醇|醛|酮|酯|醚|烃|烷|烯|炔|羧|有机)/.test(n);
}

function isOrganicByFormula(formula) {
  const f = String(formula || '').toUpperCase();
  if (!f) return false;
  // Common inorganic exceptions containing carbon
  if (f === 'CO' || f === 'CO2' || /H?CO3/.test(f)) return false;
  const hasC = /C/.test(f);
  const hasH = /H/.test(f);
  return hasC && hasH;
}

function isOrganic(item) {
  return isOrganicByName(item?.name) || isOrganicByFormula(item?.formula);
}

function groupByOrganicInorganic(items) {
  const groups = { 无机物: [], 有机物: [] };
  items.forEach(it => {
    if (isOrganic(it)) groups['有机物'].push(it);
    else groups['无机物'].push(it);
  });
  return groups;
}

// helpers to build chips
function splitBySlash(text) {
  return String(text || '')
    .split('/')
    .map(s => s.trim())
    .filter(Boolean);
}

function splitBySpace(text) {
  return String(text || '')
    .split(/\s+/)
    .map(s => s.trim())
    .filter(Boolean);
}

// Rough periodic order by first element symbol occurrence
const periodicOrder = ['H','He','Li','Be','B','C','N','O','F','Ne','Na','Mg','Al','Si','P','S','Cl','Ar','K','Ca','Fe','Cu','Zn','Br','Ag','I','Ba','Pb','Sn','Mn','Cr','Ni'];
function firstElementSymbol(formula) {
  const match = String(formula).match(/[A-Z][a-z]?/);
  return match ? match[0] : 'Z';
}

export default function ChemistryLibrary() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const all = await getAllChemistry();
        setData(all);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sorted = useMemo(() => {
    const arr = [...data];
    arr.sort((a, b) => {
      const ea = firstElementSymbol(a.formula);
      const eb = firstElementSymbol(b.formula);
      const ia = periodicOrder.indexOf(ea);
      const ib = periodicOrder.indexOf(eb);
      const ai = ia === -1 ? 999 : ia;
      const bi = ib === -1 ? 999 : ib;
      return ai - bi || String(a.formula).localeCompare(String(b.formula));
    });
    return arr;
  }, [data]);

  const groups = useMemo(() => groupByOrganicInorganic(sorted), [sorted]);

  if (loading) return <div style={{padding:16}}>加载中...</div>;

  return (
    <div style={{maxWidth: 1200, margin: '0 auto', padding: '24px'}}>
      <h2 style={{fontSize: '28px', marginBottom: '8px'}}>📚 化学资料库（题库）</h2>
      <p style={{color:'#64748b', fontSize: '15px', marginBottom: '24px'}}>按元素顺序排序 · 分组：无机物 / 有机物 · 标签可视化</p>

      {Object.entries(groups).map(([groupName, items]) => (
        <div key={groupName} style={{marginTop: 32}}>
          <h3 style={{
            borderLeft: '4px solid #0ea5e9',
            paddingLeft: 12,
            fontSize: '22px',
            marginBottom: '16px'
          }}>{groupName}（{items.length}）</h3>
          <div style={{overflowX:'auto'}}>
            <table className="guesses-table chemistry-table">
              <thead>
                <tr>
                  <th>化学式</th>
                  <th>名称</th>
                  <th>酸碱性</th>
                  <th>水解/电解</th>
                  <th>状态</th>
                  <th>反应（示例）</th>
                  <th>其他性质</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="formula-text">{it.formula}</div>
                    </td>
                    <td>
                      <div className="name-text">{it.name}</div>
                    </td>
                    <td>
                      <div className="chips-container">
                        { (it.labels?.acidBase ? [String(it.labels.acidBase).trim()] : []).map((t,i)=>(
                          <span key={i} className="tag-chip">{t}</span>
                        )) }
                      </div>
                    </td>
                    <td>
                      <div className="chips-container">
                        { splitBySlash(it.labels?.hydrolysisElectrolysis).map((t,i)=>(
                          <span key={i} className="tag-chip">{t}</span>
                        )) }
                      </div>
                    </td>
                    <td>
                      <div className="chips-container">
                        { splitBySpace(it.labels?.state).map((t,i)=>(
                          <span key={i} className="tag-chip">{t}</span>
                        )) }
                      </div>
                    </td>
                    <td>
                      <div className="reactions-container">
                        {(it.labels?.reactions || []).slice(0,2).map((r, i)=>(
                          <div key={i} className="reaction-item">{r}</div>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="chips-container">
                        { splitBySlash(it.labels?.other).map((t,i)=>(
                          <span key={i} className="tag-chip">{t}</span>
                        )) }
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

