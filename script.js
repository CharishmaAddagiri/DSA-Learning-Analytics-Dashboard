const API_BASE = "https://dsa-learning-analytics-dashboard.onrender.com";
let currentUser = parseInt(localStorage.getItem("user_id"));
const username = localStorage.getItem("username")

async function loadProblems(){
const res = await fetch(`${API_BASE}/problems/${currentUser}`)

problems = await res.json()

renderAll()
updateCharts()
buildHeatmap()

}
/* ═══════════════════════════════════════════
   THEME TOGGLE
═══════════════════════════════════════════ */
function toggleTheme(checkbox) {
  const isLight = checkbox.checked;
  const html = document.documentElement;
  const icon = document.getElementById('toggle-icon');
  if (isLight) {
    html.classList.add('light');
    icon.textContent = '☀';
    localStorage.setItem('dsa_theme', 'light');
  } else {
    html.classList.remove('light');
    icon.textContent = '🌙';
    localStorage.setItem('dsa_theme', 'dark');
  }
  updateChartColors();
}

function applyStoredTheme() {
  const stored = localStorage.getItem('dsa_theme');
  if (stored === 'light') {
    document.documentElement.classList.add('light');
    const cb = document.getElementById('theme-checkbox');
    if (cb) cb.checked = true;
    const icon = document.getElementById('toggle-icon');
    if (icon) icon.textContent = '☀';
  }
}

function updateChartColors() {
  const isLight = document.documentElement.classList.contains('light');
  const gridColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)';
  const tickColor = isLight ? '#4b5470' : '#8892a4';
  const legendColor = isLight ? '#4b5470' : '#8892a4';

  if (!charts.weekly) return;

  [charts.weekly, charts.platform].forEach(c => {
    if (!c) return;
    c.options.scales.x.grid.color = gridColor;
    c.options.scales.y.grid.color = gridColor;
    c.options.scales.x.ticks = { ...c.options.scales.x.ticks, color: tickColor };
    c.options.scales.y.ticks = { ...c.options.scales.y.ticks, color: tickColor };
    if (c.options.plugins.legend) c.options.plugins.legend.labels.color = legendColor;
    c.update();
  });

  if (charts.difficulty) {
    charts.difficulty.options.plugins.legend.labels.color = legendColor;
    charts.difficulty.update();
  }
}

/* ═══════════════════════════════════════════
   STATE
═══════════════════════════════════════════ */
let problems = [];
let currentFilter = 'all';
let searchQuery = '';
let charts = {};

/* ═══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
   
  if(!currentUser){
    window.location.href = "login.html"
    return
  }
  applyStoredTheme();
  setDefaultDate();
  loadProblems();
  buildHeatmap();
  initCharts();
});

function setDefaultDate() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('problem-date').value = today;
  // default revision = 3 days later
  const rev = new Date(); rev.setDate(rev.getDate() + 3);
  document.getElementById('problem-revision').value = rev.toISOString().split('T')[0];
}

function save() { localStorage.setItem('dsa_problems', JSON.stringify(problems)); }

/* ═══════════════════════════════════════════
   NAV
═══════════════════════════════════════════ */
const sectionTitles = {
  overview: 'Overview', tracker: 'Problem Tracker',
  analytics: 'Analytics', heatmap: 'Activity Heatmap',
  reminders: 'Revision Reminders', favorites: 'Favorites', notes: 'Notes & Snippets'
};

function showSection(id, btn) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));
  document.getElementById('section-' + id).classList.add('active');
  if (btn) btn.classList.add('active');
  document.getElementById('page-title').textContent = sectionTitles[id] || id;
  if (id === 'analytics') { setTimeout(updateCharts, 50); }
  if (id === 'heatmap') { buildHeatmap(); }
  if (window.innerWidth < 900) document.getElementById('sidebar').classList.remove('open');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

