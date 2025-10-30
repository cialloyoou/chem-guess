import { useEffect, useMemo, useState } from 'react';
import { fetchLeaderboard, loadProfile, submitScore, computeStatsFromLogs } from '../utils/leaderboard';
import { loadTestLogs } from '../utils/testLogs';

export default function LeaderboardWidget(){
  const [logs, setLogs] = useState(()=> loadTestLogs());
  const [people, setPeople] = useState([]);
  const stats = useMemo(()=> computeStatsFromLogs(logs), [logs]);
  useEffect(()=>{
    const onCustom = ()=> setLogs(loadTestLogs());
    window.addEventListener('chem-logs-updated', onCustom);
    return ()=> window.removeEventListener('chem-logs-updated', onCustom);
  },[]);


  useEffect(()=>{ setLogs(loadTestLogs()); },[]);

  async function syncAll(){
    try{ await submitScore(stats); } catch {}
    try{ setPeople(await fetchLeaderboard('ALL')); } catch {}
  }

  useEffect(()=>{ syncAll(); }, [stats]);
  useEffect(()=>{ const t=setInterval(syncAll, 15000); return ()=> clearInterval(t); }, [stats]);

  return (
    <div className="glass-card" style={{padding:12}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{fontWeight:800}}>Top</div>
      </div>

      <div style={{marginTop:8, display:'grid', gap:6}}>
        {people.length===0 ? <div style={{color:'#94a3b8'}}>暂无数据</div> : people.slice(0,10).map((p,idx)=> (
          <div key={p.machineId||idx} className="glass-row" style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderRadius:10, padding:'8px 10px'}}>
            <div style={{display:'flex', gap:8, alignItems:'center'}}>
              <span style={{width:18, textAlign:'right', color:'#64748b'}}>{idx+1}</span>
              <span style={{fontWeight:700}}>{p.username||'未命名'}</span>
            </div>
            <div className="num" style={{fontWeight:800}}>
              <span className="num">{p.wins||0}</span>/<span className="num">{p.total||0}</span>
              <span style={{marginLeft:6, color:'#64748b'}}>({p.total? (p.wins*100/p.total).toFixed(1):'0.0'}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

