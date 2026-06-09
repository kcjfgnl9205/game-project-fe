<script setup lang="ts">
import { ref, watch } from 'vue'

// 게임 공통 참가자 카드. 방장(👑)·현재 그리는 사람(🖌️/강조)·나(나 배지)·닉네임은 공통.
// 닉네임 아래 내용(점수/참가 상태 등)만 게임별로 슬롯으로 채운다.
const props = defineProps<{
  nickname: string
  isHost?: boolean
  isMe?: boolean
  active?: boolean // 현재 그리는 사람(차례)
  // 점수 획득 연출: at(시퀀스)이 바뀌면 이름 옆에 +delta가 떠올랐다 사라진다.
  scorePop?: { delta: number; at: number } | null
}>()

const nameEl = ref<HTMLElement | null>(null)

// 떠다니는 +N 목록. 사이드바 overflow에 잘리지 않게 body로 Teleport(화면 좌표 고정)한다.
const floats = ref<{ id: number; delta: number; x: number; y: number }[]>([])
let fid = 0

watch(
  () => props.scorePop?.at,
  (at) => {
    const delta = props.scorePop?.delta
    if (!at || !delta || !nameEl.value) return
    const r = nameEl.value.getBoundingClientRect()
    const id = ++fid
    floats.value.push({ id, delta, x: r.right + 4, y: r.top + r.height / 2 })
    setTimeout(() => {
      floats.value = floats.value.filter((f) => f.id !== id)
    }, 900)
  },
)
</script>

<template>
  <li
    class="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all"
    :class="
      active
        ? 'border-2 border-brand bg-brand-soft shadow-sm'
        : isMe
          ? 'bg-bg-elevated ring-1 ring-brand/40'
          : 'hover:bg-bg-card-hover'
    "
  >
    <span
      class="flex h-7 w-7 items-center justify-center rounded-full text-sm"
      :class="active ? 'bg-brand text-on-brand' : 'bg-bg-elevated text-text-secondary'"
    >
      {{ active ? '🖌️' : '🙂' }}
    </span>

    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-1">
        <span ref="nameEl" class="truncate text-sm font-semibold text-text-primary">
          {{ nickname }}
        </span>
        <span v-if="isHost" class="text-xs text-warning" aria-hidden="true">👑</span>
        <span
          v-if="isMe"
          class="shrink-0 rounded-md bg-brand px-1.5 py-0.5 text-[10px] font-bold text-on-brand"
        >
          나
        </span>
      </div>
      <!-- 닉네임 아래: 게임별 내용(점수/참가 상태 등) -->
      <p class="text-xs text-text-secondary"><slot /></p>
    </div>
  </li>

  <!-- 점수 획득 +N: 사이드바 overflow에 잘리지 않게 body로 빼서 화면 좌표에 띄움 -->
  <Teleport to="body">
    <span
      v-for="f in floats"
      :key="f.id"
      class="score-pop pointer-events-none fixed z-100 text-xl font-bold whitespace-nowrap text-green-500"
      :style="{ left: `${f.x}px`, top: `${f.y}px` }"
    >
      +{{ f.delta }}
    </span>
  </Teleport>
</template>

<style scoped>
@keyframes score-pop {
  0% {
    transform: translate(0, -50%);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  100% {
    transform: translate(0, -150%);
    opacity: 0;
  }
}
.score-pop {
  animation: score-pop 0.9s ease-out forwards;
}
</style>
