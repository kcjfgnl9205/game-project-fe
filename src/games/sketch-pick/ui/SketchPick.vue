<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import SketchPickHeader from './SketchPickHeader.vue'
import SketchPickParticipants from './SketchPickParticipants.vue'
import SketchPickCanvas from './SketchPickCanvas.vue'
import SketchPickChat from './SketchPickChat.vue'
import {
  PROMPT,
  chatMessages,
  participants,
} from '@/games/sketch-pick/model/mock'

const seconds = ref(56)
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timer = setInterval(() => {
    if (seconds.value > 0) seconds.value -= 1
    else if (timer) clearInterval(timer)
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="flex h-dvh flex-col">
    <SketchPickHeader
      game-name="스케치픽"
      game-icon="🎨"
      :current-players="participants.length"
      :max-players="8"
      :seconds="seconds"
    />

    <div class="flex flex-1 overflow-hidden">
      <SketchPickParticipants :participants="participants" />
      <SketchPickCanvas :prompt="PROMPT" />
      <SketchPickChat :messages="chatMessages" />
    </div>
  </div>
</template>
