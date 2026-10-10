const STORAGE_KEY = "coachCommandCenterV1";
const DAY = 24 * 60 * 60 * 1000;

const samplePlayers = [
  { id: "p1", name: "Alex Rivera", position: "CM", year: "So", email: "", notes: "Team captain check-in every Monday.", lastCheck: "Today 5:00 PM", assignments: [
    { course: "ENG 101", title: "Essay 2 draft", due: offsetDate(1), status: "upcoming" },
    { course: "MATH 120", title: "Problem set 6", due: offsetDate(-1), status: "submitted" },
    { course: "HIST 210", title: "Reading quiz 4", due: offsetDate(4), status: "upcoming" } ] },
  { id: "p2", name: "Jordan Lee", position: "ST", year: "Jr", email: "", notes: "Math is the danger class. Needs tutoring referral.", lastCheck: "Today 5:00 PM", assignments: [
    { course: "MATH 120", title: "Problem set 6", due: offsetDate(-2), status: "missed" },
    { course: "MATH 120", title: "Midterm review", due: offsetDate(0), status: "upcoming" },
    { course: "PSY 101", title: "Discussion 5", due: offsetDate(2), status: "upcoming" } ] },
  { id: "p3", name: "Sam Carter", position: "GK", year: "Sr", email: "", notes: "All clear. Mentor for freshmen.", lastCheck: "Today 5:00 PM", assignments: [
    { course: "BUS 300", title: "Case study 3", due: offsetDate(5), status: "upcoming" },
    { course: "BIO 110", title: "Lab report", due: offsetDate(-3), status: "submitted" } ] },
  { id: "p4", name: "Chris Morgan", position: "CB", year: "Fr", email: "", notes: "First semester. Check in twice a week.", lastCheck: "Today 5:00 PM", assignments: [
    { course: "ENG 101", title: "Reading response", due: offsetDate(-4), status: "missed" },
    { course: "ENG 101", title: "Essay 2 draft", due: offsetDate(1), status: "upcoming" },
    { course: "SOC 100", title: "Quiz 3", due: offsetDate(-1), status: "missed" } ] },
  { id: "p5", name: "Taylor Brooks", position: "RB", year: "So", email: "", notes: "", lastCheck: "Today 5:00 PM", assignments: [
    { course: "CHEM 105", title: "Lab 7", due: offsetDate(2), status: "upcoming" },
    { course: "ENG 201", title: "Peer review", due: offsetDate(-1), status: "submitted" } ] },
  { id: "p6", name: "Jamie Ortiz", position: "LW", year: "Jr", email: "", notes: "Work-study schedule is tight on Thursdays.", lastCheck: "Today 5:00 PM", assignments: [
    { course: "ECON 200", title: "Homework 4", due: offsetDate(0), status: "upcoming" },
    { course: "SPAN 201", title: "Oral practice", due: offsetDate(3), status: "upcoming" } ] }
];

let players = loadPlayers();
let selectedId = players[0]?.id || null;
let activeFilter = "all";

const els = {
  list: document.getElementById("playerList"), empty: document.getElementById("emptyState"),
  detail: document.getElementById("detailBody"), feed: document.getElementById("teamFeed"),
  search: document.getElementById("searchInput"), sort: document.getElementById("sortSelect"),
  count: document.getElementById("playerCount"), dialog: document.getElementById("playerDialog"),
  form: document.getElementById("playerForm")
};

