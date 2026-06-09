<script setup lang="ts">
import { useModalStore } from '@/shared/stores'
import { useNavigation } from '@/shared/composables'
import { InquiryModal } from '@/features/inquiry'

const year = new Date().getFullYear()
const modal = useModalStore()
const nav = useNavigation()

const openInquiry = () => {
  modal.open(InquiryModal)
}
</script>

<template>
  <footer class="bg-bg border-t border-border">
    <div
      class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-8 md:flex-row"
    >
      <div class="flex items-center gap-2 text-sm text-text-primary">
        <span class="text-brand" aria-hidden="true">🎮</span>
        <span class="font-semibold">놀모아</span>
      </div>
      <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <button
          type="button"
          class="text-xs text-text-muted transition-colors hover:text-text-primary"
          @click="nav.toTerms()"
        >
          이용약관
        </button>
        <button
          type="button"
          class="text-xs font-semibold text-text-secondary transition-colors hover:text-text-primary"
          @click="nav.toPrivacy()"
        >
          개인정보 처리방침
        </button>
        <button
          type="button"
          class="text-xs text-text-muted transition-colors hover:text-text-primary"
          @click="openInquiry"
        >
          문의하기
        </button>
        <p class="text-xs text-text-muted">© {{ year }} 놀모아. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>
