<script setup lang="ts">
interface Props {
  open: boolean
  closeOnBackdrop?: boolean
  // true면 Teleport 없이 부모(relative 컨테이너) 안에서 absolute로 뜬다. (예: 캔버스 안)
  contained?: boolean
}

// 상태(v-if)로 열고 닫는 presentational 모달 껍데기.
// (modal.store 기반 BaseModal과 달리, 외부 상태에 반응해 자동으로 열리고 닫힘)
const props = withDefaults(defineProps<Props>(), {
  closeOnBackdrop: false,
  contained: false,
})

const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <Teleport to="body" :disabled="contained">
    <Transition name="modal-shell">
      <div
        v-if="open"
        class="inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        :class="props.contained ? 'absolute' : 'fixed z-100'"
        @click.self="closeOnBackdrop && emit('close')"
      >
        <div class="w-full max-w-sm rounded-2xl border border-border bg-bg-card p-6 shadow-xl">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-shell-enter-active,
.modal-shell-leave-active {
  transition: opacity 0.2s ease;
}
.modal-shell-enter-from,
.modal-shell-leave-to {
  opacity: 0;
}
.modal-shell-enter-active .w-full,
.modal-shell-leave-active .w-full {
  transition: transform 0.2s ease;
}
.modal-shell-enter-from .w-full,
.modal-shell-leave-to .w-full {
  transform: translateY(12px) scale(0.98);
}
</style>
