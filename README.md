# 🎯 Habit Tracker

A minimal, no-dependency daily habit tracker that runs entirely in the browser. No accounts, no backend — your data stays locally in your browser.

## 🌐 Live Demo

**[➡️ Try it now: aquibazam8-afk.github.io/habit-tracker](https://aquibazam8-afk.github.io/habit-tracker/)**

No install. No sign-up. Just open and start tracking.

---

## Features

- **Light / Dark mode** — toggle and persists across sessions
- **Custom categories** — Health, Productivity, Learning, or add your own
- **Daily & weekly habits** — auto-resets at midnight (daily) or Sunday (weekly)
- **25% progress increments** — click to add progress, 4 clicks = done
- **Streak tracking** — consecutive-day streaks with milestone badges (5 / 10 / 20 / 50 / 100 days 🏆)
- **Overview panel** — total habits, completed today, longest streak at a glance
- **Analytics** — completion count broken down by category
- **Browser reminders** — set once / daily / weekly notifications via Web Notifications API
- **Edit & delete** — modify or remove any habit; reminders auto-clean up
- **Zero dependencies** — plain HTML, CSS, and JavaScript; works fully offline
- **Persistent** — data saved in `localStorage`; survives page refreshes

## Quick Start

### Option A — Use online (recommended)
Click the live demo link above. Done.

### Option B — Run locally
```bash
git clone https://github.com/aquibazam8-afk/habit-tracker.git
cd habit-tracker
# Open index.html in any browser — no build step needed
start index.html        # Windows
open index.html         # macOS
xdg-open index.html     # Linux
```

## How to Use

| Action | How |
|--------|-----|
| Add a habit | Fill in the **Add New Habit** form and click Add |
| Mark progress | Click the progress bar or the **+25%** button — 4 clicks = complete |
| View streaks | Streak badge appears on each habit card |
| Filter by category | Use the **Filter Habits** dropdown |
| Edit a habit | Click **Edit** on any habit card |
| Set a reminder | Choose a habit, time, and frequency in the **Reminders** section |
| Add custom category | Type in **Manage Categories** and click Add |
| Toggle dark mode | Click 🌙 / ☀️ in the top-right corner |
| Clear all data | **Settings → Clear All Data** |

## Customisation

All colours are CSS variables in `style.css`:

```css
:root {
  --accent:  #5cb85c;   /* primary green — change to any colour */
  --danger:  #d9534f;   /* delete / warning red */
  --bg:      #f4f4f4;   /* page background (light mode) */
}
```

## Project Structure

```
habit-tracker/
├── index.html   # all sections and modals
├── style.css    # light + dark theme, responsive layout, animations
├── app.js       # habits, streaks, categories, reminders, analytics
└── README.md
```

## Contributing

PRs welcome. Keep it dependency-free and vanilla — the whole point is that anyone can open the file and use it immediately.

## License

MIT — do whatever you want with it.
