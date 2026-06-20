import { defineStore } from 'pinia'
import { ref } from 'vue'
import { io, type Socket } from 'socket.io-client'

// ===== 타입 =====
export type Phase = 'LOBBY' | 'PLAYING' | 'END'
export type Mode = 'ROUND' | 'TOURNAMENT'

export interface LobbyPlayer {
  playerId: string
  nickname: string
  isHost: boolean
  isPlaying: boolean
  isAlive: boolean
  wins: number
}

export interface ChatLine {
  key: number
  system?: boolean
  senderId?: string
  nickname?: string
  text: string
}

export interface ChainWord {
  key: number
  by: string
  nickname?: string
  word: string
  definition: string
}

// 참가자 카드 표시용 뷰 모델
export interface Participant {
  id: string
  nickname: string
  isHost: boolean
  isMe: boolean
  isTurn: boolean
  isAlive: boolean
  wins: number
}

export interface GameResult {
  winnerKey: string | null
  winnerName: string | null
  wins: { playerId: string; wins: number }[]
}

interface SocketAuth {
  token?: string
  guestId?: string
  nickname: string
}

interface LobbyState {
  status: Phase
  hostKey: string | null
  mode: Mode
  roundCount: number
  round: number
  turnTimeSec: number
  allowKillerWord: boolean
  currentTurnKey: string | null
  requiredStarts: string[] | null
  lastWord: string | null
  usedCount: number
  turnEndsAt: number | null
  startAt: number | null
  winnerKey: string | null
  players: LobbyPlayer[]
}

let socket: Socket | null = null
let seq = 0

export const useGameStore = defineStore('word-chain-game', () => {
  const ready = ref(false)
  const status = ref<Phase>('LOBBY')
  const hostKey = ref<string | null>(null)
  const mode = ref<Mode>('ROUND')
  const roundCount = ref(0)
  const round = ref(0)
  const turnTimeSec = ref(15)
  const allowKillerWord = ref(false)
  const currentTurnKey = ref<string | null>(null)
  const requiredStarts = ref<string[] | null>(null)
  const lastWord = ref<string | null>(null)
  const turnEndsAt = ref<number | null>(null)
  const winnerKey = ref<string | null>(null)

  const players = ref<LobbyPlayer[]>([])
  const chat = ref<ChatLine[]>([])
  const chainWords = ref<ChainWord[]>([]) // 이번 라운드 채택 단어들 (뜻 포함)
  const error = ref<string | null>(null)
  const rejectMsg = ref<string | null>(null)
  const result = ref<GameResult | null>(null)

  let rejectTimer: ReturnType<typeof setTimeout> | null = null

  function reset() {
    ready.value = false
    status.value = 'LOBBY'
    hostKey.value = null
    roundCount.value = 0
    round.value = 0
    currentTurnKey.value = null
    requiredStarts.value = null
    lastWord.value = null
    turnEndsAt.value = null
    winnerKey.value = null
    players.value = []
    chat.value = []
    chainWords.value = []
    error.value = null
    rejectMsg.value = null
    result.value = null
  }

  function pushSystem(text: string) {
    chat.value.push({ key: seq++, system: true, text })
  }

  function connect(roomId: string, auth: SocketAuth) {
    if (socket) return
    reset()

    // env VITE_WS_URL은 sketch-pic 기준 → word-chain 네임스페이스로 교체
    const configured = (import.meta.env.VITE_WS_URL as string) || ''
    let wsUrl = configured.trim().replace(/\/sketch-pic$/, '/word-chain')
    if (!wsUrl && typeof window !== 'undefined') {
      wsUrl = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/word-chain`
    }

    socket = io(wsUrl, {
      auth: { roomId, ...auth },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    })

    socket.on('connect', () => (error.value = null))
    socket.on('connect_error', (e: Error) => {
      error.value = e.message || '소켓 연결에 실패했습니다.'
    })
    socket.on('disconnect', (reason: string) => {
      if (reason !== 'io client disconnect') error.value = `연결이 끊어졌습니다: ${reason}`
    })
    socket.on('error', (e: { message?: string }) => {
      error.value = e.message ?? '오류가 발생했습니다.'
    })

    socket.on('lobby:state', (s: LobbyState) => {
      ready.value = true
      // 새 라운드 시작(사용 단어 0) → 체인 표시 초기화
      if (s.usedCount === 0) chainWords.value = []
      // 새 게임 진행 시작 → 이전 결과 모달 닫기
      if (s.status === 'PLAYING') result.value = null
      status.value = s.status
      hostKey.value = s.hostKey
      mode.value = s.mode
      roundCount.value = s.roundCount
      round.value = s.round
      turnTimeSec.value = s.turnTimeSec
      allowKillerWord.value = s.allowKillerWord
      currentTurnKey.value = s.currentTurnKey
      requiredStarts.value = s.requiredStarts
      lastWord.value = s.lastWord
      turnEndsAt.value = s.turnEndsAt
      winnerKey.value = s.winnerKey
      players.value = s.players
    })

    socket.on('chat:message', (m: { senderId: string; nickname: string; text: string }) => {
      chat.value.push({ key: seq++, senderId: m.senderId, nickname: m.nickname, text: m.text })
    })
    socket.on('chat:system', (m: { text: string }) => pushSystem(m.text))

    socket.on(
      'word:accepted',
      (w: { by: string; nickname?: string; word: string; definition: string }) => {
        chainWords.value.push({ key: seq++, ...w })
      },
    )
    socket.on('word:rejected', (r: { reason: string }) => {
      rejectMsg.value = r.reason
      if (rejectTimer) clearTimeout(rejectTimer)
      rejectTimer = setTimeout(() => (rejectMsg.value = null), 2500)
    })

    socket.on('round:end', (r: { round: number; winnerName: string | null }) => {
      pushSystem(r.winnerName ? `${r.round}라운드 승자: ${r.winnerName}` : `${r.round}라운드 종료`)
    })
    socket.on('game:end', (r: GameResult) => {
      result.value = r
    })
  }

  function disconnect() {
    if (rejectTimer) clearTimeout(rejectTimer)
    socket?.disconnect()
    socket = null
    reset()
  }

  // ===== 액션 =====
  function startGame() {
    socket?.emit('game:start')
  }
  function submitWord(word: string) {
    const w = word.trim()
    if (w) socket?.emit('word:submit', { word: w })
  }
  function sendChat(text: string) {
    const t = text.trim()
    if (t) socket?.emit('chat:send', { text: t })
  }

  return {
    ready,
    status,
    hostKey,
    mode,
    roundCount,
    round,
    turnTimeSec,
    allowKillerWord,
    currentTurnKey,
    requiredStarts,
    lastWord,
    turnEndsAt,
    winnerKey,
    players,
    chat,
    chainWords,
    error,
    rejectMsg,
    result,
    connect,
    disconnect,
    startGame,
    submitWord,
    sendChat,
  }
})
