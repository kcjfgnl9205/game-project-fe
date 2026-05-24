<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import { useModalStore } from '@/shared/stores'

export interface CreateRoomResult {
  name: string
  isPrivate: boolean
  password?: string
}

interface Props {
  modalId: number
  gameId: string
}
const props = defineProps<Props>()

const modal = useModalStore()

const name = ref('')
const isPrivate = ref(false)
const password = ref('')

const canSubmit = computed(() => {
  if (name.value.trim().length === 0) return false
  if (isPrivate.value && password.value.trim().length === 0) return false
  return true
})

const onCancel = () => {
  modal.close(props.modalId, undefined)
}

const onSubmit = () => {
  if (!canSubmit.value) return
  const result: CreateRoomResult = {
    name: name.value.trim(),
    isPrivate: isPrivate.value,
    password: isPrivate.value ? password.value.trim() : undefined,
  }
  modal.close(props.modalId, result)
}
</script>

<template>
  <form
    class="flex h-full w-full flex-col rounded-none border-none bg-bg-card p-6 shadow-xl md:h-auto md:w-lg md:rounded-2xl md:border md:border-border md:p-10"
    autocomplete="off"
    @submit.prevent="onSubmit"
  >
    <h2 class="text-2xl font-bold text-text-primary">새 방 만들기</h2>

    <input type="hidden" :value="gameId" />

    <!-- 방 이름 -->
    <div class="mt-8">
      <label for="create-room-name" class="block text-sm font-semibold text-text-primary">
        방 이름
      </label>
      <input
        id="create-room-name"
        v-model="name"
        type="text"
        placeholder="방 이름을 입력하세요"
        maxlength="30"
        autocomplete="off"
        autofocus
        class="mt-3 h-12 w-full rounded-xl border border-border bg-bg-elevated px-4 text-sm text-text-primary transition-colors placeholder:text-text-muted focus:border-brand focus:outline-none"
      />
    </div>

    <!-- 비밀 방 토글 -->
    <div class="mt-5 rounded-xl border border-border bg-bg-elevated p-4">
      <label class="flex cursor-pointer items-center gap-4" :class="{ 'mb-3': isPrivate }">
        <span
          class="text-2xl"
          :class="isPrivate ? 'text-warning' : 'text-text-muted'"
          aria-hidden="true"
        >
          🔒
        </span>
        <div class="flex-1">
          <p class="text-sm font-semibold text-text-primary">비밀 방</p>
          <p class="mt-0.5 text-xs text-text-secondary">비밀번호를 설정합니다</p>
        </div>
        <span class="relative inline-block h-7 w-12 shrink-0">
          <input v-model="isPrivate" type="checkbox" class="peer sr-only" />
          <span
            class="absolute inset-0 rounded-full bg-bg-card transition-colors peer-checked:bg-brand"
          />
          <span
            class="absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5"
          />
        </span>
      </label>

      <input
        v-if="isPrivate"
        v-model="password"
        type="password"
        placeholder="비밀번호를 입력하세요"
        maxlength="20"
        autocomplete="new-password"
        class="h-11 w-full rounded-lg border border-border bg-bg-card px-4 text-sm text-text-primary transition-colors placeholder:text-text-muted focus:border-brand focus:outline-none"
      />
    </div>

    <!-- 액션: 모바일 세로 / 데스크탑 가로 2분할 -->
    <div class="mt-auto flex flex-col gap-3 pt-8 md:mt-8 md:grid md:grid-cols-2 md:pt-0">
      <BaseButton variant="secondary" size="lg" type="button" @click="onCancel"> 취소 </BaseButton>
      <BaseButton variant="primary" size="lg" type="submit" :disabled="!canSubmit">
        만들기
      </BaseButton>
    </div>
  </form>
</template>
