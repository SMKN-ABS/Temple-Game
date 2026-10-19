import { useCallback, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const CANVAS_WIDTH = 960
const CANVAS_HEIGHT = 540
const MAX_LEVEL = 4
const levelNames = {
  1: 'TEMPLE GATE',
  2: 'LAVA VAULT',
  3: 'SUNKEN RUINS',
  4: 'FINAL TOMB',
}

const initialHud = {
  score: 0,
  ammo: 18,
  hearts: 3,
  level: 1,
  kills: 0,
  total: 8,
  coins: 0,
  coinTotal: 0,
  won: false,
}

function makeCoins(level = 1) {
  const coins = [
    { x: 110, y: 397 }, { x: 210, y: 397 },
    { x: 410, y: 362 }, { x: 480, y: 362 },
    { x: 735, y: 397 }, { x: 830, y: 397 },
    { x: 230, y: 277 }, { x: 325, y: 277 },
    { x: 520, y: 242 }, { x: 625, y: 242 },
    { x: 790, y: 287 }, { x: 80, y: 182 },
    { x: 365, y: 162 }, { x: 470, y: 162 },
    { x: 680, y: 182 }, { x: 470, y: 77 },
    { x: 140, y: 182 }, { x: 560, y: 162 }, { x: 570, y: 77 }, { x: 860, y: 287 },
    { x: 50, y: 182 }, { x: 760, y: 242 }, { x: 430, y: 77 }, { x: 900, y: 287 },
  ]
  // Each chamber adds another layer of collectibles to the route.
  const chamberCoins = level === 1 ? coins.slice(0, 6) : level === 2 ? coins.slice(0, 16) : level === 3 ? coins.slice(0, 20) : coins
  return chamberCoins.map((coin, index) => ({
    ...coin,
    id: index,
    collected: false,
  }))
}

function makeKey(level = 1) {
  // The chamber key appears near the exit once the guardians are defeated.
  return { x: 780, y: 385, level, collected: false }
}

function makeEnemies(level = 1) {
  const enemies = [
    { x: 115, y: 378, w: 34, h: 38, vx: 0, vy: 0, hp: 2, alive: true, dir: 1, type: 'crab', color: '#df684e' },
    { x: 430, y: 343, w: 34, h: 38, vx: 0, vy: 0, hp: 2, alive: true, dir: -1, type: 'tortoise', color: '#6f9b77' },
    { x: 754, y: 378, w: 34, h: 38, vx: 0, vy: 0, hp: 2, alive: true, dir: 1, type: 'crab', color: '#e18b48' },
    { x: 250, y: 258, w: 34, h: 38, vx: 0, vy: 0, hp: 2, alive: true, dir: -1, type: 'tortoise', color: '#688c84' },
    { x: 542, y: 223, w: 34, h: 38, vx: 0, vy: 0, hp: 2, alive: true, dir: 1, type: 'guardian', color: '#e18b48' },
    { x: 820, y: 268, w: 34, h: 38, vx: 0, vy: 0, hp: 2, alive: true, dir: -1, type: 'guardian', color: '#c95b72' },
    { x: 102, y: 163, w: 34, h: 38, vx: 0, vy: 0, hp: 2, alive: true, dir: 1, type: 'crab', color: '#df684e' },
    { x: 690, y: 163, w: 34, h: 38, vx: 0, vy: 0, hp: 2, alive: true, dir: -1, type: 'tortoise', color: '#739b7a' },
    { x: 390, y: 143, w: 34, h: 38, vx: 0, vy: 0, hp: 2, alive: true, dir: 1, type: 'guardian', color: '#9a6e52' },
    { x: 500, y: 58, w: 34, h: 38, vx: 0, vy: 0, hp: 3, alive: true, dir: -1, type: 'guardian', color: '#b34f68' },
    { x: 150, y: 143, w: 34, h: 38, vx: 0, vy: 0, hp: 2, alive: true, dir: -1, type: 'crab', color: '#ad514e' },
    { x: 760, y: 228, w: 34, h: 38, vx: 0, vy: 0, hp: 3, alive: true, dir: 1, type: 'guardian', color: '#b07848' },
  ]
  if (level === 1) return enemies.slice(0, 2)
  if (level === 2) return enemies.slice(0, 8)
  if (level === 3) return enemies.slice(0, 10)
  return enemies
}

const platforms = [
  { x: 0, y: 500, w: 960, h: 40 },
  { x: 58, y: 420, w: 205, h: 18 },
  { x: 340, y: 385, w: 180, h: 18 },
  { x: 650, y: 420, w: 235, h: 18 },
  { x: 182, y: 300, w: 178, h: 18 },
  { x: 470, y: 265, w: 192, h: 18 },
  { x: 742, y: 310, w: 165, h: 18 },
  { x: 25, y: 205, w: 172, h: 18 },
  { x: 300, y: 185, w: 210, h: 18 },
  { x: 615, y: 205, w: 190, h: 18 },
  { x: 385, y: 100, w: 210, h: 18 },
]

const ladders = [
  { x: 225, y: 300, h: 120 },
  { x: 520, y: 265, h: 120 },
  { x: 760, y: 205, h: 105 },
  { x: 350, y: 185, h: 115 },
  { x: 445, y: 100, h: 85 },
]

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

function drawText(ctx, text, x, y, size, color, align = 'left') {
  ctx.save()
  ctx.font = `700 ${size}px "Arial Black", Impact, sans-serif`
  ctx.textAlign = align
  ctx.textBaseline = 'middle'
  ctx.fillStyle = color
  ctx.fillText(text, x, y)
  ctx.restore()
}

function drawBackground(ctx, time) {
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
  gradient.addColorStop(0, '#151f37')
  gradient.addColorStop(0.62, '#1f2946')
  gradient.addColorStop(1, '#111827')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // Moon and distant temple silhouette
  ctx.fillStyle = '#263251'
  ctx.beginPath()
  ctx.arc(785, 86, 48, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#101a2d'
  ctx.fillRect(0, 178, 960, 322)
  ctx.fillStyle = '#17213a'
  ctx.beginPath()
  ctx.moveTo(0, 300); ctx.lineTo(110, 245); ctx.lineTo(165, 272); ctx.lineTo(255, 215); ctx.lineTo(340, 285); ctx.lineTo(435, 232); ctx.lineTo(535, 285); ctx.lineTo(635, 240); ctx.lineTo(720, 275); ctx.lineTo(825, 205); ctx.lineTo(960, 275); ctx.lineTo(960, 500); ctx.lineTo(0, 500); ctx.closePath(); ctx.fill()

  // Stone brick grid
  ctx.globalAlpha = 0.22
  ctx.strokeStyle = '#64708c'
  ctx.lineWidth = 1
  for (let y = 194; y < 500; y += 33) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(960, y); ctx.stroke()
    const offset = (Math.floor(y / 33) % 2) * 42
    for (let x = offset; x < 960; x += 84) {
      ctx.beginPath(); ctx.moveTo(x, y - 33); ctx.lineTo(x, y); ctx.stroke()
    }
  }
  ctx.globalAlpha = 1

  // Floating dust motes
  for (let i = 0; i < 19; i++) {
    const x = (i * 103 + time * (7 + i % 4)) % 990 - 15
    const y = 120 + ((i * 47) % 310)
    ctx.fillStyle = i % 3 === 0 ? '#cfb66a' : '#7783a0'
    ctx.globalAlpha = 0.18 + (i % 4) * 0.05
    ctx.fillRect(x, y, 2, 2)
  }
  ctx.globalAlpha = 1
}

function drawTempleDetails(ctx) {
  // Pillars
  for (const x of [18, 920]) {
    ctx.fillStyle = '#1a2238'
    ctx.fillRect(x, 128, 24, 372)
    ctx.fillStyle = '#303b59'
    ctx.fillRect(x - 5, 128, 34, 11)
    ctx.fillRect(x - 5, 493, 34, 12)
    ctx.fillStyle = '#43506f'
    ctx.fillRect(x + 5, 145, 5, 336)
  }
  // Top arch
  ctx.fillStyle = '#202b47'
  ctx.fillRect(190, 28, 580, 10)
  ctx.fillRect(215, 38, 530, 12)
  ctx.strokeStyle = '#43506c'
  ctx.lineWidth = 3
  ctx.strokeRect(280, 49, 400, 48)
  ctx.fillStyle = '#131d32'
  ctx.fillRect(300, 64, 360, 34)
  // torches
  for (const x of [74, 875]) drawTorch(ctx, x, 175)
}

function drawTorch(ctx, x, y) {
  ctx.fillStyle = '#3a2d2a'
  ctx.fillRect(x - 3, y, 6, 28)
  ctx.fillStyle = '#edb64e'
  ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.quadraticCurveTo(x - 11, y + 9, x, y + 15); ctx.quadraticCurveTo(x + 11, y + 9, x, y - 4); ctx.fill()
  ctx.fillStyle = '#fff0a2'
  ctx.fillRect(x - 2, y + 1, 4, 7)
  ctx.globalAlpha = 0.14
  ctx.fillStyle = '#e9a84f'
  ctx.beginPath(); ctx.arc(x, y + 5, 28, 0, Math.PI * 2); ctx.fill()
  ctx.globalAlpha = 1
}

function drawPlatform(ctx, p) {
  ctx.fillStyle = '#111a2b'
  ctx.fillRect(p.x, p.y + 5, p.w, p.h + 8)
  ctx.fillStyle = '#69718b'
  ctx.fillRect(p.x, p.y, p.w, 8)
  ctx.fillStyle = '#a5a28b'
  ctx.fillRect(p.x + 2, p.y, p.w - 4, 3)
  ctx.fillStyle = '#424d68'
  ctx.fillRect(p.x, p.y + 8, p.w, p.h - 2)
  ctx.fillStyle = '#536079'
  for (let x = p.x + 16; x < p.x + p.w - 5; x += 42) ctx.fillRect(x, p.y + 9, 2, 8)
}

function drawLadder(ctx, ladder) {
  ctx.fillStyle = '#9a8054'
  ctx.fillRect(ladder.x, ladder.y, 5, ladder.h)
  ctx.fillRect(ladder.x + 25, ladder.y, 5, ladder.h)
  for (let y = ladder.y + 6; y < ladder.y + ladder.h; y += 15) ctx.fillRect(ladder.x, y, 30, 4)
  ctx.fillStyle = '#c0a16a'
  ctx.fillRect(ladder.x + 2, ladder.y, 3, ladder.h)
}

function drawPlayer(ctx, player, time, aimPoint) {
  const bob = player.onGround ? Math.sin(time * 0.012) * 1 : 0
  const x = Math.round(player.x), y = Math.round(player.y + bob)
  const aimAngle = aimPoint ? Math.atan2(aimPoint.y - (y + 25), aimPoint.x - (x + 15)) : (player.dir > 0 ? 0 : Math.PI)
  ctx.save()
  if (player.invuln > 0 && Math.floor(time / 90) % 2 === 0) ctx.globalAlpha = 0.4
  // Small backpack makes the playable character read as a young explorer.
  ctx.fillStyle = '#2e5571'; ctx.fillRect(x + (player.dir < 0 ? 22 : -2), y + 18, 9, 16)
  ctx.fillStyle = '#477493'; ctx.fillRect(x + (player.dir < 0 ? 25 : -4), y + 21, 4, 8)
  // Short legs and chunky boots.
  ctx.fillStyle = '#29324a'; ctx.fillRect(x + 8, y + 32, 7, 8); ctx.fillRect(x + 18, y + 32, 7, 8)
  ctx.fillStyle = '#151827'; ctx.fillRect(x + 5, y + 39, 11, 4); ctx.fillRect(x + 17, y + 39, 11, 4)
  // Bright hoodie and little shorts.
  ctx.fillStyle = '#d15c68'; ctx.fillRect(x + 6, y + 18, 20, 16)
  ctx.fillStyle = '#ef8b70'; ctx.fillRect(x + 8, y + 20, 4, 10)
  ctx.fillStyle = '#252a3d'; ctx.fillRect(x + 8, y + 31, 7, 5); ctx.fillRect(x + 18, y + 31, 7, 5)
  ctx.fillStyle = '#e6b66a'; ctx.fillRect(x + 13, y + 26, 6, 5)
  // Oversized kid face, hair, and cap.
  ctx.fillStyle = '#e6b66a'; ctx.fillRect(x + 6, y + 3, 20, 19)
  ctx.fillStyle = '#252a3d'; ctx.fillRect(x + 5, y + 1, 22, 7); ctx.fillRect(x + 8, y - 3, 15, 4)
  ctx.fillStyle = '#bd5360'; ctx.fillRect(player.dir > 0 ? x + 23 : x + 3, y + 5, 5, 4)
  ctx.fillStyle = '#141827'; ctx.fillRect(player.dir > 0 ? x + 21 : x + 8, y + 11, 3, 3)
  // A ladder pose makes the young explorer's movement clear.
  if (player.onLadder) {
    ctx.fillStyle = '#e6b66a'
    ctx.fillRect(x + 1, y + 20, 7, 4)
    ctx.fillRect(x + 22, y + 20, 7, 4)
    ctx.fillStyle = '#29324a'
    ctx.fillRect(x + 5, y + 34, 9, 4)
    ctx.fillRect(x + 17, y + 28, 9, 4)
  } else {
    // The kid's toy-like blaster follows the cursor when aiming.
    ctx.save()
    ctx.translate(x + 15, y + 25)
    ctx.rotate(aimAngle)
    ctx.fillStyle = '#252a3d'; ctx.fillRect(6, -3, 14, 6)
    ctx.fillStyle = '#8b94a9'; ctx.fillRect(19, -2, 5, 3)
    ctx.restore()
  }
  ctx.restore()
}

function drawCrosshair(ctx, point) {
  if (!point || !point.active) return
  ctx.save()
  ctx.translate(point.x, point.y)
  ctx.strokeStyle = '#f0d487'
  ctx.lineWidth = 2
  ctx.globalAlpha = point.down ? 1 : 0.72
  ctx.beginPath(); ctx.arc(0, 0, point.down ? 9 : 11, 0, Math.PI * 2); ctx.stroke()
  ctx.fillStyle = '#f0d487'; ctx.fillRect(-2, -2, 4, 4)
  ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(-7, 0); ctx.moveTo(7, 0); ctx.lineTo(16, 0); ctx.moveTo(0, -16); ctx.lineTo(0, -7); ctx.moveTo(0, 7); ctx.lineTo(0, 16); ctx.stroke()
  ctx.restore()
}

function drawCoin(ctx, coin, time) {
  if (coin.collected) return
  const bob = Math.sin(time * 0.005 + coin.x) * 3
  const spin = 0.72 + Math.abs(Math.sin(time * 0.008 + coin.x)) * 0.28
  const x = Math.round(coin.x)
  const y = Math.round(coin.y + bob)
  ctx.save()
  ctx.fillStyle = '#9a6c2d'
  ctx.fillRect(x - Math.round(7 * spin), y - 9, Math.round(14 * spin), 18)
  ctx.fillStyle = '#eac25b'
  ctx.fillRect(x - Math.round(5 * spin), y - 8, Math.max(2, Math.round(10 * spin)), 16)
  ctx.fillStyle = '#fff0a2'
  ctx.fillRect(x - Math.round(3 * spin), y - 6, Math.max(2, Math.round(4 * spin)), 4)
  ctx.fillStyle = '#b17b32'
  ctx.fillRect(x - Math.round(5 * spin), y + 6, Math.max(2, Math.round(10 * spin)), 2)
  ctx.restore()
}

function drawKey(ctx, key, time, visible) {
  if (!visible || key.collected) return
  const bob = Math.sin(time * 0.008) * 3
  const x = Math.round(key.x), y = Math.round(key.y + bob)
  ctx.save()
  ctx.fillStyle = '#9a6c2d'
  ctx.fillRect(x - 3, y - 9, 7, 20)
  ctx.fillRect(x + 2, y + 6, 13, 5)
  ctx.fillRect(x + 8, y + 2, 5, 5)
  ctx.fillStyle = '#f0d487'
  ctx.fillRect(x - 1, y - 8, 4, 17)
  ctx.fillRect(x + 3, y + 7, 11, 3)
  ctx.fillRect(x + 9, y + 3, 3, 4)
  ctx.strokeStyle = '#fff0a2'
  ctx.lineWidth = 1
  ctx.strokeRect(x - 10, y - 5, 9, 9)
  ctx.restore()
}

function drawEnemy(ctx, enemy, time) {
  if (!enemy.alive) return
  if (enemy.type === 'crab') drawCrab(ctx, enemy, time)
  else if (enemy.type === 'tortoise') drawTortoise(ctx, enemy, time)
  else drawGuardian(ctx, enemy, time)
}

function drawEnemyHealth(ctx, enemy, x, y) {
  if (enemy.hp < 2) {
    ctx.fillStyle = '#efb956'; ctx.fillRect(x + 5, y - 7, 24, 3)
    ctx.fillStyle = '#bc4b4c'; ctx.fillRect(x + 5, y - 7, 12, 3)
  }
}

function drawCrab(ctx, enemy, time) {
  const x = Math.round(enemy.x), y = Math.round(enemy.y)
  const bob = Math.sin(time * 0.01 + x) * 1.5
  ctx.fillStyle = '#161a2a'; ctx.fillRect(x + 3, y + 34, 30, 5)
  // legs and sideways claws
  ctx.fillStyle = '#a64842'
  ctx.fillRect(x - 5, y + 22, 10, 5); ctx.fillRect(x + 29, y + 22, 10, 5)
  ctx.fillRect(x + 2, y + 30, 8, 4); ctx.fillRect(x + 25, y + 30, 8, 4)
  ctx.fillStyle = '#db6651'
  ctx.fillRect(x + 5, y + 15 + bob, 25, 18)
  ctx.fillRect(x + 9, y + 10 + bob, 17, 22)
  ctx.fillStyle = '#f0a062'
  ctx.fillRect(x + 11, y + 14 + bob, 4, 4); ctx.fillRect(x + 21, y + 14 + bob, 4, 4)
  // eyes on stalks
  ctx.fillStyle = '#df8b5a'; ctx.fillRect(x + 10, y + 5, 3, 8); ctx.fillRect(x + 23, y + 5, 3, 8)
  ctx.fillStyle = '#191e2e'; ctx.fillRect(x + 11, y + 5, 3, 3); ctx.fillRect(x + 23, y + 5, 3, 3)
  // claws
  ctx.fillStyle = '#bf4e46'; ctx.fillRect(enemy.dir > 0 ? x + 30 : x - 7, y + 17, 9, 7)
  ctx.fillStyle = '#f0a05d'; ctx.fillRect(enemy.dir > 0 ? x + 36 : x - 10, y + 13, 5, 5)
  drawEnemyHealth(ctx, enemy, x, y)
}

function drawTortoise(ctx, enemy, time) {
  const x = Math.round(enemy.x), y = Math.round(enemy.y)
  const bob = Math.sin(time * 0.006 + x) * 1
  ctx.fillStyle = '#161a2a'; ctx.fillRect(x + 2, y + 35, 31, 5)
  // sturdy feet
  ctx.fillStyle = '#3f604f'; ctx.fillRect(x + 5, y + 30, 8, 8); ctx.fillRect(x + 23, y + 30, 8, 8)
  // shell
  ctx.fillStyle = '#416758'; ctx.fillRect(x + 4, y + 13 + bob, 28, 20)
  ctx.fillStyle = '#72935f'; ctx.fillRect(x + 8, y + 7 + bob, 20, 20)
  ctx.fillStyle = '#9daf70'; ctx.fillRect(x + 13, y + 10 + bob, 10, 3)
  ctx.fillStyle = '#3c594b'; ctx.fillRect(x + 17, y + 13 + bob, 3, 16); ctx.fillRect(x + 8, y + 20 + bob, 21, 3)
  // head and little tail
  ctx.fillStyle = '#a9a369'; ctx.fillRect(enemy.dir > 0 ? x + 27 : x - 6, y + 17, 10, 11)
  ctx.fillStyle = '#1d2730'; ctx.fillRect(enemy.dir > 0 ? x + 33 : x - 7, y + 20, 3, 3)
  ctx.fillStyle = '#547462'; ctx.fillRect(enemy.dir > 0 ? x - 4 : x + 32, y + 25, 6, 5)
  drawEnemyHealth(ctx, enemy, x, y)
}

function drawGuardian(ctx, enemy, time) {
  const x = Math.round(enemy.x), y = Math.round(enemy.y)
  const wobble = Math.sin(time * 0.008 + x) * 1.5
  ctx.fillStyle = '#161a2a'; ctx.fillRect(x + 4, y + 35, 27, 5)
  ctx.fillStyle = enemy.color; ctx.fillRect(x + 4, y + 12 + wobble, 25, 25)
  ctx.fillStyle = '#22273b'; ctx.fillRect(x + 2, y + 5 + wobble, 29, 14)
  ctx.fillStyle = '#e6b66a'; ctx.fillRect(x + 7, y + 9 + wobble, 17, 10)
  ctx.fillStyle = '#efce7a'; ctx.fillRect(x + 9, y + 11 + wobble, 3, 3); ctx.fillRect(x + 18, y + 11 + wobble, 3, 3)
  ctx.fillStyle = '#25293a'; ctx.fillRect(enemy.dir > 0 ? x + 28 : x - 8, y + 20, 11, 5)
  drawEnemyHealth(ctx, enemy, x, y)
}

function drawDoor(ctx, open) {
  const x = 861, y = 346
  ctx.fillStyle = '#111827'
  ctx.fillRect(x - 5, y - 8, 69, 116)
  ctx.fillStyle = '#59627a'
  ctx.fillRect(x, y, 59, 100)
  ctx.fillStyle = '#2c3853'
  ctx.fillRect(x + 7, y + 8, 45, 92)
  ctx.fillStyle = '#a8a187'
  ctx.fillRect(x - 4, y - 7, 67, 7)
  ctx.fillRect(x - 4, y + 98, 67, 8)
  if (open) {
    ctx.fillStyle = '#0a1020'
    ctx.fillRect(x + 11, y + 10, 37, 88)
    ctx.fillStyle = '#e3bd66'
    ctx.fillRect(x + 7, y + 41, 4, 9)
    ctx.fillRect(x + 48, y + 41, 4, 9)
    drawText(ctx, 'OPEN', x + 29, y + 117, 9, '#e3bd66', 'center')
  } else {
    ctx.fillStyle = '#3f4b65'
    for (let barX = x + 10; barX < x + 50; barX += 12) ctx.fillRect(barX, y + 9, 5, 89)
    ctx.fillStyle = '#cfad5d'
    ctx.fillRect(x + 27, y + 52, 5, 10)
  }
}

function drawHeart(ctx, x, y, fill = true) {
  ctx.fillStyle = fill ? '#e56c61' : '#3a3d51'
  ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.arc(x - 5, y, 5, 0, Math.PI, true); ctx.arc(x + 5, y, 5, 0, Math.PI, true); ctx.lineTo(x, y + 15); ctx.closePath(); ctx.fill()
  ctx.strokeStyle = fill ? '#f3a16b' : '#555a70'; ctx.lineWidth = 1; ctx.stroke()
}

function drawCanvasHud(ctx, hud) {
  ctx.fillStyle = 'rgba(10, 15, 27, .88)'; ctx.fillRect(18, 16, 924, 58)
  ctx.strokeStyle = '#4d5a76'; ctx.lineWidth = 1; ctx.strokeRect(18.5, 16.5, 923, 57)
  drawText(ctx, `SECTOR ${String(hud.level || 1).padStart(2, '0')}`, 35, 36, 11, '#8793af')
  drawText(ctx, levelNames[hud.level] || `CHAMBER ${hud.level}`, 35, 55, 16, '#f0d487')
  ctx.fillStyle = '#3a435b'; ctx.fillRect(181, 31, 118, 9)
  ctx.fillStyle = '#d5a94e'; ctx.fillRect(181, 31, 118 * (hud.kills / hud.total), 9)
  drawText(ctx, `${hud.kills}/${hud.total} GUARDIANS`, 181, 57, 10, '#aeb8ca')
  drawText(ctx, 'COINS', 525, 35, 10, '#8793af')
  drawText(ctx, `${String(hud.coins || 0).padStart(2, '0')}/${String(hud.coinTotal || 0).padStart(2, '0')}`, 525, 55, 15, '#f0d487')
  drawText(ctx, 'SCORE', 650, 35, 10, '#8793af')
  drawText(ctx, String(hud.score).padStart(5, '0'), 650, 55, 17, '#f0d487')
  drawText(ctx, 'HEALTH', 833, 35, 10, '#8793af')
  for (let i = 0; i < 3; i++) drawHeart(ctx, 853 + i * 19, 52, i < hud.hearts)
}

function TempleCanvas({ running, paused, onScore, onHud, onWin, onDoorEnter, resetKey, level }) {
  const canvasRef = useRef(null)
  const keysRef = useRef(new Set())
  const gameRef = useRef(null)

  const resetGame = useCallback(() => {
    const coins = makeCoins(level)
    gameRef.current = {
      level,
      player: { x: 52, y: 455, w: 30, h: 43, vx: 0, vy: 0, dir: 1, onGround: false, onLadder: null, coyote: 0, jumpLock: false, invuln: 0 },
      mouse: { x: 480, y: 270, active: false, down: false },
      enemies: makeEnemies(level), key: makeKey(level), coins, coinTotal: coins.length, coinsCollected: 0, bullets: [], sparks: [], muzzle: null, lastShot: 0, score: 0, hearts: 3, kills: 0, ammo: level === 1 ? 18 : level === 2 ? 28 : level === 3 ? 36 : 44, time: 0, doorTriggered: false,
    }
  }, [level])

  useEffect(() => { resetGame() }, [resetGame, resetKey])

  useEffect(() => {
    const down = (event) => {
      const key = event.key.toLowerCase()
      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' ', 'enter', 'a', 'd', 'w', 's', 'x', 'j', 'p'].includes(key)) event.preventDefault()
      keysRef.current.add(key)
    }
    const up = (event) => keysRef.current.delete(event.key.toLowerCase())
    window.addEventListener('keydown', down); window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    let animation
    let last = performance.now()
    const render = (now) => {
      const dt = Math.min((now - last) / 16.67, 2)
      last = now
      const game = gameRef.current
      if (!game) { animation = requestAnimationFrame(render); return }
      if (running && !paused) updateGame(game, keysRef.current, dt, now, onHud, onScore, onWin, onDoorEnter)
      drawGame(ctx, game, now)
      animation = requestAnimationFrame(render)
    }
    animation = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animation)
  }, [running, paused, onHud, onScore, onWin, onDoorEnter])

  const updatePointer = (event) => {
    const canvas = canvasRef.current
    const game = gameRef.current
    if (!canvas || !game) return
    const rect = canvas.getBoundingClientRect()
    game.mouse.x = (event.clientX - rect.left) * CANVAS_WIDTH / rect.width
    game.mouse.y = (event.clientY - rect.top) * CANVAS_HEIGHT / rect.height
    game.mouse.active = true
  }
  const pressPointer = (event) => {
    if (event.button !== 0) return
    updatePointer(event)
    if (gameRef.current) gameRef.current.mouse.down = true
    canvasRef.current?.setPointerCapture(event.pointerId)
  }
  const releasePointer = (event) => {
    if (gameRef.current) gameRef.current.mouse.down = false
    if (canvasRef.current?.hasPointerCapture(event.pointerId)) canvasRef.current.releasePointerCapture(event.pointerId)
  }

  return <canvas
    ref={canvasRef}
    width={CANVAS_WIDTH}
    height={CANVAS_HEIGHT}
    className="game-canvas"
    aria-label="Temple of Boom game"
    onPointerMove={updatePointer}
    onPointerDown={pressPointer}
    onPointerUp={releasePointer}
    onPointerCancel={releasePointer}
    onPointerLeave={() => { if (gameRef.current) gameRef.current.mouse.active = false }}
    onContextMenu={(event) => event.preventDefault()}
  />
}

