<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button, Input } from '@/shared/ui'
import { useModalStore, useAuthStore } from '@/shared/stores'
import { getGuestNickname, setGuestNickname } from '@/shared/lib/guest'
import { games } from '@/shared/lib/games'
import { CONFIG_FORMS } from '@/features/create-room/config-forms'
import type { CreateRoomRequest, RoomConfig } from '@/entities/room/model'

interface Props {
  modalId: number
  gameId: string
}
const props = defineProps<Props>()

const modal = useModalStore()
const auth = useAuthStore()
const isGuest = computed(() => !auth.isAuthenticated)

// 모달 수명 동안 gameId는 고정 → 한 번만 조회한다.
const game = games.find((g) => g.id === props.gameId)
// 게임별 설정 폼 (없으면 설정 섹션 미표시). 게임 추가 시 이 모달은 안 바뀜.
const configForm = game?.gameType ? CONFIG_FORMS[game.gameType] : undefined
const minP = game?.minPlayers ?? 2
const maxP = game?.maxPlayers ?? 8
const MAX_PLAYER_OPTIONS = Array.from({ length: maxP - minP + 1 }, (_, i) => minP + i)

const name = ref('')
const maxPlayers = ref(Math.min(Math.max(4, minP), maxP))
const isPrivate = ref(false)
const password = ref('')
const nickname = ref(isGuest.value ? getGuestNickname() : '')
const config = ref<RoomConfig>({}) // 게임별 폼이 채운다 (v-model)

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
    gameType: game?.gameType,
    name: name.value.trim(),
    maxPlayers: maxPlayers.value,
    isPrivate: isPrivate.value,
    password: isPrivate.value ? password.value.trim() : undefined,
    config: config.value,
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
      <Input
        v-model="name"
        label="방 이름"
        type="text"
        placeholder="방 이름을 입력하세요"
        maxlength="50"
        autocomplete="off"
        autofocus
      />
    </div>

    <!-- 게스트 닉네임 -->
    <div v-if="isGuest" class="mt-5">
      <Input
        v-model="nickname"
        label="닉네임"
        type="text"
        placeholder="표시할 닉네임"
        maxlength="30"
        autocomplete="off"
      />
    </div>

    <!-- 최대 인원 (공통) -->
    <div class="mt-5">
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

    <!-- 게임별 설정 (게임이 자기 폼을 제공) -->
    <div v-if="configForm" class="mt-5">
      <component :is="configForm" v-model="config" />
    </div>

    <!-- 비밀 방 토글 -->
    <div class="mt-5 rounded-xl border border-border bg-bg-elevated p-4">
      <label class="flex cursor-pointer items-center gap-4" :class="{ 'mb-3': isPrivate }">
        <i-local-lock />
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

      <Input
        v-if="isPrivate"
        v-model="password"
        type="password"
        placeholder="비밀번호를 입력하세요"
        maxlength="20"
        autocomplete="new-password"
      />
    </div>

    <!-- 액션: 모바일 세로 / 데스크탑 가로 2분할 -->
    <div class="mt-auto flex flex-col gap-3 pt-8 md:mt-8 md:grid md:grid-cols-2 md:pt-0">
      <Button variant="secondary" size="lg" type="button" @click="onCancel"> 취소 </Button>
      <Button variant="primary" size="lg" type="submit" :disabled="!canSubmit"> 만들기 </Button>
    </div>
  </form>
</template>
