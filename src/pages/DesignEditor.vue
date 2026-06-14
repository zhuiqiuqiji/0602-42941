<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, Save, Trash2, Plus, Play, RotateCcw, Info, Sparkles } from 'lucide-vue-next';
import { useGameStore } from '@/stores/gameStore';
import type { CustomFoldDesign, WingProfile, FlightState } from '@/types';
import { WING_PROFILES, stepPhysics, DEFAULT_PHYSICS } from '@/composables/usePhysics';
import PlanePreview from '@/components/PlanePreview.vue';
import StatBar from '@/components/StatBar.vue';

const router = useRouter();
const store = useGameStore();

const designName = ref('我的自定义折法');
const wingSpan = ref(12);
const bodyLength = ref(18);
const dihedralAngle = ref(5);
const paperWeight = ref(80);
const aspectRatio = ref(2.5);
const camber = ref(0.05);
const cgX = ref(0.38);
const sweepAngle = ref(10);
const thicknessRatio = ref(0.03);
const wingProfileType = ref('flat');

const designs = computed(() => store.customFoldDesigns);
const wingProfileOptions = computed(() => Object.values(WING_PROFILES));

let previewRaf: number | null = null;
const initialAcrobatics = { loops: 0, rolls: 0, dives: 0, climbs: 0, maxPitchRate: 0, score: 0 };
let previewState = ref<FlightState>({
  positionX: 0,
  positionY: 2,
  velocityX: 12,
  velocityY: 3,
  pitchAngle: 15,
  pitchRate: 0,
  flightTime: 0,
  isLanded: false,
  trail: [],
  acrobatics: initialAcrobatics,
  angularVelocity: 0,
});
let previewAccumulator = 0;
let previewLastTs = 0;

const previewFold = computed(() => {
  const wingFactor = aspectRatio.value / 3;
  const liftCoeff = 0.4 * wingFactor + 0.2 * camber.value * 10;
  const dragCoeff = 0.03 + 0.02 * (paperWeight.value / 80);
  const stability = 0.6 + 0.8 * Math.abs(cgX.value - 0.5);
  const speedFactor = 0.8 + 0.4 * (bodyLength.value / 18);
  const baseProfile = WING_PROFILES[wingProfileType.value] || WING_PROFILES.flat;
  return {
    id: 'preview',
    name: designName.value,
    description: '预览折法',
    category: 'custom' as const,
    baseLiftCoeff: Math.max(0.3, Math.min(0.9, liftCoeff)),
    baseDragCoeff: Math.max(0.015, Math.min(0.07, dragCoeff)),
    baseStability: Math.max(0.2, Math.min(1.4, stability)),
    maxSpeedFactor: Math.max(0.6, Math.min(1.6, speedFactor)),
    wingProfileId: wingProfileType.value,
    centerOfGravity: { x: cgX.value, y: 0, massRatio: 1 },
    momentOfInertia: 0.08,
    svgPath: '',
    stats: {
      lift: Math.round(Math.min(100, liftCoeff * 120)),
      speed: Math.round(Math.min(100, speedFactor * 80)),
      stability: Math.round(Math.min(100, stability * 80)),
      distance: Math.round(Math.min(100, (1 - dragCoeff * 10) * 100)),
      acrobatics: Math.round(Math.min(100, (1 - stability) * 100)),
    },
  };
});

const previewTrailPath = computed(() => {
  const trail = previewState.value.trail;
  if (trail.length < 2) return '';
  return trail.map((p, i) => {
    const x = 50 + p.x * 4;
    const y = 130 - p.y * 20;
    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  }).join(' ');
});

const previewParams = computed(() => ({
  wingAngle: dihedralAngle.value,
  tailAngle: 0,
  throwPower: 70,
  throwAngle: 30,
}));

function resetPreview() {
  previewState.value = {
    positionX: 0,
    positionY: 2,
    velocityX: 12,
    velocityY: 3,
    pitchAngle: 15,
    pitchRate: 0,
    flightTime: 0,
    isLanded: false,
    trail: [],
    acrobatics: { ...initialAcrobatics },
    angularVelocity: 0,
  };
  previewAccumulator = 0;
}

function tickPreview(ts: number) {
  if (!previewLastTs) previewLastTs = ts;
  const dt = Math.min(0.05, (ts - previewLastTs) / 1000);
  previewLastTs = ts;
  previewAccumulator += dt;

  const DT = 1 / 60;
  while (previewAccumulator >= DT) {
    if (!previewState.value.isLanded) {
      const nextState = stepPhysics(
        previewState.value,
        previewParams.value,
        previewFold.value,
        undefined,
        DEFAULT_PHYSICS
      );
      previewState.value = {
        ...nextState,
        acrobatics: nextState.acrobatics || { ...initialAcrobatics },
      };
    }
    previewAccumulator -= DT;
  }

  if (previewState.value.isLanded && previewState.value.flightTime > 2) {
    setTimeout(resetPreview, 800);
  }

  previewRaf = requestAnimationFrame(tickPreview);
}