function updateGame(game, keys, dt, now, onHud, onScore, onWin, onDoorEnter) {
  const p = game.player
  game.time += dt
  const left = keys.has('a') || keys.has('arrowleft')
  const right = keys.has('d') || keys.has('arrowright')
  const climbUp = keys.has('w') || keys.has('arrowup')
  const climbDown = keys.has('s') || keys.has('arrowdown')
  const jump = climbUp || keys.has(' ')
  const keyboardShooting = keys.has('x') || keys.has('j')
  const mouseShooting = game.mouse.active && game.mouse.down
  p.vx = left ? -3.25 : right ? 3.25 : p.vx * 0.78
  if (left) p.dir = -1
  if (right) p.dir = 1
  if (game.mouse.active) p.dir = game.mouse.x >= p.x + p.w / 2 ? 1 : -1

  // Grab a ladder when the player is lined up with it and presses up/down.
  // The small end-zone checks make it possible to step onto a ladder from either platform.
  const nearbyLadder = ladders.find((ladder) => {
    const horizontal = p.x + p.w > ladder.x - 8 && p.x < ladder.x + 30 + 8
    const vertical = p.y + p.h > ladder.y && p.y < ladder.y + ladder.h
    const nearBottom = Math.abs((p.y + p.h) - (ladder.y + ladder.h)) < 10
    const nearTop = Math.abs(p.y - (ladder.y - p.h)) < 10
    return horizontal && (vertical || (climbUp && nearBottom) || (climbDown && nearTop))
  })
  if (!p.onLadder && nearbyLadder && (climbUp || climbDown) && !keys.has(' ')) {
    p.onLadder = nearbyLadder
    p.x = nearbyLadder.x
    p.vx = 0
    p.vy = 0
    p.onGround = false
  }

  if (p.onLadder) {
    const ladder = p.onLadder
    p.x = ladder.x
    p.vx = 0
    p.vy = 0
    p.onGround = false
    if (climbUp) p.y -= 3.35 * dt
    if (climbDown) p.y += 3.35 * dt
    const top = ladder.y - p.h
    const bottom = ladder.y + ladder.h - p.h
    if (p.y <= top) {
      p.y = top
      p.onLadder = null
      p.onGround = true
      p.coyote = 5
    } else if (p.y >= bottom) {
      p.y = bottom
      p.onLadder = null
      p.onGround = true
      p.coyote = 5
    }
    p.jumpLock = jump
  } else {
    if (jump && !p.jumpLock && (p.onGround || p.coyote > 0)) { p.vy = -10.8; p.onGround = false; p.coyote = 0 }
    p.jumpLock = jump
    p.vy += 0.52 * dt
    p.x += p.vx * dt
    p.x = Math.max(4, Math.min(926, p.x))
    const oldBottom = p.y + p.h
    p.y += p.vy * dt
    p.onGround = false
    for (const platform of platforms) {
      if (p.vy >= 0 && oldBottom <= platform.y + 4 && p.y + p.h >= platform.y && p.x + p.w > platform.x && p.x < platform.x + platform.w) {
        p.y = platform.y - p.h; p.vy = 0; p.onGround = true
      }
    }
    if (!p.onGround) p.coyote = Math.max(0, p.coyote - dt); else p.coyote = 5
  }
  if ((keyboardShooting || mouseShooting) && game.ammo > 0 && now - game.lastShot > 210) {
    const startX = p.x + p.w / 2
    const startY = p.y + 22
    const targetX = game.mouse.active ? game.mouse.x : startX + p.dir * 100
    const targetY = game.mouse.active ? game.mouse.y : startY
    const angle = Math.atan2(targetY - startY, targetX - startX)
    const barrelLength = 24
    const muzzleX = startX + Math.cos(angle) * barrelLength
    const muzzleY = startY + Math.sin(angle) * barrelLength
    // Start the projectile at the end of the barrel so it cannot appear to fire from the player's body.
    game.bullets.push({ x: muzzleX, y: muzzleY, vx: Math.cos(angle) * 8.5, vy: Math.sin(angle) * 8.5, angle, life: 75 })
    game.muzzle = { x: muzzleX, y: muzzleY, angle, life: 7 }
    game.ammo -= 1; game.lastShot = now
    onHud({ ammo: game.ammo })
  }
  if (!p.onLadder && p.y > 560) damagePlayer(game, onHud)
  if (p.invuln > 0) p.invuln -= dt * 16.67

  for (const coin of game.coins) {
    const coinHitbox = { x: coin.x - 10, y: coin.y - 10, w: 20, h: 20 }
    if (!coin.collected && rectsOverlap(p, coinHitbox)) {
      coin.collected = true
      game.coinsCollected += 1
      game.score += 50
      game.sparks.push({ x: coin.x, y: coin.y, life: 18, coin: true })
      onScore(game.score)
      onHud({ coins: game.coinsCollected })
    }
  }

  for (const bullet of game.bullets) { bullet.x += bullet.vx * dt; bullet.y += bullet.vy * dt; bullet.life -= dt * 1.2 }
  game.bullets = game.bullets.filter(b => b.life > 0 && b.x > -20 && b.x < 980)
  if (game.muzzle) {
    game.muzzle.life -= dt
    if (game.muzzle.life <= 0) game.muzzle = null
  }
  for (const enemy of game.enemies) {
    if (!enemy.alive) continue
    const distance = p.x - enemy.x
    if (Math.abs(distance) < 230 && Math.abs(p.y - enemy.y) < 90) enemy.dir = distance > 0 ? 1 : -1
    enemy.vy += 0.52 * dt
    enemy.x += (Math.abs(distance) < 230 ? enemy.dir * 0.7 : 0) * dt
    enemy.x = Math.max(4, Math.min(930, enemy.x))
    const oldEnemyBottom = enemy.y + enemy.h
    enemy.y += enemy.vy * dt
    for (const platform of platforms) {
      if (enemy.vy >= 0 && oldEnemyBottom <= platform.y + 4 && enemy.y + enemy.h >= platform.y && enemy.x + enemy.w > platform.x && enemy.x < platform.x + platform.w) { enemy.y = platform.y - enemy.h; enemy.vy = 0 }
    }
    if (enemy.y > 560) enemy.alive = false
    if (rectsOverlap(p, enemy) && p.invuln <= 0) damagePlayer(game, onHud)
    for (const bullet of game.bullets) {
      if (bullet.x > enemy.x - 5 && bullet.x < enemy.x + enemy.w + 5 && bullet.y > enemy.y && bullet.y < enemy.y + enemy.h) {
        bullet.life = 0; enemy.hp -= 1
        game.sparks.push({ x: bullet.x, y: bullet.y, life: 12 })
        if (enemy.hp <= 0) {
          enemy.alive = false; game.kills += 1; game.score += 125
          onScore(game.score); onHud({ kills: game.kills })
        }
      }
    }
  }

  const chamberCleared = game.enemies.every((enemy) => !enemy.alive)
  if (chamberCleared && !game.key.collected) {
    const keyHitbox = { x: game.key.x - 13, y: game.key.y - 13, w: 26, h: 26 }
    if (rectsOverlap(p, keyHitbox)) {
      game.key.collected = true
      game.score += 100
      game.sparks.push({ x: game.key.x, y: game.key.y, life: 22, coin: true })
      onScore(game.score)
      onWin()
    }
  }
  if (chamberCleared && game.key.collected && !game.doorTriggered) {
    const nearDoor = p.x > 808 && p.y > 300 && p.y < 430
    const enteringDoor = keys.has('arrowup') || keys.has('w') || keys.has('enter') || (game.mouse.down && game.mouse.x > 820 && game.mouse.y > 300)
    if (nearDoor && enteringDoor) {
      game.doorTriggered = true
      onDoorEnter()
    }
  }
  game.sparks = game.sparks.filter(s => (s.life -= dt) > 0)
}

