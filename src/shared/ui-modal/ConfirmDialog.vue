<script setup lang="ts">
import BaseButton from '@/shared/ui/BaseButton.vue'
import { useModalStore } from '@/shared/stores'

interface Props {
  modalId: number
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
}
const props = withDefaults(defineProps<Props>(), {
  title: '',
  confirmText: '확인',
  cancelText: '취소',
})

const modal = useModalStore()
</script>

<template>
  <div class="rounded-2xl border border-border bg-bg-card p-8 shadow-xl">
    <h2 v-if="title" class="text-xl font-bold text-text-primary">{{ title }}</h2>
    <p class="mt-2 text-sm leading-relaxed text-text-secondary">{{ message }}</p>

    <div class="mt-6 flex justify-end gap-3">
      <BaseButton variant="secondary" size="md" @click="modal.close(props.modalId, false)">
        {{ cancelText }}
      </BaseButton>
      <BaseButton variant="primary" size="md" @click="modal.close(props.modalId, true)">
        {{ confirmText }}
      </BaseButton>
    </div>
  </div>
</template>
