import { useEffect, useMemo, useRef, useState } from 'react';
import { getMachineId, loadProfile, saveProfile, computeStatsFromLogs } from '../utils/leaderboard';
import { loadTestLogs } from '../utils/testLogs';

export default function ProfileBar(){
  const [profile, setProfile] = useState(()=> loadProfile());
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile.username||'');
  const [logs, setLogs] = useState(()=> loadTestLogs());
  const stats = useMemo(()=> computeStatsFromLogs(logs), [logs]);
  const machineId = useMemo(()=> getMachineId(), []);
  const inputRef = useRef(null);

  useEffect(()=>{
    const onStorage = (e)=>{ if(!e.key || e.key==='chem_test_logs'){ setLogs(loadTestLogs()); } };
    const onCustom = ()=> setLogs(loadTestLogs());
    window.addEventListener('storage', onStorage);
    window.addEventListener('chem-logs-updated', onCustom);
    return ()=>{
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('chem-logs-updated', onCustom);
    };
  },[]);

  useEffect(()=>{ if(editing && inputRef.current){ inputRef.current.focus(); inputRef.current.select(); } }, [editing]);

  function startEdit(){ setEditing(true); }
  function cancelEdit(){ setEditing(false); setNameDraft(profile.username||''); }
  function save(){
    const next = saveProfile({ username: nameDraft.trim() });
    setProfile(next);
    setEditing(false);
  }

  return (
    <div className="profile-bar">
      <div className="profile-status">
        {!editing ? (
          <>
            <span className="label">ID：</span>
            <span className="id" onDoubleClick={startEdit} title="双击修改ID（昵称）">{profile.username||'未命名'}</span>
            <span className="sep">｜</span>
            <span className="stats"><span className="num">{stats.wins}</span>/<span className="num">{stats.total}</span></span>
          </>
        ) : (
          <div className="edit-wrap">
            <input ref={inputRef} className="profile-input" placeholder="输入新的ID / 昵称" value={nameDraft} onChange={e=>setNameDraft(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') save(); if(e.key==='Escape') cancelEdit(); }} />
            <button className="profile-save-icon" onClick={save} aria-label="保存"><i className="fa fa-check"></i></button>
          </div>
        )}
      </div>
    </div>
  );
}

