<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, Globe, Home, Trophy, Clock, Target, Zap, Award } from 'lucide-vue-next';
import { useGameStore } from '@/stores/gameStore';
import type { CompetitionMode } from '@/types';

const router = useRouter();
const store = useGameStore();

const activeTab = ref<'all' | 'distance' | 'airtime' | 'acrobatic'>('all');

const tabConfig = [
  { key: 'all', label: '综合榜', icon: Award },
  { key: 'distance', label: '距离榜', icon: Target },
  { key: 'airtime', label: '滞空榜', icon: Clock },
  { key: 'acrobatic', label: '花式榜', icon: Zap },
];

const filteredLeaderboard = computed(() => {
  const all = store.globalLeaderboard;
  if (activeTab.value === 'all') return all;

  return [...all].sort((a, b) => {
    if (activeTab.value === 'distance') return b.distance - a.distance;
    if (activeTab.value === 'airtime') return b.airTime - a.airTime;
    if (activeTab.value === 'acrobatic') return (b.acrobaticsScore || 0) - (a.acrobaticsScore || 0);
    return b.totalScore - a.totalScore;
  }).slice(0, 20);
});

const myRanking = computed(() => {
  const idx = filteredLeaderboard.value.findIndex(s => !s.isGlobal);
  return idx >= 0 ? idx + 1 : null;
});

function back() {
  router.push('/home');
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('zh-CN');
}

function getPrimaryScore(score: any): number {
  if (activeTab.value === 'distance') return score.distance;
  if (activeTab.value === 'airtime') return score.airTime;
  if (activeTab.value === 'acrobatic') return score.acrobaticsScore || 0;
  return score.totalScore;
}

function getScoreUnit(): string {
  if (activeTab.value === 'distance') return 'm';
  if (activeTab.value === 'airtime') return 's';
  return '分';
}
</script>

