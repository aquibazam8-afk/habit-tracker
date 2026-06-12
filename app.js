// ── Storage ─────────────────────────────────────────────────────────────────

const KEY_HABITS     = 'ht-habits-v2';
const KEY_CATEGORIES = 'ht-categories-v2';
const KEY_REMINDERS  = 'ht-reminders-v2';
const KEY_THEME      = 'ht-theme-v2';

function loadHabits()     { return JSON.parse(localStorage.getItem(KEY_HABITS))     || []; }
function loadCategories() { return JSON.parse(localStorage.getItem(KEY_CATEGORIES)) || ['Health','Productivity','Learning']; }
function loadReminders()  { return JSON.parse(localStorage.getItem(KEY_REMINDERS))  || []; }

function saveHabits(h)     { localStorage.setItem(KEY_HABITS,     JSON.stringify(h)); }
function saveCategories(c) { localStorage.setItem(KEY_CATEGORIES, JSON.stringify(c)); }
function saveReminders(r)  { localStorage.setItem(KEY_REMINDERS,  JSON.stringify(r)); }

// ── Helpers ──────────────────────────────────────────────────────────────────

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function todayStr() { return new Date().toISOString().slice(0, 10); }

function isSunday() { return new Date().getDay() === 0; }

// ── Progress reset logic ─────────────────────────────────────────────────────

function resetProgressIfNeeded(habit) {
  const today = todayStr();
  if (!habit.lastReset) { habit.lastReset = today; return habit; }

  if (habit.frequency === 'daily' && habit.lastReset !== today) {
    if (habit.progress < 100) habit.streak = 0; // missed yesterday
    habit.progress  = 0;
    habit.lastReset = today;
  }

  if (habit.frequency === 'weekly' && isSunday() && habit.lastReset !== today) {
    if (habit.progress < 100) habit.streak = 0;
    habit.progress  = 0;
    habit.lastReset = today;
  }

  return habit;
}

// ── Streak milestones ─────────────────────────────────────────────────────────

const MILESTONES = [5, 10, 20, 50, 100];

function milestoneLabel(streak) {
  if (streak >= 100) return '🏆 100 days!';
  if (streak >= 50)  return '💎 50 days!';
  if (streak >= 20)  return '⭐ 20 days!';
  if (streak >= 10)  return '🥈 10 days!';
  if (streak >= 5)   return '🥉 5 days!';
  return null;
}

// ── Render helpers ────────────────────────────────────────────────────────────

function getCategorySelectOptions(categories, selected) {
  return categories.map(c =>
    `<option value="${c}" ${c === selected ? 'selected' : ''}>${c}</option>`
  ).join('');
}

function populateCategorySelects() {
  const cats = loadCategories();
  const opts  = getCategorySelectOptions(cats, '');

  // Add habit form
  const addCat = document.getElementById('habit-category');
  const curAdd = addCat.value;
  addCat.innerHTML = getCategorySelectOptions(cats, curAdd || cats[0]);

  // Edit habit form
  const editCat = document.getElementById('edit-habit-category');
  editCat.innerHTML = getCategorySelectOptions(cats, editCat.value || cats[0]);

  // Filter dropdown
  const filter = document.getElementById('filter-category');
  const curFilter = filter.value;
  filter.innerHTML = `<option value="all">All Categories</option>` +
    cats.map(c => `<option value="${c}" ${c === curFilter ? 'selected' : ''}>${c}</option>`).join('');

  // Reminder habit select
  const habits = loadHabits();
  const reminderSel = document.getElementById('reminder-habit');
  const curReminder = reminderSel.value;
  reminderSel.innerHTML = `<option value="">-- Select a habit --</option>` +
    habits.map(h => `<option value="${h.id}" ${h.id === curReminder ? 'selected' : ''}>${h.name}</option>`).join('');
}

// ── Render habits ─────────────────────────────────────────────────────────────

