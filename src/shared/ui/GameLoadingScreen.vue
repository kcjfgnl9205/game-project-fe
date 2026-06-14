<script setup lang="ts">
import { useRouter } from 'vue-router'

defineProps<{ message?: string; error?: string | null }>()

const router = useRouter()

// 접속 실패 시 이전 화면(로비)로. 직접 진입(히스토리 없음)이면 홈으로.
function goBack() {
  if (window.history.state?.back) router.back()
  else router.push('/')
}
</script>

<template>
  <div class="flex h-dvh flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
    <template v-if="error">
      <p class="text-warning">{{ error }}</p>
      <button
        class="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-bg-card"
        @click="goBack"
      >
        돌아가기
      </button>
    </template>
    <template v-else>
      <div
        class="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-brand"
        aria-hidden="true"
      />
      <p class="text-sm text-text-secondary">{{ message ?? '게임에 접속하는 중…' }}</p>
    </template>
  </div>
</template>