function saveDesign() {
  const selectedProfile = WING_PROFILES[wingProfileType.value] || WING_PROFILES.flat;
  const newDesign: CustomFoldDesign = {
    id: Date.now().toString(36),
    name: designName.value,
    wingProfile: {
      ...selectedProfile,
      id: wingProfileType.value,
      aspectRatio: aspectRatio.value,
      camber: camber.value,
      sweepAngle: sweepAngle.value,
      thicknessRatio: thicknessRatio.value,
    },
    centerOfGravity: { x: cgX.value, y: 0, massRatio: 1 },
    wingSpan: wingSpan.value,
    bodyLength: bodyLength.value,
    dihedralAngle: dihedralAngle.value,
    paperWeight: paperWeight.value,
    createdAt: Date.now(),
  };
  store.saveCustomFold(newDesign);
  designName.value = '我的自定义折法 ' + (designs.value.length + 1);
}

function deleteDesign(id: string) {
  store.deleteCustomFold(id);
}

function back() {
  router.push('/home');
}

function getWingProfileShape(camber: number, thickness: number): string {
  const w = 80;
  const h = 12;
  const mid = h / 2;
  const camberOffset = camber * 40;
  const thicknessScale = thickness * 200;

  let topPath = `M 0 ${mid}`;
  let bottomPath = `M 0 ${mid}`;

  for (let x = 0; x <= w; x += 2) {
    const t = x / w;
    const yCamber = 4 * camberOffset * t * (1 - t);
    const yThick = thicknessScale * Math.sqrt(Math.max(0, t * (1 - t)));
    topPath += ` L ${x} ${mid - yCamber - yThick}`;
    bottomPath = ` L ${x} ${mid - yCamber + yThick}` + bottomPath;
  }

  return `${topPath} L ${w} ${mid} ${bottomPath.replace('M 0 ' + mid, '')} Z`;
}

const wingShapePath = computed(() => getWingProfileShape(camber.value, thicknessRatio.value));

onMounted(() => {
  previewRaf = requestAnimationFrame(tickPreview);
});

onUnmounted(() => {
  if (previewRaf) cancelAnimationFrame(previewRaf);
});
</script>

