// ── Storage helpers ──────────────────────────────────────────────────────────

const STORAGE_KEY = 'habit-tracker-v1';

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getState() {
  const data = load();
  return {
    setupDone: data.setupDone || false,
    habits:    data.habits    || [],
    logs:      data.logs      || {},
  };
}

function setState(patch) {
  save({ ...load(), ...patch });
}

// ── Date helpers ─────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function dateStr(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function friendlyDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ── Setup modal ──────────────────────────────────────────────────────────────

function buildHabitRow(emoji, name, removable) {
  const row = document.createElement('div');
  row.className = 'habit-row';
  row.innerHTML = `
    <input class="emoji-input" type="text" placeholder="🏃" maxlength="2" value="${emoji}" />
    <input class="name-input"  type="text" placeholder="e.g. Morning workout" value="${name}" />
    <button class="remove-row-btn${removable ? '' : ' hidden'}" title="Remove">✕</button>
  `;
  row.querySelector('.remove-row-btn').addEventListener('click', () => {
    row.remove();
    updateRemoveButtons('#habit-input-list');
  });
  return row;
}

function updateRemoveButtons(containerSelector) {
  const rows = document.querySelectorAll(`${containerSelector} .habit-row`);
  rows.forEach((r, i) => {
    const btn = r.querySelector('.remove-row-btn');
    btn.classList.toggle('hidden', rows.length === 1 && i === 0);
  });
}

function initSetupModal() {
  const overlay = document.getElementById('setup-overlay');
  const list    = document.getElementById('habit-input-list');
  const addBtn  = document.getElementById('add-row-btn');
  const saveBtn = document.getElementById('save-setup-btn');
  const errEl   = document.getElementById('setup-error');

  // Clear and seed one row
  list.innerHTML = '';
  list.appendChild(buildHabitRow('', '', false));

  addBtn.addEventListener('click', () => {
    list.appendChild(buildHabitRow('', '', true));
    updateRemoveButtons('#habit-input-list');
    list.lastElementChild.querySelector('.name-input').focus();
  });

  saveBtn.addEventListener('click', () => {
    const rows   = list.querySelectorAll('.habit-row');
    const habits = [];
    let valid    = true;

    rows.forEach(row => {
      const name  = row.querySelector('.name-input').value.trim();
      const emoji = row.querySelector('.emoji-input').value.trim() || '⬜';
      if (name) habits.push({ id: uid(), name, emoji, createdAt: todayStr() });
      else if (row.querySelector('.name-input').value.trim() === '' && rows.length > 1) {
        // skip empty extra rows silently
      } else if (name === '') {
        valid = false;
      }
    });

    if (!valid || habits.length === 0) {
      errEl.classList.remove('hidden');
      return;
    }

    errEl.classList.add('hidden');
    setState({ setupDone: true, habits });
    overlay.classList.add('hidden');
    initApp();
  });
}

// ── Main app ─────────────────────────────────────────────────────────────────

function initApp() {
  const app = document.getElementById('app');
  app.classList.remove('hidden');

  renderHeader();
  renderHabits();
  renderWeekly();
}

function renderHeader() {
  document.getElementById('today-label').textContent = friendlyDate(todayStr());
}

function renderHabits() {
  const { habits, logs } = getState();
  const today            = todayStr();
  const todayLog         = logs[today] || {};
  const list             = document.getElementById('habits-list');
  const doneCount        = habits.filter(h => todayLog[h.id]).length;

  // Progress bar
  const pct = habits.length ? Math.round((doneCount / habits.length) * 100) : 0;
  document.getElementById('progress-bar-fill').style.width = pct + '%';
  document.getElementById('progress-label').textContent =
    `${doneCount} / ${habits.length} done today`;

  list.innerHTML = '';
  habits.forEach(habit => {
    const done  = !!todayLog[habit.id];
    const streak = calcStreak(habit.id, logs);

    const li = document.createElement('li');
    li.className = 'habit-item' + (done ? ' done' : '');
    li.innerHTML = `
      <span class="habit-emoji">${habit.emoji}</span>
      <div class="habit-info">
        <div class="habit-name">${habit.name}</div>
        <div class="habit-streak">${streak > 0 ? `🔥 ${streak}-day streak` : 'No streak yet'}</div>
      </div>
      <div class="habit-check">${done ? '✓' : ''}</div>
    `;
    li.addEventListener('click', () => toggleHabit(habit.id));
    list.appendChild(li);
  });
}

