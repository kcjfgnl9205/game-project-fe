<script setup lang="ts">
import { ref, useId } from 'vue'
import { icons, type IconName } from '@/shared/ui/icons'

interface Props {
  label?: string
  invalid?: boolean
  icon?: IconName // 텍스트 왼쪽에 표시할 아이콘 이름(레지스트리 등록명)
}

defineOptions({ inheritAttrs: false })

// label: 있으면 입력칸 위에 라벨을 렌더하고 input과 연결(for/id)한다.
// icon: 레지스트리에 등록된 아이콘 이름(예: "search"). 있으면 왼쪽에 표시한다.
withDefaults(defineProps<Props>(), {
  invalid: false,
})

const model = defineModel<string>()
const inputId = useId()

// 부모에서 focus() 호출 가능하게 노출 (모달 자동 포커스 등)
const el = ref<HTMLInputElement | null>(null)
defineExpose({ focus: () => el.value?.focus() })
</script>

<template>
  <div class="w-full">
    <label v-if="label" :for="inputId" class="mb-2 block text-sm font-semibold text-text-primary">
      {{ label }}
    </label>
    <div class="relative">
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
        :id="inputId"
        class="h-11 w-full rounded-lg border bg-bg-elevated text-sm text-text-primary transition-colors placeholder:text-text-muted focus:outline-none"
        :class="[
          invalid ? 'border-warning focus:border-warning' : 'border-border focus:border-brand',
          icon ? 'pr-3 pl-9' : 'px-3',
        ]"
      />
    </div>
  </div>
</template>
