<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-vue-next';
import { useGameStore } from '@/stores/gameStore';
import { FOLDS } from '@/config/gameConfig';
import StatBar from '@/components/StatBar.vue';
import PlanePreview from '@/components/PlanePreview.vue';

const router = useRouter();
const store = useGameStore();

const statLabels: Record<string, string> = {
  lift: '升力',
  speed: '速度',
  stability: '稳定性',
  distance: '距离潜力',
};

function selectFold(id: string) {
  store.setFold(id);
  router.push('/tune');
}

function back() {
  router.push('/');
}
</script>

<template>
  <div class="page-wrap">
    <div class="w-full max-w-6xl">
      <div class="flex items-center justify-between mb-8">
        <button class="btn-ghost" @click="back">
          <ArrowLeft :size="18" /> 返回场景
        </button>
        <div class="text-center">
          <div class="inline-flex items-center gap-2 text-sm px-4 py-1.5 rounded-full bg-white/70 text-sky-dark shadow-soft">
            <Sparkles :size="14" class="text-accent" />
            <span class="font-medium">第二步 · 选择折法</span>
          </div>
        </div>
        <div class="w-[140px]"></div>
      </div>

      <h1 class="font-display text-4xl md:text-5xl text-center text-sky-dark mb-2 tracking-wide animate-fade-up">
        选择你的专属折法
      </h1>
      <p class="text-center text-slate-500 mb-10 animate-fade-up">
        不同折法拥有不同的飞行特性，找到最适合你的那一款
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="(fold, idx) in FOLDS"
          :key="fold.id"
          class="card p-6 cursor-pointer transform transition-all duration-300
                 hover:-translate-y-2 hover:shadow-glow
                 border-2 border-transparent
                 animate-fade-up"
          :class="store.selectedFoldId === fold.id ? 'border-sky shadow-glow -translate-y-2' : ''"
          :style="{ animationDelay: `${idx * 0.08}s` }"
          @click="selectFold(fold.id)"
        >
          <div
            class="h-28 mb-4 flex items-center justify-center rounded-2xl bg-gradient-to-br from-sky-light/50 to-paper"
          >
            <PlanePreview :fold="fold" :size="160" />
          </div>

          <h3 class="font-display text-2xl text-slate-800 mb-1 text-center tracking-wide">
            {{ fold.name }}
          </h3>
          <p class="text-xs text-slate-500 text-center mb-5 leading-relaxed">
            {{ fold.description }}
          </p>

          <div class="space-y-3 mb-5">
            <StatBar
              v-for="(val, key) in fold.stats"
              :key="key"
              :label="statLabels[key as string]"
              :value="val"
            />
          </div>

          <button
            class="w-full py-2.5 rounded-capsule bg-sky text-white font-medium
                   transition-all duration-200 flex items-center justify-center gap-1.5
                   hover:bg-sky-dark active:scale-95"
            @click.stop="selectFold(fold.id)"
          >
            选择此折法
            <ArrowRight :size="16" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
