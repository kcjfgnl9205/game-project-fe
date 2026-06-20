<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { BRUT } from './brutal'

// 게임 공통 채팅 패널 (브루탈 카드 포함). 메시지/입력은 부모가 관리하지 않고 여기서 처리.
interface ChatLine {
  key: number
  system?: boolean
  nickname?: string
  text: string
}
const props = defineProps<{ messages: ChatLine[]; placeholder?: string }>()
const emit = defineEmits<{ send: [text: string] }>()

const input = ref('')
const scroller = ref<HTMLElement | null>(null)

function submit() {
  const text = input.value.trim()
  if (!text) return
  emit('send', text)
  input.value = ''
}

// 새 메시지 도착 시 맨 아래로
watch(
  () => props.messages.length,
  () => nextTick(() => scroller.value?.scrollTo({ top: scroller.value.scrollHeight })),
)
</script>

<template>
  <div :class="['flex min-h-0 flex-1 flex-col p-4', BRUT, 'bg-white dark:bg-[#262019]']">
    <h2 class="font-game mb-3 text-lg text-slate-400">CHAT</h2>
    <div ref="scroller" class="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-1">
      <template v-for="m in messages" :key="m.key">
        <p v-if="m.system" class="text-center text-xs font-bold text-slate-400 dark:text-[#7c7263]">
          {{ m.text }}
        </p>
        <div
          v-else
          class="rounded-2xl border-2 border-black bg-slate-100 p-2.5 text-sm shadow-[2px_2px_0_0_#000] dark:bg-[#1c1812]"
        >
          <span class="font-black text-[#4F46E5] dark:text-[#a5b4fc]">{{ m.nickname }}:</span>
          {{ m.text }}
        </div>
      </template>
    </div>
    <form class="mt-3 flex gap-2" @submit.prevent="submit">
      <input
        v-model="input"
        type="text"
        :placeholder="placeholder ?? '메시지를 입력하세요'"
        class="min-w-0 flex-1 rounded-xl border-2 border-black bg-[#FFF9E1] px-3 py-2 text-sm font-bold text-black focus:outline-none dark:bg-[#1c1812] dark:text-white"
      />
      <button
        type="submit"
        class="press flex shrink-0 items-center justify-center rounded-xl border-2 border-black bg-[#4F46E5] px-3 py-2 text-white shadow-[3px_3px_0_0_#000]"
      >
        ➤
      </button>
    </form>
  </div>
</template>
