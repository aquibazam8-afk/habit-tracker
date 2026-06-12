# 🎯 Habit Tracker

A minimal, no-dependency habit tracker that runs entirely in the browser. No accounts, no backend — your data stays in your browser's localStorage.

![dark theme screenshot placeholder](https://via.placeholder.com/660x360/0f1117/6c63ff?text=Habit+Tracker)

## Features

- **First-run setup** — asks you which habits to track (you own the list)
- **Daily check-in** — tap a habit to mark it done
- **Streak tracking** — see your current streak per habit
- **7-day history grid** — visual overview of the last week
- **Manage habits** — add, rename, or remove habits anytime via the ⚙ button
- **Zero dependencies** — plain HTML, CSS, and JavaScript; works offline
- **Persistent** — data saved in `localStorage`; survives page refreshes

## Quick Start

1. Clone or download this repo:
   ```bash
   git clone https://github.com/YOUR_USERNAME/habit-tracker.git
   cd habit-tracker
   ```

2. Open `index.html` in any browser — that's it. No install, no build step.

   On Windows you can double-click `index.html`, or:
   ```bash
   start index.html
   ```

## Usage

| Action | How |
|--------|-----|
| Set up habits | First launch shows a setup screen — add as many habits as you want with an optional emoji |
| Mark a habit done | Click/tap the habit row |
| View streaks | Streak count appears below each habit name |
| See last 7 days | Scroll to the "Last 7 Days" grid at the bottom |
| Add / rename / delete habits | Click **⚙ Habits** in the top right |

## Customisation

All styles live in `style.css` and use CSS variables at the top of the file.  Change colours, radius, or font there — no JavaScript knowledge needed.

```css
:root {
  --accent: #6c63ff;   /* purple → change to your preferred colour */
  --green:  #22c55e;   /* done/streak colour */
  --bg:     #0f1117;   /* page background */
}
```

## Project Structure

```
habit-tracker/
├── index.html   # markup + modal structure
├── style.css    # dark theme, responsive layout
├── app.js       # all logic (setup, toggle, streaks, weekly grid)
└── README.md
```

## Contributing

PRs welcome. Keep it dependency-free and vanilla — the point is that anyone can open the file and use it immediately.

## License

MIT — do whatever you want with it.
