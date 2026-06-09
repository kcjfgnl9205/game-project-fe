<script setup lang="ts">
// 캔버스 하단 가운데 안내 배너. error가 있으면 빨강, 없으면 info(공지)를 brand 색으로 표시.
// 캔버스 square(relative) 안의 overlay 슬롯에 두는 것을 전제로 absolute 배치한다.
defineProps<{ error?: string | null; info?: string | null }>()
</script>

<template>
  <div
    v-if="error || info"
    class="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center px-3"
  >
    <div
      class="rounded-xl border px-4 py-2 text-sm font-semibold shadow-sm"
      :class="
        error
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-brand bg-brand-soft text-brand'
      "
    >
      {{ error || info }}
    </div>
  </div>
</template>