function renderHabits() {
  const habits      = loadHabits().map(resetProgressIfNeeded);
  saveHabits(habits);

  const filterVal   = document.getElementById('filter-category').value;
  const listEl      = document.getElementById('habit-list');
  const noMsg       = document.getElementById('no-habits-msg');

  const filtered = filterVal === 'all' ? habits : habits.filter(h => h.category === filterVal);

  if (filtered.length === 0) {
    listEl.innerHTML = '';
    noMsg.classList.remove('hidden');
  } else {
    noMsg.classList.add('hidden');
    listEl.innerHTML = filtered.map(habitCard).join('');
  }

  updateOverview(habits);
  updateAnalytics(habits);
  populateCategorySelects();
}

function habitCard(h) {
  const pct       = h.progress || 0;
  const done      = pct >= 100;
  const milestone = milestoneLabel(h.streak);

  return `
    <li class="habit-card ${done ? 'completed' : ''}" id="hc-${h.id}">
      <div class="habit-card-header">
        <div class="habit-card-info">
          <div class="habit-card-name">${h.name}</div>
          <div class="habit-card-meta">
            <span class="badge badge-category">${h.category}</span>
            <span class="badge badge-freq">${h.frequency}</span>
            ${h.streak > 0 ? `<span class="badge badge-streak">🔥 ${h.streak} day streak</span>` : ''}
            ${milestone    ? `<span class="badge badge-milestone">${milestone}</span>` : ''}
          </div>
        </div>
        <div class="habit-card-actions">
          ${!done ? `<button class="btn-sm btn-progress" onclick="markProgress('${h.id}')">+25%</button>` : ''}
          <button class="btn-sm btn-edit"   onclick="openEdit('${h.id}')">Edit</button>
          <button class="btn-sm btn-delete" onclick="deleteHabit('${h.id}')">Delete</button>
        </div>
      </div>
      <div class="progress-label">${pct}% complete</div>
      <div class="progress-wrap" onclick="markProgress('${h.id}')" title="Click to add 25% progress">
        <div class="progress-fill" style="width:${pct}%"></div>
      </div>
    </li>`;
}

// ── Mark progress ─────────────────────────────────────────────────────────────

function markProgress(id) {
  const habits = loadHabits();
  const today  = todayStr();
  const h      = habits.find(x => x.id === id);
  if (!h || h.progress >= 100) return;

  h.progress = Math.min(100, (h.progress || 0) + 25);

  if (h.progress === 100) {
    // Check streak continuation
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yd = yesterday.toISOString().slice(0, 10);

    if (h.lastCompleted === yd || h.lastCompleted === today) {
      h.streak = (h.streak || 0) + 1;
    } else {
      h.streak = 1;
    }
    h.lastCompleted = today;

    // Alert milestones
    if (MILESTONES.includes(h.streak)) {
      setTimeout(() => alert(`🎉 ${h.name} — ${milestoneLabel(h.streak)}`), 100);
    }
  }

  saveHabits(habits);
  renderHabits();
}

// ── Add habit ─────────────────────────────────────────────────────────────────

document.getElementById('add-habit-btn').addEventListener('click', () => {
  const name  = document.getElementById('habit-name').value.trim();
  const cat   = document.getElementById('habit-category').value;
  const freq  = document.getElementById('habit-frequency').value;
  const errEl = document.getElementById('add-error');

  if (!name) { errEl.classList.remove('hidden'); return; }
  errEl.classList.add('hidden');

  const habits = loadHabits();
  habits.push({ id: uid(), name, category: cat, frequency: freq,
                progress: 0, streak: 0, lastCompleted: null,
                lastReset: todayStr(), createdAt: todayStr() });
  saveHabits(habits);

  document.getElementById('habit-name').value = '';
  renderHabits();
});

// ── Delete habit ──────────────────────────────────────────────────────────────