/* ═══════════════════════════════════════════
   MODAL
═══════════════════════════════════════════ */
function openModal() {
  document.getElementById('modal-overlay').classList.add('open');
}
function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  clearForm();
}
function closeModalOutside(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
}
function clearForm() {
  ['problem-name','problem-pattern','problem-time','problem-notes','problem-code']
    .forEach(id => document.getElementById(id).value = '');
  setDefaultDate();
}

/* ═══════════════════════════════════════════
   ADD PROBLEM
═══════════════════════════════════════════ */
async function addProblem() {
  const name = document.getElementById('problem-name').value.trim();
  if (!name) { showToast('Please enter a problem name', 'error'); return; }

  const problem = {
    user_id: currentUser,
    id: Date.now(),
    name,
    platform: document.getElementById('problem-platform').value,
    difficulty: document.getElementById('problem-difficulty').value,
    pattern: document.getElementById('problem-pattern').value.trim(),
    time: parseInt(document.getElementById('problem-time').value) || 0,
    date: document.getElementById('problem-date').value || new Date().toISOString().split('T')[0],
    revision: document.getElementById('problem-revision').value,
    notes: document.getElementById('problem-notes').value.trim(),
    code: document.getElementById('problem-code').value.trim(),
    favorite: false
  };

  await fetch(`${API_BASE}/add-problem`,{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify(problem)
});

loadProblems();
closeModal();
}

/* ═══════════════════════════════════════════
   RENDER ALL
═══════════════════════════════════════════ */
function renderAll() {
  updateStats();
  renderTable();
  renderFavorites();
  renderNotes();
  renderReminders();
  renderRecentActivity();
}

/* ═══════════════════════════════════════════
   STATS
═══════════════════════════════════════════ */
function updateStats() {
  const easy = problems.filter(p => p.difficulty === 'Easy').length;
  const medium = problems.filter(p => p.difficulty === 'Medium').length;
  const hard = problems.filter(p => p.difficulty === 'Hard').length;
  const total = problems.length;
  const skill = easy * 10 + medium * 25 + hard * 50;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-easy').textContent = easy;
  document.getElementById('stat-medium').textContent = medium;
  document.getElementById('stat-hard').textContent = hard;
  document.getElementById('stat-skill').textContent = Math.min(skill, 1000);

  const streak = calcStreak();
  document.getElementById('stat-streak').textContent = streak;
  document.getElementById('sidebar-streak').textContent = streak;

  // Meters
  const maxVal = Math.max(total, 1);
  setMeter('meter-easy', easy, maxVal, 'var(--easy)');
  setMeter('meter-medium', medium, maxVal, 'var(--medium)');
  setMeter('meter-hard', hard, maxVal, 'var(--hard)');
  setMeter('meter-overall', Math.min(skill/10, 100), 100, 'var(--accent-blue)');
  document.getElementById('meter-easy-val').textContent = total ? Math.round(easy/total*100)+'%' : '0%';
  document.getElementById('meter-medium-val').textContent = total ? Math.round(medium/total*100)+'%' : '0%';
  document.getElementById('meter-hard-val').textContent = total ? Math.round(hard/total*100)+'%' : '0%';
  document.getElementById('meter-overall-val').textContent = Math.min(Math.round(skill/10), 100)+'%';

  document.getElementById('tracker-count').textContent = `${total} problem${total !== 1 ? 's' : ''} tracked`;
}

function setMeter(id, val, max, color) {
  const el = document.getElementById(id);
  el.style.width = Math.round((val/max)*100) + '%';
  if (color) el.style.background = color;
}

function calcStreak() {
  if (!problems.length) return 0;
  const dates = [...new Set(problems.map(p => p.date))].sort().reverse();
  const today = new Date().toISOString().split('T')[0];
  let streak = 0;
  let cur = new Date(today);
  for (let d of dates) {
    const dd = new Date(d);
    const diff = Math.round((cur - dd) / 86400000);
    if (diff <= 1) { streak++; cur = dd; }
    else break;
  }
  return streak;
}

