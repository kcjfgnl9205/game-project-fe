<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Button } from '@/shared/ui'
import ThemeToggle from '@/shared/ui/ThemeToggle.vue'
import { useAuthStore } from '@/shared/stores'
import { useNavigation } from '@/shared/composables'

const auth = useAuthStore()
const nav = useNavigation()

const navItems = [
  { label: '홈', to: '/' },
  { label: '게임 목록', to: '/games' },
  { label: '공지사항', to: '/notice' },
]

async function onLogout() {
  await auth.logout()
  nav.toHome()
}
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
        <span class="text-lg font-bold text-text-primary">놀모아</span>
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
        <Button
          v-if="auth.isAuthenticated"
          variant="ghost"
          size="sm"
          class="border! border-border-strong! text-text-secondary! hover:text-text-primary!"
          @click="onLogout"
        >
          로그아웃
        </Button>
        <Button
          v-else
          variant="ghost"
          size="sm"
          class="border! border-brand! text-brand! hover:bg-brand-soft!"
          @click="nav.toLogin"
        >
          로그인
        </Button>
      </div>
    </div>
  </header>
</template>