function offsetDate(days){ const d = new Date(Date.now() + days*DAY); return d.toISOString().slice(0,10); }
function loadPlayers(){ try{ const raw = localStorage.getItem(STORAGE_KEY); if(raw) return JSON.parse(raw); }catch(e){} return structuredClone(samplePlayers); }
function savePlayers(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(players)); }
function parseDate(value){ const d = new Date(value + (value.length === 10 ? "T23:59:59" : "")); return Number.isNaN(d.getTime()) ? null : d; }
function fmtDate(value){ const d = parseDate(value); return d ? d.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"}) : "No date"; }
function initials(name){ return name.split(/\s+/).map(x=>x[0]).slice(0,2).join("").toUpperCase() || "?"; }
function counts(p){ const missed = p.assignments.filter(a=>a.status==="missed").length; const submitted = p.assignments.filter(a=>a.status==="submitted").length; const due48 = p.assignments.filter(a=>{ if(a.status!=="upcoming") return false; const d=parseDate(a.due); return d && d-Date.now() >= 0 && d-Date.now() <= 2*DAY; }).length; return {missed, submitted, due48}; }
function statusFor(p){ const c=counts(p); if(c.missed>=2) return "At Risk"; if(c.missed===1 || c.due48>=2) return "Watch"; return "On Track"; }
function riskFor(p){ const c=counts(p); return Math.min(100, c.missed*38 + c.due48*12 + (statusFor(p)==="Watch" ? 10 : 0)); }
function nextDue(p){ const up = p.assignments.filter(a=>a.status==="upcoming" && parseDate(a.due)).sort((a,b)=>parseDate(a.due)-parseDate(b.due)); return up[0] || null; }
function filteredPlayers(){
  const q = els.search.value.trim().toLowerCase();
  let out = players.filter(p=>{
    const c = counts(p), st = statusFor(p);
    if(activeFilter==="missing" && c.missed===0) return false;
    if(activeFilter==="due48" && c.due48===0) return false;
    if(["On Track","Watch","At Risk"].includes(activeFilter) && st!==activeFilter) return false;
    if(!q) return true;
    const hay = [p.name,p.position,p.year,p.notes,...p.assignments.flatMap(a=>[a.course,a.title,a.status])].join(" ").toLowerCase();
    return hay.includes(q);
  });
  const sorters = {
    risk:(a,b)=>riskFor(b)-riskFor(a), missing:(a,b)=>counts(b).missed-counts(a).missed,
    name:(a,b)=>a.name.localeCompare(b.name),
    due:(a,b)=>(parseDate(nextDue(a)?.due||"2999-01-01")||0)-(parseDate(nextDue(b)?.due||"2999-01-01")||0)
  };
  return out.sort(sorters[els.sort.value] || sorters.risk);
}
function render(){
  const allCounts = players.map(counts);
  document.getElementById("kpiPlayers").textContent = players.length;
  document.getElementById("kpiOnTrack").textContent = players.filter(p=>statusFor(p)==="On Track").length;
  document.getElementById("kpiWatch").textContent = players.filter(p=>statusFor(p)==="Watch").length;
  document.getElementById("kpiAtRisk").textContent = players.filter(p=>statusFor(p)==="At Risk").length;
  document.getElementById("kpiMissing").textContent = allCounts.reduce((s,c)=>s+c.missed,0);
  document.getElementById("kpiDue48").textContent = allCounts.reduce((s,c)=>s+c.due48,0);

  const list = filteredPlayers();
  els.count.textContent = `${list.length} shown`;
  els.empty.hidden = list.length !== 0;
  els.list.innerHTML = list.map(p=>{
    const c=counts(p), st=statusFor(p), nd=nextDue(p), pillClass = st.replace(/\s/g,"");
    return `<button class="player-card ${p.id===selectedId?"selected":""}" data-id="${p.id}">
      <span class="avatar">${initials(p.name)}</span>
      <span><span class="player-name">${escapeHtml(p.name)}</span>
      <span class="player-meta">${escapeHtml(p.position||"—")} • ${escapeHtml(p.year||"—")} • Last check: ${escapeHtml(p.lastCheck||"Not yet")}</span>
      <span class="stats"><span>❌ ${c.missed} missing</span><span>✅ ${c.submitted} turned in</span><span>⏰ ${c.due48} due 48h</span></span>
      <span class="risk"><i style="width:${riskFor(p)}%"></i></span>
      <span class="next-due">Next: ${nd ? `${escapeHtml(nd.course)} — ${escapeHtml(nd.title)} (${fmtDate(nd.due)})` : "Nothing upcoming"}</span></span>
      <span class="pill ${pillClass}">${st}</span></button>`;
  }).join("");
  els.list.querySelectorAll(".player-card").forEach(card=>card.addEventListener("click",()=>{ selectedId=card.dataset.id; render(); }));
  renderDetail(); renderFeed(); savePlayers();
}
function renderDetail(){
  const p = players.find(x=>x.id===selectedId);
  if(!p){ els.detail.innerHTML = `<p class="muted">Pick a player on the left to see detail.</p>`; return; }
  const c=counts(p), st=statusFor(p), nd=nextDue(p);
  els.detail.innerHTML = `<h3>${escapeHtml(p.name)}</h3>
    <p class="muted">${escapeHtml(p.position||"")} ${p.year?`• ${escapeHtml(p.year)}`:""} ${p.email?`• ${escapeHtml(p.email)}`:""}</p>
    <p><span class="pill ${st.replace(/\s/g,"")}">${st}</span> <strong>${riskFor(p)}% risk</strong></p>
    <div class="stats"><span>❌ ${c.missed} missing</span><span>✅ ${c.submitted} turned in</span><span>⏰ ${c.due48} due in 48h</span></div>
    <p><strong>Next due:</strong> ${nd ? `${escapeHtml(nd.course)} — ${escapeHtml(nd.title)} on ${fmtDate(nd.due)}` : "Nothing upcoming"}</p>
    <h4>Assignments</h4>
    ${p.assignments.length ? p.assignments.slice().sort((a,b)=>(parseDate(a.due)||0)-(parseDate(b.due)||0)).map(a=>`<div class="assignment"><div class="assignment-title">${escapeHtml(a.course)} — ${escapeHtml(a.title)}</div><div class="muted">Due ${fmtDate(a.due)}</div><div class="status ${a.status}">${a.status}</div></div>`).join("") : `<p class="muted">No assignments yet. Edit this player to add them.</p>`}
    <h4>Coach notes</h4><p>${escapeHtml(p.notes||"No notes yet.")}</p>
    <div class="io-row"><button class="btn small" id="editPlayerBtn">Edit player</button><button class="btn small danger" id="deletePlayerBtn">Delete player</button></div>`;
  document.getElementById("editPlayerBtn")?.addEventListener("click",()=>openDialog(p));
  document.getElementById("deletePlayerBtn")?.addEventListener("click",()=>{ if(confirm(`Remove ${p.name}?`)){ players=players.filter(x=>x.id!==p.id); selectedId=players[0]?.id||null; render(); }});
}
function renderFeed(){
  const items=[];
  players.forEach(p=>p.assignments.forEach(a=>{ if(a.status==="missed") items.push({p,a,kind:"missed",text:`${a.course} — ${a.title} was due ${fmtDate(a.due)} and is marked missed.`}); if(a.status==="submitted") items.push({p,a,kind:"submitted",text:`${a.course} — ${a.title} turned in. Due ${fmtDate(a.due)}.`}); }));
  items.sort((a,b)=>(parseDate(b.a.due)||0)-(parseDate(a.a.due)||0));
  els.feed.innerHTML = items.slice(0,10).map(({p,a,kind,text})=>`<div class="feed-item ${kind}"><strong>${escapeHtml(p.name)}</strong> <span class="status ${kind}">${kind}</span><br/>${escapeHtml(text)}<br/><span class="muted">Coach action: ${kind==="missed"?"Check in today and make a catch-up plan.":"No action needed — keep momentum."}</span></div>`).join("") || `<p class="muted">No submitted or missed work yet.</p>`;
}
function escapeHtml(str){ return String(str??"").replace(/[&<>"']/g, ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch])); }
function openDialog(p=null){
  document.getElementById("dialogTitle").textContent = p ? "Edit player" : "Add player";
  document.getElementById("playerId").value = p?.id || "";
  document.getElementById("fName").value = p?.name || "";
  document.getElementById("fPosition").value = p?.position || "";
  document.getElementById("fYear").value = p?.year || "";
  document.getElementById("fEmail").value = p?.email || "";
  document.getElementById("fNotes").value = p?.notes || "";
  document.getElementById("fAssignments").value = p ? p.assignments.map(a=>`${a.course} | ${a.title} | ${a.due} | ${a.status}`).join("\n") : "";
  els.dialog.showModal();
}
function parseAssignments(text){ return text.split("\n").map(line=>line.trim()).filter(Boolean).map(line=>{ const [course="",title="",due="",status="upcoming"] = line.split("|").map(s=>s.trim()); return {course, title, due: due || offsetDate(3), status: ["submitted","missed","upcoming","late"].includes(status.toLowerCase()) ? status.toLowerCase() : "upcoming"}; }); }

document.querySelectorAll(".chip").forEach(chip=>chip.addEventListener("click",()=>{ document.querySelectorAll(".chip").forEach(c=>c.classList.remove("active")); chip.classList.add("active"); activeFilter=chip.dataset.filter; render(); }));
els.search.addEventListener("input",render); els.sort.addEventListener("change",render);
document.getElementById("addPlayerBtn").addEventListener("click",()=>openDialog());
document.getElementById("cancelDialogBtn").addEventListener("click",()=>els.dialog.close());
document.getElementById("loadSampleBtn").addEventListener("click",()=>{ players=structuredClone(samplePlayers); selectedId=players[0].id; render(); });
document.getElementById("clearBtn").addEventListener("click",()=>{ if(confirm("Clear all locally saved player data in this browser?")){ players=[]; selectedId=null; render(); }});
els.form.addEventListener("submit",e=>{
  e.preventDefault();
  const id = document.getElementById("playerId").value || `p${Date.now()}`;
  const player = { id, name: document.getElementById("fName").value.trim(), position: document.getElementById("fPosition").value.trim(), year: document.getElementById("fYear").value.trim(), email: document.getElementById("fEmail").value.trim(), notes: document.getElementById("fNotes").value.trim(), lastCheck: "Manual update", assignments: parseAssignments(document.getElementById("fAssignments").value) };
  const idx = players.findIndex(p=>p.id===id); if(idx>=0) players[idx]=player; else players.push(player);
  selectedId=id; els.dialog.close(); render();
});
document.getElementById("exportCsvBtn").addEventListener("click",()=>{
  const rows=[["name","position","year","course","assignment","due","status"]];
  players.forEach(p=>p.assignments.forEach(a=>rows.push([p.name,p.position,p.year,a.course,a.title,a.due,a.status])));
  download("coach-command-center.csv", rows.map(r=>r.map(csvCell).join(",")).join("\n"), "text/csv");
});
document.getElementById("backupBtn").addEventListener("click",()=>download("coach-command-center-backup.json", JSON.stringify(players,null,2), "application/json"));
document.getElementById("importFile").addEventListener("change",async e=>{
  const file=e.target.files[0]; if(!file) return;
  const text=await file.text();
  try{ const imported = file.name.endsWith(".json") ? JSON.parse(text) : importCsv(text); players=mergePlayers(players, imported); selectedId=players[0]?.id||null; render(); alert("Import complete. New players and assignments were merged into the board, not wiped over it. Data is saved only in this browser."); }
  catch(err){ alert("Import failed. Check the file matches the sample format."); }
  e.target.value="";
});
function mergePlayers(existing, incoming){
  const byName = new Map(existing.map(p=>[p.name.trim().toLowerCase(), p]));
  incoming.forEach(p=>{
    const key = (p.name||"Unnamed Player").trim().toLowerCase();
    if(!byName.has(key)){ byName.set(key, p); return; }
    const current = byName.get(key);
    current.position = p.position || current.position;
    current.year = p.year || current.year;
    current.email = p.email || current.email;
    current.notes = p.notes || current.notes;
    current.lastCheck = p.lastCheck || "Imported update";
    const seen = new Map(current.assignments.map(a=>[(a.course+"|"+a.title+"|"+a.due).toLowerCase(), a]));
    (p.assignments||[]).forEach(a=>{ const k=(a.course+"|"+a.title+"|"+a.due).toLowerCase(); if(seen.has(k)){ seen.get(k).status = a.status; } else { current.assignments.push(a); seen.set(k,a); } });
  });
  return [...byName.values()];
}
function csvCell(v){ return `"${String(v??"").replace(/"/g,'""')}"`; }
function importCsv(text){
  const lines=text.trim().split(/\r?\n/); const header=lines.shift().split(",").map(s=>s.trim().toLowerCase());
  const idx = n=>header.indexOf(n); const byName=new Map();
  lines.filter(Boolean).forEach(line=>{ const cols=splitCsv(line); const name=cols[idx("name")]||"Unnamed Player"; if(!byName.has(name)) byName.set(name,{id:`p${Date.now()}-${Math.random().toString(16).slice(2)}`,name,position:cols[idx("position")]||"",year:cols[idx("year")]||"",email:"",notes:"",lastCheck:"Imported",assignments:[]});
    byName.get(name).assignments.push({course:cols[idx("course")]||"",title:cols[idx("assignment")]||cols[idx("title")]||"",due:cols[idx("due")]||offsetDate(3),status:(cols[idx("status")]||"upcoming").toLowerCase()}); });
  return [...byName.values()];
}
function splitCsv(line){ const out=[]; let cur="",q=false; for(let i=0;i<line.length;i++){ const ch=line[i]; if(ch==='"'&&line[i+1]==='"'){cur+='"';i++;} else if(ch==='"'){q=!q;} else if(ch===","&&!q){out.push(cur.trim());cur="";} else cur+=ch; } out.push(cur.trim()); return out; }
function download(name, content, type){ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([content],{type})); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); }

/* --- Device password screen (privacy screen only, not internet security) --- */
const LOCK_HASH_KEY = "playersSchoolCenterLockHashV1";
const LOCK_SESSION_KEY = "playersSchoolCenterUnlockedV1";
async function hashText(text){
  if(window.crypto?.subtle){ const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("players-school-center:" + text)); return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,"0")).join(""); }
  let h = 0; for(let i=0;i<text.length;i++){ h = ((h<<5)-h) + text.charCodeAt(i); h |= 0; } return "fallback-" + Math.abs(h);
}
function setBoardLocked(locked){
  document.getElementById("lockScreen").hidden = !locked;
  document.querySelectorAll(".lockable").forEach(el=>{ el.style.display = locked ? "none" : ""; });
  document.body.style.overflow = locked ? "hidden" : "";
}
async function initLock(){
  const savedHash = localStorage.getItem(LOCK_HASH_KEY);
  const unlocked = sessionStorage.getItem(LOCK_SESSION_KEY) === "yes";
  const title = document.getElementById("lockTitle"), text = document.getElementById("lockText"), button = document.getElementById("lockButton"), confirmWrap = document.getElementById("lockConfirmWrap");
  if(!savedHash){ title.textContent = "Set a password for this board"; text.textContent = "First time here: choose a password on this device. You set it here on the page — never send it to anyone in chat or email."; button.textContent = "Set password and open board"; confirmWrap.hidden = false; setBoardLocked(true); return; }
  if(unlocked){ setBoardLocked(false); return; }
  title.textContent = "Players School Center is locked"; text.textContent = "Enter the password you set on this device to see the board."; button.textContent = "Unlock board"; confirmWrap.hidden = true; setBoardLocked(true);
}
document.getElementById("lockForm").addEventListener("submit", async e=>{
  e.preventDefault();
  const pw = document.getElementById("lockPassword").value, msg = document.getElementById("lockMessage"), savedHash = localStorage.getItem(LOCK_HASH_KEY);
  if(!savedHash){
    const confirmPw = document.getElementById("lockConfirm").value;
    if(pw.length < 6){ msg.textContent = "Use at least 6 characters."; return; }
    if(pw !== confirmPw){ msg.textContent = "Passwords do not match."; return; }
    localStorage.setItem(LOCK_HASH_KEY, await hashText(pw));
  } else if(await hashText(pw) !== savedHash){ msg.textContent = "Wrong password for this device."; return; }
  sessionStorage.setItem(LOCK_SESSION_KEY, "yes"); document.getElementById("lockPassword").value = ""; msg.textContent = ""; setBoardLocked(false);
});
document.getElementById("lockNowBtn")?.addEventListener("click", ()=>{ sessionStorage.removeItem(LOCK_SESSION_KEY); initLock(); });

