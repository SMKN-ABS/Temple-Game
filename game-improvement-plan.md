# Temple of Boom — Game Improvement Plan

## Current strengths

- Strong visual identity with a cohesive navy, gold, and red palette.
- Clear game presentation with a home screen, level map, pause overlay, HUD, and win screen.
- Good foundation for a pixel-art platform shooter.
- Responsive page layout and a production build that currently succeeds with `npm run build`.

## Highest-priority improvements

### 1. Improve the core game feel

The current loop is:

> Move → shoot guardians twice → reach the door

Make every action more satisfying:

- Add muzzle flashes and weapon recoil.
- Add hit-stop or a small screen shake when enemies are hit.
- Add different hit effects for normal and armored enemies.
- Add shooting, impact, enemy death, and door sounds.
- Add floating score text such as `+125`.
- Add enemy death animations instead of instantly removing enemies.
- Add knockback and brief hit-stun states.

Relevant code: `src/main.jsx`, especially `updateGame`, `drawPlayer`, `drawEnemy`, and `drawGame`.

### 2. Implement the ladders

Ladders are currently drawn but do not have gameplay functionality. Add:

- Ladder collision zones.
- Climbing with `W`, `S`, `ArrowUp`, and `ArrowDown`.
- Reduced or disabled gravity while climbing.
- Jumping off ladders.
- Optional enemy ladder behavior.

This will make the vertical temple layout much more meaningful.

### 3. Give enemies distinct behavior

Enemies currently mostly move toward the player and cause contact damage. Give each enemy a clear role:

- **Crab:** fast melee enemy.
- **Tortoise:** slow armored enemy requiring more shots or positioning.
- **Guardian:** ranged enemy with a visible attack telegraph.
- **Boss:** larger enemy with multiple attack phases.

Also add patrol areas, attack cooldowns, knockback, alert indicators, and platform-aware movement.

### 4. Improve progression and level selection

The map displays four levels, but only level 1 is selectable. Level 2 is entered automatically through the door, while levels 3 and 4 are decorative.

Recommended changes:

- Make unlocked map nodes clickable.
- Display the selected level clearly.
- Add level descriptions and difficulty ratings.
- Unlock levels one at a time.
- Save progression with `localStorage`.

Example:

```jsx
<button
  className="map-node unlocked"
  onClick={() => onStart(2)}
>
  <span>02</span>
  <small>VAULT</small>
</button>
```

### 5. Make the Lava Vault visually different

Level 2 is labeled `LAVA VAULT`, but currently reuses the same environment and layout as level 1.

Add:

- Orange and red background lighting.
- Animated lava pools.
- Steam and ember particles.
- Falling rocks.
- Lava hazards.
- Crumbling platforms.
- Different torches, enemies, and music.

Pass the level into the background renderer:

```js
drawBackground(ctx, now, game.level)
```

## Current gameplay issues to fix

### Ladders are visual only

`drawLadder` renders ladders, but `updateGame` does not implement climbing.

### The mute button does not mute anything

The `muted` React state changes, but there is no audio system. Add audio or hide the button until audio is implemented.

### Ammo never replenishes

The player starts with limited ammunition, but there are no ammo pickups or reload mechanics. Add ammo crates, enemy drops, reloads, or additional weapon types.

### There is no proper game-over state

When all hearts are lost, `damagePlayer` silently resets the enemies. A finished game should show:

- A `Temple Lost` screen.
- Restart and checkpoint options.
- A score summary.
- The best score.

### Bullets pass through platforms

Bullets currently only collide with enemies. Add platform collision so the environment affects combat:

```js
for (const platform of platforms) {
  if (
    bullet.x < platform.x + platform.w &&
    bullet.x + 10 > platform.x &&
    bullet.y < platform.y + platform.h &&
    bullet.y + 4 > platform.y
  ) {
    bullet.life = 0
  }
}
```

### High score is currently the current score

The footer displays the current score under `HIGH SCORE`. Store the best score separately:

```js
const [highScore, setHighScore] = useState(
  () => Number(localStorage.getItem('temple-high-score') || 0)
)
```

Update it whenever the current score exceeds it.

## Rewards and replayability

Give players reasons to explore instead of rushing to the exit:

- Secret rooms.
- Relics and gold collectibles.
- Hidden ammo caches.
- Health upgrades.
- Optional challenge rooms.
- Time bonuses.
- No-damage bonuses.
- Completion ranks such as `S`, `A`, `B`, and `C`.
- Combo multipliers for consecutive kills.

Example level summary:

```text
TEMPLE GATE CLEARED

Guardians defeated: 8/8
Secrets found: 2/3
Time: 01:42
Damage taken: 1
Rank: A
Score: 2,450
```

## Controls and accessibility

- Add `S` and `ArrowDown` for ladders.
- Document keyboard shooting with `X` and `J`.
- Add visible keyboard focus styles.
- Add mobile buttons or a virtual joystick.
- Pause automatically when the browser tab loses focus.
- Support `Escape` for pause.
- Add a short tutorial room before the first level.
- Add screen-reader labels for important controls.

The current controls panel mentions mouse, click, arrows, space, and pause, but does not mention the keyboard shooting keys.

## Home screen improvements

The current home screen has a strong visual presentation, but it can do more to explain the game and encourage the player to start.

### Recommended improvements

- Add an animated background preview with moving dust, torches, and enemy silhouettes.
- Add a short playable tutorial from the home screen.
- Make `START GAME` the primary action and give it a clear keyboard shortcut such as `Enter`.
- Make `QUICK START` skip the map and begin level 1 immediately.
- Display the current best score and unlocked level count.
- Add a settings panel for sound, music, controls, and screen shake.
- Add a first-time player hint explaining movement, aiming, shooting, and jumping.
- Add a small version/status indicator such as `BUILD 0.1 // PROTOTYPE`.
- Add a confirmation screen before resetting saved progress.
- Add visible keyboard focus states so the menu is usable without a mouse.

Example home-screen content:

```text
TEMPLE OF BOOM

Descend into the ruins.
Defeat the guardians.
Escape before the temple collapses.

[ START GAME ]
[ LEVEL MAP ]  [ HOW TO PLAY ]

BEST SCORE  02450     LEVELS CLEARED  02

ARROWS MOVE   SPACE JUMP   MOUSE AIM   CLICK FIRE
```

### Home screen technical improvements

The home screen is currently controlled by `showHome` in `App`. Consider adding a dedicated screen state instead of several independent booleans:

```js
const [screen, setScreen] = useState('home')
// home | map | game | pause | win | game-over
```

This prevents conflicting combinations such as the map and game overlays being active at the same time and makes future screens easier to add.

Also update the static home-screen statistics. For example, `LEVELS OPEN` should use the actual unlocked level count instead of always displaying `01`.

## Suggested implementation order

1. Improve the home screen navigation and keyboard accessibility.
2. Add shooting feedback, enemy hit reactions, and sound.
2. Implement functional ladders.
3. Add ammo and health pickups.
4. Add ranged enemy attacks.
5. Add a proper game-over screen.
6. Make level 2 visually unique.
7. Make map nodes selectable.
8. Add secrets, upgrades, and score bonuses.
9. Add mobile controls.
10. Add saved high scores and progression.

## Best next step

Implement these four features first:

1. Functional ladders.
2. Ammo pickups.
3. Enemy attacks with clear telegraphs.
4. A proper game-over screen.

These will improve the actual play experience more than additional UI polish.