<template>
  <div class="page-wrap">
    <div class="w-full max-w-4xl">
      <div class="flex items-center justify-between mb-8">
        <button class="btn-ghost" @click="back">
          <ArrowLeft :size="18" /> 返回首页
        </button>
        <div class="w-[140px]"></div>
      </div>

      <div class="text-center mb-8 animate-fade-up">
        <div class="inline-flex items-center gap-2 text-sm px-4 py-1.5 rounded-full bg-white/70 text-sky-dark mb-4 shadow-soft">
          <Trophy :size="14" class="text-accent" />
          <span class="font-medium">全球排行榜</span>
        </div>
        <h1 class="font-display text-5xl md:text-6xl text-sky-dark mb-3 tracking-wide">
          🏆 荣耀榜
        </h1>
        <p class="text-slate-500 text-lg">
          与全球玩家一较高下，冲击排行榜榜首
        </p>
      </div>

      <div class="flex justify-center gap-2 mb-8 animate-fade-up" style="animation-delay:0.1s">
        <button
          v-for="tab in tabConfig"
          :key="tab.key"
          class="px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5"
          :class="activeTab === tab.key
            ? 'bg-gradient-to-r from-sky to-sky-dark text-white shadow-lg shadow-sky/30'
            : 'bg-white/70 text-slate-600 hover:bg-white hover:text-sky-dark'"
          @click="activeTab = tab.key as any"
        >
          <component :is="tab.icon" :size="16" />
          {{ tab.label }}
        </button>
      </div>

      <div
        v-if="myRanking && myRanking > 10"
        class="card p-4 mb-6 animate-fade-up bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200/60"
        style="animation-delay:0.15s"
      >
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
            {{ myRanking }}
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="text-lg">🏠</span>
              <span class="font-semibold text-slate-800">{{ store.playerName }}</span>
              <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                我的排名
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">继续努力，冲击前10名！</p>
          </div>
          <div class="text-right">
            <p class="font-display text-2xl text-sky-dark leading-none">
              {{ getPrimaryScore(store.topScores[0] || { totalScore: 0 }) }}
            </p>
            <p class="text-xs text-slate-400">{{ getScoreUnit() }}</p>
          </div>
        </div>
      </div>

      <div class="card overflow-hidden animate-fade-up" style="animation-delay:0.2s">
        <div class="grid grid-cols-12 gap-4 px-6 py-4 bg-gradient-to-r from-sky-dark via-sky to-sky-dark text-white text-sm font-medium">
          <div class="col-span-1 text-center">#</div>
          <div class="col-span-5">玩家</div>
          <div class="col-span-2 text-right">距离</div>
          <div class="col-span-2 text-right">滞空</div>
          <div class="col-span-2 text-center">得分</div>
        </div>

        <div v-if="filteredLeaderboard.length === 0" class="p-12 text-center">
          <div class="text-5xl mb-4">✈️</div>
          <p class="text-slate-400">暂无排名数据</p>
          <p class="text-slate-400 text-sm mt-1">开始飞行，创造你的第一个记录吧！</p>
        </div>

        <div v-else class="divide-y divide-slate-100">
          <div
            v-for="(score, idx) in filteredLeaderboard"
            :key="score.id"
            class="grid grid-cols-12 gap-4 px-6 py-4 items-center transition-all duration-300 hover:bg-sky-light/20 group"
            :class="{
              'bg-gradient-to-r from-yellow-50/80 to-transparent': idx === 0,
              'bg-gradient-to-r from-slate-50/60 to-transparent': idx === 1,
              'bg-gradient-to-r from-orange-50/40 to-transparent': idx === 2,
            }"
          >
            <div class="col-span-1 text-center">
              <span v-if="idx === 0" class="inline-block animate-bounce">
                <span class="text-3xl">🥇</span>
              </span>
              <span v-else-if="idx === 1" class="text-3xl">🥈</span>
              <span v-else-if="idx === 2" class="text-3xl">🥉</span>
              <span v-else class="text-slate-400 font-medium text-lg">{{ idx + 1 }}</span>
            </div>
            <div class="col-span-5">
              <div class="flex items-center gap-2.5">
                <span class="text-xl">{{ score.country || '🏠' }}</span>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-slate-800 truncate">{{ score.playerName }}</p>
                  <p class="text-xs text-slate-400 truncate">
                    {{ score.foldName }}
                    <span v-if="score.isGlobal" class="ml-1.5 inline-flex items-center gap-0.5 text-sky">
                      <Globe :size="10" />
                    </span>
                    <span v-else class="ml-1.5 inline-flex items-center gap-0.5 text-grass">
                      <Home :size="10" />
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <div class="col-span-2 text-right font-mono text-slate-700">
              <span :class="{ 'font-bold text-sky-dark': activeTab === 'distance' }">
                {{ score.distance.toFixed(1) }}m
              </span>
            </div>
            <div class="col-span-2 text-right font-mono text-slate-700">
              <span :class="{ 'font-bold text-accent-dark': activeTab === 'airtime' }">
                {{ score.airTime.toFixed(1) }}s
              </span>
            </div>
            <div class="col-span-2 text-center">
              <span
                class="inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold shadow-sm"
                :class="`grade-badge grade-badge-${score.grade}`"
              >
                {{ score.grade }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="store.highScores.length > 0" class="mt-8 animate-fade-up" style="animation-delay:0.3s">
        <h2 class="font-display text-2xl text-slate-800 mb-4 tracking-wide flex items-center gap-2">
          <Clock :size="20" class="text-slate-400" />
          我的最近记录
        </h2>
        <div class="card overflow-hidden">
          <div
            v-for="(score, idx) in store.highScores.slice().reverse().slice(0, 5)"
            :key="score.id"
            class="grid grid-cols-12 gap-4 px-6 py-3.5 items-center border-b border-slate-100 last:border-0 transition-colors hover:bg-sky-light/10"
          >
            <div class="col-span-1 text-slate-400 font-medium">{{ idx + 1 }}</div>
            <div class="col-span-3 text-slate-700 font-medium truncate">{{ score.foldName }}</div>
            <div class="col-span-2 text-right font-mono text-slate-600">{{ score.distance.toFixed(1) }}m</div>
            <div class="col-span-2 text-right font-mono text-slate-600">{{ score.airTime.toFixed(1) }}s</div>
            <div class="col-span-2 text-center">
              <span
                class="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
                :class="`grade-badge grade-badge-${score.grade}`"
              >
                {{ score.grade }}
              </span>
            </div>
            <div class="col-span-2 text-right text-xs text-slate-400">
              {{ formatDate(score.timestamp) }}
            </div>
          </div>
        </div>
      </div>

      <div class="mt-10 text-center animate-fade-up" style="animation-delay:0.4s">
        <button class="btn-primary px-8" @click="() => router.push('/scene')">
          <Trophy :size="18" />
          去挑战更高分
        </button>
      </div>
    </div>
  </div>
</template>
