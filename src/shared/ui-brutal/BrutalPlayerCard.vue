<script setup lang="ts">
import { ref, watch } from 'vue'

// 게임 공통 참가자 카드 한 줄. 우측 내용(점수/상태)은 default slot, 닉네임 아래 보조라벨은 #sub slot.
const props = defineProps<{
  nickname: string
  avatarColor: string
  isHost?: boolean
  isMe?: boolean
  active?: boolean // 현재 차례/그리는 중 등 강조
  // 점수 획득 연출: at(시퀀스)이 바뀌면 닉네임 옆에 +delta가 떠올랐다 사라진다.
  scorePop?: { delta: number; at: number } | null
}>()

const nameEl = ref<HTMLElement | null>(null)

// 떠다니는 +N. 사이드바 overflow에 잘리지 않게 body로 Teleport(화면 좌표 고정).
const floats = ref<{ id: number; delta: number; x: number; y: number }[]>([])
let fid = 0
watch(
  () => props.scorePop?.at,
  (at) => {
    const delta = props.scorePop?.delta
    if (!at || !delta || !nameEl.value) return
    const r = nameEl.value.getBoundingClientRect()
    const id = ++fid
    floats.value.push({ id, delta, x: r.right + 6, y: r.top + r.height / 2 })
    setTimeout(() => {
      floats.value = floats.value.filter((f) => f.id !== id)
    }, 900)
  },
)
</script>

<template>
  <div
    class="flex items-center gap-2.5 rounded-2xl border-2 border-black p-2.5 shadow-[3px_3px_0_0_#000]"
    :class="
      active
        ? 'bg-[#FFB300]/25 dark:bg-[#FFB300]/15'
        : isMe
          ? 'bg-[#00D8A5]/25 dark:bg-[#00D8A5]/15'
          : 'bg-slate-50 dark:bg-[#1c1812]'
    "
  >
    <div class="relative shrink-0">
      <div
        class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-black text-lg font-black text-black"
        :style="{ backgroundColor: avatarColor }"
      >
        {{ nickname.charAt(0) }}
      </div>
      <!-- 현재 그리는 사람 표시 -->
      <span
        v-if="active"
        class="absolute -right-1.5 -bottom-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-black bg-white text-[10px] shadow-[1px_1px_0_0_#000]"
        title="그리는 중"
      >
        ✏️
      </span>
    </div>
    <div class="min-w-0 flex-1">
      <p class="flex items-center gap-1 truncate text-sm font-black">
        <span ref="nameEl" class="truncate">{{ nickname }}</span>
        <span v-if="isHost" title="방장">👑</span>
      </p>
      <p class="text-xs font-bold text-slate-500 dark:text-[#9c9079]"><slot name="sub" /></p>
    </div>
    <div class="shrink-0 text-right text-xs font-bold text-slate-500 dark:text-[#9c9079]">
      <slot />
    </div>
  </div>

  <!-- 점수 획득 +N: 사이드바 overflow에 잘리지 않게 body로 띄움 -->
  <Teleport to="body">
    <span
      v-for="f in floats"
      :key="f.id"
      class="brutal-pop font-game pointer-events-none fixed z-100 text-2xl whitespace-nowrap text-[#00D8A5]"
      :style="{ left: `${f.x}px`, top: `${f.y}px` }"
    >
      +{{ f.delta }}
    </span>
  </Teleport>
</template>

<style scoped>
@keyframes brutal-pop {
  0% {
    transform: translate(0, -50%);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  100% {
    transform: translate(0, -160%);
    opacity: 0;
  }
}
.brutal-pop {
  animation: brutal-pop 0.9s ease-out forwards;
}
</style>
