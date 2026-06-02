import { ref } from 'vue'
import { defineStore } from 'pinia'
import { io, type Socket } from 'socket.io-client'

// 한 방의 게임 진행 단계(서버 인메모리 phase).
// LOBBY=대기, WORD_SELECT=출제어 선택, DRAWING=그리는 중, REVEAL=정답 공개.
// WORD_SELECT→DRAWING→REVEAL이 한 턴을 이루며 반복, game:stop/인원<2면 LOBBY 복귀.
export type GamePhase = 'LOBBY' | 'WORD_SELECT' | 'DRAWING' | 'REVEAL'

/** lobby:state.players 항목. playerId는 user:<id> | guest:<id>. */
export interface LobbyPlayer {
  playerId: string
  type: 'user' | 'guest'
  nickname: string
  isHost: boolean
  score: number
}

export interface ChatLine {
  key: number
  senderId: string
  nickname: string
  text: string
}

interface LobbyState {
  status: GamePhase
  hostKey: string
  turnCount: number
  currentDrawerKey: string | null
  players: LobbyPlayer[]
}

interface SocketAuth {
  token?: string
  guestId?: string
  nickname: string
}

// socket은 반응형일 필요가 없어 모듈 스코프에 둔다.
let socket: Socket | null = null
let chatSeq = 0

export const useGameStore = defineStore('sketch-pick-game', () => {
  const status = ref<GamePhase>('LOBBY')
  const players = ref<LobbyPlayer[]>([])
  const hostKey = ref<string | null>(null)
  const currentDrawerKey = ref<string | null>(null)
  const turnCount = ref(0)
  const chat = ref<ChatLine[]>([])
  const error = ref<string | null>(null)

  function reset() {
    status.value = 'LOBBY'
    players.value = []
    hostKey.value = null
    currentDrawerKey.value = null
    turnCount.value = 0
    chat.value = []
    error.value = null
  }

  function connect(roomId: string, auth: SocketAuth) {
    if (socket) return // 이미 연결됨 (중복 연결 방지)
    reset()

    socket = io(import.meta.env.VITE_WS_URL, {
      auth: { roomId, ...auth },
      transports: ['websocket'],
    })

    socket.on('lobby:state', (state: LobbyState) => {
      status.value = state.status
      hostKey.value = state.hostKey
      currentDrawerKey.value = state.currentDrawerKey
      turnCount.value = state.turnCount
      players.value = state.players
    })

    socket.on('chat:message', (msg: { senderId: string; nickname: string; text: string }) => {
      chat.value.push({ key: chatSeq++, ...msg })
    })

    socket.on('error', (e: { code?: string; message?: string }) => {
      error.value = e.message ?? '오류가 발생했습니다.'
    })
  }

  function sendChat(text: string) {
    const trimmed = text.trim()
    if (trimmed) socket?.emit('chat:send', { text: trimmed })
  }

  function startGame() {
    socket?.emit('game:start')
  }

  function disconnect() {
    socket?.close()
    socket = null
    reset()
  }

  return {
    status,
    players,
    hostKey,
    currentDrawerKey,
    turnCount,
    chat,
    error,
    connect,
    sendChat,
    startGame,
    disconnect,
  }
})
