<script setup lang="ts">
import { ref } from 'vue'
import { icons, type IconName } from '@/shared/ui/icons'

defineOptions({ inheritAttrs: false })

// icon: 레지스트리에 등록된 아이콘 이름(예: "search"). 있으면 왼쪽에 표시한다.
withDefaults(defineProps<{ invalid?: boolean; icon?: IconName }>(), { invalid: false })

const model = defineModel<string>()

// 부모에서 focus() 호출 가능하게 노출 (모달 자동 포커스 등)
const el = ref<HTMLInputElement | null>(null)
defineExpose({ focus: () => el.value?.focus() })
</script>

<template>
  <div class="relative w-full">
    <component
      :is="icons[icon]"
      v-if="icon"
      class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
      aria-hidden="true"
    />
    <input
      ref="el"
      v-model="model"
      v-bind="$attrs"
      class="h-11 w-full rounded-lg border bg-bg-elevated text-sm text-text-primary transition-colors placeholder:text-text-muted focus:outline-none"
      :class="[
        invalid ? 'border-warning focus:border-warning' : 'border-border focus:border-brand',
        icon ? 'pr-3 pl-9' : 'px-3',
      ]"
    />
  </div>
</template>
