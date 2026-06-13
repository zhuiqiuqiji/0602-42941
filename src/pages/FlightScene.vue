<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores/gameStore';
import { stepPhysics } from '@/composables/usePhysics';
import type { FlightState } from '@/types';

const router = useRouter();
const store = useGameStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);

let rafId: number | null = null;
let lastTs: number | null = null;
let accumulator = 0;
let settledFrames = 0;
let finishedFlight = false;
const DT = 1 / 60;

const state = ref<FlightState>({ ...store.flightState, trail: [] });
const cameraX = ref(0);
const dustParticles = ref<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number }[]>([]);

const hud = computed(() => ({
  distance: Math.max(0, Math.round(state.value.positionX * 10) / 10),
  height: Math.round(state.value.positionY * 100) / 100,
  speed: Math.round(Math.sqrt(state.value.velocityX ** 2 + state.value.velocityY ** 2) * 10) / 10,
  time: Math.round(state.value.flightTime * 100) / 100,
  pitch: Math.round(state.value.pitchAngle),
}));

const scene = computed(() => store.selectedScene);
const fold = computed(() => store.selectedFold);

function resizeCanvas() {
  const canvas = canvasRef.value;
  const container = containerRef.value;
  if (!canvas || !container) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = container.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function worldToScreen(
  wx: number,
  wy: number,
  w: number,
  h: number
): { x: number; y: number } {
  const groundY = h - 90;
  const horizonY = h * 0.55;
  const scale = 55;
  const camLerp = Math.min(1, state.value.flightTime * 1.2);
  const camX = cameraX.value * camLerp;
  const screenX = (wx - camX) * scale + w * 0.22;
  const heightRatio = Math.min(1, wy / 40);
  const screenY = groundY - wy * scale * (0.55 + 0.45 * (1 - heightRatio * 0.3));
  const clampedY = Math.min(groundY, Math.max(horizonY - 120, screenY));
  return { x: screenX, y: clampedY };
}

function spawnDust(wx: number, wy: number, speed: number) {
  const n = Math.min(14, Math.floor(speed * 0.8) + 5);
  for (let i = 0; i < n; i++) {
    dustParticles.value.push({
      x: wx + (Math.random() - 0.5) * 0.3,
      y: wy + 0.01,
      vx: (Math.random() * 2 - 0.5) * (speed * 0.08 + 1),
      vy: Math.random() * 1.2 + 0.4,
      life: 0,
      maxLife: 0.7 + Math.random() * 0.8,
    });
  }
}

function updateDust(dt: number) {
  for (const p of dustParticles.value) {
    p.life += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy -= 1.8 * dt;
  }
  dustParticles.value = dustParticles.value.filter(p => p.life < p.maxLife);
}

function drawScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const s = scene.value;
  const isOutdoor = s.type === 'outdoor';

  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.75);
  sky.addColorStop(0, s.skyTop);
  sky.addColorStop(1, s.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h * 0.75);

  if (isOutdoor) {
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    const camX = cameraX.value;
    for (let i = 0; i < 6; i++) {
      const seed = i * 137.5;
      const baseX = ((seed * 31 - camX * 0.08) % (w + 240) + w + 240) % (w + 240) - 120;
      const cy = 40 + (i % 3) * 45;
      const r = 22 + ((seed * 7) % 18);
      ctx.beginPath();
      ctx.ellipse(baseX, cy, r * 1.8, r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(baseX + r * 0.7, cy - 6, r * 1.2, r * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const groundY = h - 90;
    const horizonHills = ctx.createLinearGradient(0, h * 0.5, 0, groundY);
    horizonHills.addColorStop(0, '#8FCC85');
    horizonHills.addColorStop(1, s.groundColor2);
    ctx.fillStyle = horizonHills;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.6);
    for (let x = 0; x <= w; x += 10) {
      const t = (x + cameraX.value * 18) / w;
      const y = h * 0.6 + Math.sin(t * 5.2) * 12 + Math.sin(t * 11 + 1.7) * 6;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, groundY);
    ctx.lineTo(0, groundY);
    ctx.closePath();
    ctx.fill();

    const ground = ctx.createLinearGradient(0, groundY, 0, h);
    ground.addColorStop(0, s.groundColor);
    ground.addColorStop(1, s.groundColor2);
    ctx.fillStyle = ground;
    ctx.fillRect(0, groundY, w, h - groundY);

    ctx.strokeStyle = 'rgba(90, 150, 80, 0.28)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
      const xLine = ((i * 80 - cameraX.value * 55) % (w + 200) + w + 200) % (w + 200) - 100;
      ctx.beginPath();
      ctx.moveTo(xLine, groundY + 6);
      ctx.lineTo(xLine + 15, h);
      ctx.stroke();
    }
  } else {
    const groundY = h - 90;
    const wall = ctx.createLinearGradient(0, 0, 0, groundY);
    wall.addColorStop(0, '#FFF9EF');
    wall.addColorStop(1, s.skyBottom);
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, w, groundY);

    const wx = w * 0.7;
    const wy = h * 0.12;
    const ww = w * 0.22;
    const wh = h * 0.42;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(wx, wy, ww, wh);
    ctx.strokeStyle = '#c8bfaa';
    ctx.lineWidth = 3;
    ctx.strokeRect(wx, wy, ww, wh);
    ctx.beginPath();
    ctx.moveTo(wx + ww / 2, wy);
    ctx.lineTo(wx + ww / 2, wy + wh);
    ctx.moveTo(wx, wy + wh / 2);
    ctx.lineTo(wx + ww, wy + wh / 2);
    ctx.stroke();
    const glow = ctx.createLinearGradient(wx, wy, wx + ww, wy + wh);
    glow.addColorStop(0, 'rgba(255,240,180,0.35)');
    glow.addColorStop(1, 'rgba(255,240,180,0.08)');
    ctx.fillStyle = glow;
    ctx.fillRect(wx, wy, ww, wh);

    const floor = ctx.createLinearGradient(0, groundY, 0, h);
    floor.addColorStop(0, s.groundColor);
    floor.addColorStop(1, s.groundColor2);
    ctx.fillStyle = floor;
    ctx.fillRect(0, groundY, w, h - groundY);

    ctx.strokeStyle = 'rgba(150, 110, 70, 0.35)';
    ctx.lineWidth = 1;
    for (let y = groundY + 10; y < h; y += 18) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }
}