function damagePlayer(game, onHud) {
  if (game.player.invuln > 0) return
  game.hearts -= 1; game.player.invuln = 130; game.player.vy = -7; game.player.x -= game.player.dir * 30
  onHud({ hearts: game.hearts })
  if (game.hearts <= 0) { game.hearts = 3; game.player.x = 52; game.player.y = 450; game.player.onLadder = null; game.player.onGround = false; game.kills = 0; game.key = makeKey(game.level); game.enemies = makeEnemies(game.level); onHud({ hearts: 3, kills: 0 }) }
}

function drawGame(ctx, game, now) {
  drawBackground(ctx, now)
  drawTempleDetails(ctx)
  for (const ladder of ladders) drawLadder(ctx, ladder)
  for (const platform of platforms) drawPlatform(ctx, platform)
  for (const coin of game.coins) drawCoin(ctx, coin, now)
  const chamberCleared = game.enemies.every((enemy) => !enemy.alive)
  drawKey(ctx, game.key, now, chamberCleared)
  drawDoor(ctx, chamberCleared && game.key.collected)
  for (const spark of game.sparks) {
    const size = spark.coin ? 5 : 4
    ctx.fillStyle = spark.coin ? '#eac25b' : '#ffdc77'
    ctx.fillRect(spark.x - size, spark.y - size, size * 2, size * 2)
    ctx.fillStyle = '#fff4bc'
    ctx.fillRect(spark.x - 1, spark.y - (spark.coin ? 10 : 8), 3, spark.coin ? 20 : 16)
  }
  for (const bullet of game.bullets) {
    ctx.save()
    ctx.translate(bullet.x, bullet.y)
    ctx.rotate(bullet.angle || 0)
    ctx.fillStyle = '#ffdc77'; ctx.fillRect(0, -2, 10, 4)
    ctx.fillStyle = '#fff4b6'; ctx.fillRect(7, -1, 4, 2)
    ctx.restore()
  }
  for (const enemy of game.enemies) drawEnemy(ctx, enemy, now)
  drawPlayer(ctx, game.player, now, game.mouse.active ? game.mouse : null)
  if (game.muzzle) {
    ctx.save()
    ctx.translate(game.muzzle.x, game.muzzle.y)
    ctx.rotate(game.muzzle.angle)
    ctx.globalAlpha = Math.min(1, game.muzzle.life / 3)
    ctx.fillStyle = '#fff0a2'; ctx.fillRect(0, -4, 12, 8)
    ctx.fillStyle = '#e9a84f'; ctx.fillRect(8, -7, 9, 14)
    ctx.restore()
  }
  drawCrosshair(ctx, game.mouse)
  drawCanvasHud(ctx, { score: game.score, ammo: game.ammo, hearts: game.hearts, kills: game.kills, total: game.enemies.length, coins: game.coinsCollected, coinTotal: game.coinTotal, level: game.level })
  // ammo indicator
  ctx.fillStyle = 'rgba(10, 15, 27, .88)'; ctx.fillRect(814, 88, 128, 38)
  drawText(ctx, 'AMMO', 827, 101, 10, '#8793af'); drawText(ctx, String(game.ammo).padStart(2, '0'), 913, 105, 17, game.ammo < 4 ? '#e56c61' : '#f0d487', 'right')
}

