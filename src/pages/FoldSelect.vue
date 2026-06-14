<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, ArrowRight, Sparkles, Trash2, Info, X, Star, Award, Clock, Target, Zap, Wind, Layers } from 'lucide-vue-next';
import { useGameStore } from '@/stores/gameStore';
import StatBar from '@/components/StatBar.vue';
import PlanePreview from '@/components/PlanePreview.vue';
import type { PaperPlaneFold } from '@/types';

const router = useRouter();
const store = useGameStore();

const activeCategory = ref<string>('all');
const detailFold = ref<PaperPlaneFold | null>(null);

const categoryLabels: Record<string, string> = {
  all: '全部',
  dart: '飞镖型',
  glider: '滑翔型',
  stunt: '特技型',
  distance: '距离型',
  acrobatic: '花式型',
  custom: '自定义',
};

const statLabels: Record<string, string> = {
  lift: '升力',
  speed: '速度',
  stability: '稳定性',
  distance: '距离潜力',
  acrobatics: '花式潜力',
};

const categoryColors: Record<string, string> = {
  dart: 'from-red-400 to-orange-500',
  glider: 'from-blue-400 to-sky-500',
  stunt: 'from-orange-400 to-amber-500',
  distance: 'from-green-400 to-emerald-500',
  acrobatic: 'from-purple-400 to-pink-500',
  custom: 'from-pink-400 to-rose-500',
};

const categoryBgColors: Record<string, string> = {
  dart: 'bg-red-100 text-red-600',
  glider: 'bg-blue-100 text-blue-600',
  stunt: 'bg-orange-100 text-orange-600',
  distance: 'bg-green-100 text-green-600',
  acrobatic: 'bg-purple-100 text-purple-600',
  custom: 'bg-pink-100 text-pink-600',
};

const filteredFolds = computed(() => {
  if (activeCategory.value === 'all') {
    return store.allFolds;
  }
  return store.allFolds.filter(fold => fold.category === activeCategory.value);
});

function getDifficultyStars(diff?: number) {
  return diff || 2;
}

function getDifficultyLabel(diff?: number) {
  const d = diff || 2;
  if (d <= 1) return '入门';
  if (d <= 2) return '简单';
  if (d <= 3) return '中等';
  if (d <= 4) return '困难';
  return '大师';
}

function selectFold(id: string) {
  store.setFold(id);
  router.push('/tune');
}

function showDetail(fold: PaperPlaneFold) {
  detailFold.value = fold;
}

function closeDetail() {
  detailFold.value = null;
}

function deleteFold(id: string) {
  store.deleteCustomFold(id);
}

function back() {
  router.push('/scene');
}

