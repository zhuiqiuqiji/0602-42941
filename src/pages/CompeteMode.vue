<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ArrowLeft, Target, Clock, Zap, Award } from 'lucide-vue-next';
import { useGameStore } from '@/stores/gameStore';
import { COMPETITION_MODES } from '@/config/gameConfig';
import type { CompetitionMode } from '@/types';

const router = useRouter();
const store = useGameStore();

const modeInfo: Record<CompetitionMode, { icon: any; desc: string; tip: string }> = {
  distance: { icon: Target, desc: '以飞行距离作为唯一评分标准，飞得越远分数越高', tip: '推荐使用飞镖类折法' },
  airtime: { icon: Clock, desc: '以滞空时间作为唯一评分标准，飘得越久分数越高', tip: '推荐使用滑翔机类折法' },
  acrobatic: { icon: Zap, desc: '30秒限时，以特技动作为主的花式评分', tip: '推荐使用特技类折法' },
  free: { icon: Award, desc: '距离与滞空时间各占50%，综合实力的比拼', tip: '综合性能折法最佳' },
};

function selectMode(mode: CompetitionMode) {
  store.setCompetitionMode(mode);
  router.push('/scene');
}

function back() {
  router.push('/home');
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

      <div class="text-center mb-10 animate-fade-up">
        <h1 class="font-display text-5xl md:text-6xl text-sky-dark mb-3 tracking-wide">
          选择比赛模式
        </h1>
        <p class="text-slate-500 text-lg">
          每种模式考验不同的飞行技巧，选择你擅长的挑战吧
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          v-for="(mode, idx) in COMPETITION_MODES"
          :key="mode.mode"
          class="card p-8 cursor-pointer transform transition-all duration-300
                 hover:-translate-y-2 hover:shadow-glow animate-fade-up
                 border-2 border-transparent"
          :class="store.competitionMode === mode.mode ? 'border-sky shadow-glow -translate-y-2' : ''"
          :style="{ animationDelay: `${idx * 0.1}s` }"
          @click="selectMode(mode.mode)"
        >
          <div class="flex items-start gap-5">
            <div class="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center text-white shadow-md">
              <component :is="modeInfo[mode.mode].icon" :size="28" />
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <h3 class="font-display text-2xl text-slate-800 tracking-wide">
                  {{ mode.mode === 'distance' ? '距离赛' : mode.mode === 'airtime' ? '滞空赛' : mode.mode === 'acrobatic' ? '特技赛' : '自由模式' }}
                </h3>
                <span class="text-xs px-3 py-1 rounded-full bg-sky-light/50 text-sky-dark font-medium">
                  {{ mode.rounds }} 轮
                </span>
                <span v-if="mode.timeLimitSec > 0" class="text-xs px-3 py-1 rounded-full bg-accent/30 text-accent-dark font-medium">
                  限时 {{ mode.timeLimitSec }}s
                </span>
              </div>
              <p class="text-slate-500 mb-3">
                {{ modeInfo[mode.mode].desc }}
              </p>
              <p class="text-sm text-sky-dark font-medium">
                💡 {{ modeInfo[mode.mode].tip }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