function LandingPage({ onStart }) {
  return (
    <main className="landing-page">
      <div className="landing-noise" />
      <header className="landing-header">
        <a className="brand" href="#landing" aria-label="Temple of Boom landing page">
          <span className="brand-mark">✦</span><span>TEMPLE <em>OF</em><br />BOOM</span>
        </a>
        <span className="landing-status"><span className="live-dot" /> ORIGINAL PIXEL ADVENTURE</span>
      </header>
      <section className="landing-hero" id="landing">
        <div className="landing-copy">
          <p className="landing-eyebrow">ANCIENT RUINS // SOLO MISSION</p>
          <h1>THE TEMPLE<br /><strong>IS AWAKE.</strong></h1>
          <p className="landing-description">A pixel platform shooter built for the brave.<br />Descend into the ruins, face the guardians,<br />and make your way to the final tomb.</p>
          <button className="landing-cta" onClick={onStart}>START ADVENTURE <span>→</span></button>
          <p className="landing-hint">NO ACCOUNT REQUIRED <b>•</b> PLAY IN YOUR BROWSER</p>
        </div>
        <div className="landing-art" aria-hidden="true">
          <div className="landing-moon" />
          <div className="landing-stars"><i /><i /><i /><i /><i /></div>
          <div className="landing-mountain landing-mountain-back" />
          <div className="landing-mountain landing-mountain-front" />
          <div className="landing-gate">
            <span className="gate-roof" /><span className="gate-pillar gate-pillar-left" /><span className="gate-pillar gate-pillar-right" />
            <span className="gate-opening"><b>✦</b></span>
          </div>
          <div className="landing-art-label"><span>01</span><b>THE DESCENT<br />BEGINS</b><small>MOVE · AIM · SURVIVE</small></div>
        </div>
      </section>
      <footer className="landing-footer"><span>© 2024 TEMPLE OF BOOM</span><span>FOUR CHAMBERS <i>✦</i> ONE WAY OUT</span></footer>
    </main>
  )
}

