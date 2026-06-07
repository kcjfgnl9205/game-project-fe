<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Button, Input } from '@/shared/ui'
import { useModalStore, useAuthStore } from '@/shared/stores'
import { useToast } from '@/shared/composables'
import { fetchInquiryCategories, submitInquiry, type InquiryCategory } from '@/entities/inquiry'

interface Props {
  modalId: number
}
const props = defineProps<Props>()

const modal = useModalStore()
const auth = useAuthStore()
const toast = useToast()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const categories = ref<InquiryCategory[]>([])
const loadingCategories = ref(true)
const submitting = ref(false)

const email = ref(auth.isAuthenticated ? (auth.user?.email ?? '') : '')
const categoryId = ref('')
const title = ref('')
const content = ref('')
const agreed = ref(false) // 개인정보 수집·이용 동의 (필수)
const showAgreeError = ref(false) // 미동의 상태로 제출 시도 시 오류 표시

onMounted(async () => {
  try {
    const list = await fetchInquiryCategories()
    categories.value = list
    if (list[0]) categoryId.value = list[0].id
  } catch (e) {
    toast.error(e, '문의 유형을 불러오지 못했습니다.')
  } finally {
    loadingCategories.value = false
  }
})

// 이메일이 입력됐는데 형식이 틀린 경우에만 경고 표시 (빈 칸엔 표시 안 함)
const emailInvalid = computed(
  () => email.value.trim().length > 0 && !EMAIL_RE.test(email.value.trim()),
)

const canSubmit = computed(() => {
  if (submitting.value) return false
  if (!EMAIL_RE.test(email.value.trim())) return false
  if (categoryId.value.length === 0) return false
  if (title.value.trim().length === 0) return false
  if (content.value.trim().length === 0) return false
  return true
})

const onCancel = () => {
  modal.close(props.modalId)
}

const onSubmit = async () => {
  if (!canSubmit.value) return
  // 개인정보 동의 미체크 시 제출 불가 + 오류 표시
  if (!agreed.value) {
    showAgreeError.value = true
    return
  }

  submitting.value = true
  try {
    await submitInquiry({
      email: email.value.trim(),
      categoryId: categoryId.value,
      title: title.value.trim(),
      content: content.value.trim(),
      privacyConsent: true,
    })
    toast.success('문의가 접수되었습니다. 감사합니다!')
    modal.close(props.modalId)
  } catch (e) {
    toast.error(e, '문의 접수에 실패했습니다.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form
    class="flex h-full w-full flex-col rounded-none border-none bg-bg-card p-6 shadow-xl md:h-auto md:w-lg md:rounded-2xl md:border md:border-border md:p-10"
    autocomplete="off"
    @submit.prevent="onSubmit"
  >
    <h2 class="text-2xl font-bold text-text-primary">문의 · 건의하기</h2>
    <p class="mt-2 text-sm text-text-secondary">버그 제보나 건의사항을 남겨주세요.</p>

    <!-- 이메일 -->
    <div class="mt-8">
      <Input
        v-model="email"
        label="이메일"
        type="email"
        placeholder="답변받을 이메일을 입력하세요"
        maxlength="254"
        autocomplete="email"
        :invalid="emailInvalid"
      />
      <p v-if="emailInvalid" class="mt-1.5 text-xs text-warning">
        올바른 이메일 형식을 입력해주세요.
      </p>
    </div>

    <!-- 문의 유형 -->
    <div class="mt-5">
      <label for="inquiry-category" class="mb-2 block text-sm font-semibold text-text-primary">
        문의 유형
      </label>
      <select
        id="inquiry-category"
        v-model="categoryId"
        :disabled="loadingCategories"
        class="h-11 w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary transition-colors placeholder:text-text-muted focus:border-brand focus:outline-none disabled:opacity-60"
      >
        <option v-if="loadingCategories" value="">불러오는 중…</option>
        <option v-else-if="categories.length === 0" value="">유형 없음</option>
        <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
    </div>

    <!-- 제목 -->
    <div class="mt-5">
      <Input
        v-model="title"
        label="제목"
        type="text"
        placeholder="제목을 입력하세요"
        maxlength="100"
        autocomplete="off"
      />
    </div>

    <!-- 내용 -->
    <div class="mt-5">
      <label for="inquiry-content" class="mb-2 block text-sm font-semibold text-text-primary">
        내용
      </label>
      <textarea
        id="inquiry-content"
        v-model="content"
        placeholder="내용을 입력하세요"
        maxlength="2000"
        class="h-32 w-full resize-none rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary transition-colors placeholder:text-text-muted focus:border-brand focus:outline-none"
      />
    </div>

    <!-- 개인정보 수집·이용 동의 (필수) -->
    <div class="mt-6">
      <label class="flex cursor-pointer items-start gap-2">
        <input
          v-model="agreed"
          type="checkbox"
          class="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-border accent-brand"
          @change="showAgreeError = false"
        />
        <span class="text-sm font-medium text-text-primary">
          개인정보 수집 및 이용에 동의합니다. <span class="text-warning">(필수)</span>
        </span>
      </label>
      <div class="mt-2 rounded-lg bg-bg-elevated p-3 text-xs leading-relaxed text-text-secondary">
        <p>수집 항목: 이메일 주소</p>
        <p>수집 목적: 문의 접수 및 답변</p>
        <p>보관 기간: 문의 처리 완료 후 1년</p>
        <p class="mt-1 text-text-muted">
          ※ 수집된 개인정보는 문의 처리 외 다른 목적으로 사용되지 않습니다.
        </p>
      </div>
      <p v-if="showAgreeError" class="mt-1.5 text-xs text-warning">
        개인정보 수집·이용에 동의해야 문의를 제출할 수 있습니다.
      </p>
    </div>

    <!-- 액션: 모바일 세로 / 데스크탑 가로 2분할 -->
    <div class="mt-auto flex flex-col gap-3 pt-8 md:mt-8 md:grid md:grid-cols-2 md:pt-0">
      <Button variant="secondary" size="lg" type="button" @click="onCancel"> 취소 </Button>
      <Button variant="primary" size="lg" type="submit" :disabled="!canSubmit"> 보내기 </Button>
    </div>
  </form>
</template>
