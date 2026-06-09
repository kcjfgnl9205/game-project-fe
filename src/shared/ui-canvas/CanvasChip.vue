<script setup lang="ts">
// 캔버스 위에 띄우는 정보 칩(제시어/시간/차례 등)의 공통 박스.
// 박스 스타일만 제공하고 내용은 슬롯으로 받는다. (간격/글자색 등은 class로 덧붙임)
</script>

<template>
  <div
    class="inline-flex items-center rounded-xl border border-border bg-bg-card/95 px-4 py-2 text-sm font-bold shadow-sm backdrop-blur-sm"
  >
    <slot />
  </div>
</template>
