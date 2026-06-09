import { ref, computed } from 'vue'
import { storage } from '@/utils/storage'
import { globalTimeline } from '@/engine/Timeline'
import {
  BadgeCategory,
  BadgeTier,
  BADGE_CATEGORY_NAMES,
  BADGE_TIER_NAMES,
  BADGE_TIER_COLORS,
  type Badge,
  type UserAchievement,
  type AchievementProgress,
  type Diary,
  type ArchivedDiary
} from '@/types'

const BADGES: Badge[] = [
  {
    id: 'exhibition_bronze',
    category: BadgeCategory.EXHIBITION,
    tier: BadgeTier.BRONZE,
    name: '初出茅庐',
    description: '首次公开展出你的日记作品',
    icon: '🎨',
    requirement: 1,
    requirementUnit: '次公开展出'
  },
  {
    id: 'exhibition_silver',
    category: BadgeCategory.EXHIBITION,
    tier: BadgeTier.SILVER,
    name: '小有名气',
    description: '公开展出5篇日记，开始积累你的观众',
    icon: '🖼️',
    requirement: 5,
    requirementUnit: '次公开展出'
  },
  {
    id: 'exhibition_gold',
    category: BadgeCategory.EXHIBITION,
    tier: BadgeTier.GOLD,
    name: '展览达人',
    description: '公开展出20篇日记，成为展厅常客',
    icon: '🏛️',
    requirement: 20,
    requirementUnit: '次公开展出'
  },
  {
    id: 'exhibition_platinum',
    category: BadgeCategory.EXHIBITION,
    tier: BadgeTier.PLATINUM,
    name: '博物馆馆长',
    description: '公开展出50篇日记，打造属于你的数字博物馆',
    icon: '👑',
    requirement: 50,
    requirementUnit: '次公开展出'
  },
  {
    id: 'repair_bronze',
    category: BadgeCategory.REPAIR,
    tier: BadgeTier.BRONZE,
    name: '学徒修复师',
    description: '首次成功修复一篇濒临消逝的日记',
    icon: '🔧',
    requirement: 1,
    requirementUnit: '次修复'
  },
  {
    id: 'repair_silver',
    category: BadgeCategory.REPAIR,
    tier: BadgeTier.SILVER,
    name: '熟练工匠',
    description: '累计修复10篇日记，技艺日渐精湛',
    icon: '⚒️',
    requirement: 10,
    requirementUnit: '次修复'
  },
  {
    id: 'repair_gold',
    category: BadgeCategory.REPAIR,
    tier: BadgeTier.GOLD,
    name: '修复大师',
    description: '累计修复30篇日记，被誉为数字文物的守护者',
    icon: '🏺',
    requirement: 30,
    requirementUnit: '次修复'
  },
  {
    id: 'repair_platinum',
    category: BadgeCategory.REPAIR,
    tier: BadgeTier.PLATINUM,
    name: '时间炼金术士',
    description: '累计修复100篇日记，掌握逆转时间的奥秘',
    icon: '⚗️',
    requirement: 100,
    requirementUnit: '次修复'
  },
  {
    id: 'survival_bronze',
    category: BadgeCategory.SURVIVAL,
    tier: BadgeTier.BRONZE,
    name: '坚持者',
    description: '有一篇日记存活超过100时间单位',
    icon: '🌱',
    requirement: 100,
    requirementUnit: '时间单位'
  },
  {
    id: 'survival_silver',
    category: BadgeCategory.SURVIVAL,
    tier: BadgeTier.SILVER,
    name: '坚韧不拔',
    description: '有一篇日记存活超过500时间单位',
    icon: '🌲',
    requirement: 500,
    requirementUnit: '时间单位'
  },
  {
    id: 'survival_gold',
    category: BadgeCategory.SURVIVAL,
    tier: BadgeTier.GOLD,
    name: '时间见证者',
    description: '有一篇日记存活超过2000时间单位',
    icon: '🗿',
    requirement: 2000,
    requirementUnit: '时间单位'
  },
  {
    id: 'survival_platinum',
    category: BadgeCategory.SURVIVAL,
    tier: BadgeTier.PLATINUM,
    name: '永恒传说',
    description: '有一篇日记存活超过10000时间单位，成为不朽的数字遗产',
    icon: '⭐',
    requirement: 10000,
    requirementUnit: '时间单位'
  }
]

const userAchievements = ref<Record<string, UserAchievement>>({})

