<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Plane, Trophy, Pencil, Medal, Edit2, Check, X } from 'lucide-vue-next';
import { useGameStore } from '@/stores/gameStore';

const router = useRouter();
const store = useGameStore();

const isEditingName = ref(false);
const tempName = ref('');

function startEditName() {
  tempName.value = store.playerName;
  isEditingName.value = true;
}

function saveName() {
  if (tempName.value.trim()) {
    store.setPlayerName(tempName.value.trim());
  }
  isEditingName.value = false;
}

function cancelEdit() {
  isEditingName.value = false;
}

const menuItems = [
  {
    key: 'free',
    title: '自由飞行',
    description: '选择场景和折法，享受无拘无束的飞行乐趣',
    icon: Plane,
    gradient: 'from-sky to-sky-dark',
    path: '/scene',
  },
  {
    key: 'compete',
    title: '比赛模式',
    description: '参与多种竞技模式，挑战更高分数',
    icon: Trophy,
    gradient: 'from-accent to-accent-dark',
    path: '/compete',
  },
  {
    key: 'design',
    title: '设计编辑器',
    description: '自定义纸飞机折法，打造专属战机',
    icon: Pencil,
    gradient: 'from-grass to-grass-light',
    path: '/design',
  },
  {
    key: 'leaderboard',
    title: '排行榜',
    description: '查看全球玩家成绩，冲击 TOP 榜单',
    icon: Medal,
    gradient: 'from-purple-400 to-purple-600',
    path: '/leaderboard',
  },
];

const topScore = computed(() => store.topScores[0] || null);
const lastScore = computed(() => store.lastResult);

function navigate(path: string) {
  router.push(path);
}
</script>

