<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '@/shared/stores'
import { getGuestId } from '@/shared/lib/guest'
import { useGameStore } from '@/games/sketch-pick/model/game.store'

const game = useGameStore()
const auth = useAuthStore()

const myPlayerId = computed(() =>
  auth.isAuthenticated ? `user:${auth.user?.id}` : `guest:${getGuestId()}`,
)

const input = ref('')

// 서버가 chat:message로 발신자에게도 되돌려주므로 낙관적 추가는 하지 않는다.
const onSend = () => {
  game.sendChat(input.value)
  input.value = ''
}
</script>

<template>
  <aside class="flex w-80 shrink-0 flex-col border-l border-border bg-bg-card">
    <header class="flex h-12 items-center gap-2 border-b border-border px-4">
      <span class="text-brand" aria-hidden="true">💬</span>
      <h2 class="text-sm font-bold text-text-primary">채팅</h2>
    </header>

    <ul class="flex-1 space-y-2 overflow-y-auto p-3">
      <li v-for="msg in game.chat" :key="msg.key">
        <!-- 진행 안내(시스템) 메시지: 가운데 구분선 스타일 -->
        <div
          v-if="msg.system"
          class="flex items-center gap-2 py-1 text-xs font-medium text-text-muted"
        >
          <span class="h-px flex-1 bg-border" />
          <span>{{ msg.text }}</span>
          <span class="h-px flex-1 bg-border" />
        </div>
        <div
          v-else
          class="rounded-xl p-3"
          :class="msg.senderId === myPlayerId ? 'bg-brand-soft' : 'bg-bg-elevated'"
        >
          <p class="text-xs font-semibold text-brand">{{ msg.nickname }}</p>
          <p class="mt-0.5 text-sm text-text-primary">{{ msg.text }}</p>
        </div>
      </li>
    </ul>

    <form
      class="flex h-14 shrink-0 items-center gap-2 border-t border-border px-3"
      @submit.prevent="onSend"
    >
      <input
        v-model="input"
        type="text"
        placeholder="정답을 입력하세요..."
        class="h-10 flex-1 rounded-lg border border-border bg-bg-elevated px-3 text-sm text-text-primary transition-colors placeholder:text-text-muted focus:border-brand focus:outline-none"
      />
      <button
        type="submit"
        aria-label="전송"
        class="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-brand text-on-brand transition-colors hover:bg-brand-hover"
      >
        <span aria-hidden="true">➤</span>
      </button>
    </form>
  </aside>
</template>