function toggleHabit(habitId) {
  const state = getState();
  const today  = todayStr();

  if (!state.logs[today]) state.logs[today] = {};
  state.logs[today][habitId] = !state.logs[today][habitId];

  setState({ logs: state.logs });
  renderHabits();
  renderWeekly();
}

function calcStreak(habitId, logs) {
  let streak = 0;
  let offset = 0;

  // Don't count today towards streak until it's ticked
  while (true) {
    offset--;
    const d = dateStr(offset);
    if (logs[d] && logs[d][habitId]) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function renderWeekly() {
  const { habits, logs } = getState();
  const today            = todayStr();
  const grid             = document.getElementById('weekly-grid');
  const days             = Array.from({ length: 7 }, (_, i) => dateStr(i - 6)); // last 7 days incl. today

  grid.innerHTML = '';
  habits.forEach(habit => {
    const row = document.createElement('div');
    row.className = 'week-row';

    const label = document.createElement('span');
    label.className = 'week-label';
    label.textContent = `${habit.emoji} ${habit.name}`;

    const daysWrap = document.createElement('div');
    daysWrap.className = 'week-days';

    days.forEach(d => {
      const dot = document.createElement('div');
      const dayLogs = logs[d] || {};
      const isToday = d === today;
      const done    = !!dayLogs[habit.id];

      dot.className = 'week-dot' +
        (done ? ' done' : ' missed') +
        (isToday ? ' today' : '');
      dot.title = friendlyDate(d) + (done ? ' ✓' : ' ✗');
      dot.textContent = isToday ? '·' : '';
      daysWrap.appendChild(dot);
    });

    row.appendChild(label);
    row.appendChild(daysWrap);
    grid.appendChild(row);
  });
}

// ── Settings modal ───────────────────────────────────────────────────────────

function buildSettingsRow(habit) {
  const row = document.createElement('div');
  row.className = 'habit-row';
  row.dataset.id = habit.id;
  row.innerHTML = `
    <input class="emoji-input" type="text" placeholder="🏃" maxlength="2" value="${habit.emoji}" />
    <input class="name-input"  type="text" placeholder="Habit name" value="${habit.name}" />
    <button class="remove-row-btn" title="Remove">✕</button>
  `;
  row.querySelector('.remove-row-btn').addEventListener('click', () => {
    row.remove();
    updateRemoveButtons('#settings-habit-list');
  });
  return row;
}

function initSettingsModal() {
  const openBtn    = document.getElementById('settings-btn');
  const overlay    = document.getElementById('settings-overlay');
  const cancelBtn  = document.getElementById('settings-cancel-btn');
  const saveBtn    = document.getElementById('settings-save-btn');
  const addBtn     = document.getElementById('settings-add-row-btn');
  const listEl     = document.getElementById('settings-habit-list');
  const errEl      = document.getElementById('settings-error');

  openBtn.addEventListener('click', () => {
    const { habits } = getState();
    listEl.innerHTML = '';
    habits.forEach(h => listEl.appendChild(buildSettingsRow(h)));
    updateRemoveButtons('#settings-habit-list');
    errEl.classList.add('hidden');
    overlay.classList.remove('hidden');
  });

  cancelBtn.addEventListener('click', () => overlay.classList.add('hidden'));

  addBtn.addEventListener('click', () => {
    listEl.appendChild(buildSettingsRow({ id: uid(), emoji: '', name: '' }));
    updateRemoveButtons('#settings-habit-list');
    listEl.lastElementChild.querySelector('.name-input').focus();
  });

  saveBtn.addEventListener('click', () => {
    const rows   = listEl.querySelectorAll('.habit-row');
    const habits = [];
    let valid    = true;

    rows.forEach(row => {
      const name  = row.querySelector('.name-input').value.trim();
      const emoji = row.querySelector('.emoji-input').value.trim() || '⬜';
      const id    = row.dataset.id || uid();
      if (name) habits.push({ id, name, emoji, createdAt: todayStr() });
      else valid = false;
    });

    if (!valid || habits.length === 0) {
      errEl.classList.remove('hidden');
      return;
    }

    errEl.classList.add('hidden');
    setState({ habits });
    overlay.classList.add('hidden');
    renderHabits();
    renderWeekly();
  });
}

// ── Boot ─────────────────────────────────────────────────────────────────────

(function boot() {
  const { setupDone } = getState();

  if (!setupDone) {
    initSetupModal();
  } else {
    document.getElementById('setup-overlay').classList.add('hidden');
    initApp();
  }

  initSettingsModal();
})();
