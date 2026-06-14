<script setup lang="ts">
import { reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, Send, Settings2, RotateCcw, Trophy } from 'lucide-vue-next';
import { useGameStore, calcScore } from '@/stores/gameStore';
import ParamSlider from '@/components/ParamSlider.vue';
import PlanePreview from '@/components/PlanePreview.vue';
import { FOLDS, COMPETITION_MODES } from '@/config/gameConfig';
import type { FlightParams } from '@/types';

const competitionModeLabels: Record<string, string> = {
  distance: '距离赛',
  airtime: '滞空赛',
  acrobatic: '特技赛',
};

const router = useRouter();
const store = useGameStore();

const localParams = reactive<FlightParams>({
  wingAngle: store.flightParams.wingAngle,
  tailAngle: store.flightParams.tailAngle,
  throwPower: store.flightParams.throwPower,
  throwAngle: store.flightParams.throwAngle,
});

const previewParams = computed(() => ({ ...localParams }));

const scorePreview = computed(() => {
  const estDistance = localParams.throwPower * 0.5;
  const estAirTime = localParams.throwPower * 0.1;
  const estAcrobatics = 0;
  const result = calcScore(estDistance, estAirTime, estAcrobatics, store.competitionMode);
  return {
    estDistance,
    estAirTime,
    estAcrobatics,
    ...result,
  };
});

const competitionRules = computed(() =>
  COMPETITION_MODES.find(m => m.mode === store.competitionMode) || COMPETITION_MODES[3]
);

function updateParam<K extends keyof FlightParams>(key: K, val: FlightParams[K]) {
  localParams[key] = val;
  store.updateParams({ [key]: val } as Partial<FlightParams>);
}

function resetDefaults() {
  const defaults: FlightParams = {
    wingAngle: 8,
    tailAngle: 0,
    throwPower: 75,
    throwAngle: 35,
  };
  Object.assign(localParams, defaults);
  store.updateParams(defaults);
}

function back() {
  router.push('/fold');
}

function goFly() {
  store.initFlight();
  router.push('/fly');
}
</script>

