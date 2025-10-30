import { useEffect, useMemo, useState } from 'react';
import { loadTestLogs, clearTestLogs, removeTestLog, saveTestLogs } from '../utils/testLogs';
import { Link } from 'react-router-dom';
import '../styles/TestRecords.css';
import { getCompoundDetail } from '../utils/chemistry';

function FormulaHover({ formula, name }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (data || !formula) return;
    setLoading(true);
    try {
      const detail = await getCompoundDetail(formula);
      setData(detail);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <span className="formula-hover" onMouseEnter={fetchData} onMouseOver={()=>setOpen(true)} onMouseLeave={()=>setOpen(false)}>
      {formula}
      <span className={`hover-card ${open ? 'open' : ''}`}>
        <div className="hover-content">
          <div className="hover-title">{formula}（{(data?.name)||name||''}）</div>
          {data ? (
            <div className="hover-grid">
              <div className="row"><span className="k">名称</span><span className="v">{data.name||name||''}</span></div>
              <div className="row"><span className="k">酸碱性</span><span className="v">{data.labels?.acidBase||''}</span></div>
              <div className="row"><span className="k">水解/电解</span><span className="v">{data.labels?.hydrolysisElectrolysis||''}</span></div>
              <div className="row"><span className="k">状态</span><span className="v">{data.labels?.state||''}</span></div>
              <div className="row"><span className="k">反应</span><span className="v">{Array.isArray(data.labels?.reactions)?data.labels.reactions.join(' / '):''}</span></div>
              <div className="row"><span className="k">其他性质</span><span className="v">{data.labels?.other||''}</span></div>
            </div>
          ) : (
            <div className="hover-grid"><div className="row"><span className="k muted">加载</span><span className="v muted">{loading ? '加载中…' : '暂无数据'}</span></div></div>
          )}
        </div>
      </span>
    </span>
  );
}

export default function TestRecords() {
  const [logs, setLogs] = useState([]);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const list = loadTestLogs();
    setLogs(list);
    //    hydrate missing names in-place
    const miss = Array.from(new Set(list.filter(x=>!x?.answer?.name && x?.answer?.formula).map(x=>x.answer.formula)));
    if (miss.length > 0) {
      Promise.all(miss.map(f=>searchChemistry(f).then(res=>({f, res})).catch(()=>({f, res:[]}))))
        .then(results => {
          const map = new Map();
          results.forEach(({f,res}) => {
            const exact = (res||[]).find(x=>String(x.formula).toUpperCase()===String(f).toUpperCase());
            if (exact) map.set(f, exact.name);
          });
          if (map.size) {
            const updated = list.map(x => {
              if (!x?.answer?.name && x?.answer?.formula && map.has(x.answer.formula)) {
                return { ...x, answer: { ...x.answer, name: map.get(x.answer.formula) } };
              }
              return x;
            });
            setLogs(updated);
            try { saveTestLogs(updated); } catch {}
          }
        });
    }
  }, []);

  const fmt = (ts) => new Date(ts).toLocaleString();

  const onClear = () => {
    if (confirm('确定要清空全部测试记录吗？此操作不可恢复')) {
      clearTestLogs();
      setLogs([]);
      setExpanded({});
    }
  };

  const onRemove = (id) => {
    removeTestLog(id);
    setLogs(prev => prev.filter(x => x.id !== id));
  };

  const errorGroups = useMemo(() => {
    const m = new Map();
    (logs||[]).filter(x=>x.result==='fail').forEach(x => {
      const key = `${x.answer?.formula||''}|${x.answer?.name||''}`;
      if (!m.has(key)) m.set(key, { formula: x.answer?.formula||'', name: x.answer?.name||'', count: 0 });
      m.get(key).count += 1;
    });
    return Array.from(m.values()).sort((a,b)=>b.count-a.count);
  }, [logs]);

  return (
    <div className="records-container">
      <div className="records-header">
        <h1>测试记录</h1>
        <div className="records-actions">
          <Link className="back-link" to="/">返回首页</Link>
          {logs.length > 0 && (
            <button className="clear-btn" onClick={onClear}>清空记录</button>
          )}
        </div>
      </div>

      {logs.length > 0 && (
        <div className="error-summary">
          <div className="summary-title">错误汇总（按答案归并）</div>
          <div className="summary-list">
            {errorGroups.length === 0 ? (
              <span className="muted">暂无失败记录</span>
            ) : (
              errorGroups.map((g, idx) => (
                <div key={idx} className="summary-item">
                  <span className="count">×{g.count}</span>
                  <span className="formula"><FormulaHover formula={g.formula} name={g.name} /><span className="name">（{g.name || ''}）</span></span>
                </div>
              ))
            )}
          </div>
        </div>
      )}


      {logs.length === 0 ? (
        <div className="empty">暂无记录</div>
      ) : (
        <div className="records-list">
          {logs.map(item => (
            <div key={item.id} className="record-card">
              <div className="record-summary" onClick={() => setExpanded(p => ({...p, [item.id]: !p[item.id]}))}>
                <div className="summary-left">
                  <span className={`badge ${item.result === 'success' ? 'success' : 'fail'}`}>
                    {item.result === 'success' ? '成功' : '失败'}
                  </span>
                  <span className="time">{fmt(item.startTime)} → {fmt(item.endTime)}</span>
                  <span className="answer">答案：<FormulaHover formula={item.answer?.formula} name={item.answer?.name} />（{item.answer?.name || ''}）</span>
                  {item.result === 'fail' && (
                    <span className="reason">原因：{item.reason === 'timer' ? '超时' : item.reason === 'attempts' ? '次数用尽' : '其他'}</span>
                  )}
                </div>
                <div className="summary-right">
                  <span className="duration">⏱ {item.durationSec ?? '-'}s</span>
                  <button className="remove-btn" onClick={(e)=>{e.stopPropagation(); onRemove(item.id);}}>删除</button>
                  <span className="chevron">{expanded[item.id] ? '▲' : '▼'}</span>
                </div>
              </div>
              {expanded[item.id] && (
                <div className="record-details">
                  <div className="details-title">本次猜测</div>
                  <div className="guesses">
                    {item.guesses?.length ? item.guesses.map((g, i) => (
                      <span key={i} className="guess-chip"><FormulaHover formula={g.formula} name={g.name} />（{g.name || ''}）</span>
                    )) : <span className="muted">无</span>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