/* ═══════════════════════════════════════════
   TABLE RENDER
═══════════════════════════════════════════ */
function getFilteredProblems() {
  return problems.filter(p => {
    const matchFilter = currentFilter === 'all' || p.difficulty === currentFilter || p.platform === currentFilter;
    const matchSearch = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.pattern.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.platform.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });
}

function renderTable() {
  const tbody = document.getElementById('problems-tbody');
  const filtered = getFilteredProblems();

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">No problems match</div><div class="empty-sub">Try adjusting your search or filters</div></div></td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((p, i) => `
    <tr class="${p.favorite ? 'favorite-row' : ''}" data-id="${p.id}">
      <td style="color:var(--text-muted);font-family:var(--font-mono);font-size:12px">${i+1}</td>
      <td>
        <div class="problem-name">${escHtml(p.name)}</div>
        <div class="problem-platform">${p.platform}</div>
      </td>
      <td><span class="badge badge-${p.difficulty.toLowerCase()}">${p.difficulty}</span></td>
      <td><span class="platform-tag platform-${p.platform.toLowerCase().replace(/\s/g,'')}">${p.platform}</span></td>
      <td>
        <div class="tags-cell">
          ${p.pattern ? p.pattern.split(',').map(t => `<span class="badge badge-tag">${t.trim()}</span>`).join('') : '<span style="color:var(--text-muted);font-size:12px">—</span>'}
        </div>
      </td>
      <td style="font-family:var(--font-mono);font-size:12px;color:var(--text-secondary)">${p.date}</td>
      <td style="font-family:var(--font-mono);font-size:12px;color:var(--text-secondary)">${p.time || '—'}</td>
      <td>
        <div class="row-actions">
          <button class="action-btn fav-btn ${p.favorite ? 'active' : ''}" onclick="toggleFavorite(${p.id})" data-tooltip="${p.favorite ? 'Unfavorite' : 'Favorite'}">★</button>
          <button class="action-btn" onclick="viewNotes(${p.id})" data-tooltip="View Notes">📝</button>
          <button class="action-btn delete-btn" onclick="deleteProblem(${p.id})" data-tooltip="Delete">✕</button>
        </div>
      </td>
    </tr>
  `).join('');
}

/* ═══════════════════════════════════════════
   ACTIONS
═══════════════════════════════════════════ */
function toggleFavorite(id) {
  const p = problems.find(p => p.id === id);
  if (!p) return;
  p.favorite = !p.favorite;
  save(); renderAll(); updateCharts();
  showToast(p.favorite ? 'Added to favorites ⭐' : 'Removed from favorites', 'info');
}

function deleteProblem(id) {
  problems = problems.filter(p => p.id !== id);
  save(); renderAll(); updateCharts(); buildHeatmap();
  showToast('Problem deleted', 'error');
}

function viewNotes(id) {
  const p = problems.find(p => p.id === id);
  if (!p) return;
  const overlay = document.getElementById('modal-overlay');
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">${escHtml(p.name)}</div>
        <button class="close-btn" onclick="restoreModal()">✕</button>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
        <span class="badge badge-${p.difficulty.toLowerCase()}">${p.difficulty}</span>
        <span class="platform-tag platform-${p.platform.toLowerCase().replace(/\s/g,'')}">${p.platform}</span>
        ${p.pattern ? p.pattern.split(',').map(t=>`<span class="badge badge-tag">${t.trim()}</span>`).join('') : ''}
      </div>
      ${p.notes ? `<label>Notes</label><div class="code-snippet" style="margin-top:8px;margin-bottom:16px;font-family:var(--font-ui)">${escHtml(p.notes)}</div>` : ''}
      ${p.code ? `<label>Code Snippet</label><div class="code-snippet">${escHtml(p.code)}</div>` : ''}
      ${!p.notes && !p.code ? '<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-title">No notes or code</div></div>' : ''}
    </div>
  `;
  overlay.classList.add('open');
}

function restoreModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.remove('open');
  overlay.innerHTML = getModalHTML();
  setDefaultDate();
}

