<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Trophy, RotateCcw, Home, ArrowRight, Trash2 } from 'lucide-vue-next';
import { useGameStore, calcScore } from '@/stores/gameStore';
import PlanePreview from '@/components/PlanePreview.vue';
import { FOLDS } from '@/config/gameConfig';

const router = useRouter();
const store = useGameStore();

const showAnimation = ref(false);
onMounted(() => {
  setTimeout(() => { showAnimation.value = true; }, 50);
});

const result = computed(() => store.lastResult);
const distanceScore = computed(() => result.value ? Math.min(500, Math.round(result.value.distance * 3.5)) : 0);
const airTimeScore = computed(() => result.value ? Math.min(500, Math.round(result.value.airTime * 28)) : 0);

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
  return calcScore(result.value.distance, result.value.airTime);
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
              <div class="flex items-center gap-2 mb-6">
                <div class="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center text-accent">
                  <Trophy :size="22" />
                </div>
                <div>
                  <p class="text-xs text-slate-400">飞行成绩报告</p>
                  <h1 class="font-display text-3xl text-slate-800 tracking-wide">
                    飞行完成！
                  </h1>
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
                    <span class="text-sm text-slate-500">综合得分 </span>
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
                      {{ result.totalScore }}
                    </span>
                    <span class="text-sm text-slate-400 ml-1">/ 1000</span>
                  </div>
                  <p class="text-sm text-slate-500">
                    {{ result.foldName }} · {{ store.selectedScene.name }}
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-4 mb-8">
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

              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button class="btn-primary w-full" @click="retry">
                  <RotateCcw :size="18" /> 再飞一次
                </button>
                <button class="btn-accent w-full" @click="newFold">
                  <ArrowRight :size="18" /> 换个折法
                </button>
                <button class="btn-ghost w-full" @click="backHome">
                  <Home :size="18" /> 返回首页
                </button>
              </div>
            </div>
          </div>

          <div class="lg:col-span-2 card p-6 md:p-8 animate-fade-up" style="animation-delay:0.15s">
            <div class="flex items-center justify-between mb-5">
              <h3 class="font-display text-2xl text-slate-800 tracking-wide flex items-center gap-2">
                <Trophy :size="20" class="text-accent" />
                历史 TOP 10
              </h3>
              <button
                v-if="store.topScores.length"
                class="text-xs text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
                @click="store.clearHighScores"
                title="清除记录"
              >
                <Trash2 :size="14" />
                清空
              </button>
            </div>

            <div v-if="store.topScores.length === 0" class="text-center py-10">
              <p class="text-slate-400">还没有历史记录，去创造你的第一个成绩吧！</p>
            </div>

            <div v-else class="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              <div
                v-for="(s, idx) in store.topScores"
                :key="s.id"
                class="flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 hover:bg-sky-light/20"
                :class="s.id === result.id ? 'bg-sky-light/40 ring-2 ring-sky/40' : 'bg-slate-50'"
              >
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
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
                  <div class="flex items-center gap-2 mb-0.5">
                    <span
                      class="inline-flex items-center justify-center min-w-[24px] h-5 rounded-md px-1.5 text-xs font-bold text-white grade-badge"
                      :class="`grade-badge-${s.grade}`"
                    >
                      {{ s.grade }}
                    </span>
                    <span class="font-semibold text-sm text-slate-700 truncate">{{ s.foldName }}</span>
                  </div>
                  <p class="text-[11px] text-slate-400">
                    {{ s.distance }}米 · {{ s.airTime }}秒 · {{ formatTime(s.timestamp) }}
                  </p>
                </div>
                <div class="text-right flex-shrink-0">
                  <p class="font-display text-lg text-sky-dark leading-none">{{ s.totalScore }}</p>
                  <p class="text-[10px] text-slate-400">分</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
