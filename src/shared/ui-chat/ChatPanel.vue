<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { Button, Input } from '@/shared/ui'
import ChatMessage from './ChatMessage.vue'
import ChatSystem from './ChatSystem.vue'
import type { ChatMessageItem } from './types'

const props = withDefaults(
  defineProps<{
    messages: ChatMessageItem[]
    myPlayerId: string // 내 메시지(우측 정렬) 판별용
    placeholder?: string
    widthClass?: string // 패널 폭 (게임별로 조정 가능)
  }>(),
  { placeholder: '메시지를 입력하세요...', widthClass: 'w-80' },
)

const emit = defineEmits<{ send: [string] }>()

// 새 메시지가 오면 목록 맨 아래로 스크롤한다.
const listRef = ref<HTMLElement | null>(null)
const scrollToBottom = () => {
  const el = listRef.value
  if (el) el.scrollTop = el.scrollHeight
}
watch(
  () => props.messages.length,
  () => nextTick(scrollToBottom),
)
onMounted(scrollToBottom)

const input = ref('')
// 서버가 발신자에게도 chat:message를 되돌려주므로 낙관적 추가는 하지 않는다.
// 빈/공백 처리는 스토어의 sendChat에서 trim+무시한다.
const onSend = () => {
  emit('send', input.value)
  input.value = ''
}
</script>

<template>
  <aside class="flex shrink-0 flex-col border-l border-border bg-bg-card" :class="widthClass">
    <header class="flex h-12 items-center gap-2 border-b border-border px-4">
      <i-local-chat aria-hidden="true" />
      <h2 class="text-sm font-bold text-text-primary">채팅</h2>
    </header>

    <ul ref="listRef" class="flex-1 space-y-2 overflow-y-auto p-3">
      <li v-for="msg in messages" :key="msg.key">
        <ChatSystem v-if="msg.system" :text="msg.text" />
        <ChatMessage
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
      <Input v-model="input" type="text" :placeholder="placeholder" />
      <Button type="submit" size="sm" aria-label="전송" icon="send" />
    </form>
  </aside>
</template>