export function useAchievements() {
  function getBadges(): Badge[] {
    return BADGES
  }

  function getBadgeById(id: string): Badge | undefined {
    return BADGES.find(b => b.id === id)
  }

  function getBadgesByCategory(category: BadgeCategory): Badge[] {
    return BADGES.filter(b => b.category === category)
  }

  function initUserAchievements(userId: string): UserAchievement {
    if (userAchievements.value[userId]) {
      return userAchievements.value[userId]
    }

    const stored = storage.getAchievements(userId)
    if (stored) {
      userAchievements.value[userId] = stored
      return stored
    }

    const newAchievements: UserAchievement = {
      userId,
      unlockedBadges: [],
      unlockedAt: {},
      stats: {
        totalExhibitions: 0,
        totalRepairs: 0,
        longestSurvival: 0,
        currentStreak: 0
      }
    }

    userAchievements.value[userId] = newAchievements
    storage.saveAchievements(userId, newAchievements)
    return newAchievements
  }

  function getUserAchievements(userId: string): UserAchievement {
    return initUserAchievements(userId)
  }

  function calculateStats(
    userId: string,
    diaries: Diary[],
    archivedDiaries: ArchivedDiary[]
  ): {
    totalExhibitions: number
    totalRepairs: number
    longestSurvival: number
    currentStreak: number
  } {
    const userDiaries = diaries.filter(d => d.ownerId === userId)
    const userArchived = archivedDiaries.filter(ad => ad.diary.ownerId === userId)

    const totalExhibitions = userDiaries.filter(d => d.isPublic).length +
      userArchived.filter(ad => ad.diary.isPublic).length

    const totalRepairs = userArchived.reduce((sum, ad) => sum + ad.repairCount, 0)

    const now = globalTimeline.getTime()
    let longestSurvival = 0

    userDiaries.forEach(diary => {
      const survivalTime = now - diary.createdAt
      if (survivalTime > longestSurvival) {
        longestSurvival = survivalTime
      }
    })

    userArchived.forEach(ad => {
      const survivalTime = ad.archivedAt - ad.diary.createdAt
      if (survivalTime > longestSurvival) {
        longestSurvival = survivalTime
      }
    })

    const currentStreak = userDiaries.filter(d => d.state !== 'dead').length

    return {
      totalExhibitions,
      totalRepairs,
      longestSurvival,
      currentStreak
    }
  }

  function updateStats(
    userId: string,
    diaries: Diary[],
    archivedDiaries: ArchivedDiary[]
  ): UserAchievement {
    const achievements = initUserAchievements(userId)
    const stats = calculateStats(userId, diaries, archivedDiaries)

    achievements.stats = stats
    checkAndUnlockBadges(userId, achievements)

    userAchievements.value[userId] = { ...achievements }
    storage.saveAchievements(userId, achievements)

    return achievements
  }

  function checkAndUnlockBadges(userId: string, achievements: UserAchievement): string[] {
    const newlyUnlocked: string[] = []
    const now = globalTimeline.getTime()

    BADGES.forEach(badge => {
      if (achievements.unlockedBadges.includes(badge.id)) return

      let currentValue = 0
      switch (badge.category) {
        case BadgeCategory.EXHIBITION:
          currentValue = achievements.stats.totalExhibitions
          break
        case BadgeCategory.REPAIR:
          currentValue = achievements.stats.totalRepairs
          break
        case BadgeCategory.SURVIVAL:
          currentValue = achievements.stats.longestSurvival
          break
      }

      if (currentValue >= badge.requirement) {
        achievements.unlockedBadges.push(badge.id)
        achievements.unlockedAt[badge.id] = now
        newlyUnlocked.push(badge.id)
      }
    })

    return newlyUnlocked
  }

  function getProgress(
    userId: string,
    diaries: Diary[],
    archivedDiaries: ArchivedDiary[]
  ): AchievementProgress[] {
    const achievements = initUserAchievements(userId)
    const stats = calculateStats(userId, diaries, archivedDiaries)

    return BADGES.map(badge => {
      let currentValue = 0
      switch (badge.category) {
        case BadgeCategory.EXHIBITION:
          currentValue = stats.totalExhibitions
          break
        case BadgeCategory.REPAIR:
          currentValue = stats.totalRepairs
          break
        case BadgeCategory.SURVIVAL:
          currentValue = stats.longestSurvival
          break
      }

      const unlocked = achievements.unlockedBadges.includes(badge.id)
      const progress = Math.min(100, (currentValue / badge.requirement) * 100)

      return {
        badge,
        current: currentValue,
        required: badge.requirement,
        unlocked,
        unlockedAt: unlocked ? achievements.unlockedAt[badge.id] : undefined,
        progress
      }
    })
  }

  function getProgressByCategory(
    userId: string,
    category: BadgeCategory,
    diaries: Diary[],
    archivedDiaries: ArchivedDiary[]
  ): AchievementProgress[] {
    return getProgress(userId, diaries, archivedDiaries)
      .filter(p => p.badge.category === category)
  }

  const totalBadges = computed(() => BADGES.length)

  const unlockedCount = (userId: string) => {
    const achievements = initUserAchievements(userId)
    return achievements.unlockedBadges.length
  }

  const completionRate = (userId: string) => {
    const count = unlockedCount(userId)
    return Math.round((count / BADGES.length) * 100)
  }

  function getCategoryProgress(
    userId: string,
    category: BadgeCategory,
    diaries: Diary[],
    archivedDiaries: ArchivedDiary[]
  ): {
    unlocked: number
    total: number
    percentage: number
    maxTier?: BadgeTier
  } {
    const progress = getProgressByCategory(userId, category, diaries, archivedDiaries)
    const unlocked = progress.filter(p => p.unlocked).length
    const total = progress.length
    const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0

    const unlockedBadges = progress.filter(p => p.unlocked).map(p => p.badge)
    const tierOrder = [BadgeTier.BRONZE, BadgeTier.SILVER, BadgeTier.GOLD, BadgeTier.PLATINUM]
    let maxTier: BadgeTier | undefined

    tierOrder.forEach(tier => {
      if (unlockedBadges.some(b => b.tier === tier)) {
        maxTier = tier
      }
    })

    return { unlocked, total, percentage, maxTier }
  }

  return {
    getBadges,
    getBadgeById,
    getBadgesByCategory,
    initUserAchievements,
    getUserAchievements,
    calculateStats,
    updateStats,
    checkAndUnlockBadges,
    getProgress,
    getProgressByCategory,
    totalBadges,
    unlockedCount,
    completionRate,
    getCategoryProgress
  }
}
