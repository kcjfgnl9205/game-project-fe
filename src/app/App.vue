<script setup lang="ts">
import { RouterView } from 'vue-router'
import { BaseModal } from '@/shared/ui-modal'
import Toast from '@/shared/ui/Toast.vue'
</script>

<template>
  <RouterView />
  <BaseModal />
  <Toast />
</template>
