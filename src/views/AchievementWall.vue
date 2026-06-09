<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useDiaryStore } from '@/stores/diary'
import { useAchievements } from '@/composables/useAchievements'
import BadgeCard from '@/components/achievement/BadgeCard.vue'
import {
  BadgeCategory,
  BADGE_CATEGORY_NAMES,
  BADGE_CATEGORY_ICONS,
  BADGE_TIER_NAMES,
  BADGE_TIER_COLORS,
  type AchievementProgress,
  type BadgeTier
} from '@/types'

const route = useRoute()
const userStore = useUserStore()
const diaryStore = useDiaryStore()
const achievements = useAchievements()

const activeCategory = ref<BadgeCategory | 'all'>('all')
const filterStatus = ref<'all' | 'unlocked' | 'locked'>('all')
const selectedBadge = ref<AchievementProgress | null>(null)

const targetUserId = computed(() => {
  const userId = route.params.userId as string
  return userId || userStore.currentUserId
})

const targetUser = computed(() => {
  if (!targetUserId.value) return null
  return userStore.getUserById(targetUserId.value)
})

const isOwner = computed(() => {
  return targetUserId.value === userStore.currentUserId
})

const userProgress = computed(() => {
  if (!targetUserId.value) return []
  return achievements.getProgress(
    targetUserId.value,
    diaryStore.diaries,
    diaryStore.archivedDiaries
  )
})

const userAchievement = computed(() => {
  if (!targetUserId.value) return null
  return achievements.getUserAchievements(targetUserId.value)
})

const totalBadges = computed(() => achievements.totalBadges.value)

const unlockedCount = computed(() => {
  if (!targetUserId.value) return 0
  return achievements.unlockedCount(targetUserId.value)
})

const completionRate = computed(() => {
  if (!targetUserId.value) return 0
  return achievements.completionRate(targetUserId.value)
})

const filteredProgress = computed(() => {
  let result = userProgress.value

  if (activeCategory.value !== 'all') {
    result = result.filter(p => p.badge.category === activeCategory.value)
  }

  if (filterStatus.value === 'unlocked') {
    result = result.filter(p => p.unlocked)
  } else if (filterStatus.value === 'locked') {
    result = result.filter(p => !p.unlocked)
  }

  return result
})

const categoryStats = computed(() => {
  if (!targetUserId.value) return []

  const categories = Object.values(BadgeCategory)
  return categories.map(category => {
    const progress = achievements.getCategoryProgress(
      targetUserId.value!,
      category,
      diaryStore.diaries,
      diaryStore.archivedDiaries
    )
    return {
      category,
      name: BADGE_CATEGORY_NAMES[category],
      icon: BADGE_CATEGORY_ICONS[category],
      ...progress
    }
  })
})

const stats = computed(() => {
  if (!targetUserId.value) return null
  return achievements.calculateStats(
    targetUserId.value,
    diaryStore.diaries,
    diaryStore.archivedDiaries
  )
})

const categories = computed(() => {
  return [
    { id: 'all' as const, name: '全部', icon: '🏆' },
    ...Object.values(BadgeCategory).map(c => ({
      id: c,
      name: BADGE_CATEGORY_NAMES[c],
      icon: BADGE_CATEGORY_ICONS[c]
    }))
  ]
})

const filters = [
  { id: 'all' as const, name: '全部徽章' },
  { id: 'unlocked' as const, name: '已解锁' },
  { id: 'locked' as const, name: '未解锁' }
]

const getHighestTierBadge = (category: BadgeCategory): AchievementProgress | null => {
  const progress = userProgress.value.filter(p => p.badge.category === category && p.unlocked)
  if (progress.length === 0) return null

  const tierOrder: BadgeTier[] = ['platinum', 'gold', 'silver', 'bronze']
  for (const tier of tierOrder) {
    const found = progress.find(p => p.badge.tier === tier)
    if (found) return found
  }
  return null
}

function showBadgeDetail(progress: AchievementProgress) {
  selectedBadge.value = progress
}

function closeBadgeDetail() {
  selectedBadge.value = null
}

