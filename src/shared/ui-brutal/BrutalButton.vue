<script setup lang="ts">
// 네오브루탈리즘 버튼. 모달/액션 공통.
withDefaults(
  defineProps<{
    variant?: 'primary' | 'outline' | 'danger'
    disabled?: boolean
  }>(),
  { variant: 'primary', disabled: false },
)
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    class="press w-full rounded-2xl border-4 border-black px-4 py-3 text-center text-base font-black shadow-[5px_5px_0_0_#000] disabled:opacity-50"
    :class="{
      'bg-[#4F46E5] text-white': variant === 'primary',
      'bg-[#FF6B6B] text-white': variant === 'danger',
      'bg-white text-[#161310] dark:bg-[#1c1812] dark:text-[#f2ead6]': variant === 'outline',
    }"
  >
    <slot />
  </button>
</template>