function deleteHabit(id) {
  const el = document.getElementById(`hc-${id}`);
  if (el) {
    el.classList.add('fade-out');
    setTimeout(() => {
      let habits = loadHabits().filter(h => h.id !== id);
      saveHabits(habits);
      // Cascade: remove reminders for this habit
      let reminders = loadReminders().filter(r => r.habitId !== id);
      saveReminders(reminders);
      renderHabits();
      renderReminders();
    }, 400);
  }
}

// ── Edit habit ────────────────────────────────────────────────────────────────

let editingId = null;

function openEdit(id) {
  const h = loadHabits().find(x => x.id === id);
  if (!h) return;
  editingId = id;

  document.getElementById('edit-habit-name').value = h.name;
  document.getElementById('edit-habit-category').value = h.category;
  document.getElementById('edit-habit-frequency').value = h.frequency;
  document.getElementById('edit-habit-section').classList.remove('hidden');
  document.getElementById('edit-habit-section').scrollIntoView({ behavior: 'smooth' });
}

document.getElementById('save-edit-btn').addEventListener('click', () => {
  if (!editingId) return;
  const name = document.getElementById('edit-habit-name').value.trim();
  const cat  = document.getElementById('edit-habit-category').value;
  const freq = document.getElementById('edit-habit-frequency').value;
  if (!name) return;

  const habits = loadHabits();
  const h      = habits.find(x => x.id === editingId);
  if (h) { h.name = name; h.category = cat; h.frequency = freq; }
  saveHabits(habits);

  editingId = null;
  document.getElementById('edit-habit-section').classList.add('hidden');
  renderHabits();
});

document.getElementById('cancel-edit-btn').addEventListener('click', () => {
  editingId = null;
  document.getElementById('edit-habit-section').classList.add('hidden');
});

// ── Filter ────────────────────────────────────────────────────────────────────

document.getElementById('filter-category').addEventListener('change', renderHabits);

// ── Categories ────────────────────────────────────────────────────────────────

function renderCategories() {
  const cats = loadCategories();
  const el   = document.getElementById('category-list');
  el.innerHTML = cats.map(c => `
    <div class="category-chip">
      ${c}
      ${!['Health','Productivity','Learning'].includes(c)
        ? `<button class="remove-cat" onclick="removeCategory('${c}')" title="Remove">✕</button>`
        : ''}
    </div>`).join('');
}

document.getElementById('add-category-btn').addEventListener('click', () => {
  const input = document.getElementById('new-category-input');
  const val   = input.value.trim();
  if (!val) return;

  const cats = loadCategories();
  if (cats.map(c => c.toLowerCase()).includes(val.toLowerCase())) {
    alert('That category already exists.'); return;
  }
  cats.push(val);
  saveCategories(cats);
  input.value = '';
  renderCategories();
  populateCategorySelects();
});

function removeCategory(cat) {
  const cats = loadCategories().filter(c => c !== cat);
  saveCategories(cats);
  renderCategories();
  populateCategorySelects();
}

// ── Overview ──────────────────────────────────────────────────────────────────

function updateOverview(habits) {
  document.getElementById('total-habits').textContent = habits.length;
  document.getElementById('completed-habits').textContent = habits.filter(h => h.progress >= 100).length;
  const longest = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);
  document.getElementById('longest-streak').textContent = longest;
}

// ── Analytics ─────────────────────────────────────────────────────────────────

function updateAnalytics(habits) {
  const cats  = loadCategories();
  const done  = habits.filter(h => h.progress >= 100);

  document.getElementById('health-completed').textContent =
    done.filter(h => h.category === 'Health').length;
  document.getElementById('productivity-completed').textContent =
    done.filter(h => h.category === 'Productivity').length;
  document.getElementById('learning-completed').textContent =
    done.filter(h => h.category === 'Learning').length;

  // Extra (custom) categories
  const custom = cats.filter(c => !['Health','Productivity','Learning'].includes(c));
  const extraEl = document.getElementById('extra-analytics');
  if (custom.length === 0) { extraEl.innerHTML = ''; return; }

  extraEl.innerHTML = custom.map(c => `
    <div class="analytics-item">
      <span class="analytics-label">${c}</span>
      <span class="analytics-value">${done.filter(h => h.category === c).length}</span>
      <span class="analytics-label">completed</span>
    </div>`).join('');
}

