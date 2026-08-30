# Brick Breaker

A hyper-casual brick breaker game inspired by labyrinth-style brick games. Features 20 hand-crafted levels with corridor-based level design, multiple brick types, and a combo scoring system.

## Features

- **20 Labyrinth Levels** with unique corridor designs
- **Endless Mode** with procedural level generation
- **Multiple Brick Types**: Normal (1-4 HP), Indestructible, Pierce-required, Opens-corridor
- **Combo System**: Chain hits for score multipliers
- **Power-ups**: Pierce (red ball), Multi-ball, Expand paddle, Extra life
- **Progress System**: Stars, saved progress, level select
- **Responsive**: Works on desktop and mobile
- **PWA**: Installable as a standalone app

## How to Play

1. Open `index.html` in a browser
2. Click **Play** to start Campaign or **Endless** for infinite mode
3. Use mouse/touch to move the paddle
4. Break all destructible bricks to complete each level

## Technologies

- Vanilla JavaScript (no frameworks)
- HTML5 Canvas
- Web Audio API
- CSS3
- Service Worker (PWA)

## Setup

Simply serve the files via any HTTP server:

```bash
# Python
python3 -m http.server 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.
