<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/shared/stores'
import { useNavigation } from '@/shared/composables'
import { Button } from '@/shared/ui'

const auth = useAuthStore()
const nav = useNavigation()

const email = ref('')
const password = ref('')
const submitting = ref(false)

async function onSubmit() {
  submitting.value = true
  try {
    await auth.login({ email: email.value, password: password.value })
    await nav.toHome()
  } catch {
    // 실패 사유는 auth.error에 담겨 화면에 노출된다.
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center gap-6 px-4">
    <h1 class="text-2xl font-bold text-text-primary">로그인</h1>

    <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
      <input
        v-model="email"
        type="email"
        autocomplete="email"
        required
        placeholder="이메일"
        class="h-11 rounded-xl border border-border-strong bg-bg-card px-4 text-sm text-text-primary"
      />
      <input
        v-model="password"
        type="password"
        autocomplete="current-password"
        required
        placeholder="비밀번호"
        class="h-11 rounded-xl border border-border-strong bg-bg-card px-4 text-sm text-text-primary"
      />

      <p v-if="auth.error" class="text-sm text-red-500">{{ auth.error }}</p>

      <Button type="submit" :glow="true" class="w-full">
        {{ submitting ? '로그인 중…' : '로그인' }}
      </Button>
    </form>
  </div>
</template>
