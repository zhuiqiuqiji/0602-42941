<script setup lang="ts">
interface Props {
  label: string;
  value: number;
  suffix?: string;
}
defineProps<Props>();
</script>

<template>
  <div class="w-full">
    <div class="flex items-center justify-between mb-1.5">
      <span class="text-sm font-medium text-slate-600">{{ label }}</span>
      <span class="text-sm font-bold text-sky-dark">
        {{ value }}{{ suffix || '' }}
      </span>
    </div>
    <div class="stat-bar-track">
      <div class="stat-bar-fill" :style="{ width: `${Math.min(100, Math.max(0, value))}%` }" />
    </div>
  </div>
</template>
