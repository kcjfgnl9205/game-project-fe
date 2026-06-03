<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button, Input } from '@/shared/ui'
import { useAuthStore } from '@/shared/stores'
import { getGuestId } from '@/shared/lib/guest'
import { useGameStore } from '@/games/sketch-pick/model/game.store'
import SketchPickChatMessage from './SketchPickChatMessage.vue'
import SketchPickChatSystem from './SketchPickChatSystem.vue'

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
      <i-local-chat aria-hidden="true" />
      <h2 class="text-sm font-bold text-text-primary">채팅</h2>
    </header>

    <ul class="flex-1 space-y-2 overflow-y-auto p-3">
      <li v-for="msg in game.chat" :key="msg.key">
        <SketchPickChatSystem v-if="msg.system" :text="msg.text" />
        <SketchPickChatMessage
          v-else
          :nickname="msg.nickname"
          :text="msg.text"
          :mine="msg.senderId === myPlayerId"
        />
      </li>
    </ul>

    <form
      class="flex h-14 shrink-0 items-center gap-2 border-t border-border px-2"
      @submit.prevent="onSend"
    >
      <Input v-model="input" type="text" placeholder="정답을 입력하세요..." />
      <Button type="submit" size="sm" aria-label="전송" icon="send" />
    </form>
  </aside>
</template>