function HomeScreen({ onStart, onLevels, onShop, onHelp }) {
  return (
    <div className="game-overlay home-overlay">
      <div className="home-content">
        <div className="home-kicker"><span className="live-dot" /> ORIGINAL PIXEL BLAST // EST. 2024</div>
        <h2>TEMPLE<br /><strong>OF BOOM</strong></h2>
        <p>Descend into the ruins. Defeat the guardians.<br />Find the door before the temple finds you.</p>
        <div className="home-actions home-menu-actions">
          <button className="primary-cta" onClick={onStart}>START GAME <span>→</span></button>
          <button className="home-secondary" onClick={onLevels}>LEVELS <span>↗</span></button>
          <button className="home-secondary" onClick={onShop}>SHOP <span>↗</span></button>
          <button className="home-secondary home-help-button" onClick={onHelp}>HELP <span>?</span></button>
        </div>
      </div>
    </div>
  )
}

function HelpScreen({ onBack }) {
  return (
    <div className="game-overlay help-overlay">
      <div className="help-panel">
        <button className="map-exit" onClick={onBack}>← BACK</button>
        <div className="overlay-kicker">FIELD GUIDE // CONTROLS</div>
        <h2>HOW TO <strong>PLAY</strong></h2>
        <p className="help-intro">Clear the guardians, collect the coins, and reach the exit door.</p>
        <div className="help-list">
          <div className="help-row"><b>MOVE</b><span><kbd>A</kbd><kbd>D</kbd> or <kbd>←</kbd><kbd>→</kbd></span></div>
          <div className="help-row"><b>JUMP / CLIMB</b><span><kbd>W</kbd><kbd>↑</kbd> or <kbd>SPACE</kbd></span></div>
          <div className="help-row"><b>AIM</b><span>Move the mouse</span></div>
          <div className="help-row"><b>FIRE</b><span><kbd>CLICK</kbd> or hold <kbd>X</kbd></span></div>
          <div className="help-row"><b>PAUSE</b><span>Press <kbd>P</kbd></span></div>
        </div>
        <button className="primary-cta" onClick={onBack}>GOT IT <span>→</span></button>
      </div>
    </div>
  )
}