<template>
  <div class="page-wrap">
    <div class="w-full max-w-5xl">
      <div class="flex items-center justify-between mb-8 animate-fade-up">
        <div class="flex items-center gap-3">
          <div class="relative w-12 h-12 rounded-full bg-gradient-to-br from-sky to-sky-dark flex items-center justify-center text-white shadow-card">
            <Plane :size="26" class="transform -rotate-12" />
          </div>
          <div>
            <p class="text-xs text-slate-500">飞行员</p>
            <div v-if="!isEditingName" class="flex items-center gap-2 group cursor-pointer" @click="startEditName">
              <span class="font-display text-2xl text-sky-dark tracking-wide">{{ store.playerName }}</span>
              <Edit2 :size="14" class="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div v-else class="flex items-center gap-2">
              <input
                v-model="tempName"
                type="text"
                maxlength="12"
                class="font-display text-xl text-sky-dark bg-white/80 border-2 border-sky/40 rounded-lg px-3 py-1 outline-none focus:border-sky w-36"
                @keyup.enter="saveName"
                @keyup.esc="cancelEdit"
                autofocus
              />
              <button class="w-8 h-8 rounded-full bg-grass text-white flex items-center justify-center hover:bg-grass-light transition-colors" @click="saveName">
                <Check :size="16" />
              </button>
              <button class="w-8 h-8 rounded-full bg-slate-300 text-white flex items-center justify-center hover:bg-slate-400 transition-colors" @click="cancelEdit">
                <X :size="16" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="text-center mb-10 animate-fade-up" style="animation-delay:0.05s">
        <div class="inline-flex items-center gap-2 text-sm px-4 py-1.5 rounded-full bg-white/70 text-sky-dark mb-4 shadow-soft">
          <span class="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
          <span class="font-medium">准备好了吗？</span>
        </div>
        <h1 class="font-display text-5xl md:text-6xl text-sky-dark mb-3 tracking-wide">
          纸飞机飞行游戏
        </h1>
        <p class="text-slate-500 text-lg">
          折一架纸飞机，让它载着梦想飞向远方 ✈️
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div
          v-for="(item, idx) in menuItems"
          :key="item.key"
          class="card group cursor-pointer transform transition-all duration-300
                 hover:-translate-y-2 hover:shadow-glow animate-fade-up overflow-hidden"
          :style="{ animationDelay: `${0.1 + idx * 0.08}s` }"
          @click="navigate(item.path)"
        >
          <div class="relative h-40 overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br" :class="item.gradient">
              <div class="absolute inset-0 opacity-20">
                <svg viewBox="0 0 400 160" class="w-full h-full">
                  <g opacity="0.4">
                    <ellipse cx="60" cy="40" rx="38" ry="14" fill="#ffffff" />
                    <ellipse cx="85" cy="35" rx="28" ry="11" fill="#ffffff" />
                  </g>
                  <g opacity="0.3">
                    <ellipse cx="320" cy="30" rx="32" ry="10" fill="#ffffff" />
                    <ellipse cx="345" cy="26" rx="24" ry="9" fill="#ffffff" />
                  </g>
                  <g transform="translate(200, 80)">
                    <path d="M0,0 L28,-4 L36,0 L28,4 L0,0 Z" fill="#ffffff" opacity="0.9" />
                    <path d="M28,-4 L36,-10 L36,0 Z" fill="#ffffff" opacity="0.7" />
                    <path d="M28,4 L36,10 L36,0 Z" fill="#ffffff" opacity="0.7" />
                  </g>
                </svg>
              </div>
            </div>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-20 h-20 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                <component :is="item.icon" :size="36" />
              </div>
            </div>
          </div>
          <div class="p-6">
            <h3 class="font-display text-2xl text-slate-800 tracking-wide mb-2">
              {{ item.title }}
            </h3>
            <p class="text-sm text-slate-500 leading-relaxed">
              {{ item.description }}
            </p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div class="card p-6 animate-fade-up" style="animation-delay:0.45s">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-full bg-sky/15 flex items-center justify-center text-sky-dark">
              <Trophy :size="20" />
            </div>
            <div>
              <p class="text-xs text-slate-400">最新成绩</p>
              <h3 class="font-display text-xl text-slate-800 tracking-wide">最近一次飞行</h3>
            </div>
          </div>
          <div v-if="lastScore" class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-slate-500">综合得分</span>
              <span class="font-display text-3xl text-sky-dark">{{ lastScore.totalScore }}</span>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-xl bg-sky-light/30 p-3 text-center">
                <p class="text-xs text-slate-500 mb-1">飞行距离</p>
                <p class="font-display text-xl text-sky-dark">{{ lastScore.distance }}<span class="text-xs text-slate-500 ml-1">米</span></p>
              </div>
              <div class="rounded-xl bg-accent/25 p-3 text-center">
                <p class="text-xs text-slate-500 mb-1">滞空时间</p>
                <p class="font-display text-xl text-accent-dark">{{ lastScore.airTime }}<span class="text-xs text-slate-500 ml-1">秒</span></p>
              </div>
            </div>
            <p class="text-xs text-slate-400 text-center">{{ lastScore.foldName }} · {{ lastScore.grade }} 评级</p>
          </div>
          <div v-else class="text-center py-6">
            <p class="text-slate-400">还没有飞行记录，去自由飞行吧！</p>
          </div>
        </div>

        <div class="card p-6 animate-fade-up" style="animation-delay:0.55s">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 flex items-center justify-center text-white shadow-md">
              <Medal :size="20" />
            </div>
            <div>
              <p class="text-xs text-slate-400">个人最佳</p>
              <h3 class="font-display text-xl text-slate-800 tracking-wide">TOP 1 纪录</h3>
            </div>
          </div>
          <div v-if="topScore" class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-slate-500">最高分</span>
              <span class="font-display text-3xl text-accent-dark">{{ topScore.totalScore }}</span>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-xl bg-grass/25 p-3 text-center">
                <p class="text-xs text-slate-500 mb-1">飞行距离</p>
                <p class="font-display text-xl text-sky-dark">{{ topScore.distance }}<span class="text-xs text-slate-500 ml-1">米</span></p>
              </div>
              <div class="rounded-xl bg-accent/25 p-3 text-center">
                <p class="text-xs text-slate-500 mb-1">滞空时间</p>
                <p class="font-display text-xl text-accent-dark">{{ topScore.airTime }}<span class="text-xs text-slate-500 ml-1">秒</span></p>
              </div>
            </div>
            <p class="text-xs text-slate-400 text-center">{{ topScore.foldName }} · {{ topScore.grade }} 评级</p>
          </div>
          <div v-else class="text-center py-6">
            <p class="text-slate-400">暂无纪录，快去创造你的传奇！</p>
          </div>
        </div>
      </div>

      <div class="text-center animate-fade-up" style="animation-delay:0.65s">
        <p class="text-xs text-slate-400">纸飞机飞行游戏 v1.0.0 · Made with ❤️</p>
      </div>
    </div>
  </div>
</template>
