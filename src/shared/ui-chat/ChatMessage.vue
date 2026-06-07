<script setup lang="ts">
// 일반 채팅 메시지. mine이면 우측 정렬(+강조), 아니면 좌측 정렬.
defineProps<{ nickname?: string; text?: string; mine?: boolean }>()
</script>

<template>
  <div class="flex" :class="mine ? 'justify-end' : 'justify-start'">
    <div class="max-w-[80%]">
      <!-- 내 메시지는 닉네임 생략(어차피 나) -->
      <p v-if="!mine && nickname" class="mb-0.5 px-1 text-xs font-semibold text-brand">
        {{ nickname }}
      </p>
      <div
        class="rounded-xl px-3 py-2 text-sm break-words text-text-primary"
        :class="mine ? 'bg-brand-soft' : 'bg-bg-elevated'"
      >
        {{ text }}
      </div>
    </div>
  </div>
</template>
