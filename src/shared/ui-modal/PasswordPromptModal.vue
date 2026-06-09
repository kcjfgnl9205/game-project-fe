<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Button, Input } from '@/shared/ui'
import { useModalStore } from '@/shared/stores'

interface Props {
  modalId: number
  title?: string
  description?: string
  submitText?: string
  // 입력값 처리(검증·요청 등)는 호출하는 쪽이 주입한다 — 모달은 도메인을 모른다.
  // 실패 시 throw하면 Error.message가 모달에 표시되고 모달은 유지된다.
  // 성공하면 모달이 닫히며 open()이 true로 resolve된다.
  onSubmit: (value: string) => Promise<void> | void
}
const props = withDefaults(defineProps<Props>(), {
  title: '비밀번호 입력',
  description: '',
  submitText: '확인',
})

const modal = useModalStore()
const value = ref('')
const errorMsg = ref('')
const loading = ref(false)
const inputEl = ref<InstanceType<typeof Input> | null>(null)

onMounted(() => inputEl.value?.focus())

const submit = async () => {
  const v = value.value.trim()
  if (!v || loading.value) return
  loading.value = true
  errorMsg.value = ''
  try {
    await props.onSubmit(v)
    modal.close(props.modalId, true)
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '확인에 실패했습니다.'
    value.value = ''
    inputEl.value?.focus()
  } finally {
    loading.value = false
  }
}

const cancel = () => modal.close(props.modalId, false)
</script>

<template>
  <div class="w-screen rounded-2xl border border-border bg-bg-card p-8 shadow-xl md:w-96">
    <h2 class="text-xl font-bold text-text-primary">{{ title }}</h2>
    <p v-if="description" class="mt-1 text-sm text-text-secondary">{{ description }}</p>

    <form class="mt-5" @submit.prevent="submit">
      <Input
        ref="inputEl"
        v-model="value"
        type="password"
        placeholder="비밀번호"
        :invalid="!!errorMsg"
        @input="errorMsg = ''"
      />
      <p v-if="errorMsg" class="mt-2 text-sm text-warning">{{ errorMsg }}</p>

      <div class="mt-6 flex justify-end gap-3">
        <Button variant="secondary" size="md" type="button" :disabled="loading" @click="cancel">
          취소
        </Button>
        <Button variant="primary" size="md" type="submit" :disabled="loading">
          {{ loading ? '확인 중…' : submitText }}
        </Button>
      </div>
    </form>
  </div>
</template>