/* ═══════════════════════════════════════════
   FAVORITES
═══════════════════════════════════════════ */
function renderFavorites() {
  const favs = problems.filter(p => p.favorite);
  const tbody = document.getElementById('favorites-tbody');
  if (!favs.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">⭐</div><div class="empty-title">No favorites yet</div><div class="empty-sub">Star problems from the tracker</div></div></td></tr>`;
    return;
  }
  tbody.innerHTML = favs.map((p, i) => `
    <tr data-id="${p.id}">
      <td style="color:var(--text-muted);font-family:var(--font-mono);font-size:12px">${i+1}</td>
      <td><div class="problem-name">${escHtml(p.name)}</div></td>
      <td><span class="badge badge-${p.difficulty.toLowerCase()}">${p.difficulty}</span></td>
      <td><span class="platform-tag platform-${p.platform.toLowerCase().replace(/\s/g,'')}">${p.platform}</span></td>
      <td><div class="tags-cell">${p.pattern ? p.pattern.split(',').map(t=>`<span class="badge badge-tag">${t.trim()}</span>`).join('') : '<span style="color:var(--text-muted);font-size:12px">—</span>'}</div></td>
      <td style="font-family:var(--font-mono);font-size:12px;color:var(--text-secondary)">${p.date}</td>
      <td><div class="row-actions"><button class="action-btn fav-btn active" onclick="toggleFavorite(${p.id})" data-tooltip="Unfavorite">★</button><button class="action-btn delete-btn" onclick="deleteProblem(${p.id})" data-tooltip="Delete">✕</button></div></td>
    </tr>
  `).join('');
}

/* ═══════════════════════════════════════════
   NOTES
═══════════════════════════════════════════ */
function renderNotes() {
  const withNotes = problems.filter(p => p.notes || p.code);
  const grid = document.getElementById('notes-grid');
  if (!withNotes.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">📝</div><div class="empty-title">No notes yet</div><div class="empty-sub">Add notes while adding problems</div></div>`;
    return;
  }
  grid.innerHTML = withNotes.map(p => `
    <div class="note-card">
      <div class="note-card-title">${escHtml(p.name)}</div>
      <div class="note-card-meta">${p.platform} · ${p.date} · <span class="badge badge-${p.difficulty.toLowerCase()}" style="font-size:10px;padding:1px 6px">${p.difficulty}</span></div>
      ${p.notes ? `<div class="note-card-content">${escHtml(p.notes)}</div>` : ''}
      ${p.code ? `<div class="note-card-content" style="margin-top:6px">${escHtml(p.code)}</div>` : ''}
    </div>
  `).join('');
}

/* ═══════════════════════════════════════════
   REMINDERS
═══════════════════════════════════════════ */
function renderReminders() {
  const today = new Date().toISOString().split('T')[0];
  const withReminders = problems.filter(p => p.revision);
  const list = document.getElementById('reminders-list');

  if (!withReminders.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">🔔</div><div class="empty-title">No reminders set</div><div class="empty-sub">Set revision dates when adding problems</div></div>`;
    return;
  }

  const sorted = [...withReminders].sort((a,b) => a.revision.localeCompare(b.revision));

  list.innerHTML = sorted.map(p => {
    const daysLeft = Math.round((new Date(p.revision) - new Date(today)) / 86400000);
    let cls = 'ok', label = `In ${daysLeft} days`, statusCls = 'ok';
    if (daysLeft < 0) { cls = 'due'; label = `${Math.abs(daysLeft)}d overdue`; statusCls = 'due'; }
    else if (daysLeft <= 2) { cls = 'due-soon'; label = daysLeft === 0 ? 'Due today' : `In ${daysLeft} day${daysLeft>1?'s':''}`; statusCls = 'due-soon'; }

    return `
      <div class="reminder-item ${cls}">
        <div>
          <div class="reminder-name">${escHtml(p.name)}</div>
          <div class="reminder-date">Revision: ${p.revision} · <span class="badge badge-${p.difficulty.toLowerCase()}" style="font-size:10px;padding:1px 6px">${p.difficulty}</span></div>
        </div>
        <span class="reminder-status ${statusCls}">${label}</span>
      </div>
    `;
  }).join('');
}

