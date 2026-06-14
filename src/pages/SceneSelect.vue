<script setup lang="ts">
import { useRouter } from 'vue-router';
import { TreePine, Home, ArrowRight, ArrowLeft } from 'lucide-vue-next';
import { useGameStore } from '@/stores/gameStore';
import { SCENES, WEATHERS } from '@/config/gameConfig';

const router = useRouter();
const store = useGameStore();

const competitionModeLabels: Record<string, string> = {
  distance: '距离赛',
  airtime: '滞空赛',
  acrobatic: '特技赛',
};

function selectScene(id: string) {
  store.setScene(id);
  router.push('/fold');
}

function selectWeather(id: string) {
  store.setWeather(id);
}

function backToHome() {
  router.push('/home');
}
</script>

<template>
  <div class="page-wrap">
    <div class="w-full max-w-5xl">
      <div class="flex items-center justify-between mb-8 animate-fade-up">
        <button class="btn-ghost" @click="backToHome">
          <ArrowLeft :size="18" /> 返回首页
        </button>
        <div class="flex items-center gap-3">
          <span
            v-if="store.competitionMode !== 'free'"
            class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full
                   bg-accent text-white text-sm font-medium shadow-soft"
          >
            🏆 {{ competitionModeLabels[store.competitionMode] }}
            <span v-if="store.currentRound > 1" class="ml-1 opacity-90">第 {{ store.currentRound }} 轮</span>
          </span>
        </div>
        <div class="w-[140px]"></div>
      </div>

      <div class="text-center mb-10 animate-fade-up">
        <div class="inline-flex items-center gap-2 text-sm px-4 py-1.5 rounded-full bg-white/70 text-sky-dark mb-4 shadow-soft">
          <span class="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
          <span class="font-medium">准备起飞 · 第一步</span>
        </div>
        <h1 class="font-display text-5xl md:text-6xl text-sky-dark mb-3 tracking-wide">
          纸飞机飞行游戏
        </h1>
        <p class="text-slate-500 text-lg">
          选择一个你喜欢的场景，开始你的飞行冒险吧 ✈️
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div
          v-for="(scene, idx) in SCENES"
          :key="scene.id"
          class="card group cursor-pointer transform transition-all duration-300
                 hover:-translate-y-2 hover:shadow-glow
                 animate-fade-up"
          :style="{ animationDelay: `${idx * 0.08}s` }"
          @click="selectScene(scene.id)"
        >
          <div
            class="relative h-64 overflow-hidden"
          >
            <div
              class="absolute inset-0"
              :style="{ background: `linear-gradient(to bottom, ${scene.skyTop}, ${scene.skyBottom} 65%, ${scene.groundColor2}` }"
            >
              <template v-if="scene.type === 'outdoor'">
                <svg viewBox="0 0 400 256" class="absolute inset-0 w-full h-full">
                  <g class="opacity-90">
                    <ellipse cx="60" cy="60" rx="38" ry="14" fill="#ffffff" opacity="0.92" />
                    <ellipse cx="85" cy="55" rx="28" ry="11" fill="#ffffff" opacity="0.92" />
                  </g>
                  <g style="animation: cloudDrift 38s linear infinite">
                    <ellipse cx="320" cy="40" rx="32" ry="10" fill="#ffffff" opacity="0.85" />
                    <ellipse cx="345" cy="36" rx="24" ry="9" fill="#ffffff" opacity="0.85" />
                  </g>
                  <path
                    d="M0,180 Q80,140 160,165 Q240,135 320,170 Q360,150 400,175 L400,256 L0,256 Z"
                    :fill="scene.groundColor"
                  />
                  <g transform="translate(30, 172)">
                    <rect x="-2" y="0" width="4" height="22" fill="#7a5a3a" rx="1" />
                    <circle cx="0" cy="-6" r="22" fill="#5ea856" opacity="0.95" />
                  </g>
                  <g transform="translate(360, 178)">
                    <rect x="-2" y="0" width="4" height="16" fill="#7a5a3a" rx="1" />
                    <circle cx="0" cy="-4" r="17" fill="#6bb35f" opacity="0.95" />
                  </g>
                  <g transform="translate(200, 90)">
                    <path d="M0,0 L28,-4 L36,0 L28,4 L0,0 Z" fill="#fdfbf5" stroke="#c8bfaa" stroke-width="0.5" />
                    <path d="M28,-4 L36,-10 L36,0 Z" fill="#ebe4d2" />
                    <path d="M28,4 L36,10 L36,0 Z" fill="#ebe4d2" />
                    <path d="M10,0 L22,-12 L30,0 Z" fill="#f5efe0" />
                    <path d="M10,0 L22,12 L30,0 Z" fill="#f5efe0" />
                  </g>
                </svg>
              </template>
              <template v-else>
                <svg viewBox="0 0 400 256" class="absolute inset-0 w-full h-full">
                  <rect x="0" y="0" width="400" height="170" :fill="scene.skyBottom" opacity="0.6" />
                  <rect x="260" y="28" width="110" height="110" fill="#ffffff" stroke="#c8bfaa" stroke-width="2" />
                  <line x1="315" y1="28" x2="315" y2="138" stroke="#c8bfaa" stroke-width="2" />
                  <line x1="260" y1="83" x2="370" y2="83" stroke="#c8bfaa" stroke-width="2" />
                  <path d="M0,170 L400,170 L400,256 L0,256 Z" :fill="scene.groundColor2" />
                  <path d="M0,170 L400,170 L380,178 L20,178 Z" :fill="scene.groundColor" opacity="0.6" />
                  <g stroke="#b88a5c" stroke-width="0.6" opacity="0.5">
                    <line x1="0" y1="200" x2="400" y2="200" />
                    <line x1="0" y1="225" x2="400" y2="225" />
                    <line x1="0" y1="250" x2="400" y2="250" />
                  </g>
                  <g transform="translate(120, 140)">
                    <path d="M0,0 L28,-4 L36,0 L28,4 L0,0 Z" fill="#fdfbf5" stroke="#c8bfaa" stroke-width="0.5" />
                    <path d="M28,-4 L36,-10 L36,0 Z" fill="#ebe4d2" />
                    <path d="M28,4 L36,10 L36,0 Z" fill="#ebe4d2" />
                  </g>
                  <rect x="40" y="130" width="70" height="40" fill="#e76f51" opacity="0.8" rx="2" />
                  <rect x="40" y="118" width="50" height="14" fill="#d6603d" opacity="0.8" rx="1" />
                </svg>
              </template>
            </div>
            <div class="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold text-sky-dark shadow-sm">
              {{ scene.type === 'outdoor' ? '户外' : scene.type === 'canyon' ? '峡谷' : scene.type === 'balcony' ? '阳台' : '室内' }}
            </div>
          </div>

          <div class="p-6">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md"
                   :class="scene.type === 'outdoor' ? 'bg-grass' : 'bg-accent'">
                <TreePine v-if="scene.type === 'outdoor'" :size="20" />
                <Home v-else :size="20" />
              </div>
              <h3 class="font-display text-2xl text-slate-800 tracking-wide">
                {{ scene.name }}
              </h3>
            </div>
            <p class="text-sm text-slate-500 mb-4 leading-relaxed">
              {{ scene.description }}
            </p>
            <div class="flex items-center gap-3 mb-4 text-xs">
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-light/30 text-sky-dark font-medium">
                💨 风速 {{ scene.baseWindSpeed?.toFixed(1) || 0 }} m/s
              </span>
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/20 text-accent-dark font-medium">
                🌀 湍流 {{ scene.turbulence?.toFixed(2) || 0 }}
              </span>
              <span v-if="scene.ceilingHeight" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-600 font-medium">
                🏠 顶高 {{ scene.ceilingHeight }}m
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-sky-dark font-medium">选择此场景</span>
              <div class="w-9 h-9 rounded-full bg-sky text-white flex items-center justify-center
                          transform group-hover:translate-x-1 group-hover:bg-accent transition-all duration-300">
                <ArrowRight :size="18" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="animate-fade-up" style="animation-delay:0.2s">
        <div class="text-center mb-6">
          <h2 class="font-display text-3xl text-sky-dark mb-2 tracking-wide">选择天气条件</h2>
          <p class="text-slate-500">不同的天气会影响纸飞机的飞行表现</p>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div
            v-for="(weather, idx) in WEATHERS"
            :key="weather.id"
            class="card p-4 cursor-pointer transform transition-all duration-300
                   hover:-translate-y-1 hover:shadow-glow
                   border-2 border-transparent"
            :class="store.selectedWeatherId === weather.id ? 'border-sky shadow-glow -translate-y-1' : ''"
            :style="{ animationDelay: `${0.25 + idx * 0.05}s` }"
            @click="selectWeather(weather.id)"
          >
            <div class="text-center">
              <div class="text-4xl mb-2">{{ weather.icon }}</div>
              <h3 class="font-display text-lg text-slate-800 mb-2 tracking-wide">
                {{ weather.name }}
              </h3>
              <div class="space-y-1 text-xs text-slate-500">
                <div class="flex items-center justify-center gap-1">
                  <span>💨</span>
                  <span>{{ weather.windSpeed.toFixed(1) }} m/s</span>
                </div>
                <div class="flex items-center justify-center gap-1">
                  <span>💧</span>
                  <span>{{ weather.humidity }}%</span>
                </div>
                <div class="flex items-center justify-center gap-1">
                  <span>🌡️</span>
                  <span>{{ weather.temperature }}°C</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="store.topScores.length" class="mt-10 text-center animate-fade-up" style="animation-delay:0.4s">
        <p class="text-sm text-slate-400">
          🏆 历史最佳：
          <span class="font-bold text-accent-dark text-lg ml-1">{{ store.topScores[0].totalScore }}</span>
          <span class="text-slate-500 ml-1">分</span>
          <span class="text-slate-400">· {{ store.topScores[0].foldName }}</span>
        </p>
      </div>
    </div>
  </div>
</template>
