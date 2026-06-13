<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  label: string;
  icon?: string;
  modelValue: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  hint?: string;
  colorFrom?: string;
  colorTo?: string;
}

const props = withDefaults(defineProps<Props>(), {
  step: 1,
  colorFrom: '#4A90D9',
  colorTo: '#FFB347',
});

const emit = defineEmits<{
  (e: 'update:modelValue', v: number): void;
}>();

const pct = computed(() => {
  const rng = props.max - props.min;
  return ((props.modelValue - props.min) / rng) * 100;
});

const trackStyle = computed(() => ({
  background: `linear-gradient(to right, ${props.colorFrom} 0%, ${props.colorTo} ${pct.value}%, #e5e7eb ${pct.value}%, #e5e7eb 100%)`,
}));

function onInput(e: Event) {
  const target = e.target as HTMLInputElement;
  emit('update:modelValue', Number(target.value));
}
</script>

<template>
  <div class="w-full">
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold text-slate-700">{{ label }}</span>
        <span
          v-if="hint"
          class="text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5"
        >
          {{ hint }}
        </span>
      </div>
      <span
        class="inline-flex items-center justify-center min-w-[52px] px-3 py-1 rounded-full
               bg-gradient-to-r text-white font-bold text-sm shadow-sm"
        :style="{ backgroundImage: `linear-gradient(135deg, ${colorFrom}, ${colorTo})` }"
      >
        {{ modelValue }}{{ unit || '' }}
      </span>
    </div>
    <input
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      class="custom-slider"
      :style="trackStyle"
      @input="onInput"
    />
    <div class="flex justify-between mt-1 text-xs text-slate-400">
      <span>{{ min }}{{ unit || '' }}</span>
      <span>{{ max }}{{ unit || '' }}</span>
    </div>
  </div>
</template>
