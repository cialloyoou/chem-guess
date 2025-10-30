import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

const KEY_PROFILE = 'chem_profile_v1';
const KEY_MACHINE = 'chem_machine_id_v1';

function hashString(s){
  let h=0; for(let i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i); h|=0;} return (h>>>0).toString(36);
}

export function getMachineId(){
  let id = localStorage.getItem(KEY_MACHINE);
  if(!id){
    const seed = [navigator.userAgent, navigator.language, screen.width, screen.height, Intl.DateTimeFormat().resolvedOptions().timeZone].join('|');
    id = 'm_'+hashString(seed)+'_'+Date.now().toString(36);
    try{ localStorage.setItem(KEY_MACHINE, id); } catch {}
  }
  return id;
}

export function loadProfile(){
  try{ return JSON.parse(localStorage.getItem(KEY_PROFILE)||'{}'); }catch{ return {}; }
}

export function saveProfile(p){
  const profile = { username: p?.username||'' };
  try{ localStorage.setItem(KEY_PROFILE, JSON.stringify(profile)); } catch {}
  return profile;
}

export function computeStatsFromLogs(logs){
  const total = (logs||[]).length;
  const wins = (logs||[]).filter(x=>x.result==='success').length;
  return {wins, total};
}

export async function submitScore({wins,total}){
  const { username='' } = loadProfile();
  const machineId = getMachineId();
  try{
    const res = await axios.post(`${API_BASE_URL}/api/score/submit`, { machineId, username, wins, total });
    return res.data;
  }catch(e){ console.error('submitScore error', e); return null; }
}

export async function fetchLeaderboard(group='ALL'){
  try{
    const res = await axios.get(`${API_BASE_URL}/api/score/leaderboard`, { params:{ group } });
    return res.data||[];
  }catch(e){ console.error('fetchLeaderboard error', e); return []; }
}

