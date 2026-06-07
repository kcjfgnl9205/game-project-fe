<script setup lang="ts">
import { Badge, Button } from '@/shared/ui'
import { useNavigation } from '@/shared/composables'
const stats = [
  { value: '2+', label: '미니게임' },
  { value: '8명', label: '최대 플레이어' },
  { value: '실시간', label: '멀티플레이' },
  { value: '무료', label: '이용 가능' },
]

const nav = useNavigation()
</script>

<template>
  <section class="border-b border-border">
    <div class="mx-auto flex max-w-7xl flex-col items-center px-6 py-28 text-center">
      <Badge tone="brand" class="mb-8">
        <span aria-hidden="true">✦</span>
        새로운 게임이 추가되었어요!
      </Badge>

      <h1 class="text-5xl font-bold leading-tight md:text-6xl">
        친구들과 함께<br />
        <span class="text-brand">미니게임</span>을 즐겨보세요
      </h1>

      <p class="mt-6 max-w-xl text-base text-text-secondary md:text-lg">
        다양한 미니게임으로 즐거운 시간을 보내세요. 실시간 멀티플레이어로 언제 어디서나 친구들과
        함께!
      </p>

      <div class="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Button
          variant="primary"
          size="lg"
          right-icon="arrow-right"
          @click="() => nav.toGameList()"
        >
          지금 시작하기
          <span aria-hidden="true">›</span>
        </Button>
      </div>
    </div>

    <div class="border-t border-border">
      <div class="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-14 md:grid-cols-4">
        <div v-for="stat in stats" :key="stat.label" class="flex flex-col items-center text-center">
          <span class="text-4xl font-bold text-brand md:text-5xl">{{ stat.value }}</span>
          <span class="mt-2 text-sm text-text-secondary">{{ stat.label }}</span>
        </div>
      </div>
    </div>
  </section>
</template>
