<script setup lang="ts">
import { RouterLink } from 'vue-router'
import BaseButton from '@/shared/ui/BaseButton.vue'
import ThemeToggle from '@/shared/ui/ThemeToggle.vue'

const navItems = [
  { label: '홈', to: '/' },
  { label: '게임 목록', to: '/games' },
  { label: '공지사항', to: '/notice' },
]
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur">
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
      <RouterLink to="/" class="flex items-center gap-3">
        <span
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-xl"
          aria-hidden="true"
        >
          🎮
        </span>
        <span class="text-lg font-bold text-text-primary">미니게임 파크</span>
      </RouterLink>

      <nav class="hidden items-center gap-8 md:flex">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="text-sm text-text-secondary transition-colors hover:text-text-primary"
          active-class="text-text-primary"
        >
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="flex items-center gap-3">
        <ThemeToggle />
        <BaseButton
          variant="ghost"
          size="sm"
          class="border! border-brand! text-brand! hover:bg-brand-soft!"
        >
          로그인
        </BaseButton>
      </div>
    </div>
  </header>
</template>
