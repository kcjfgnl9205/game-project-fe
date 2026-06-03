<script setup lang="ts">
import { computed } from 'vue'
import { useToastStore, type ToastVariant } from '@/shared/stores'

const store = useToastStore()

const variantClass = (v: ToastVariant) => {
  if (v === 'success') return 'border-brand/40 bg-brand/10 text-brand'
  if (v === 'error') return 'border-warning/40 bg-warning/10 text-warning'
  if (v === 'warning') return 'border-warning/40 bg-warning/10 text-warning'
  return 'border-border bg-bg-card text-text-primary'
}

const list = computed(() => store.toasts)
</script>

<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed bottom-6 left-1/2 z-[9999] flex -translate-x-1/2 flex-col items-center gap-2"
    >
      <TransitionGroup name="toast">
        <button
          v-for="t in list"
          :key="t.id"
          type="button"
          :class="[
            'pointer-events-auto min-w-64 max-w-md cursor-pointer rounded-2xl border px-4 py-3 text-center text-sm font-medium shadow-lg transition-colors',
            variantClass(t.variant),
          ]"
          @click="store.dismiss(t.id)"
        >
          {{ t.message }}
        </button>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.toast-enter-active {
  transition:
    opacity 0.2s ease-out,
    transform 0.2s ease-out;
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
.toast-leave-active {
  transition:
    opacity 0.15s ease-in,
    transform 0.15s ease-in;
}
</style>
