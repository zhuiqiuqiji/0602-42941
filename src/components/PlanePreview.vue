<script setup lang="ts">
import { computed } from 'vue';
import type { PaperPlaneFold, FlightParams } from '@/types';

interface Props {
  fold: PaperPlaneFold;
  params?: FlightParams;
  size?: number;
  showPitch?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: 220,
  showPitch: false,
});

const wingTransform = computed(() => `rotate(${props.params?.wingAngle ?? 0} 60 20)`);
const tailTransform = computed(() => `rotate(${-(props.params?.tailAngle ?? 0)} 88 20)`);
const bodyTransform = computed(() =>
  props.showPitch ? `rotate(${-(props.params?.throwAngle ?? 0)} 50 20)` : ''
);
</script>

<template>
  <div class="plane-preview-wrap relative flex items-center justify-center w-full">
    <svg
      :viewBox="'0 0 100 40'"
      :width="size"
      :height="size * 0.45"
      class="drop-shadow-xl transition-transform duration-300"
    >
      <defs>
        <linearGradient id="paperBody" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="60%" stop-color="#f2efe6" />
          <stop offset="100%" stop-color="#e3dccc" />
        </linearGradient>
        <linearGradient id="paperWing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fdfbf5" />
          <stop offset="100%" stop-color="#ebe4d2" />
        </linearGradient>
        <filter id="planeShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#2c5f8f" flood-opacity="0.18" />
        </filter>
      </defs>

      <g :transform="bodyTransform" filter="url(#planeShadow)">
        <path
          d="M0,20 L12,18 L80,17 L92,20 L80,23 L12,22 L0,20 Z"
          fill="url(#paperBody)"
          stroke="#c8bfaa"
          stroke-width="0.3"
          stroke-linejoin="round"
        />
        <g :transform="wingTransform">
          <path
            d="M28,20 L55,3 L75,20 Z"
            fill="url(#paperWing)"
            stroke="#c8bfaa"
            stroke-width="0.3"
            stroke-linejoin="round"
          />
          <path
            d="M28,20 L55,37 L75,20 Z"
            fill="url(#paperWing)"
            stroke="#c8bfaa"
            stroke-width="0.3"
            stroke-linejoin="round"
            opacity="0.92"
          />
        </g>
        <g :transform="tailTransform">
          <path
            d="M78,20 L90,9 L95,20 Z"
            fill="url(#paperWing)"
            stroke="#c8bfaa"
            stroke-width="0.3"
            stroke-linejoin="round"
          />
          <path
            d="M78,20 L90,31 L95,20 Z"
            fill="url(#paperWing)"
            stroke="#c8bfaa"
            stroke-width="0.3"
            stroke-linejoin="round"
            opacity="0.92"
          />
        </g>
        <path
          d="M12,18 L92,20 L12,22 Z"
          fill="none"
          stroke="#a89e84"
          stroke-width="0.25"
          stroke-dasharray="1,1"
        />
      </g>
    </svg>
  </div>
</template>
