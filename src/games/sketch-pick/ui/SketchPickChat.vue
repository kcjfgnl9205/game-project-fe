<script setup lang="ts">
import { ref } from 'vue'
import type { ChatMessage } from '@/games/sketch-pick/model/mock'

const props = defineProps<{ messages: ChatMessage[] }>()

const input = ref('')
const localMessages = ref<ChatMessage[]>([...props.messages])

const onSend = () => {
  const text = input.value.trim()
  if (text.length === 0) return
  localMessages.value.push({
    id: `local-${Date.now()}`,
    nickname: '나',
    text,
  })
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
      <li
        v-for="msg in localMessages"
        :key="msg.id"
        :class="msg.isSystem ? 'flex justify-center' : ''"
      >
        <p
          v-if="msg.isSystem"
          class="rounded-full bg-bg-elevated px-3 py-1 text-xs text-text-secondary"
        >
          {{ msg.text }}
        </p>
        <div v-else class="rounded-xl bg-bg-elevated p-3">
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