function getFoldTips(fold: PaperPlaneFold): string[] {
  const tips: string[] = [];
  if (fold.stats.speed >= 80) tips.push('高速机型，适合直线冲刺');
  if (fold.stats.lift >= 75) tips.push('高升力设计，滞空表现优秀');
  if (fold.stats.stability >= 80) tips.push('稳定性极佳，新手友好');
  if (fold.stats.acrobatics >= 70) tips.push('机动灵活，适合花式表演');
  if (fold.stats.distance >= 80) tips.push('低阻力翼型，飞行距离远');
  if (fold.category === 'glider') tips.push('建议搭配上升气流使用');
  if (fold.category === 'stunt') tips.push('需要熟练掌握方向控制');
  if (fold.category === 'dart') tips.push('投掷时角度稍大效果更好');
  if (tips.length === 0) tips.push('经典设计，综合性能均衡');
  return tips.slice(0, 4);
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

      <div class="text-center mb-8 animate-fade-up">
        <h1 class="font-display text-4xl md:text-5xl text-sky-dark mb-3 tracking-wide">
          选择你的专属折法
        </h1>
        <p class="text-slate-500 text-lg">
          不同折法拥有不同的飞行特性，找到最适合你的那一款
        </p>
      </div>

      <div class="flex flex-wrap justify-center gap-2 mb-8 animate-fade-up" style="animation-delay:0.05s">
        <button
          v-for="(label, key) in categoryLabels"
          :key="key"
          class="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
          :class="activeCategory === key
            ? 'bg-gradient-to-r from-sky to-sky-dark text-white shadow-md shadow-sky/20'
            : 'bg-white/70 text-slate-600 hover:bg-white hover:text-sky-dark'"
          @click="activeCategory = key"
        >
          {{ label }}
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div
          v-for="(fold, idx) in filteredFolds"
          :key="fold.id"
          class="card p-6 cursor-pointer transform transition-all duration-300 relative
                 hover:-translate-y-2 hover:shadow-glow
                 border-2 border-transparent
                 animate-fade-up"
          :class="store.selectedFoldId === fold.id ? 'border-sky shadow-glow -translate-y-2' : ''"
          :style="{ animationDelay: `${idx * 0.06}s` }"
          @click="selectFold(fold.id)"
        >
          <div class="flex items-center justify-between mb-3">
            <span
              class="text-xs font-medium px-3 py-1 rounded-full"
              :class="categoryBgColors[fold.category]"
            >
              {{ categoryLabels[fold.category] }}
            </span>
            <div class="flex items-center gap-1 text-amber-400">
              <Star v-for="i in getDifficultyStars(fold.difficulty)" :key="i" :size="12" class="fill-current" />
            </div>
          </div>

          <div
            class="h-32 mb-4 flex items-center justify-center rounded-2xl bg-gradient-to-br from-sky-light/50 to-paper relative overflow-hidden group"
          >
            <div
              class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
            >
              <div class="absolute inset-0 bg-sky-dark/10"></div>
              <button
                class="relative z-10 px-4 py-2 rounded-full bg-white/90 text-sky-dark text-sm font-medium shadow-lg flex items-center gap-1.5"
                @click.stop="showDetail(fold)"
              >
                <Info :size="14" />
                查看详情
              </button>
            </div>
            <PlanePreview :fold="fold" :size="160" />
          </div>

          <h3 class="font-display text-xl text-slate-800 mb-1 text-center tracking-wide">
            {{ fold.name }}
          </h3>
          <p class="text-xs text-slate-500 text-center mb-4 leading-relaxed line-clamp-2 h-8">
            {{ fold.description }}
          </p>

          <div class="space-y-2.5 mb-5">
            <StatBar
              v-for="(val, key) in fold.stats"
              :key="key"
              :label="statLabels[key as string]"
              :value="val"
              :height="6"
            />
          </div>

          <div class="flex gap-2">
            <button
              class="flex-1 py-2.5 rounded-capsule bg-sky text-white font-medium
                     transition-all duration-200 flex items-center justify-center gap-1.5
                     hover:bg-sky-dark active:scale-95"
              @click.stop="selectFold(fold.id)"
            >
              选择
              <ArrowRight :size="14" />
            </button>
            <button
              v-if="fold.category === 'custom'"
              class="w-10 h-10 rounded-capsule bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-all"
              @click.stop="deleteFold(fold.id)"
            >
              <Trash2 :size="16" />
            </button>
          </div>
        </div>
      </div>

      <div class="mt-10 text-center animate-fade-up" style="animation-delay:0.3s">
        <button
          class="btn-secondary px-8"
          @click="() => router.push('/design')"
        >
          <Layers :size="18" />
          设计我的专属折法
        </button>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="detailFold"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          @click.self="closeDetail"
        >
          <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="closeDetail"></div>
          <div class="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-modal-in">
            <div
              class="h-40 relative overflow-hidden"
              :class="`bg-gradient-to-br ${categoryColors[detailFold.category]}`"
            >
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-white/20 text-8xl">✈️</div>
              </div>
              <div class="absolute top-4 right-4">
                <button
                  class="w-9 h-9 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center transition-all"
                  @click="closeDetail"
                >
                  <X :size="18" />
                </button>
              </div>
              <div class="absolute bottom-4 left-6 right-6">
                <div class="flex items-center gap-3 mb-2">
                  <span
                    class="text-xs font-medium px-3 py-1 rounded-full bg-white/20 text-white"
                  >
                    {{ categoryLabels[detailFold.category] }}
                  </span>
                  <span class="text-white/80 text-sm flex items-center gap-1">
                    <Clock :size="12" />
                    {{ getDifficultyLabel(detailFold.difficulty) }}
                  </span>
                </div>
                <h2 class="font-display text-3xl text-white tracking-wide">
                  {{ detailFold.name }}
                </h2>
              </div>
            </div>

            <div class="p-6 max-h-[calc(90vh-160px)] overflow-y-auto">
              <p class="text-slate-600 leading-relaxed mb-6">
                {{ detailFold.description }}
              </p>

              <div class="grid grid-cols-2 gap-4 mb-6">
                <div class="bg-slate-50 rounded-2xl p-4">
                  <div class="flex items-center gap-2 text-sm text-slate-500 mb-1">
                    <Target :size="14" />
                    <span>最佳场景</span>
                  </div>
                  <p class="font-semibold text-slate-800">
                    {{ detailFold.bestScene || '全场景适用' }}
                  </p>
                </div>
                <div class="bg-slate-50 rounded-2xl p-4">
                  <div class="flex items-center gap-2 text-sm text-slate-500 mb-1">
                    <Layers :size="14" />
                    <span>折法步骤</span>
                  </div>
                  <p class="font-semibold text-slate-800">
                    {{ detailFold.foldingSteps || '~12' }} 步
                  </p>
                </div>
              </div>

              <h3 class="font-display text-lg text-slate-800 mb-4 flex items-center gap-2">
                <Award :size="18" class="text-accent" />
                性能参数
              </h3>
              <div class="space-y-3 mb-6">
                <StatBar
                  v-for="(val, key) in detailFold.stats"
                  :key="key"
                  :label="statLabels[key as string]"
                  :value="val"
                  :height="8"
                />
              </div>

              <h3 class="font-display text-lg text-slate-800 mb-4 flex items-center gap-2">
                <Zap :size="18" class="text-amber-500" />
                飞行小贴士
              </h3>
              <div class="space-y-2 mb-6">
                <div
                  v-for="(tip, i) in getFoldTips(detailFold)"
                  :key="i"
                  class="flex items-start gap-3 p-3 bg-amber-50 rounded-xl"
                >
                  <span class="text-amber-500 mt-0.5">💡</span>
                  <p class="text-sm text-amber-900/80">{{ tip }}</p>
                </div>
              </div>

              <h3 class="font-display text-lg text-slate-800 mb-4 flex items-center gap-2">
                <Wind :size="18" class="text-sky" />
                空气动力学特性
              </h3>
              <div class="grid grid-cols-2 gap-3 mb-6">
                <div class="bg-sky-50 rounded-xl p-3">
                  <p class="text-xs text-sky-600 mb-1">基础升力系数</p>
                  <p class="font-mono font-bold text-sky-dark">{{ detailFold.baseLiftCoeff.toFixed(2) }}</p>
                </div>
                <div class="bg-grass-50 rounded-xl p-3">
                  <p class="text-xs text-grass-600 mb-1">基础阻力系数</p>
                  <p class="font-mono font-bold text-grass-dark">{{ detailFold.baseDragCoeff.toFixed(3) }}</p>
                </div>
                <div class="bg-accent-50 rounded-xl p-3">
                  <p class="text-xs text-accent-600 mb-1">稳定系数</p>
                  <p class="font-mono font-bold text-accent-dark">{{ detailFold.baseStability.toFixed(2) }}</p>
                </div>
                <div class="bg-red-50 rounded-xl p-3">
                  <p class="text-xs text-red-500 mb-1">最大速度因子</p>
                  <p class="font-mono font-bold text-red-500">{{ detailFold.maxSpeedFactor.toFixed(2) }}</p>
                </div>
              </div>

              <div class="flex gap-3">
                <button
                  class="flex-1 py-3.5 rounded-capsule bg-gradient-to-r from-sky to-sky-dark text-white font-semibold
                         transition-all duration-200 flex items-center justify-center gap-2
                         hover:shadow-lg hover:shadow-sky/30 active:scale-95"
                  @click="selectFold(detailFold.id)"
                >
                  选择此折法
                  <ArrowRight :size="18" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .animate-modal-in,
.modal-leave-to .animate-modal-in {
  transform: scale(0.95) translateY(20px);
}

.animate-modal-in {
  animation: modalIn 0.3s ease-out;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
