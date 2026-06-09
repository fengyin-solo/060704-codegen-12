<script setup lang="ts">
import { computed } from 'vue'
import {
  BADGE_TIER_NAMES,
  BADGE_TIER_COLORS,
  BADGE_CATEGORY_NAMES,
  BADGE_CATEGORY_ICONS,
  type AchievementProgress
} from '@/types'
import { globalTimeline } from '@/engine/Timeline'

const props = defineProps<{
  progress: AchievementProgress
}>()

const emit = defineEmits<{
  click: [progress: AchievementProgress]
}>()

const tierName = computed(() => BADGE_TIER_NAMES[props.progress.badge.tier])
const tierColor = computed(() => BADGE_TIER_COLORS[props.progress.badge.tier])
const categoryName = computed(() => BADGE_CATEGORY_NAMES[props.progress.badge.category])
const categoryIcon = computed(() => BADGE_CATEGORY_ICONS[props.progress.badge.category])

const formattedDate = computed(() => {
  if (!props.progress.unlockedAt) return ''
  const time = props.progress.unlockedAt
  const days = Math.floor(time / (24 * 60 * 60 * 1000))
  return `第 ${days} 天解锁`
})

const progressText = computed(() => {
  if (props.progress.unlocked) {
    return `✓ 已达成`
  }
  return `${props.progress.current} / ${props.progress.required}`
})

function handleClick() {
  emit('click', props.progress)
}
</script>

<template>
  <div
    class="badge-card p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:scale-105"
    :class="[
      progress.unlocked
        ? 'border-opacity-100 bg-gray-800/70'
        : 'border-gray-700 bg-gray-800/30 opacity-60'
    ]"
    :style="{
      borderColor: progress.unlocked ? tierColor : undefined
    }"
    @click="handleClick"
  >
    <div class="flex items-start gap-3">
      <div
        class="w-14 h-14 rounded-lg flex items-center justify-center text-3xl flex-shrink-0"
        :class="[
          progress.unlocked
            ? 'bg-gray-700/50'
            : 'bg-gray-800/50 grayscale'
        ]"
        :style="{
          boxShadow: progress.unlocked ? `0 0 20px ${tierColor}40` : 'none'
        }"
      >
        {{ progress.badge.icon }}
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-xs font-vt323 px-2 py-0.5 rounded"
            :style="{
              backgroundColor: `${tierColor}20`,
              color: tierColor
            }"
          >
            {{ tierName }}
          </span>
          <span class="text-xs font-vt323 text-gray-500">
            {{ categoryIcon }} {{ categoryName }}
          </span>
        </div>

        <h4
          class="font-vt323 text-lg mb-1 truncate"
          :class="[
            progress.unlocked ? 'text-diary-fresh' : 'text-gray-500'
          ]"
        >
          {{ progress.badge.name }}
        </h4>

        <p class="text-xs font-vt323 text-gray-400 mb-3 line-clamp-2">
          {{ progress.badge.description }}
        </p>

        <div class="space-y-1">
          <div class="flex justify-between text-xs font-vt323">
            <span class="text-gray-500">
              {{ progress.badge.requirementUnit }}
            </span>
            <span
              :class="[
                progress.unlocked ? 'text-diary-fresh' : 'text-gray-400'
              ]"
            >
              {{ progressText }}
            </span>
          </div>

          <div class="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              class="h-full transition-all duration-500 rounded-full"
              :style="{
                width: `${progress.progress}%`,
                backgroundColor: progress.unlocked ? tierColor : '#6b7280'
              }"
            />
          </div>

          <div
            v-if="progress.unlocked && formattedDate"
            class="text-xs font-vt323 text-gray-500 mt-1"
          >
            {{ formattedDate }}
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="!progress.unlocked"
      class="absolute inset-0 flex items-center justify-center bg-gray-900/30 rounded-lg"
    >
      <span class="text-4xl opacity-30">🔒</span>
    </div>
  </div>
</template>

<style scoped>
.badge-card {
  position: relative;
  overflow: hidden;
}

.badge-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.05),
    transparent
  );
  transition: left 0.5s;
}

.badge-card:hover::before {
  left: 100%;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