function ShopScreen({ onBack }) {
  return (
    <div className="game-overlay shop-overlay">
      <div className="shop-panel">
        <div className="overlay-kicker">TEMPLE MARKET // LOADOUT</div>
        <h2>THE <strong>SHOP</strong></h2>
        <p className="shop-intro">Prepare for the descent. More relics will unlock as you clear the temple.</p>
        <div className="shop-grid">
          <div className="shop-item"><span className="shop-item-icon">✦</span><div><b>GOLDEN CHARM</b><small>STARTING RELIC</small></div><em>OWNED</em></div>
          <div className="shop-item shop-item-locked"><span className="shop-item-icon">◆</span><div><b>HUNTER'S MARK</b><small>INCREASED DAMAGE</small></div><em>LOCKED</em></div>
          <div className="shop-item shop-item-locked"><span className="shop-item-icon">◈</span><div><b>RELIC OF LIFE</b><small>EXTRA HEART</small></div><em>LOCKED</em></div>
        </div>
        <button className="primary-cta" onClick={onBack}>BACK TO HOME <span>←</span></button>
        <div className="map-hint">CLEAR CHAMBERS TO UNLOCK NEW ITEMS</div>
      </div>
    </div>
  )
}

function LevelMap({ onStart, onBack, unlockedLevel }) {
  return (
    <div className="game-overlay map-overlay">
      <div className="map-panel">
        <button className="map-exit" onClick={onBack}>← BACK</button>
        <div className="overlay-kicker">MISSION SELECT // CHAMBER ROUTE</div>
        <h2>THE TEMPLE <strong>MAP</strong></h2>
        <p className="map-intro">Clear each chamber to unlock the next.<br />Your first descent starts here.</p>
        <div className="map-route" aria-label="Temple level map">
          <div className="route-line" />
          <div className="map-node selected" onClick={() => onStart(1)}><span>01</span><small>GATE</small></div>
          <div className={`map-node ${unlockedLevel >= 2 ? 'unlocked' : 'locked'}`} onClick={() => unlockedLevel >= 2 && onStart(2)}><span>02</span><small>VAULT</small>{unlockedLevel < 2 && <i>×</i>}</div>
          <div className={`map-node ${unlockedLevel >= 3 ? 'unlocked' : 'locked'}`} onClick={() => unlockedLevel >= 3 && onStart(3)}><span>03</span><small>RUINS</small>{unlockedLevel < 3 && <i>×</i>}</div>
          <div className={`map-node ${unlockedLevel >= 4 ? 'unlocked' : 'locked'}`} onClick={() => unlockedLevel >= 4 && onStart(4)}><span>04</span><small>TOMB</small>{unlockedLevel < 4 && <i>×</i>}</div>
        </div>
        <div className="map-selection"><span className="map-selection-number">01</span><div><b>TEMPLE GATE</b><small>2 GUARDIANS // EASY</small></div><em>UNLOCKED</em></div>
        <button className="primary-cta" onClick={onStart}>ENTER LEVEL 01 <span>→</span></button>
        <div className="map-hint">MOVE WITH ARROWS <b>•</b> AIM WITH MOUSE <b>•</b> CLICK TO FIRE</div>
      </div>
    </div>
  )
}

