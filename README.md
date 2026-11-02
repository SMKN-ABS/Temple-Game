# Temple of Boom

**Temple of Boom** is a pixel-art platform shooter set in a moonlit ancient temple. Move through the ruins, aim at the guardians, clear each chamber, and reach the exit door before the temple claims you.

This repository contains a small React/Vite playable prototype with a custom Canvas-based game loop and a styled mission interface.

## Features

- Pixel-art-inspired temple setting rendered with the HTML Canvas API
- Platforming with movement, jumping, climbable ladders, temple platforms, and an exit door
- Mouse aiming and hold-to-fire shooting
- Keyboard movement and shooting controls
- Enemy guardians with different visual types: crabs, tortoises, and guardians
- Health, collectible heart and ammo pickups, score, coin collection, and guardian progress HUD
- Breakable bricks that release growth and shield power-ups
- Guardian projectiles introduced from Chamber 6 onward with visible attack telegraphs
- Volcanic lava crossing in Chamber 6 with rising and falling bridge steps
- Animated gold coins placed throughout each chamber; collecting one awards 50 points and adds to the persistent coin wallet
- Golden Raider player dress automatically unlocks and equips after collecting 100 coins
- Home screen, level map, pause screen, and victory screen
- Twenty-five playable chambers in the current prototype:
  - **Temple Gate** — Chamber 1
  - **Lava Vault** — Chamber 2
  - Chambers 3–25 use numbered chamber labels without separate title names
  - Chamber 6 introduces lava, volcano scenery, and raised stepping-stone bridges
- Responsive layout around a fixed 960 × 540 game canvas

## How to play

1. Launch the game and choose **Start Game** or **Quick Start**.
2. Move through the temple using the platforms and ladders. When you reach a ladder, hold `W` or `↑` to climb up; hold `S` or `↓` to climb down.
3. Aim with the mouse and click or hold the left mouse button to fire.
4. Defeat every guardian in the chamber.
5. When the door opens, move to the door on the right and press **Up**, **W**, or **Enter** to continue.
6. Clear all 25 chambers to win the run.

### Controls

| Action | Controls |
| --- | --- |
| Move left/right | `A` / `D` or `←` / `→` |
| Jump | `W`, `↑`, or `Space` |
| Climb ladders | Hold `W` / `↑` up, or `S` / `↓` down |
| Aim | Mouse cursor |
| Fire | Hold left mouse button, `X`, or `J` |
| Pause/resume | `P` |
| Enter the exit door | `W`, `↑`, or `Enter` |

> The on-screen controls panel lists the primary mouse and keyboard controls. Keyboard shooting with `X` and `J` is also supported.

## Getting started

### Requirements

- Node.js 18 or newer recommended
- npm

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

Vite will print a local URL, usually `http://localhost:5173`.

### Create a production build

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

## Project structure

```text
.
├── index.html              # Application HTML entry point
├── package.json            # Scripts and dependencies
├── src/
│   ├── main.jsx            # React UI and Canvas game logic
│   └── styles.css          # Interface, overlays, and responsive styles
├── dist/                   # Generated production output
└── game-improvement-plan.md # Notes and proposed future improvements
```

## Technical overview

The application is a React single-page app powered by Vite. The game world is drawn directly to a 960 × 540 `<canvas>` element. React manages menus, overlays, level state, pause state, HUD updates, and progression, while the Canvas loop handles player movement, collisions, projectiles, enemies, particles, and rendering.

The game currently uses no external art, audio, or game engine. Visuals are generated with Canvas drawing commands and the interface is styled with CSS.

## Current prototype limitations

This is an early playable prototype. Some interface and gameplay elements are intentionally incomplete:

- Coin progress and the highest unlocked chamber are saved in the browser; `START GAME` resumes at the highest unlocked level.
- The mute button is present, but audio has not yet been added.
- Ammunition is limited, but collectible ammo crates restore bullets when picked up; heart pickups restore lost health.
- Growth power-ups increase jump height and absorb one enemy hit; shield potions block one attack.
- From Chamber 6 onward, guardian enemies fire telegraphed projectiles that must be dodged or blocked.
- Losing all health now shows a dedicated `Temple Lost` screen with restart and home options.
- Levels 2–4 currently reuse the temple layout and visual treatment instead of having fully distinct environments.
- The footer's “High Score” value currently reflects the active run score rather than a saved best score.

See [`game-improvement-plan.md`](./game-improvement-plan.md) for planned improvements and design notes.

## Development notes

The main gameplay entry point is [`src/main.jsx`](./src/main.jsx). Important areas include:

- `TempleCanvas` — Canvas setup, input handling, and animation loop
- `updateGame` — Movement, shooting, collision, enemy, and progression logic
- `drawGame` — World, characters, effects, and HUD rendering
- `App` — Menus, level transitions, pause state, and overlays

## License

No license has been specified for this prototype yet.
