<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { fetchNotice } from '@/entities/notice/api'
import type { Notice } from '@/entities/notice/model'
import { ROUTE_NAME } from '@/app/router/router-name'
import { ApiError } from '@/shared/api'
import { formatDate } from '@/shared/utils'

const route = useRoute()
const notice = ref<Notice | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

async function load(id: string) {
  loading.value = true
  error.value = null
  try {
    notice.value = await fetchNotice(id)
  } catch (e) {
    notice.value = null
    error.value = e instanceof ApiError ? e.message : '공지사항을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

// 같은 라우트에서 id만 바뀌어도 다시 불러온다.
watch(
  () => route.params.id,
  (id) => {
    if (typeof id === 'string') load(id)
  },
  { immediate: true },
)
</script>

<template>
  <section class="mx-auto max-w-7xl px-6 py-20">
    <RouterLink
      :to="{ name: ROUTE_NAME.NOTICE }"
      class="mb-8 inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-text-primary"
    >
      <span aria-hidden="true">‹</span>
      목록으로
    </RouterLink>

    <p v-if="loading" class="py-20 text-center text-sm text-text-muted">불러오는 중…</p>

    <article v-else-if="notice">
      <header class="border-b border-border pb-6">
        <div class="mb-3 flex items-center gap-2">
          <span class="text-xs text-text-muted">{{ formatDate(notice.createdAt) }}</span>
        </div>
        <h1 class="text-3xl font-bold text-text-primary">{{ notice.title }}</h1>
      </header>

      <div class="mt-8 whitespace-pre-line text-base leading-relaxed text-text-secondary">
        {{ notice.content }}
      </div>
    </article>

    <div v-else class="py-20 text-center">
      <p class="text-lg font-semibold text-text-primary">공지사항을 찾을 수 없습니다</p>
      <p class="mt-2 text-sm text-text-secondary">
        {{ error ?? '삭제되었거나 잘못된 주소일 수 있어요.' }}
      </p>
    </div>
  </section>
</template>
