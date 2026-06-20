<script setup lang="ts">
// 네오브루탈리즘 모달 껍데기. 외부 상태(open)로 열고 닫는다.
// contained=true면 Teleport 없이 부모(relative 컨테이너, 예: 캔버스) 안에서 absolute로 뜬다.
interface Props {
  open: boolean
  closeOnBackdrop?: boolean
  contained?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  closeOnBackdrop: false,
  contained: false,
})
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <Teleport to="body" :disabled="contained">
    <Transition name="brutal-modal">
      <div
        v-if="open"
        class="inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        :class="props.contained ? 'absolute' : 'fixed z-100'"
        @click.self="closeOnBackdrop && emit('close')"
      >
        <div
          class="game-root w-full max-w-sm rounded-[28px] border-4 border-black bg-white p-6 text-[#161310] shadow-[8px_8px_0_0_#000] dark:bg-[#262019] dark:text-[#f2ead6]"
        >
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.brutal-modal-enter-active,
.brutal-modal-leave-active {
  transition: opacity 0.2s ease;
}
.brutal-modal-enter-from,
.brutal-modal-leave-to {
  opacity: 0;
}
.brutal-modal-enter-active > div,
.brutal-modal-leave-active > div {
  transition: transform 0.2s ease;
}
.brutal-modal-enter-from > div,
.brutal-modal-leave-to > div {
  transform: translateY(12px) scale(0.98);
}
</style>