function formatTimeUnit(value: number): string {
  if (value >= 10000) {
    return `${(value / 1000).toFixed(1)}k`
  }
  return value.toString()
}

onMounted(() => {
  if (targetUserId.value) {
    userStore.updateUserAchievements(
      targetUserId.value,
      diaryStore.diaries,
      diaryStore.archivedDiaries
    )
  }
})

watch(
  () => [diaryStore.diaries.length, diaryStore.archivedDiaries.length],
  () => {
    if (targetUserId.value) {
      userStore.updateUserAchievements(
        targetUserId.value,
        diaryStore.diaries,
        diaryStore.archivedDiaries
      )
    }
  }
)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="font-vt323 text-3xl text-diary-fresh glow-text mb-1">
          🏆 作者成就墙
        </h1>
        <p class="text-gray-400 font-vt323">
          {{ isOwner ? '你的' : `${targetUser?.name || '作者'}的` }}数字足迹与荣誉殿堂
        </p>
      </div>
    </div>

    <div class="ascii-divider">
      ----------------------------------------------------------------
    </div>

    <div v-if="!targetUser" class="text-center py-16 bg-gray-800/30 rounded border border-gray-700 border-dashed">
      <div class="text-6xl mb-4">👤</div>
      <p class="text-gray-500 font-vt323 text-xl">用户不存在</p>
    </div>

    <template v-else>
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div class="p-6 rounded-lg border-2 border-gray-700 bg-gray-800/50">
          <div class="text-center">
            <div
              class="w-20 h-20 rounded-lg bg-gray-700/50 flex items-center justify-center text-5xl mx-auto mb-4 border-2 border-diary-fresh/30"
            >
              {{ isOwner ? '👤' : '🎭' }}
            </div>
            <h2 class="font-vt323 text-2xl text-diary-fresh glow-text mb-1">
              {{ targetUser.name }}
            </h2>
            <p class="text-gray-400 font-vt323 text-sm mb-4">
              {{ targetUser.bio || '这个人很神秘...' }}
            </p>
            <div class="inline-block px-4 py-1 rounded-full bg-diary-fresh/10 border border-diary-fresh/30">
              <span class="text-diary-fresh font-vt323">
                完成度 {{ completionRate }}%
              </span>
            </div>
          </div>
        </div>

        <div class="p-6 rounded-lg border-2 border-gray-700 bg-gray-800/50">
          <div class="text-center">
            <div class="text-5xl mb-2">🏆</div>
            <div class="font-vt323 text-4xl text-diary-fresh mb-1">
              {{ unlockedCount }} / {{ totalBadges }}
            </div>
            <div class="text-gray-400 font-vt323 text-sm">
              徽章解锁
            </div>
            <div class="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-diary-fresh transition-all duration-500"
                :style="{ width: `${completionRate}%` }"
              />
            </div>
          </div>
        </div>

        <div
          v-for="cat in categoryStats"
          :key="cat.category"
          class="p-6 rounded-lg border-2 border-gray-700 bg-gray-800/50"
        >
          <div class="text-center">
            <div class="text-4xl mb-2">{{ cat.icon }}</div>
            <div class="font-vt323 text-xl text-diary-fresh mb-1">
              {{ cat.unlocked }} / {{ cat.total }}
            </div>
            <div class="text-gray-400 font-vt323 text-sm mb-3">
              {{ cat.name }}
            </div>
            <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                class="h-full transition-all duration-500 rounded-full"
                :style="{
                  width: `${cat.percentage}%`,
                  backgroundColor: cat.maxTier ? BADGE_TIER_COLORS[cat.maxTier] : '#6b7280'
                }"
              />
            </div>
            <div v-if="cat.maxTier" class="mt-2">
              <span
                class="text-xs font-vt323 px-2 py-0.5 rounded"
                :style="{
                  backgroundColor: `${BADGE_TIER_COLORS[cat.maxTier]}20`,
                  color: BADGE_TIER_COLORS[cat.maxTier]
                }"
              >
                最高: {{ BADGE_TIER_NAMES[cat.maxTier] }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="stats" class="p-6 rounded-lg border-2 border-gray-700 bg-gray-800/50">
        <h3 class="font-vt323 text-xl text-diary-fresh mb-4">📊 成就数据</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center p-4 rounded bg-gray-700/30">
            <div class="text-3xl mb-2">🏛️</div>
            <div class="font-vt323 text-2xl text-diary-fresh">
              {{ stats.totalExhibitions }}
            </div>
            <div class="text-gray-400 font-vt323 text-sm">公开展出</div>
          </div>
          <div class="text-center p-4 rounded bg-gray-700/30">
            <div class="text-3xl mb-2">🔧</div>
            <div class="font-vt323 text-2xl text-diary-fresh">
              {{ stats.totalRepairs }}
            </div>
            <div class="text-gray-400 font-vt323 text-sm">修复次数</div>
          </div>
          <div class="text-center p-4 rounded bg-gray-700/30">
            <div class="text-3xl mb-2">⏳</div>
            <div class="font-vt323 text-2xl text-diary-fresh">
              {{ formatTimeUnit(stats.longestSurvival) }}
            </div>
            <div class="text-gray-400 font-vt323 text-sm">最长存活</div>
          </div>
          <div class="text-center p-4 rounded bg-gray-700/30">
            <div class="text-3xl mb-2">🔥</div>
            <div class="font-vt323 text-2xl text-diary-fresh">
              {{ stats.currentStreak }}
            </div>
            <div class="text-gray-400 font-vt323 text-sm">活跃日记</div>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="px-4 py-2 rounded-lg font-vt323 transition-all border-2"
          :class="[
            activeCategory === cat.id
              ? 'bg-diary-fresh/20 border-diary-fresh text-diary-fresh'
              : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-500'
          ]"
          @click="activeCategory = cat.id"
        >
          {{ cat.icon }} {{ cat.name }}
        </button>

        <div class="flex-1" />

        <div class="flex gap-1 bg-gray-800/50 rounded-lg p-1">
          <button
            v-for="filter in filters"
            :key="filter.id"
            class="px-3 py-1.5 rounded font-vt323 text-sm transition-all"
            :class="[
              filterStatus === filter.id
                ? 'bg-gray-700 text-diary-fresh'
                : 'text-gray-400 hover:text-gray-300'
            ]"
            @click="filterStatus = filter.id"
          >
            {{ filter.name }}
          </button>
        </div>
      </div>

      <div v-if="filteredProgress.length === 0" class="text-center py-12 bg-gray-800/30 rounded-lg border border-gray-700 border-dashed">
        <div class="text-5xl mb-4">🔍</div>
        <p class="text-gray-500 font-vt323 text-lg">没有符合条件的徽章</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <BadgeCard
          v-for="progress in filteredProgress"
          :key="progress.badge.id"
          :progress="progress"
          @click="showBadgeDetail"
        />
      </div>

      <div
        v-if="filteredProgress.length > 0 && activeCategory !== 'all'"
        class="p-6 rounded-lg border-2 border-diary-fresh/30 bg-diary-fresh/5"
      >
        <h3 class="font-vt323 text-lg text-diary-fresh mb-4">
          💡 如何获得更多 {{ BADGE_CATEGORY_NAMES[activeCategory as BadgeCategory] }} 徽章？
        </h3>
        <ul class="space-y-2 text-gray-300 font-vt323 text-sm">
          <template v-if="activeCategory === BadgeCategory.EXHIBITION">
            <li>• 创建新日记时选择「公开展出」选项</li>
            <li>• 在日记墙中可以随时切换日记的公开状态</li>
            <li>• 你的公开日记会出现在展厅中供其他用户欣赏</li>
          </template>
          <template v-else-if="activeCategory === BadgeCategory.REPAIR">
            <li>• 使用修复道具（修复补丁、时间水晶等）修复濒临消逝的日记</li>
            <li>• 在档案馆中可以查看已逝世的日记并进行修复</li>
            <li>• 每次修复都会计入统计，坚持不懈终会达成目标</li>
          </template>
          <template v-else-if="activeCategory === BadgeCategory.SURVIVAL">
            <li>• 创建日记后让它自然存活，不要过早删除</li>
            <li>• 使用冻结道具可以暂停日记的腐烂过程</li>
            <li>• 最长存活时间记录你所有日记中的最高纪录</li>
            <li>• 即使日记最终逝世，存活时长也会被记录</li>
          </template>
        </ul>
      </div>
    </template>

    <Teleport to="body">
      <div
        v-if="selectedBadge"
        class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        @click.self="closeBadgeDetail"
      >
        <div class="bg-gray-900 border-2 border-gray-700 rounded-lg p-6 max-w-md w-full">
          <div class="flex items-start gap-4 mb-4">
            <div
              class="w-20 h-20 rounded-lg flex items-center justify-center text-5xl"
              :class="[
                selectedBadge.unlocked
                  ? 'bg-gray-700/50'
                  : 'bg-gray-800/50 grayscale'
              ]"
              :style="{
                boxShadow: selectedBadge.unlocked
                  ? `0 0 30px ${BADGE_TIER_COLORS[selectedBadge.badge.tier]}60`
                  : 'none'
              }"
            >
              {{ selectedBadge.badge.icon }}
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span
                  class="text-xs font-vt323 px-2 py-0.5 rounded"
                  :style="{
                    backgroundColor: `${BADGE_TIER_COLORS[selectedBadge.badge.tier]}20`,
                    color: BADGE_TIER_COLORS[selectedBadge.badge.tier]
                  }"
                >
                  {{ BADGE_TIER_NAMES[selectedBadge.badge.tier] }}
                </span>
                <span class="text-xs font-vt323 text-gray-500">
                  {{ BADGE_CATEGORY_ICONS[selectedBadge.badge.category] }}
                  {{ BADGE_CATEGORY_NAMES[selectedBadge.badge.category] }}
                </span>
              </div>
              <h3
                class="font-vt323 text-2xl"
                :class="[
                  selectedBadge.unlocked ? 'text-diary-fresh' : 'text-gray-500'
                ]"
              >
                {{ selectedBadge.badge.name }}
              </h3>
            </div>
            <button
              class="text-gray-500 hover:text-gray-300 text-xl"
              @click="closeBadgeDetail"
            >
              ✕
            </button>
          </div>

          <p class="text-gray-300 font-vt323 mb-4">
            {{ selectedBadge.badge.description }}
          </p>

          <div class="space-y-3 mb-4">
            <div class="flex justify-between font-vt323">
              <span class="text-gray-400">当前进度</span>
              <span :class="[selectedBadge.unlocked ? 'text-diary-fresh' : 'text-gray-300']">
                {{ selectedBadge.current }} / {{ selectedBadge.required }}
                {{ selectedBadge.badge.requirementUnit }}
              </span>
            </div>
            <div class="h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                class="h-full transition-all duration-500 rounded-full"
                :style="{
                  width: `${selectedBadge.progress}%`,
                  backgroundColor: selectedBadge.unlocked
                    ? BADGE_TIER_COLORS[selectedBadge.badge.tier]
                    : '#6b7280'
                }"
              />
            </div>
            <div class="text-right font-vt323 text-sm">
              <span class="text-gray-500">
                {{ selectedBadge.progress.toFixed(1) }}%
              </span>
            </div>
          </div>

          <div
            v-if="selectedBadge.unlocked && selectedBadge.unlockedAt"
            class="p-3 rounded bg-diary-fresh/10 border border-diary-fresh/30 text-center"
          >
            <span class="text-diary-fresh font-vt323">
              🎉 已解锁 - 第 {{ Math.floor(selectedBadge.unlockedAt / (24 * 60 * 60 * 1000)) }} 天
            </span>
          </div>

          <div
            v-else
            class="p-3 rounded bg-gray-800/50 border border-gray-700 text-center"
          >
            <span class="text-gray-400 font-vt323">
              🔒 继续努力，还差 {{ selectedBadge.required - selectedBadge.current }}
              {{ selectedBadge.badge.requirementUnit }}
            </span>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
