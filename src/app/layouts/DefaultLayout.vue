<script setup lang="ts">
import { RouterView } from 'vue-router'
import { LandingFooter, LandingHeader } from '@/widgets/landing'
</script>

<template>
  <div class="flex min-h-screen flex-col bg-bg text-text-primary">
    <LandingHeader />
    <main class="flex-1">
      <RouterView />
    </main>
    <LandingFooter />
  </div>
</template>
