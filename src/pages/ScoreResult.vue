<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Trophy, RotateCcw, Home, ArrowRight, Trash2, Play } from 'lucide-vue-next';
import { useGameStore, calcScore } from '@/stores/gameStore';
import PlanePreview from '@/components/PlanePreview.vue';
import { FOLDS, COMPETITION_MODES, WEATHERS } from '@/config/gameConfig';

const router = useRouter();
const store = useGameStore();

const showAnimation = ref(false);
onMounted(() => {
  setTimeout(() => { showAnimation.value = true; }, 50);
});

const result = computed(() => store.lastResult);

const scoreData = computed(() => {
  if (!result.value) return { distanceScore: 0, airTimeScore: 0, acrobaticsScore: 0, totalScore: 0, grade: 'D' as const };
  return calcScore(
    result.value.distance,
    result.value.airTime,
    result.value.acrobaticsScore || 0,
    store.competitionMode
  );
});

const distanceScore = computed(() => scoreData.value.distanceScore);
const airTimeScore = computed(() => scoreData.value.airTimeScore);
const acrobaticsScore = computed(() => result.value?.acrobaticsScore || store.flightState.acrobatics?.score || 0);

const competitionModeName: Record<string, string> = {
  free: '自由模式',
  distance: '距离赛',
  airtime: '滞空赛',
  acrobatic: '花式赛',
};

const competitionRules = computed(() =>
  COMPETITION_MODES.find(m => m.mode === store.competitionMode) || COMPETITION_MODES[0]
);

const totalRounds = computed(() => competitionRules.value.rounds);

const isCompetitionFinished = computed(() =>
  store.competitionMode !== 'free' && store.currentRound >= totalRounds.value
);

const competitionSummary = computed(() => {
  const results = store.competitionRoundResults;
  if (results.length === 0) return null;
  const totalScore = results.reduce((sum, r) => sum + r.totalScore, 0);
  const avgScore = Math.round(totalScore / results.length);
  const best = [...results].sort((a, b) => b.totalScore - a.totalScore)[0];
  const worst = [...results].sort((a, b) => a.totalScore - b.totalScore)[0];
  return { totalScore, avgScore, best, worst, count: results.length };
});

const acrobaticsStats = computed(() => {
  if (result.value && store.flightState.acrobatics) {
    return store.flightState.acrobatics;
  }
  return { loops: 0, rolls: 0, dives: 0, climbs: 0, maxPitchRate: 0, score: 0 };
});

const weather = computed(() => {
  if (result.value?.weatherId) {
    return WEATHERS.find(w => w.id === result.value!.weatherId) || store.selectedWeather;
  }
  return store.selectedWeather;
});

const fold = computed(() => FOLDS.find(f => f.id === store.selectedFoldId) || FOLDS[0]);

function retry() {
  router.push('/tune');
}
function backHome() {
  router.push('/');
}
function newFold() {
  router.push('/fold');
}
function nextCompetitionRound() {
  store.nextRound();
  router.push('/scene');
}

const gradeMap: Record<string, { label: string; color: string }> = {
  S: { label: '完美！传奇飞行！', color: 'from-yellow-300 via-amber-400 to-orange-500' },
  A: { label: '太棒了！高手表现！', color: 'from-emerald-300 to-emerald-600' },
  B: { label: '不错！继续努力！', color: 'from-sky-300 to-sky-600' },
  C: { label: '还可以，调整下参数试试？', color: 'from-purple-300 to-purple-500' },
  D: { label: '加油！多练习就能进步！', color: 'from-slate-400 to-slate-600' },
};

function formatTime(ts: number) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const previewScore = computed(() => {
  if (!result.value) return calcScore(0, 0);
  return calcScore(result.value.distance, result.value.airTime, acrobaticsScore.value, store.competitionMode);
});
</script>

