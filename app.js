const $ = (s) => document.querySelector(s);
const TEAM_KEY = 'fplpocket_team_id';
const eventStoreKey = (gw) => `fplpocket_seen_events_${gw}`;
let teamId = localStorage.getItem(TEAM_KEY) || '';
let bootstrap = null, entry = null, liveData = null, currentGw = null;
let pollTimer = null;
let deferredInstall = null;
const eventFeed = [];


function toast(message){ const el=$('#toast'); el.textContent=message; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),2600); }
function number(n){ return (n ?? 0).toLocaleString('en-US'); }
function error(message){ $('#errorBox').textContent=message; $('#errorBox').hidden=false; }
function clearError(){ $('#errorBox').hidden=true; $('#errorBox').textContent=''; }
function api(path){ return fetch(`/api${path}`).then(async r=>{if(!r.ok){let d='';try{d=await r.text()}catch{} throw new Error(d||`HTTP ${r.status}`)}return r.json()}); }
async function loadTeam(id){ clearError(); $('#setupCard').hidden=true; $('#dashboard').hidden=false; $('#teamName').textContent='جاري تحميل الفريق…'; try{
  bootstrap=await api('/bootstrap-static');
  entry=await api(`/entry/${encodeURIComponent(id)}`);
  if(!entry||!entry.current_event){throw new Error('لم أجد Team ID. تأكد من الرقم وجرب مرة أخرى.');}
  currentGw=entry.current_event;
  const eventObj=bootstrap.events.find(e=>e.id===currentGw);
  $('#gwLabel').textContent=`GAMEWEEK ${currentGw}${eventObj?.name?` · ${eventObj.name.toUpperCase()}`:''}`;
  $('#teamName').textContent=entry.name||`${entry.player_first_name||''} ${entry.player_last_name||''}`.trim()||'فريقي';
  $('#overallRank').textContent=number(entry.summary_overall_rank);
  $('#gwRank').textContent=number(entry.summary_event_rank);
  $('#remaining').textContent=number(entry.transfers||0);
  $('#captainName').textContent='—';
  $('#chipStatus').textContent=entry.active_chip ? entry.active_chip.replaceAll('_',' ').toUpperCase() : 'OFF';
  await refreshLive(true);
  startPolling();
 }catch(e){ $('#dashboard').hidden=true; $('#setupCard').hidden=false; error(e.message||'تعذر تحميل بيانات فريقك.'); }
}
function startPolling(){ if(pollTimer)clearInterval(pollTimer); pollTimer=setInterval(()=>refreshLive(false),60000); }
async function refreshLive(initial){ try{
  if(!bootstrap||!currentGw)return;
  liveData=await api(`/event/${currentGw}/live`);
  renderTeam();
  checkEvents();
  $('#lastUpdated').textContent=`تحديث ${new Date().toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'})}`;
  clearError();
 }catch(e){ if(initial) error('فشل تحميل نقاط الجولة. تأكد من اتصال الإنترنت ثم اضغط تحديث.'); }
}
function playerPoints(pick){const live=liveData?.elements?.find(x=>x.id===pick.element);return live?.stats?.total_points??0;}
function renderTeam(){
 const playersMap=new Map(bootstrap.elements.map(p=>[p.id,p]));
 const picks=entry.picks||[];
 const start=picks.filter(p=>p.position<=11), bench=picks.filter(p=>p.position>11);
 const captain=start.find(p=>p.is_captain); const captainPlayer=playersMap.get(captain?.element);
 $('#captainName').textContent=captainPlayer?captainPlayer.web_name:'—';
 const total=start.reduce((sum,p)=>sum+playerPoints(p)*(p.is_captain?2:1),0);
 const chip=entry.active_chip;
 const displayedTotal=total; // Basic live total; official entry totals update after provider recalculation.
 $('#gwPoints').text(number(displayedTotal));
 $('#playingCount').text(start.filter(p=>{const player=playersMap.get(p.element);return player&&player.status==='a';}).length);
 const positions=['GKP','DEF','MID','FWD']; const byPos={GKP:[],DEF:[],MID:[],FWD:[]};
 start.forEach(p=>{const player=playersMap.get(p.element);if(!player)return;const pos=bootstrap.element_types.find(t=>t.id===player.element_type)?.singular_name_short||'MID';byPos[pos]?.push({pick:p,player});});
 const formation=positions.slice(1).map(pos=>byPos[pos].length).join('-');$('#formation').text(formation||'—');
 $('#pitch').innerHTML=positions.map(pos=>byPos[pos].length?`<div class="line-row">${byPos[pos].map(({pick,player})=>playerCard(pick,player)).join('')}</div>`:'').join('');
 $('#bench').innerHTML=bench.map(p=>{const player=playersMap.get(p.element);return player?playerCard(p,player,true):''}).join('');
}
function playerCard(pick,player,bench=false){const pts=playerPoints(pick);let badge=pick.is_captain?'C':pick.is_vice_captain?'VC':'';const live=liveData?.elements?.find(x=>x.id===pick.element)?.stats;
 const goals=live?.goals_scored||0;const assists=live?.assists||0;
 return `<div class="player${bench?' bench-player':''}"><div class="player-wrap"><div class="shirt">${escapeHtml(player.element_type===1?'GK':player.web_name.slice(0,2).toUpperCase())}</div>${badge?`<span class="captain-badge">${badge}</span>`:''}</div><span class="player-name">${escapeHtml(player.web_name)}</span><span class="player-points">${pts} pts${goals?` · ⚽${goals}`:''}${assists?` · A${assists}`:''}</span></div>`;
}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function checkEvents(){ if(!liveData||!entry||!bootstrap)return; const picks=entry.picks||[]; const myIds=new Set(picks.map(p=>p.element)); const seen=JSON.parse(localStorage.getItem(eventStoreKey(currentGw))||'{}');
 const fresh=[]; liveData.elements.forEach(el=>{if(!myIds.has(el.id))return;const player=bootstrap.elements.find(p=>p.id===el.id);if(!player)return; const s=el.stats; const checks=[['goals_scored','goal','⚽','هدف'],['assists','assist','↗','أسيست'],['clean_sheets','clean','🛡','كلين شيت'],['bonus','bonus','★','Bonus']];checks.forEach(([key,type,icon,label])=>{const count=s[key]||0;const old=seen[`${el.id}:${key}`]||0;if(count>old){for(let n=old;n<count;n++)fresh.push({id:`${el.id}:${key}:${n+1}`,player:player.web_name,icon,label,gw:currentGw});seen[`${el.id}:${key}`]=count;}});});
 if(fresh.length){fresh.reverse().forEach(evt=>{eventFeed.unshift(evt);addEventToUI(evt);if(Notification.permission==='granted')new Notification('FPL Pocket · '+evt.label,{body:`${evt.player} · ${evt.label} (${evt.gw})`,icon:'/icon.svg'});});toast(`حدث جديد: ${fresh[0].player} — ${fresh[0].label}`);}
 localStorage.setItem(eventStoreKey(currentGw),JSON.stringify(seen));
}
function addEventToUI(evt){const list=$('#eventsList');if(list.querySelector('.empty'))list.innerHTML='';const node=document.createElement('div');node.className='event-item';node.innerHTML=`<div class="event-icon">${evt.icon}</div><div class="event-content"><b>${escapeHtml(evt.player)} · ${escapeHtml(evt.label)}</b><small>Gameweek ${evt.gw} · حدث في لاعب فريقك</small></div><span class="event-points">${evt.label==='هدف'?'⚽':''}</span>`;list.prepend(node);}
function showEvents(){if(!eventFeed.length){$('#eventsList').innerHTML='<div class="empty">الأحداث الجديدة هتظهر هنا عند تحديث بيانات الجولة.</div>';return;}$('#eventsList').innerHTML='';eventFeed.forEach(addEventToUI);}
$('#teamForm').addEventListener('submit',e=>{e.preventDefault();const id=$('#teamId').value.trim();if(!id)return;localStorage.setItem(TEAM_KEY,id);teamId=id;loadTeam(id);});
$('#refreshBtn').addEventListener('click',()=>refreshLive(false));
$('#settingsNav').addEventListener('click',()=>{ $('#settingsTeamId').value=teamId; $('#settingsDialog').showModal(); });
$('#closeSettings').addEventListener('click',()=>$('#settingsDialog').close());
$('#saveSettings').addEventListener('click',()=>{const id=$('#settingsTeamId').value.trim();if(!id)return;localStorage.setItem(TEAM_KEY,id);teamId=id;$('#settingsDialog').close();loadTeam(id);});
$('#notifyBtn').addEventListener('click',async()=>{if(!('Notification'in window)){toast('المتصفح لا يدعم الإشعارات');return;}const p=await Notification.requestPermission();toast(p==='granted'?'تم تفعيل الإشعارات':'لم يتم السماح بالإشعارات');});
document.querySelectorAll('.bottom-nav button[data-tab]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.remove('nav-active'));btn.classList.add('nav-active');if(btn.dataset.tab==='events')showEvents();else if(btn.dataset.tab==='team'&&teamId)renderTeam();}));
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;$('#installBtn').hidden=false;});
$('#installBtn').addEventListener('click',async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$('#installBtn').hidden=true;});
if('serviceWorker'in navigator){navigator.serviceWorker.register('/sw.js').catch(console.warn);}
if(teamId){$('#teamId').value=teamId;loadTeam(teamId);}else{$('#setupCard').hidden=false;$('#dashboard').hidden=true;}