/* ═══════════════════════════════════════════
   RECENT ACTIVITY
═══════════════════════════════════════════ */
function renderRecentActivity() {
  const el = document.getElementById('recent-activity');
  const recent = [...problems].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 6);
  if (!recent.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-title">No activity yet</div></div>`;
    return;
  }
  const colors = { Easy: 'var(--easy)', Medium: 'var(--medium)', Hard: 'var(--hard)' };
  el.innerHTML = recent.map(p => `
    <div class="activity-item">
      <div class="activity-dot" style="background:${colors[p.difficulty]}"></div>
      <div class="activity-info">
        <div class="activity-name">${escHtml(p.name)}</div>
        <div class="activity-meta">${p.platform} · ${p.date} · <span class="badge badge-${p.difficulty.toLowerCase()}" style="font-size:10px;padding:1px 5px">${p.difficulty}</span></div>
      </div>
    </div>
  `).join('');
}

/* ═══════════════════════════════════════════
   FILTER & SEARCH
═══════════════════════════════════════════ */
function setFilter(f, btn) {
  currentFilter = f;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  renderTable();
}

function handleSearch(val) {
  searchQuery = val;
  renderTable();
}

/* ═══════════════════════════════════════════
   CHARTS
═══════════════════════════════════════════ */
const chartDefaults = {
  font: { family: "'JetBrains Mono', monospace", size: 11 },
  color: '#8892a4'
};

function getThemeColors() {
  const isLight = document.documentElement.classList.contains('light');
  return {
    grid: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)',
    tick: isLight ? '#4b5470' : '#8892a4',
    legend: isLight ? '#4b5470' : '#8892a4',
  };
}

function initCharts() {
  const tc = getThemeColors();
  Chart.defaults.color = tc.tick;
  Chart.defaults.font.family = chartDefaults.font.family;

  charts.difficulty = new Chart(document.getElementById('difficultyChart'), {
    type: 'doughnut',
    data: { labels: ['Easy','Medium','Hard'], datasets: [{ data: [0,0,0], backgroundColor: ['rgba(16,185,129,0.8)','rgba(245,158,11,0.8)','rgba(239,68,68,0.8)'], borderColor: ['#10b981','#f59e0b','#ef4444'], borderWidth: 2, hoverOffset: 6 }] },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '68%',
      plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyleWidth: 8 } } }
    }
  });

  charts.weekly = new Chart(document.getElementById('weeklyChart'), {
    type: 'bar',
    data: { labels: [], datasets: [
      { label: 'Easy', data: [], backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 4, borderSkipped: false },
      { label: 'Medium', data: [], backgroundColor: 'rgba(245,158,11,0.7)', borderRadius: 4, borderSkipped: false },
      { label: 'Hard', data: [], backgroundColor: 'rgba(239,68,68,0.7)', borderRadius: 4, borderSkipped: false }
    ]},
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { x: { grid: { color: tc.grid }, ticks: { font: { size: 10 }, color: tc.tick } }, y: { grid: { color: tc.grid }, beginAtZero: true, ticks: { stepSize: 1, color: tc.tick } } },
      plugins: { legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true, pointStyleWidth: 8, color: tc.legend } } }
    }
  });

  charts.platform = new Chart(document.getElementById('platformChart'), {
    type: 'bar',
    data: { labels: ['LeetCode','Codeforces','GeeksForGeeks','Other'], datasets: [{ label: 'Problems', data: [0,0,0,0], backgroundColor: ['rgba(255,161,22,0.7)','rgba(61,106,255,0.7)','rgba(16,185,129,0.7)','rgba(139,92,246,0.7)'], borderRadius: 6, borderSkipped: false }] },
    options: {
      responsive: true, maintainAspectRatio: false, indexAxis: 'y',
      scales: { x: { grid: { color: tc.grid }, beginAtZero: true, ticks: { stepSize: 1, color: tc.tick } }, y: { grid: { display: false }, ticks: { color: tc.tick } } },
      plugins: { legend: { display: false } }
    }
  });

  updateCharts();
}