<template>
  <div class="page-wrap">
    <div class="w-full max-w-5xl">
      <div v-if="!result" class="text-center card p-12">
        <p class="text-xl text-slate-500 mb-6">暂无成绩记录，请先完成一次飞行。</p>
        <button class="btn-primary" @click="backHome">
          <Home :size="18" /> 返回首页
        </button>
      </div>

      <template v-else>
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div class="lg:col-span-3 card p-8 md:p-10 animate-pop-in relative overflow-hidden">
            <div
              class="absolute inset-0 opacity-8 pointer-events-none"
              :class="`bg-gradient-to-br ${gradeMap[result.grade].color}`"
            />

            <div class="relative">
              <div class="flex items-center gap-2 mb-4">
                <div class="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center text-accent">
                  <Trophy :size="22" />
                </div>
                <div class="flex-1">
                  <p class="text-xs text-slate-400">飞行成绩报告</p>
                  <h1 class="font-display text-3xl text-slate-800 tracking-wide flex items-center gap-3 flex-wrap">
                    飞行完成！
                    <span
                      v-if="store.competitionMode !== 'free'"
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent text-white"
                    >
                      {{ competitionModeName[store.competitionMode] }}
                    </span>
                    <span
                      v-if="store.competitionMode !== 'free'"
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600"
                    >
                      当前轮次 {{ store.currentRound }}/{{ totalRounds }}
                    </span>
                  </h1>
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-3 mb-6 text-sm">
                <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-light/40 text-sky-dark">
                  <span class="text-lg">{{ weather.icon }}</span>
                  <span class="font-medium">{{ weather.name }}</span>
                </div>
              </div>

              <div class="flex flex-col md:flex-row items-center gap-8 mb-8">
                <div
                  class="relative flex-shrink-0 w-40 h-40 rounded-full flex items-center justify-center grade-badge"
                  :class="`grade-badge-${result.grade}`"
                >
                  <span class="font-display text-7xl leading-none drop-shadow-lg">
                    {{ result.grade }}
                  </span>
                  <div
                    v-if="showAnimation"
                    class="absolute inset-0 rounded-full animate-ping opacity-20 bg-white"
                  />
                </div>
                <div class="flex-1 text-center md:text-left">
                  <p class="text-lg font-semibold text-slate-700 mb-2">
                    {{ gradeMap[result.grade].label }}
                  </p>
                  <div class="mb-3">
                    <span class="text-sm text-slate-500">
                      {{ store.competitionMode === 'acrobatic' ? '花式总分' : '综合得分' }}
                    </span>
                    <span
                      class="font-display text-5xl tracking-tight"
                      :class="{
                        'text-yellow-500': result.grade === 'S',
                        'text-emerald-600': result.grade === 'A',
                        'text-sky-600': result.grade === 'B',
                        'text-purple-600': result.grade === 'C',
                        'text-slate-600': result.grade === 'D',
                      }"
                    >
                      {{ store.competitionMode === 'acrobatic' ? scoreData.totalScore : result.totalScore }}
                    </span>
                    <span class="text-sm text-slate-400 ml-1">
                      / {{ store.competitionMode === 'distance' || store.competitionMode === 'airtime' ? '500' : '1000' }}
                    </span>
                  </div>
                  <p class="text-sm text-slate-500">
                    {{ result.foldName }} · {{ store.selectedScene.name }}
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div class="rounded-2xl bg-gradient-to-br from-sky-light/40 to-white/90 p-5 text-center">
                  <p class="text-xs text-slate-500 mb-1">飞行距离</p>
                  <p class="font-display text-3xl text-sky-dark leading-none mb-1">
                    {{ result.distance }}<span class="text-sm font-sans text-slate-500 ml-1">米</span>
                  </p>
                  <div class="text-xs text-slate-400 mt-1">得分 {{ distanceScore }} / 500</div>
                  <div class="stat-bar-track mt-2">
                    <div class="stat-bar-fill" :style="{ width: `${distanceScore / 5}%` }" />
                  </div>
                </div>
                <div class="rounded-2xl bg-gradient-to-br from-accent/25 to-white/90 p-5 text-center">
                  <p class="text-xs text-slate-500 mb-1">滞空时间</p>
                  <p class="font-display text-3xl text-accent-dark leading-none mb-1">
                    {{ result.airTime }}<span class="text-sm font-sans text-slate-500 ml-1">秒</span>
                  </p>
                  <div class="text-xs text-slate-400 mt-1">得分 {{ airTimeScore }} / 500</div>
                  <div class="stat-bar-track mt-2">
                    <div class="stat-bar-fill" :style="{ width: `${airTimeScore / 5}%` }" />
                  </div>
                </div>
                <div class="rounded-2xl bg-gradient-to-br from-fuchsia-100 to-white/90 p-5 text-center">
                  <p class="text-xs text-slate-500 mb-1">花式得分</p>
                  <p class="font-display text-3xl text-fuchsia-600 leading-none mb-1">
                    {{ acrobaticsScore }}
                  </p>
                  <div class="text-xs text-slate-400 mt-1 flex justify-center gap-2 flex-wrap">
                    <span>🔄 {{ acrobaticsStats.loops }}</span>
                    <span>🌀 {{ acrobaticsStats.rolls }}</span>
                    <span>⬇️ {{ acrobaticsStats.dives }}</span>
                    <span>⬆️ {{ acrobaticsStats.climbs }}</span>
                  </div>
                  <div class="stat-bar-track mt-2">
                    <div class="stat-bar-fill bg-gradient-to-r from-fuchsia-400 to-fuchsia-600" :style="{ width: `${Math.min(100, acrobaticsScore / 5)}%` }" />
                  </div>
                </div>
                <div class="rounded-2xl bg-gradient-to-br from-grass/25 to-white/90 p-5 text-center">
                  <p class="text-xs text-slate-500 mb-1">预览当前参数</p>
                  <div class="my-1">
                    <PlanePreview :fold="fold" :params="store.flightParams" :size="110" />
                  </div>
                  <div class="text-xs text-slate-400">
                    机翼 {{ store.flightParams.wingAngle }}° · 力度 {{ store.flightParams.throwPower }}%
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <button class="btn-primary w-full" @click="retry">
                  <RotateCcw :size="18" /> 再飞一次
                </button>
                <button class="btn-accent w-full" @click="newFold">
                  <ArrowRight :size="18" /> 换个折法
                </button>
                <button
                  v-if="store.competitionMode !== 'free' && store.currentRound < totalRounds"
                  class="btn-primary w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                  @click="nextCompetitionRound"
                >
                  <Play :size="18" /> 继续比赛下一轮
                </button>
                <button
                  :class="[
                    'btn-ghost w-full',
                    store.competitionMode !== 'free' && store.currentRound < totalRounds ? '' : 'md:col-span-2'
                  ]"
                  @click="backHome"
                >
                  <Home :size="18" /> 返回首页
                </button>
              </div>
            </div>
          </div>

          <div class="lg:col-span-2 space-y-6">
            <div class="card p-6 animate-fade-up" style="animation-delay:0.15s">
              <div class="flex items-center justify-between mb-5">
                <h3 class="font-display text-xl text-slate-800 tracking-wide flex items-center gap-2">
                  <Trophy :size="18" class="text-accent" />
                  历史 TOP 10
                </h3>
              </div>

              <div v-if="store.topScores.length === 0" class="text-center py-8">
                <p class="text-slate-400 text-sm">还没有历史记录</p>
              </div>

              <div v-else class="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                <div
                  v-for="(s, idx) in store.topScores.slice(0, 8)"
                  :key="s.id"
                  class="flex items-center gap-2.5 p-2.5 rounded-xl transition-all duration-200 hover:bg-sky-light/20"
                  :class="s.id === result.id ? 'bg-sky-light/40 ring-1 ring-sky/40' : 'bg-slate-50'"
                >
                  <div
                    class="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0"
                    :class="{
                      'bg-gradient-to-br from-yellow-300 to-amber-500 text-white shadow': idx === 0,
                      'bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-sm': idx === 1,
                      'bg-gradient-to-br from-orange-300 to-orange-500 text-white shadow-sm': idx === 2,
                      'bg-slate-200 text-slate-600': idx >= 3,
                    }"
                  >
                    {{ idx + 1 }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-sm text-slate-700 truncate">{{ s.foldName }}</p>
                    <p class="text-[10px] text-slate-400">
                      {{ s.distance }}m · {{ s.airTime }}s
                    </p>
                  </div>
                  <div class="text-right flex-shrink-0">
                    <p class="font-display text-base text-sky-dark leading-none">{{ s.totalScore }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="store.competitionMode !== 'free'"
              class="card p-6 animate-fade-up"
              style="animation-delay:0.25s"
            >
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-display text-xl text-slate-800 tracking-wide flex items-center gap-2">
                  <Play :size="18" class="text-grass" />
                  本场比赛
                </h3>
                <span v-if="isCompetitionFinished" class="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                  🏆 结束
                </span>
              </div>

              <div v-if="competitionSummary" class="grid grid-cols-2 gap-3 mb-4">
                <div class="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-3 text-center">
                  <p class="text-[10px] text-slate-500 mb-0.5">总积分</p>
                  <p class="font-display text-2xl text-amber-600 leading-none">{{ competitionSummary.totalScore }}</p>
                </div>
                <div class="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 p-3 text-center">
                  <p class="text-[10px] text-slate-500 mb-0.5">最佳</p>
                  <p class="font-display text-2xl text-emerald-600 leading-none">{{ competitionSummary.best.totalScore }}</p>
                </div>
              </div>

              <div class="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                <div
                  v-for="(roundResult, idx) in store.competitionRoundResults"
                  :key="roundResult.id"
                  class="flex items-center gap-3 p-2.5 rounded-lg transition-all"
                  :class="{
                    'bg-gradient-to-r from-amber-50 to-transparent border border-amber-200/50': competitionSummary?.best.id === roundResult.id,
                    'bg-slate-50': competitionSummary?.best.id !== roundResult.id,
                  }"
                >
                  <div
                    class="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs"
                    :class="competitionSummary?.best.id === roundResult.id
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow'
                      : 'bg-slate-200 text-slate-600'"
                  >
                    {{ idx + 1 }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-medium text-slate-700 truncate">{{ roundResult.foldName }}</p>
                    <p class="text-[10px] text-slate-400">{{ roundResult.distance }}m · {{ roundResult.airTime }}s</p>
                  </div>
                  <div class="text-right">
                    <p class="font-display text-base text-sky-dark leading-none">{{ roundResult.totalScore }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
