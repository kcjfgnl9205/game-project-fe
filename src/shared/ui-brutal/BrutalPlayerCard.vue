<script setup lang="ts">
// 게임 공통 참가자 카드 한 줄. 우측 내용(점수/상태)은 default slot, 닉네임 아래 보조라벨은 #sub slot.
defineProps<{
  nickname: string
  avatarColor: string
  isHost?: boolean
  isMe?: boolean
  active?: boolean // 현재 차례/그리는 중 등 강조
}>()
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
    <div
      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-black text-lg font-black text-black"
      :style="{ backgroundColor: avatarColor }"
    >
      {{ nickname.charAt(0) }}
    </div>
    <div class="min-w-0 flex-1">
      <p class="flex items-center gap-1 truncate text-sm font-black">
        <span class="truncate">{{ nickname }}</span>
        <span v-if="isHost" title="방장">👑</span>
      </p>
      <p class="text-xs font-bold text-slate-500 dark:text-[#9c9079]"><slot name="sub" /></p>
    </div>
    <div class="shrink-0 text-right text-xs font-bold text-slate-500 dark:text-[#9c9079]">
      <slot />
    </div>
  </div>
</template>