// ── Reminders ─────────────────────────────────────────────────────────────────

function renderReminders() {
  const reminders = loadReminders();
  const listEl    = document.getElementById('reminder-list');
  if (reminders.length === 0) { listEl.innerHTML = ''; return; }

  listEl.innerHTML = reminders.map(r => `
    <li class="reminder-item">
      <span><strong>${r.habitName}</strong> · ${r.time} · ${r.frequency}</span>
      <button class="btn-sm btn-delete" onclick="deleteReminder('${r.id}')">Remove</button>
    </li>`).join('');
}

function deleteReminder(id) {
  saveReminders(loadReminders().filter(r => r.id !== id));
  renderReminders();
}

document.getElementById('set-reminder-btn').addEventListener('click', () => {
  const habitId = document.getElementById('reminder-habit').value;
  const time    = document.getElementById('reminder-time').value;
  const freq    = document.getElementById('reminder-frequency').value;
  const permMsg = document.getElementById('reminder-permission-msg');

  if (!habitId || !time) { alert('Please select a habit and set a time.'); return; }

  const habits = loadHabits();
  const habit  = habits.find(h => h.id === habitId);
  if (!habit)  return;

  if (!('Notification' in window)) {
    permMsg.classList.remove('hidden'); return;
  }

  Notification.requestPermission().then(perm => {
    if (perm !== 'granted') { permMsg.classList.remove('hidden'); return; }
    permMsg.classList.add('hidden');

    const reminder = { id: uid(), habitId, habitName: habit.name, time, frequency: freq };
    const reminders = loadReminders();
    reminders.push(reminder);
    saveReminders(reminders);

    scheduleReminder(reminder);
    renderReminders();
  });
});

function msUntil(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const now    = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target - now;
}

function scheduleReminder(r) {
  const fire = () => {
    new Notification(`⏰ Habit Reminder: ${r.habitName}`, {
      body: `Time to work on: ${r.habitName}`,
      icon: '🎯',
    });
    if (r.frequency === 'daily')  setTimeout(fire, 24 * 60 * 60 * 1000);
    if (r.frequency === 'weekly') setTimeout(fire,  7 * 24 * 60 * 60 * 1000);
  };
  setTimeout(fire, msUntil(r.time));
}

function rescheduleAllReminders() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  loadReminders().forEach(scheduleReminder);
}

// ── Theme ─────────────────────────────────────────────────────────────────────

function applyTheme(dark) {
  document.body.classList.toggle('dark-mode', dark);
  document.getElementById('theme-switcher').textContent = dark ? '☀️ Light Mode' : '🌙 Dark Mode';
  localStorage.setItem(KEY_THEME, dark ? 'dark' : 'light');
}

document.getElementById('theme-switcher').addEventListener('click', () => {
  applyTheme(!document.body.classList.contains('dark-mode'));
});

// ── Settings ──────────────────────────────────────────────────────────────────

document.getElementById('clear-data-btn').addEventListener('click', () => {
  if (!confirm('This will permanently delete all habits, categories, and reminders. Are you sure?')) return;
  localStorage.removeItem(KEY_HABITS);
  localStorage.removeItem(KEY_CATEGORIES);
  localStorage.removeItem(KEY_REMINDERS);
  renderHabits();
  renderCategories();
  renderReminders();
});

// ── Boot ──────────────────────────────────────────────────────────────────────

(function boot() {
  // Apply saved theme
  const savedTheme = localStorage.getItem(KEY_THEME);
  applyTheme(savedTheme === 'dark');

  renderHabits();
  renderCategories();
  renderReminders();
  rescheduleAllReminders();
})();