/* --- Add a coach email update to the local board --- */
function flexibleDate(value){
  if(!value) return offsetDate(3);
  const iso = value.match(/\d{4}-\d{2}-\d{2}/); if(iso) return iso[0];
  const d = new Date(value); if(!Number.isNaN(d.getTime())) return d.toISOString().slice(0,10);
  return offsetDate(3);
}
function grab(text, label){ const m = text.match(new RegExp(label + "\\s*[:\\-]\\s*([^\\n]+)", "i")); return m ? m[1].trim() : ""; }
function parseEmailToBoard(rawText){
  const text = rawText.trim(); if(!text) return 0;
  // Best path: player's Muse included the CSV import block.
  const headerIdx = text.toLowerCase().indexOf("name,position,year,course,assignment,due,status");
  if(headerIdx >= 0){
    const csvText = text.slice(headerIdx).split(/\n\s*\n/)[0];
    const imported = importCsv(csvText); players = mergePlayers(players, imported); return imported.reduce((s,p)=>s+p.assignments.length,0) || imported.length;
  }
  // Plain coach update email path.
  let playerName = document.getElementById("emailPlayerName").value.trim();
  const subject = text.match(/subject:\s*([^\n]+)/i)?.[1] || "";
  const subjectParts = subject.split(" - ").map(s=>s.trim());
  if(!playerName && subject.toLowerCase().startsWith("school update") && subjectParts[1]) playerName = subjectParts[1];
  if(!playerName){ const fromTracker = text.match(/from\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)'s\s+Canvas tracker/i); if(fromTracker) playerName = fromTracker[1]; }
  if(!playerName) playerName = "Unnamed Player";
  const course = grab(text, "Course") || subjectParts[2] || "";
  const title = grab(text, "Assignment") || "Email update";
  const statusRaw = (grab(text, "Status") || "").toLowerCase();
  const status = statusRaw.includes("miss") ? "missed" : (statusRaw.includes("turn") || statusRaw.includes("submit") ? "submitted" : "upcoming");
  const due = flexibleDate(grab(text, "Due") || grab(text, "Submitted"));
  const imported = [{ id: `p${Date.now()}`, name: playerName, position: "", year: "", email: "", notes: "", lastCheck: "Email added " + new Date().toLocaleDateString(), assignments: [{ course, title, due, status }] }];
  players = mergePlayers(players, imported); selectedId = players.find(p=>p.name === playerName)?.id || selectedId; return 1;
}
document.getElementById("parseEmailBtn")?.addEventListener("click", ()=>{
  const box = document.getElementById("emailPaste"), result = document.getElementById("emailResult");
  const added = parseEmailToBoard(box.value);
  if(added > 0){ render(); result.textContent = `Added ${added} assignment update${added===1?"":"s"} to the board. Saved only in this browser — not uploaded to GitHub.`; box.value = ""; }
  else { result.textContent = "I could not find an assignment in that email. Paste the full email including the subject, or the CSV import block."; }
});
document.getElementById("clearEmailBtn")?.addEventListener("click", ()=>{ document.getElementById("emailPaste").value = ""; document.getElementById("emailResult").textContent = ""; });

render();
initLock();
