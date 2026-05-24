<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { findNoticeById } from '@/shared/lib/notices'
import { ROUTE_NAME } from '@/app/router/router-name'

const route = useRoute()
const notice = computed(() => {
  const id = route.params.id
  if (typeof id !== 'string') return undefined
  return findNoticeById(id)
})
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

    <article v-if="notice">
      <header class="border-b border-border pb-6">
        <div class="mb-3 flex items-center gap-2">
          <span
            v-if="notice.isNew"
            class="rounded-md bg-brand px-2 py-0.5 text-xs font-bold text-on-brand"
          >
            NEW
          </span>
          <span class="text-xs text-text-muted">{{ notice.date }}</span>
        </div>
        <h1 class="text-3xl font-bold text-text-primary">{{ notice.title }}</h1>
      </header>

      <div class="mt-8 whitespace-pre-line text-base leading-relaxed text-text-secondary">
        {{ notice.content }}
      </div>
    </article>

    <div v-else class="py-20 text-center">
      <p class="text-lg font-semibold text-text-primary">공지사항을 찾을 수 없습니다</p>
      <p class="mt-2 text-sm text-text-secondary">삭제되었거나 잘못된 주소일 수 있어요.</p>
    </div>
  </section>
</template>