function updateCharts() {
  if (!charts.difficulty) return;

  const easy = problems.filter(p=>p.difficulty==='Easy').length;
  const medium = problems.filter(p=>p.difficulty==='Medium').length;
  const hard = problems.filter(p=>p.difficulty==='Hard').length;
  charts.difficulty.data.datasets[0].data = [easy, medium, hard];
  charts.difficulty.update();

  // Weekly — last 7 days
  const days = [];
  const labels = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    days.push(ds);
    labels.push(d.toLocaleDateString('en-US',{weekday:'short'}));
  }
  charts.weekly.data.labels = labels;
  charts.weekly.data.datasets[0].data = days.map(d => problems.filter(p=>p.date===d&&p.difficulty==='Easy').length);
  charts.weekly.data.datasets[1].data = days.map(d => problems.filter(p=>p.date===d&&p.difficulty==='Medium').length);
  charts.weekly.data.datasets[2].data = days.map(d => problems.filter(p=>p.date===d&&p.difficulty==='Hard').length);
  charts.weekly.update();

  charts.platform.data.datasets[0].data = [
    problems.filter(p=>p.platform==='LeetCode').length,
    problems.filter(p=>p.platform==='Codeforces').length,
    problems.filter(p=>p.platform==='GeeksForGeeks').length,
    problems.filter(p=>p.platform==='Other').length,
  ];
  charts.platform.update();

  // Top patterns
  const patternCount = {};
  problems.forEach(p => { if(p.pattern) p.pattern.split(',').forEach(t => { const k=t.trim(); if(k) patternCount[k]=(patternCount[k]||0)+1; }); });
  const sorted = Object.entries(patternCount).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const pList = document.getElementById('patterns-list');
  if (!sorted.length) {
    pList.innerHTML = `<div class="empty-state"><div class="empty-icon">🧩</div><div class="empty-title">No patterns yet</div></div>`;
  } else {
    const max = sorted[0][1];
    pList.innerHTML = sorted.map(([k,v]) => `
      <div class="skill-meter-row" style="margin-bottom:8px">
        <span class="skill-meter-label" style="min-width:120px;font-size:12px">${k}</span>
        <div class="skill-meter-bar"><div class="skill-meter-fill" style="width:${Math.round(v/max*100)}%;background:var(--accent-purple)"></div></div>
        <span class="skill-meter-val">${v}</span>
      </div>
    `).join('');
  }
}

/* ═══════════════════════════════════════════
   HEATMAP
═══════════════════════════════════════════ */
function buildHeatmap() {
  const grid = document.getElementById('heatmap-grid');
  const monthsEl = document.getElementById('heatmap-months');
  const today = new Date();
  const start = new Date(today); start.setFullYear(start.getFullYear()-1);

  // Count problems per date
  const counts = {};
  problems.forEach(p => { if(p.date) counts[p.date] = (counts[p.date]||0)+1; });

  // Build weeks
  const weeks = [];
  let cur = new Date(start);
  // align to Sunday
  cur.setDate(cur.getDate() - cur.getDay());

  while (cur <= today) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const ds = cur.toISOString().split('T')[0];
      week.push({ date: ds, count: Math.min(counts[ds]||0, 5), inRange: cur >= start && cur <= today });
      cur.setDate(cur.getDate()+1);
    }
    weeks.push(week);
  }

  grid.innerHTML = weeks.map(week => `
    <div class="heatmap-col">
      ${week.map(cell => `
        <div class="heatmap-cell" data-count="${cell.inRange ? cell.count : -1}"
          style="${!cell.inRange ? 'opacity:0' : ''}"
          data-tooltip="${cell.date}: ${cell.count} problem${cell.count!==1?'s':''}">
        </div>
      `).join('')}
    </div>
  `).join('');

  // Month labels (rough)
  const monthLabels = {};
  weeks.forEach((week, wi) => {
    const m = new Date(week[0].date).toLocaleDateString('en-US',{month:'short'});
    if (!monthLabels[m]) monthLabels[m] = wi;
  });

  monthsEl.innerHTML = '';
  let lastW = 0;
  Object.entries(monthLabels).forEach(([m, wi]) => {
    const gap = wi - lastW;
    if (gap > 0) {
      const spacer = document.createElement('div');
      spacer.style.cssText = `min-width:${gap * 18}px`;
      monthsEl.appendChild(spacer);
    }
    const label = document.createElement('div');
    label.className = 'heatmap-month-label';
    label.textContent = m;
    label.style.minWidth = '18px';
    monthsEl.appendChild(label);
    lastW = wi + 1;
  });

  const total = Object.values(counts).reduce((a,b)=>a+b,0);
  document.getElementById('heatmap-total-label').textContent = `${total} problem${total!==1?'s':''} in the last year`;
}

