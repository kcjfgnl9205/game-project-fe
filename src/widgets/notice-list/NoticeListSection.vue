<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchNotices } from '@/entities/notice/api'
import type { Notice } from '@/entities/notice/model'
import { ROUTE_NAME } from '@/app/router/router-name'
import { ApiError } from '@/shared/api'
import { formatDate } from '@/shared/utils'

interface Props {
  showViewAll?: boolean
}
withDefaults(defineProps<Props>(), {
  showViewAll: true,
})

const notices = ref<Notice[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    const { items } = await fetchNotices()
    notices.value = items
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : '공지사항을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="mx-auto max-w-7xl px-6 py-20">
    <header class="mb-8 flex items-center justify-between">
      <h2 class="inline-flex items-center gap-3 text-3xl font-bold text-text-primary">
        <span class="text-brand" aria-hidden="true">🔔</span>
        공지사항
      </h2>
      <RouterLink
        v-if="showViewAll"
        :to="{ name: ROUTE_NAME.NOTICE }"
        class="text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        전체보기
      </RouterLink>
    </header>

    <p v-if="loading" class="py-10 text-center text-sm text-text-muted">불러오는 중…</p>
    <p v-else-if="error" class="py-10 text-center text-sm text-red-500">{{ error }}</p>
    <p v-else-if="notices.length === 0" class="py-10 text-center text-sm text-text-muted">
      등록된 공지사항이 없습니다.
    </p>

    <ul v-else class="space-y-3">
      <li v-for="notice in notices" :key="notice.id">
        <RouterLink
          :to="{ name: ROUTE_NAME.NOTICE_DETAIL, params: { id: notice.id } }"
          class="flex items-center justify-between rounded-2xl border border-border bg-bg-card px-6 py-4 transition-colors hover:bg-bg-card-hover"
        >
          <span class="text-sm text-text-primary">{{ notice.title }}</span>
          <span class="text-xs text-text-muted">{{ formatDate(notice.createdAt) }}</span>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>