<template>
  <div class="page-wrap">
    <div class="w-full max-w-6xl">
      <div class="flex items-center justify-between mb-8">
        <button class="btn-ghost" @click="back">
          <ArrowLeft :size="18" /> 返回首页
        </button>
        <div class="text-center">
          <h1 class="font-display text-3xl text-sky-dark tracking-wide">设计编辑器</h1>
        </div>
        <div class="w-[140px]"></div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="card p-6 animate-fade-up">
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-display text-xl text-slate-800 tracking-wide flex items-center gap-2">
                <Play :size="20" class="text-grass" />
                实时飞行预览
              </h2>
              <button
                class="px-3 py-1.5 rounded-full bg-sky-light/50 text-sky-dark text-sm font-medium
                       hover:bg-sky-light transition-colors flex items-center gap-1"
                @click="resetPreview"
              >
                <RotateCcw :size="14" /> 重置
              </button>
            </div>

            <div class="relative h-48 rounded-2xl bg-gradient-to-b from-sky-100 to-green-50 overflow-hidden mb-4">
              <div class="absolute inset-0">
                <svg class="w-full h-full" viewBox="0 0 400 160" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <linearGradient id="previewSky" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stop-color="#87CEEB" />
                      <stop offset="100%" stop-color="#E0F4FF" />
                    </linearGradient>
                  </defs>
                  <rect width="400" height="160" fill="url(#previewSky)" />

                  <ellipse cx="80" cy="30" rx="30" ry="10" fill="#ffffff" opacity="0.8" />
                  <ellipse cx="100" cy="26" rx="22" ry="8" fill="#ffffff" opacity="0.8" />
                  <ellipse cx="300" cy="40" rx="25" ry="8" fill="#ffffff" opacity="0.7" />

                  <path
                    d="M0,130 Q100,110 200,125 Q300,105 400,130 L400,160 L0,160 Z"
                    fill="#6BB35F"
                    opacity="0.9"
                  />

                  <path
                    v-if="previewState.trail.length > 1"
                    :d="previewTrailPath"
                    stroke="#FF8C00"
                    stroke-width="2"
                    fill="none"
                    opacity="0.6"
                  />

                  <g
                    :transform="`translate(${50 + previewState.positionX * 4}, ${130 - previewState.positionY * 20}) rotate(${-previewState.pitchAngle})`"
                  >
                    <path d="M-15,0 L12,-2 L18,0 L12,2 L-15,0 Z" fill="#fdfbf5" stroke="#c8bfaa" stroke-width="0.5" />
                    <path d="M-8,0 L6,-10 L15,0 Z" fill="#f5efe0" stroke="#c8bfaa" stroke-width="0.3" />
                    <path d="M-8,0 L6,10 L15,0 Z" fill="#f5efe0" stroke="#c8bfaa" stroke-width="0.3" />
                  </g>
                </svg>
              </div>

              <div class="absolute top-3 left-3 flex gap-3">
                <div class="px-2 py-1 rounded-lg bg-white/80 backdrop-blur-sm text-xs">
                  <span class="text-slate-500">距离</span>
                  <span class="font-bold text-sky-dark ml-1">{{ previewState.positionX.toFixed(1) }}m</span>
                </div>
                <div class="px-2 py-1 rounded-lg bg-white/80 backdrop-blur-sm text-xs">
                  <span class="text-slate-500">时间</span>
                  <span class="font-bold text-accent-dark ml-1">{{ previewState.flightTime.toFixed(1) }}s</span>
                </div>
                <div class="px-2 py-1 rounded-lg bg-white/80 backdrop-blur-sm text-xs">
                  <span class="text-slate-500">速度</span>
                  <span class="font-bold text-purple-600 ml-1">
                    {{ Math.sqrt(previewState.velocityX ** 2 + previewState.velocityY ** 2).toFixed(1) }}m/s
                  </span>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-5 gap-3">
              <div class="text-center">
                <StatBar label="升力" :value="previewFold.stats.lift" />
              </div>
              <div class="text-center">
                <StatBar label="速度" :value="previewFold.stats.speed" />
              </div>
              <div class="text-center">
                <StatBar label="稳定性" :value="previewFold.stats.stability" />
              </div>
              <div class="text-center">
                <StatBar label="距离" :value="previewFold.stats.distance" />
              </div>
              <div class="text-center">
                <StatBar label="花式" :value="previewFold.stats.acrobatics" />
              </div>
            </div>
          </div>

          <div class="card p-6 animate-fade-up" style="animation-delay: 0.1s">
            <h2 class="font-display text-xl text-slate-800 mb-5 tracking-wide flex items-center gap-2">
              <Sparkles :size="20" class="text-accent" />
              参数设置
            </h2>

            <div class="mb-4">
              <label class="block text-sm font-medium text-slate-600 mb-2">折法名称</label>
              <input
                v-model="designName"
                type="text"
                class="w-full px-4 py-2.5 rounded-xl border border-sky/30 focus:border-sky
                       focus:outline-none focus:ring-2 focus:ring-sky/20 transition-all"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-600 mb-1.5">
                  翼展: {{ wingSpan }} cm
                </label>
                <input v-model="wingSpan" type="range" min="5" max="25" step="1" class="custom-slider" />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-600 mb-1.5">
                  机身长度: {{ bodyLength }} cm
                </label>
                <input v-model="bodyLength" type="range" min="10" max="30" step="1" class="custom-slider" />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-600 mb-1.5">
                  上反角: {{ dihedralAngle }}°
                </label>
                <input v-model="dihedralAngle" type="range" min="0" max="20" step="1" class="custom-slider" />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-600 mb-1.5">
                  纸张克重: {{ paperWeight }} g/m²
                </label>
                <input v-model="paperWeight" type="range" min="40" max="160" step="10" class="custom-slider" />
              </div>
            </div>

            <div class="mt-6 pt-5 border-t border-slate-100">
              <h3 class="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Info :size="16" class="text-sky" />
                翼型参数
              </h3>

              <div class="mb-4">
                <label class="block text-sm font-medium text-slate-600 mb-2">翼型类型</label>
                <div class="grid grid-cols-4 gap-2">
                  <button
                    v-for="profile in wingProfileOptions"
                    :key="profile.id"
                    class="px-2 py-1.5 rounded-lg text-xs font-medium transition-all"
                    :class="wingProfileType === profile.id
                      ? 'bg-sky text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                    @click="wingProfileType = profile.id"
                  >
                    {{ profile.name }}
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label class="block text-sm font-medium text-slate-600 mb-1.5">
                    展弦比: {{ aspectRatio.toFixed(1) }}
                  </label>
                  <input v-model="aspectRatio" type="range" min="1" max="5" step="0.1" class="custom-slider" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-600 mb-1.5">
                    翼型弯度: {{ camber.toFixed(2) }}
                  </label>
                  <input v-model="camber" type="range" min="-0.05" max="0.15" step="0.01" class="custom-slider" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-600 mb-1.5">
                    后掠角: {{ sweepAngle }}°
                  </label>
                  <input v-model="sweepAngle" type="range" min="0" max="45" step="1" class="custom-slider" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-600 mb-1.5">
                    相对厚度: {{ (thicknessRatio * 100).toFixed(0) }}%
                  </label>
                  <input v-model="thicknessRatio" type="range" min="0.01" max="0.08" step="0.005" class="custom-slider" />
                </div>
              </div>

              <div class="mt-5">
                <label class="block text-sm font-medium text-slate-600 mb-2">翼型截面预览</label>
                <div class="h-20 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <svg viewBox="0 0 80 24" class="w-full h-full">
                    <path
                      :d="wingShapePath"
                      fill="#f5efe0"
                      stroke="#c8bfaa"
                      stroke-width="0.5"
                    />
                    <line x1="0" y1="12" x2="80" y2="12" stroke="#a89e84" stroke-width="0.3" stroke-dasharray="2,2" />
                  </svg>
                </div>
              </div>
            </div>

            <div class="mt-6 pt-5 border-t border-slate-100">
              <h3 class="text-sm font-semibold text-slate-700 mb-4">重心位置</h3>
              <div class="relative mb-2">
                <div class="h-3 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    class="absolute h-full bg-gradient-to-r from-grass to-grass-light rounded-full transition-all"
                    :style="{ width: `${cgX * 100}%`, left: 0 }"
                  />
                </div>
                <input
                  v-model="cgX"
                  type="range"
                  min="0.2"
                  max="0.6"
                  step="0.01"
                  class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <div class="flex justify-between text-xs text-slate-400">
                <span>前端 0.2</span>
                <span class="font-medium text-slate-600">重心: {{ cgX.toFixed(2) }}</span>
                <span>后端 0.6</span>
              </div>
              <p class="text-xs text-slate-400 mt-2">
                💡 重心靠前更稳定，靠后更灵活
              </p>
            </div>

            <button class="btn-accent w-full mt-6" @click="saveDesign">
              <Save :size="18" /> 保存设计
            </button>
          </div>
        </div>

        <div class="space-y-6">
          <div class="card p-6 animate-fade-up" style="animation-delay: 0.15s">
            <h2 class="font-display text-xl text-slate-800 mb-4 tracking-wide">
              纸飞机预览
            </h2>
            <div class="h-32 flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl mb-4">
              <PlanePreview :fold="previewFold" :params="previewParams" :size="200" />
            </div>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">升力系数</span>
                <span class="font-mono text-sky-dark">{{ previewFold.baseLiftCoeff.toFixed(3) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">阻力系数</span>
                <span class="font-mono text-red-500">{{ previewFold.baseDragCoeff.toFixed(4) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">稳定性系数</span>
                <span class="font-mono text-grass">{{ previewFold.baseStability.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">最大速度比</span>
                <span class="font-mono text-purple-600">{{ previewFold.maxSpeedFactor.toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <div class="card p-6 animate-fade-up" style="animation-delay: 0.2s">
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-display text-xl text-slate-800 tracking-wide">
                我的设计 ({{ designs.length }})
              </h2>
              <Plus :size="18" class="text-slate-400" />
            </div>

            <div v-if="designs.length === 0" class="text-center py-8">
              <div class="text-4xl mb-3">📐</div>
              <p class="text-slate-400 text-sm">还没有自定义折法</p>
              <p class="text-slate-400 text-xs mt-1">调整参数并保存你的第一个设计</p>
            </div>

            <div v-else class="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              <div
                v-for="design in designs"
                :key="design.id"
                class="p-3 rounded-xl bg-sky-light/20 border border-sky/20 transition-all hover:bg-sky-light/30"
              >
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-medium text-slate-800 text-sm">{{ design.name }}</h3>
                  <button
                    class="p-1.5 rounded-full text-red-500 hover:bg-red-50 transition-colors"
                    @click="deleteDesign(design.id)"
                  >
                    <Trash2 :size="14" />
                  </button>
                </div>
                <div class="grid grid-cols-2 gap-1 text-[10px] text-slate-500">
                  <span>翼展: {{ design.wingSpan }}cm</span>
                  <span>展弦比: {{ (design.wingProfile.aspectRatio || 2.5).toFixed(1) }}</span>
                  <span>上反角: {{ design.dihedralAngle }}°</span>
                  <span>克重: {{ design.paperWeight }}g</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
