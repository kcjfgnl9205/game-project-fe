<script setup lang="ts">
import { Button } from '@/shared/ui'
</script>

<template>
  <section class="mx-auto max-w-7xl px-6 py-20">
    <div
      class="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-bg-card via-bg-card to-bg-elevated p-16 text-center"
    >
      <div
        class="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_center,var(--color-brand-soft),transparent_60%)]"
        aria-hidden="true"
      />
      <div class="relative">
        <span class="inline-block text-4xl text-warning" aria-hidden="true">★</span>
        <h2 class="mt-4 text-3xl font-bold text-text-primary md:text-4xl">지금 바로 시작하세요!</h2>
        <p class="mt-3 text-sm text-text-secondary md:text-base">
          회원가입 없이도 게임을 즐길 수 있어요. 친구를 초대해서 함께 플레이해보세요!
        </p>
        <div class="mt-8 flex justify-center">
          <Button variant="primary" size="lg">
            그림 맞추기 시작하기
            <span aria-hidden="true">›</span>
          </Button>
        </div>
      </div>
    </div>
  </section>
</template>
