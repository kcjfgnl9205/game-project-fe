<script setup lang="ts">
defineProps<{
  page: number
  pages: number[]
  hasPrevGroup: boolean
  hasNextGroup: boolean
}>()

const emit = defineEmits<{
  'update:page': [p: number]
  prevGroup: []
  nextGroup: []
}>()
</script>

<template>
  <nav class="flex items-center justify-center gap-1" aria-label="페이지 이동">
    <button
      type="button"
      class="flex size-9 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:bg-bg-card disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
      :disabled="!hasPrevGroup"
      aria-label="이전 페이지 묶음"
      @click="emit('prevGroup')"
    >
      ‹
    </button>

    <button
      v-for="p in pages"
      :key="p"
      type="button"
      class="flex size-9 items-center justify-center rounded-lg border text-sm font-medium transition-colors cursor-pointer"
      :class="
        p === page
          ? 'border-brand bg-brand text-on-brand'
          : 'border-border text-text-secondary hover:bg-bg-card'
      "
      :aria-current="p === page ? 'page' : undefined"
      @click="emit('update:page', p)"
    >
      {{ p }}
    </button>

    <button
      type="button"
      class="flex size-9 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:bg-bg-card disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
      :disabled="!hasNextGroup"
      aria-label="다음 페이지 묶음"
      @click="emit('nextGroup')"
    >
      ›
    </button>
  </nav>
</template>
