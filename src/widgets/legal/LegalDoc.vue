<script setup lang="ts">
// 약관/방침 등 법적 문서 공통 레이아웃. 본문은 슬롯으로 받는다.
defineProps<{ title: string; effectiveDate: string }>()
</script>

<template>
  <div class="mx-auto max-w-3xl px-6 py-10 md:py-14">
    <h1 class="text-2xl font-bold text-text-primary">{{ title }}</h1>
    <p class="mt-2 text-sm text-text-muted">시행일: {{ effectiveDate }}</p>
    <div class="legal mt-8 text-sm leading-relaxed text-text-secondary">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.legal :deep(h2) {
  margin-top: 2rem;
  margin-bottom: 0.5rem;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text-primary);
}
.legal :deep(h2:first-child) {
  margin-top: 0;
}
.legal :deep(p) {
  margin-top: 0.5rem;
}
.legal :deep(ul) {
  margin-top: 0.5rem;
  list-style: disc;
  padding-left: 1.25rem;
}
.legal :deep(ol) {
  margin-top: 0.5rem;
  list-style: decimal;
  padding-left: 1.25rem;
}
.legal :deep(li) {
  margin-top: 0.25rem;
}
.legal :deep(table) {
  width: 100%;
  margin-top: 0.75rem;
  border-collapse: collapse;
}
.legal :deep(th),
.legal :deep(td) {
  border: 1px solid var(--color-border);
  padding: 0.5rem 0.75rem;
  text-align: left;
  vertical-align: top;
}
.legal :deep(th) {
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  font-weight: 600;
}
.legal :deep(strong) {
  color: var(--color-text-primary);
  font-weight: 600;
}
</style>