function drawTrail(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const trail = state.value.trail;
  if (trail.length < 2) return;
  for (let i = 1; i < trail.length; i++) {
    const a = trail[i - 1];
    const b = trail[i];
    const sa = worldToScreen(a.x, a.y, w, h);
    const sb = worldToScreen(b.x, b.y, w, h);
    const alpha = (i / trail.length) * 0.45;
    ctx.strokeStyle = `rgba(255, 179, 71, ${alpha})`;
    ctx.lineWidth = 1 + (i / trail.length) * 1.5;
    ctx.beginPath();
    ctx.moveTo(sa.x, sa.y);
    ctx.lineTo(sb.x, sb.y);
    ctx.stroke();
  }
}

function drawPlane(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const pos = worldToScreen(state.value.positionX, state.value.positionY, w, h);
  const pitch = -state.value.pitchAngle;
  const wing = store.flightParams.wingAngle;
  const tail = store.flightParams.tailAngle;

  ctx.save();
  const speedRatio = Math.max(0.3, Math.min(1.2, hud.value.speed / 18));
  const scale = 0.75 + speedRatio * 0.25;
  ctx.translate(pos.x, pos.y);
  ctx.rotate((pitch * Math.PI) / 180);
  ctx.scale(scale, scale);

  if (!state.value.isLanded) {
    ctx.save();
    ctx.shadowColor = 'rgba(44, 95, 143, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
  }

  const bodyGrad = ctx.createLinearGradient(-50, 0, 50, 0);
  bodyGrad.addColorStop(0, '#ffffff');
  bodyGrad.addColorStop(0.6, '#f2efe6');
  bodyGrad.addColorStop(1, '#e3dccc');
  ctx.fillStyle = bodyGrad;
  ctx.strokeStyle = '#c8bfaa';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(-50, 0);
  ctx.lineTo(-35, -4);
  ctx.lineTo(42, -3);
  ctx.lineTo(52, 0);
  ctx.lineTo(42, 3);
  ctx.lineTo(-35, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const wingGrad = ctx.createLinearGradient(0, -30, 0, 30);
  wingGrad.addColorStop(0, '#fdfbf5');
  wingGrad.addColorStop(1, '#ebe4d2');
  ctx.fillStyle = wingGrad;
  ctx.strokeStyle = '#c8bfaa';
  ctx.lineWidth = 0.5;

  const wr = (wing * Math.PI) / 180;
  ctx.save();
  ctx.translate(0, 0);
  ctx.rotate(-wr);
  ctx.beginPath();
  ctx.moveTo(-20, 0);
  ctx.lineTo(8, -30);
  ctx.lineTo(32, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(0, 0);
  ctx.rotate(wr);
  ctx.beginPath();
  ctx.moveTo(-20, 0);
  ctx.lineTo(8, 30);
  ctx.lineTo(32, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  const tr = (tail * Math.PI) / 180;
  ctx.save();
  ctx.translate(42, 0);
  ctx.rotate(-tr);
  ctx.beginPath();
  ctx.moveTo(-4, 0);
  ctx.lineTo(10, -14);
  ctx.lineTo(14, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(42, 0);
  ctx.rotate(tr);
  ctx.beginPath();
  ctx.moveTo(-4, 0);
  ctx.lineTo(10, 14);
  ctx.lineTo(14, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  if (!state.value.isLanded) {
    ctx.restore();
  }

  ctx.restore();

  if (state.value.positionY > 0.1 && !state.value.isLanded) {
    const shadow = worldToScreen(state.value.positionX, 0, w, h);
    const alpha = Math.max(0.05, 0.32 - state.value.positionY * 0.04);
    const r = Math.max(4, 22 - state.value.positionY * 2.2);
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(shadow.x, shadow.y - 2, r, r * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDust(ctx: CanvasRenderingContext2D, w: number, h: number) {
  for (const p of dustParticles.value) {
    const pos = worldToScreen(p.x, p.y, w, h);
    const alpha = 1 - p.life / p.maxLife;
    const size = 2 + p.life * 5;
    ctx.fillStyle = `rgba(210, 190, 150, ${alpha * 0.7})`;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function render() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  ctx.clearRect(0, 0, w, h);

  drawScene(ctx, w, h);
  drawTrail(ctx, w, h);
  drawDust(ctx, w, h);
  drawPlane(ctx, w, h);
}

function tick(ts: number) {
  if (!finishedFlight) {
    if (lastTs == null) lastTs = ts;
    const frameDt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    accumulator += frameDt;

    while (accumulator >= DT) {
      state.value = stepPhysics(state.value, store.flightParams, fold.value);
      accumulator -= DT;
      updateDust(DT);

      const targetCam = Math.max(0, state.value.positionX - 4);
      cameraX.value += (targetCam - cameraX.value) * 0.08;

      if (state.value.isLanded) {
        settledFrames++;
        const impactSpeed = Math.sqrt(state.value.velocityX ** 2 + state.value.velocityY ** 2);
        if (dustParticles.value.length === 0 && impactSpeed > 0.5) {
          spawnDust(state.value.positionX, 0, impactSpeed * 4);
        }
        if (settledFrames > 80 && !finishedFlight) {
          finishedFlight = true;
          store.updateFlightState({ ...state.value });
          store.recordResult();
          setTimeout(() => {
            router.push('/result');
          }, 700);
        }
      }
    }
  }
  render();
  rafId = requestAnimationFrame(tick);
}

watch(
  () => store.flightState,
  (v) => {
    state.value = { ...v, trail: [] };
  },
  { immediate: true }
);

onMounted(() => {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  rafId = requestAnimationFrame(tick);
});

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas);
  if (rafId != null) cancelAnimationFrame(rafId);
});
</script>

<template>
  <div
    ref="containerRef"
    class="fixed inset-0 w-screen h-screen overflow-hidden select-none"
  >
    <canvas ref="canvasRef" class="block w-full h-full" />

    <div class="absolute top-5 left-5 card px-5 py-4 animate-fade-up" style="min-width: 220px">
      <div class="flex items-center gap-2 mb-3">
        <span class="inline-block w-2 h-2 rounded-full bg-accent animate-pulse"></span>
        <span class="text-sm font-semibold text-slate-600">
          {{ fold.name }} · {{ scene.name }}
        </span>
      </div>
      <div class="grid grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <p class="text-[11px] text-slate-400 mb-0.5">飞行距离</p>
          <p class="font-display text-xl text-sky-dark leading-none">
            {{ hud.distance }}<span class="text-xs font-sans text-slate-500 ml-1">米</span>
          </p>
        </div>
        <div>
          <p class="text-[11px] text-slate-400 mb-0.5">滞空时间</p>
          <p class="font-display text-xl text-accent-dark leading-none">
            {{ hud.time }}<span class="text-xs font-sans text-slate-500 ml-1">秒</span>
          </p>
        </div>
        <div>
          <p class="text-[11px] text-slate-400 mb-0.5">当前高度</p>
          <p class="font-display text-xl text-grass leading-none">
            {{ hud.height }}<span class="text-xs font-sans text-slate-500 ml-1">米</span>
          </p>
        </div>
        <div>
          <p class="text-[11px] text-slate-400 mb-0.5">速度 / 俯仰</p>
          <p class="font-display text-lg text-purple-600 leading-none">
            {{ hud.speed }}<span class="text-xs font-sans text-slate-500 ml-0.5">m/s</span>
            <span class="text-slate-400 mx-0.5">/</span>
            {{ hud.pitch }}°
          </p>
        </div>
      </div>
    </div>

    <div class="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
      <div
        v-if="state.isLanded"
        class="card px-6 py-3 animate-pop-in"
      >
        <p class="font-display text-2xl text-sky-dark tracking-wide">
          🛬 落地完成！即将显示成绩...
        </p>
      </div>
      <div v-else class="px-5 py-2 rounded-full bg-white/70 backdrop-blur-sm shadow-soft">
        <p class="text-sm text-slate-600 font-medium">
          ✈️ 飞行中...欣赏你的纸飞机翱翔天际吧！
        </p>
      </div>
    </div>
  </div>
</template>
