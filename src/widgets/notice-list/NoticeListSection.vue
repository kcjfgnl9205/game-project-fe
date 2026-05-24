<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { notices } from '@/shared/lib/notices'
import { ROUTE_NAME } from '@/app/router/router-name'

interface Props {
  showViewAll?: boolean
}
withDefaults(defineProps<Props>(), {
  showViewAll: true,
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

    <ul class="space-y-3">
      <li v-for="notice in notices" :key="notice.id">
        <RouterLink
          :to="{ name: ROUTE_NAME.NOTICE_DETAIL, params: { id: notice.id } }"
          class="flex items-center justify-between rounded-2xl border border-border bg-bg-card px-6 py-4 transition-colors hover:bg-bg-card-hover"
        >
          <div class="flex items-center gap-3">
            <span
              v-if="notice.isNew"
              class="rounded-md bg-brand px-2 py-0.5 text-xs font-bold text-on-brand"
            >
              NEW
            </span>
            <span class="text-sm text-text-primary">{{ notice.title }}</span>
          </div>
          <span class="text-xs text-text-muted">{{ notice.date }}</span>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>
