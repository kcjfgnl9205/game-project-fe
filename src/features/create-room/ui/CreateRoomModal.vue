<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button } from '@/shared/ui'
import { useModalStore, useAuthStore } from '@/shared/stores'
import { getGuestNickname, setGuestNickname } from '@/shared/lib/guest'
import type { CreateRoomRequest } from '@/entities/room/model'

interface Props {
  modalId: number
  gameId: string
}
const props = defineProps<Props>()

const modal = useModalStore()
const auth = useAuthStore()
const isGuest = computed(() => !auth.isAuthenticated)

const name = ref('')
const maxPlayers = ref(4)
const drawTimeSec = ref(60)
const isPrivate = ref(false)
const password = ref('')
const nickname = ref(isGuest.value ? getGuestNickname() : '')

const MAX_PLAYER_OPTIONS = [2, 3, 4, 5, 6, 7, 8]
const DRAW_TIME_OPTIONS = [30, 60, 90, 120, 180]

const canSubmit = computed(() => {
  if (name.value.trim().length === 0) return false
  if (isPrivate.value && password.value.trim().length === 0) return false
  if (isGuest.value && nickname.value.trim().length === 0) return false
  return true
})

const onCancel = () => {
  modal.close(props.modalId, undefined)
}

const onSubmit = () => {
  if (!canSubmit.value) return

  const result: CreateRoomRequest = {
    name: name.value.trim(),
    maxPlayers: maxPlayers.value,
    drawTimeSec: drawTimeSec.value,
    isPrivate: isPrivate.value,
    password: isPrivate.value ? password.value.trim() : undefined,
  }

  if (isGuest.value) {
    const nick = nickname.value.trim()
    setGuestNickname(nick) // 다음 입장/생성 때 재사용
    result.nickname = nick
  }

  modal.close(props.modalId, result)
}
</script>

<template>
  <form
    class="flex h-full w-full flex-col rounded-none border-none bg-bg-card p-6 shadow-xl md:h-auto md:w-lg md:rounded-2xl md:border md:border-border md:p-10"
    autocomplete="off"
    @submit.prevent="onSubmit"
  >
    <h2 class="text-2xl font-bold text-text-primary">새 방 만들기</h2>

    <input type="hidden" :value="gameId" />

    <!-- 방 이름 -->
    <div class="mt-8">
      <label for="create-room-name" class="block text-sm font-semibold text-text-primary">
        방 이름
      </label>
      <input
        id="create-room-name"
        v-model="name"
        type="text"
        placeholder="방 이름을 입력하세요"
        maxlength="50"
        autocomplete="off"
        autofocus
        class="mt-3 h-12 w-full rounded-xl border border-border bg-bg-elevated px-4 text-sm text-text-primary transition-colors placeholder:text-text-muted focus:border-brand focus:outline-none"
      />
    </div>

    <!-- 게스트 닉네임 -->
    <div v-if="isGuest" class="mt-5">
      <label for="create-room-nickname" class="block text-sm font-semibold text-text-primary">
        닉네임
      </label>
      <input
        id="create-room-nickname"
        v-model="nickname"
        type="text"
        placeholder="표시할 닉네임"
        maxlength="30"
        autocomplete="off"
        class="mt-3 h-12 w-full rounded-xl border border-border bg-bg-elevated px-4 text-sm text-text-primary transition-colors placeholder:text-text-muted focus:border-brand focus:outline-none"
      />
    </div>

    <!-- 인원 / 그리기 시간 -->
    <div class="mt-5 grid grid-cols-2 gap-4">
      <div>
        <label for="create-room-max" class="block text-sm font-semibold text-text-primary">
          최대 인원
        </label>
        <select
          id="create-room-max"
          v-model.number="maxPlayers"
          class="mt-3 h-12 w-full rounded-xl border border-border bg-bg-elevated px-4 text-sm text-text-primary focus:border-brand focus:outline-none"
        >
          <option v-for="n in MAX_PLAYER_OPTIONS" :key="n" :value="n">{{ n }}명</option>
        </select>
      </div>
      <div>
        <label for="create-room-time" class="block text-sm font-semibold text-text-primary">
          그리기 시간
        </label>
        <select
          id="create-room-time"
          v-model.number="drawTimeSec"
          class="mt-3 h-12 w-full rounded-xl border border-border bg-bg-elevated px-4 text-sm text-text-primary focus:border-brand focus:outline-none"
        >
          <option v-for="s in DRAW_TIME_OPTIONS" :key="s" :value="s">{{ s }}초</option>
        </select>
      </div>
    </div>

    <!-- 비밀 방 토글 -->
    <div class="mt-5 rounded-xl border border-border bg-bg-elevated p-4">
      <label class="flex cursor-pointer items-center gap-4" :class="{ 'mb-3': isPrivate }">
        <span
          class="text-2xl"
          :class="isPrivate ? 'text-warning' : 'text-text-muted'"
          aria-hidden="true"
        >
          🔒
        </span>
        <div class="flex-1">
          <p class="text-sm font-semibold text-text-primary">비밀 방</p>
          <p class="mt-0.5 text-xs text-text-secondary">비밀번호를 설정합니다</p>
        </div>
        <span class="relative inline-block h-7 w-12 shrink-0">
          <input v-model="isPrivate" type="checkbox" class="peer sr-only" />
          <span
            class="absolute inset-0 rounded-full bg-bg-card transition-colors peer-checked:bg-brand"
          />
          <span
            class="absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5"
          />
        </span>
      </label>

      <input
        v-if="isPrivate"
        v-model="password"
        type="password"
        placeholder="비밀번호를 입력하세요"
        maxlength="20"
        autocomplete="new-password"
        class="h-11 w-full rounded-lg border border-border bg-bg-card px-4 text-sm text-text-primary transition-colors placeholder:text-text-muted focus:border-brand focus:outline-none"
      />
    </div>

    <!-- 액션: 모바일 세로 / 데스크탑 가로 2분할 -->
    <div class="mt-auto flex flex-col gap-3 pt-8 md:mt-8 md:grid md:grid-cols-2 md:pt-0">
      <Button variant="secondary" size="lg" type="button" @click="onCancel"> 취소 </Button>
      <Button variant="primary" size="lg" type="submit" :disabled="!canSubmit"> 만들기 </Button>
    </div>
  </form>
</template>