function App() {
  const [running, setRunning] = useState(false)
  const [showLanding, setShowLanding] = useState(true)
  const [showHome, setShowHome] = useState(true)
  const [showMap, setShowMap] = useState(false)
  const [showShop, setShowShop] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [level, setLevel] = useState(1)
  const [unlockedLevel, setUnlockedLevel] = useState(1)
  const [paused, setPaused] = useState(false)
  const [muted, setMuted] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [hud, setHud] = useState(initialHud)
  const [doorOpen, setDoorOpen] = useState(false)
  const [won, setWon] = useState(false)

  const handleHud = useCallback((change) => setHud((current) => ({ ...current, ...change })), [])
  const handleScore = useCallback((score) => setHud((current) => ({ ...current, score })), [])

  useEffect(() => {
    const togglePause = (event) => {
      if (event.key.toLowerCase() === 'p' && running) {
        event.preventDefault()
        setPaused((current) => !current)
      }
    }
    window.addEventListener('keydown', togglePause)
    return () => window.removeEventListener('keydown', togglePause)
  }, [running])

  const startLevel = (nextLevel = 1) => {
    setLevel(nextLevel)
    setHud({ ...initialHud, level: nextLevel, total: makeEnemies(nextLevel).length, ammo: nextLevel === 1 ? 18 : nextLevel === 2 ? 28 : nextLevel === 3 ? 36 : 44, coinTotal: makeCoins(nextLevel).length })
    setWon(false); setDoorOpen(false); setPaused(false); setShowHome(false); setShowMap(false); setShowShop(false); setShowHelp(false); setRunning(true)
    setResetKey((key) => key + 1)
  }
  const start = () => startLevel(1)
  const restart = () => startLevel(level)
  const openMap = () => { setPaused(false); setRunning(false); setShowHome(false); setShowMap(true); setShowShop(false); setShowHelp(false) }
  const openShop = () => { setPaused(false); setRunning(false); setShowHome(false); setShowMap(false); setShowShop(true); setShowHelp(false) }
  const openHelp = () => { setPaused(false); setRunning(false); setShowHome(false); setShowMap(false); setShowShop(false); setShowHelp(true) }
  const openHome = (event) => { event?.preventDefault(); setPaused(false); setRunning(false); setShowMap(false); setShowShop(false); setShowHelp(false); setShowHome(true) }

  if (showLanding) return <div className="app-shell"><LandingPage onStart={() => setShowLanding(false)} /></div>

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" onClick={openHome} aria-label="Temple of Boom home">
          <span className="brand-mark">✦</span><span>TEMPLE <em>OF</em><br />BOOM</span>
        </a>
        <div className="top-actions">
          <button className={`nav-button ${showMap ? 'active' : ''}`} onClick={openMap}><span className="button-icon">⌂</span> LEVEL MAP</button>
          <button className={`nav-button ${showHelp ? 'active' : ''}`} onClick={openHelp}><span className="button-icon">?</span> HOW TO PLAY</button>
          <button className="icon-button" onClick={() => setMuted(!muted)} aria-label={muted ? 'Turn sound on' : 'Mute sound'}>{muted ? '◌' : '◖))'}</button>
          <button className="restart-button" onClick={restart}><span>↻</span> RESTART</button>
        </div>
      </header>

      <main id="top" className="main-content">
        <section className="game-heading">
          <div><p className="eyebrow">ANCIENT RUINS // SOLO MISSION</p><h1>Temple of <span>Boom</span></h1></div>
          <div className="mission-meta"><span className="live-dot" /> LIVE RUN <b>01</b></div>
        </section>

        <section className="game-frame">
          <div className="canvas-wrap">
            <TempleCanvas running={running} paused={paused} level={level} onScore={handleScore} onHud={handleHud} onWin={() => { setDoorOpen(true); if (level < MAX_LEVEL) setUnlockedLevel((current) => Math.max(current, level + 1)) }} onDoorEnter={() => { if (level < MAX_LEVEL) startLevel(level + 1); else { setWon(true); setRunning(false) } }} resetKey={resetKey} />
            {showHome && <HomeScreen onStart={start} onLevels={openMap} onShop={openShop} onHelp={openHelp} />}
            {!showHome && showMap && <LevelMap onStart={start} onBack={openHome} unlockedLevel={unlockedLevel} />}
            {!showHome && showShop && <ShopScreen onBack={openHome} />}
            {!showHome && showHelp && <HelpScreen onBack={openHome} />}
            {!showHome && !showMap && !showShop && !showHelp && !running && <div className="game-overlay intro-overlay">
              <div className="overlay-kicker">A PIXEL PLATFORMER BY POKI</div>
              <h2>ENTER THE<br /><strong>TEMPLE</strong></h2>
              <p>Fight your way through the ruins.<br />Leave no guardian standing.</p>
              <button className="primary-cta" onClick={start}>PLAY NOW <span>→</span></button>
              <div className="overlay-hint">PRESS <b>PLAY NOW</b> TO BEGIN</div>
            </div>}
            {running && paused && !won && <div className="game-overlay pause-overlay"><div className="pause-card"><div className="overlay-kicker">MISSION ON HOLD</div><h2>PAUSED</h2><button className="primary-cta" onClick={() => setPaused(false)}>RESUME <span>→</span></button><button className="text-button" onClick={restart}>RESTART RUN</button></div></div>}
            {doorOpen && !won && <div className="door-objective"><span className="door-icon">↗</span><div><b>CHAMBER CLEAR — DOOR OPEN</b><small>MOVE TO THE DOOR ON THE RIGHT · PRESS ↑ TO ENTER</small></div></div>}
            {won && <div className="game-overlay win-overlay"><div className="pause-card"><div className="overlay-kicker">RUN COMPLETE // LEVEL 04</div><h2>BOOM!</h2><p>Every chamber cleared.<br />The temple is yours.</p><button className="primary-cta" onClick={start}>PLAY AGAIN <span>→</span></button><button className="text-button" onClick={openMap}>VIEW LEVEL MAP</button></div></div>}
            {running && !paused && !won && <button className="pause-button" onClick={() => setPaused(true)} aria-label="Pause">Ⅱ</button>}
          </div>
          {running && <div className="game-footer"><span><i className="status-dot" /> RUN IN PROGRESS</span><span>MOUSE AIM <b>•</b> CLICK FIRE <b>•</b> ARROWS MOVE <b>•</b> W / ↑ CLIMB</span><span>COINS <strong>{String(hud.coins || 0).padStart(2, '0')}/{String(hud.coinTotal || 0).padStart(2, '0')}</strong> <b>•</b> SCORE <strong>{String(hud.score).padStart(5, '0')}</strong></span></div>}
        </section>


      </main>
      <footer className="site-footer"><span>© 2024 TEMPLE OF BOOM</span><span>BUILT FOR THE BRAVE <i>✦</i></span></footer>
      <button className="keyboard-pause" onClick={() => running && setPaused(!paused)} aria-label="Toggle pause">P</button>
    </div>
  )
}

export default App

createRoot(document.getElementById('root')).render(<App />)