/* ═══════════════════════════════════════════
   CSV EXPORT
═══════════════════════════════════════════ */
function exportCSV() {
  if (!problems.length) { showToast('No data to export', 'error'); return; }
  const headers = ['Name','Platform','Difficulty','Pattern','Time(min)','Date','RevisionDate','Notes'];
  const rows = problems.map(p => [
    `"${p.name.replace(/"/g,'""')}"`, p.platform, p.difficulty,
    `"${p.pattern.replace(/"/g,'""')}"`, p.time, p.date, p.revision,
    `"${(p.notes||'').replace(/"/g,'""')}"`
  ]);
  const csv = [headers.join(','), ...rows.map(r=>r.join(','))].join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='dsa_problems.csv'; a.click();
  URL.revokeObjectURL(url);
  showToast('CSV exported!', 'success');
}

/* ═══════════════════════════════════════════
   TOAST
═══════════════════════════════════════════ */
function showToast(msg, type='info') {
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.25s ease forwards';
    setTimeout(() => toast.remove(), 260);
  }, 3000);
}

/* ═══════════════════════════════════════════
   UTILS
═══════════════════════════════════════════ */
function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function getModalHTML() {
  return `
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">Add Problem</div>
        <button class="close-btn" onclick="closeModal()">✕</button>
      </div>
      <div class="form-grid">
        <div class="form-group full-width"><label>Problem Name *</label><input type="text" id="problem-name" placeholder="e.g. Two Sum" /></div>
        <div class="form-group"><label>Platform</label><select id="problem-platform"><option value="LeetCode">LeetCode</option><option value="Codeforces">Codeforces</option><option value="GeeksForGeeks">GeeksForGeeks</option><option value="Other">Other</option></select></div>
        <div class="form-group"><label>Difficulty</label><select id="problem-difficulty"><option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option></select></div>
        <div class="form-group"><label>Pattern / Topic</label><input type="text" id="problem-pattern" placeholder="e.g. Two Pointers, DP" /></div>
        <div class="form-group"><label>Time Spent (minutes)</label><input type="number" id="problem-time" placeholder="30" min="1" /></div>
        <div class="form-group"><label>Date Solved</label><input type="date" id="problem-date" /></div>
        <div class="form-group"><label>Revision Date</label><input type="date" id="problem-revision" /></div>
        <div class="form-group full-width"><label>Notes</label><textarea id="problem-notes" placeholder="Key observations, approach, complexity…"></textarea></div>
        <div class="form-group full-width"><label>Code Snippet</label><textarea id="problem-code" placeholder="// Paste your solution here" style="min-height:100px;font-family:var(--font-mono)"></textarea></div>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px">
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="addProblem()">Add Problem</button>
      </div>
    </div>
  `;
}
function logout(){

localStorage.removeItem("user_id")
localStorage.removeItem("username")

window.location.href="login.html"

}
