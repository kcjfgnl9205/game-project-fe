<script setup lang="ts">
import { useModalStore } from '@/shared/stores'

const store = useModalStore()

const onBackdropClick = () => {
  const top = store.topVisible
  if (top?.options.closeOnBackdrop) store.close(top.id)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="store.modals.length > 0" data-modal-portal>
      <!-- 공용 백드롭 (하나만 렌더, 스택돼도 겹쳐서 어두워지지 않음) -->
      <Transition name="modal-backdrop" appear>
        <div
          v-if="store.isOpen"
          class="fixed inset-0 z-100 bg-black/10 backdrop-blur-sm"
          @click="onBackdropClick"
        />
      </Transition>

      <!-- 모달 스택: 모두 렌더하고 z-index로 쌓기 -->
      <div
        v-for="(modal, index) in store.modals"
        :key="modal.id"
        class="pointer-events-none fixed inset-0 flex items-center justify-center md:p-4"
        :style="{ zIndex: 101 + index }"
      >
        <Transition
          :name="`modal-${modal.options.transition}`"
          appear
          @after-leave="store.afterLeave(modal.id)"
        >
          <div
            v-if="modal.visible"
            class="pointer-events-auto flex h-dvh w-screen items-center justify-center md:block md:h-auto md:w-auto"
            role="dialog"
            aria-modal="true"
            @click.stop
          >
            <component :is="modal.component" v-bind="{ ...modal.props, modalId: modal.id }" />
          </div>
        </Transition>
      </div>
    </div>
  </Teleport>
</template>

<style>
/* ─── 백드롭 fade ─── */
.modal-backdrop-enter-active,
.modal-backdrop-leave-active {
  transition: opacity 0.2s ease;
}
.modal-backdrop-enter-from,
.modal-backdrop-leave-to {
  opacity: 0;
}

/* ─── 모달 컨텐츠 트랜지션 ─── */
.modal-up-enter-active,
.modal-up-leave-active,
.modal-down-enter-active,
.modal-down-leave-active,
.modal-left-enter-active,
.modal-left-leave-active,
.modal-right-enter-active,
.modal-right-leave-active,
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-up-enter-from,
.modal-up-leave-to {
  opacity: 0;
  transform: translateY(100px) scale(0.98);
}

.modal-down-enter-from,
.modal-down-leave-to {
  opacity: 0;
  transform: translateY(-100px) scale(0.98);
}

.modal-left-enter-from,
.modal-left-leave-to {
  opacity: 0;
  transform: translateX(-100px);
}

.modal-right-enter-from,
.modal-right-leave-to {
  opacity: 0;
  transform: translateX(100px);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