<template>
  <div class="page-wrap">
    <div class="w-full max-w-6xl">
      <div class="flex items-center justify-between mb-8">
        <button class="btn-ghost" @click="back">
          <ArrowLeft :size="18" /> 返回折法
        </button>
        <div class="text-center">
          <div class="inline-flex items-center gap-2 text-sm px-4 py-1.5 rounded-full bg-white/70 text-sky-dark shadow-soft">
            <Settings2 :size="14" class="text-accent" />
            <span class="font-medium">第三步 · 调整飞行参数</span>
          </div>
        </div>
        <button
          class="btn-ghost flex items-center gap-1.5"
          @click="resetDefaults"
        >
          <RotateCcw :size="14" />
          重置
        </button>
      </div>

      <h1 class="font-display text-4xl md:text-5xl text-center text-sky-dark mb-2 tracking-wide animate-fade-up">
        打造完美的飞行配置
      </h1>
      <p class="text-center text-slate-500 mb-8 animate-fade-up">
        拖动滑块实时预览飞机形态，找到最佳参数组合
      </p>

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div class="lg:col-span-3 card p-6 md:p-8 animate-fade-up" style="animation-delay:0.05s">
          <div class="mb-6">
            <div class="flex items-center justify-between mb-3">
              <h2 class="font-display text-2xl text-slate-800 tracking-wide">实时预览</h2>
            </div>
            <div class="flex flex-wrap items-center gap-3 mb-4">
              <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-light/30 text-sm">
                ✈️ 折法：<span class="font-semibold text-sky-dark">{{ store.selectedFold.name }}</span>
              </div>
              <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-grass/20 text-sm">
                🌳 场景：<span class="font-semibold text-grass-dark">{{ store.selectedScene.name }}</span>
              </div>
              <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/20 text-sm">
                <span class="text-base">{{ store.selectedWeather.icon }}</span>
                <span class="font-semibold text-accent-dark">{{ store.selectedWeather.name }}</span>
                <span class="text-slate-500 text-xs">风速 {{ store.selectedWeather.windSpeed.toFixed(1) }}m/s · 湿度 {{ store.selectedWeather.humidity }}%</span>
              </div>
            </div>
          </div>

          <div
            class="rounded-2xl overflow-hidden mb-6 relative h-[360px] flex items-center justify-center"
            :style="{
              background: `linear-gradient(to bottom, ${store.selectedScene.skyTop} 0%, ${store.selectedScene.skyBottom} 70%, ${store.selectedScene.groundColor2})`
            }"
          >
            <svg v-if="store.selectedScene.type === 'outdoor'" class="absolute inset-0 w-full h-full" viewBox="0 0 600 360" preserveAspectRatio="xMidYMid slice">
              <ellipse cx="120" cy="60" rx="52" ry="16" fill="#ffffff" opacity="0.9" />
              <ellipse cx="160" cy="55" rx="38" ry="12" fill="#ffffff" opacity="0.9" />
              <ellipse cx="480" cy="90" rx="44" ry="14" fill="#ffffff" opacity="0.85" />
              <path d="M0,290 Q120,250 240,275 Q360,240 480,278 Q540,258 600,280 L600,360 L0,360 Z" :fill="store.selectedScene.groundColor" />
            </svg>
            <svg v-else class="absolute inset-0 w-full h-full" viewBox="0 0 600 360" preserveAspectRatio="xMidYMid slice">
              <rect x="0" y="0" width="600" height="290" :fill="store.selectedScene.skyBottom" opacity="0.5" />
              <rect x="420" y="40" width="150" height="170" fill="#ffffff" stroke="#c8bfaa" stroke-width="3" />
              <line x1="495" y1="40" x2="495" y2="210" stroke="#c8bfaa" stroke-width="2.5" />
              <line x1="420" y1="125" x2="570" y2="125" stroke="#c8bfaa" stroke-width="2.5" />
              <rect x="0" y="290" width="600" height="70" :fill="store.selectedScene.groundColor2" />
              <path d="M0,290 L600,290 L580,296 L20,296 Z" :fill="store.selectedScene.groundColor" opacity="0.6" />
              <g stroke="#b88a5c" stroke-width="1" opacity="0.4">
                <line x1="0" y1="320" x2="600" y2="320" />
                <line x1="0" y1="345" x2="600" y2="345" />
              </g>
            </svg>
            <div class="relative z-10 animate-float w-full px-6">
              <PlanePreview :fold="store.selectedFold" :params="previewParams" :showPitch="true" :size="300" />
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div class="rounded-2xl bg-gradient-to-br from-sky-light/40 to-white/80 p-4">
              <p class="text-xs text-slate-500 mb-1">机翼角度</p>
              <p class="font-display text-2xl text-sky-dark">{{ localParams.wingAngle }}°</p>
            </div>
            <div class="rounded-2xl bg-gradient-to-br from-accent/20 to-white/80 p-4">
              <p class="text-xs text-slate-500 mb-1">尾翼角度</p>
              <p class="font-display text-2xl text-accent-dark">{{ localParams.tailAngle }}°</p>
            </div>
            <div class="rounded-2xl bg-gradient-to-br from-grass/20 to-white/80 p-4">
              <p class="text-xs text-slate-500 mb-1">投掷力度</p>
              <p class="font-display text-2xl text-grass">{{ localParams.throwPower }}%</p>
            </div>
            <div class="rounded-2xl bg-gradient-to-br from-purple-400/20 to-white/80 p-4">
              <p class="text-xs text-slate-500 mb-1">投掷角度</p>
              <p class="font-display text-2xl text-purple-600">{{ localParams.throwAngle }}°</p>
            </div>
          </div>
        </div>

        <div class="lg:col-span-2 space-y-6">
          <div class="card p-6 md:p-8 space-y-6 animate-fade-up" style="animation-delay:0.1s">
            <div class="flex items-center justify-between mb-2">
              <h2 class="font-display text-2xl text-slate-800 tracking-wide">参数设置</h2>
              <span
                v-if="store.competitionMode !== 'free'"
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                       bg-accent text-white text-xs font-medium shadow-soft"
              >
                <Trophy :size="12" />
                {{ competitionModeLabels[store.competitionMode] }}
                <span class="ml-0.5 opacity-90">· 第 {{ store.currentRound }}/{{ competitionRules.rounds }} 轮</span>
              </span>
            </div>

            <ParamSlider
              label="机翼角度"
              hint="影响升力，约15°最佳"
              :modelValue="localParams.wingAngle"
              @update:modelValue="v => updateParam('wingAngle', v)"
              :min="-30"
              :max="30"
              unit="°"
              colorFrom="#4A90D9"
              colorTo="#2C5F8F"
            />
            <ParamSlider
              label="尾翼角度"
              hint="影响飞行稳定性"
              :modelValue="localParams.tailAngle"
              @update:modelValue="v => updateParam('tailAngle', v)"
              :min="-20"
              :max="20"
              unit="°"
              colorFrom="#FFB347"
              colorTo="#E69320"
            />
            <ParamSlider
              label="投掷力度"
              hint="决定初始速度"
              :modelValue="localParams.throwPower"
              @update:modelValue="v => updateParam('throwPower', v)"
              :min="20"
              :max="100"
              unit="%"
              colorFrom="#6BB35F"
              colorTo="#4A8F3F"
            />
            <ParamSlider
              label="投掷角度"
              hint="抛射仰角"
              :modelValue="localParams.throwAngle"
              @update:modelValue="v => updateParam('throwAngle', v)"
              :min="0"
              :max="90"
              unit="°"
              colorFrom="#8B5CF6"
              colorTo="#6D28D9"
            />
          </div>

          <button
            class="w-full btn-accent text-lg py-4 animate-fade-up"
            style="animation-delay:0.18s"
            @click="goFly"
          >
            <Send :size="20" />
            投掷飞机，起飞！
          </button>

          <div class="card p-5 animate-fade-up" style="animation-delay:0.24s">
            <h4 class="font-semibold text-slate-700 mb-2">💡 小贴士</h4>
            <ul class="text-sm text-slate-500 space-y-1 leading-relaxed">
              <li>· 机翼角度在 10°~20° 区间能获得更好升力</li>
              <li>· 尾翼正角度会让飞机抬头，负角度则下压</li>
              <li>· 投掷角度 30°~45° 通常能兼顾距离和滞空</li>
              <li>· 稳定性差的折法适合做特技动作哦</li>
            </ul>
          </div>

          <div class="card p-5 animate-fade-up" style="animation-delay:0.3s">
            <h4 class="font-semibold text-slate-700 mb-3">🎯 评分预览</h4>
            <div class="mb-3 flex items-center justify-between">
              <span class="text-sm text-slate-500">预估总分</span>
              <div class="flex items-center gap-2">
                <span class="font-display text-3xl text-sky-dark">{{ scorePreview.totalScore }}</span>
                <span
                  class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                  :class="{
                    'bg-gradient-to-br from-yellow-300 to-yellow-500 text-white': scorePreview.grade === 'S',
                    'bg-gradient-to-br from-sky-400 to-sky-600 text-white': scorePreview.grade === 'A',
                    'bg-gradient-to-br from-grass to-grass-dark text-white': scorePreview.grade === 'B',
                    'bg-gradient-to-br from-orange-300 to-orange-500 text-white': scorePreview.grade === 'C',
                    'bg-gradient-to-br from-slate-300 to-slate-500 text-white': scorePreview.grade === 'D',
                  }"
                >{{ scorePreview.grade }}</span>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-2 text-center">
              <div class="rounded-xl bg-sky-light/30 p-3">
                <p class="text-xs text-slate-500 mb-0.5">距离</p>
                <p class="font-display text-lg text-sky-dark">{{ scorePreview.estDistance.toFixed(1) }}m</p>
                <p class="text-xs text-slate-400 mt-0.5">{{ scorePreview.distanceScore }} 分</p>
              </div>
              <div class="rounded-xl bg-accent/20 p-3">
                <p class="text-xs text-slate-500 mb-0.5">滞空</p>
                <p class="font-display text-lg text-accent-dark">{{ scorePreview.estAirTime.toFixed(1) }}s</p>
                <p class="text-xs text-slate-400 mt-0.5">{{ scorePreview.airTimeScore }} 分</p>
              </div>
              <div class="rounded-xl bg-purple-400/20 p-3">
                <p class="text-xs text-slate-500 mb-0.5">花式</p>
                <p class="font-display text-lg text-purple-600">{{ scorePreview.estAcrobatics }}</p>
                <p class="text-xs text-slate-400 mt-0.5">{{ scorePreview.acrobaticsScore }} 分</p>
              </div>
            </div>
            <p class="text-xs text-slate-400 mt-3 text-center">* 实际成绩以飞行结果为准</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
