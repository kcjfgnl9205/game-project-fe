import { defineStore } from 'pinia'
import { ref } from 'vue'
import { io, type Socket } from 'socket.io-client'

// ===== 타입 =====
export type Phase = 'LOBBY' | 'DRAWING' | 'VOTE' | 'RESULT'

export interface LobbyPlayer {
  playerId: string
  nickname: string
  isHost: boolean
  isPlaying: boolean // 이번 게임 참가자(turnOrder)인지
}

export interface ChatLine {
  key: number
  system?: boolean
  senderId?: string
  nickname?: string
  text: string
}

export interface VoteCandidate {
  key: string
  nickname: string
}

export interface GameResult {
  mafiaKey: string | null
  civilianWord: string | null
  mafiaWord: string | null
  accusedKeys: string[] // 최다 득표자(들). 동률이면 여러 명
  votes: Record<string, string>
  winner: 'CIVILIAN' | 'MAFIA'
}

// 참가자 카드 표시용 뷰 모델
export interface Participant {
  id: string
  nickname: string
  isHost: boolean
  isPlaying: boolean
  isMe: boolean
  isTurn: boolean
}

// 한 획 = 세그먼트 배열 (한 번의 연속 드래그)
export interface Segment {
  x0: number
  y0: number
  x1: number
  y1: number
}
export type Stroke = Segment[]

interface SocketAuth {
  token?: string
  guestId?: string
  nickname: string
}

let socket: Socket | null = null
let chatSeq = 0
// 공유 캔버스 콜백: 원격 한 획 수신 / 접속 시 히스토리 일괄 수신
let remoteStrokeCb: ((seg: Stroke, by: string) => void) | null = null
let historyCb: ((strokes: { by: string; seg: Stroke }[]) => void) | null = null

export const useGameStore = defineStore('who-drew-game', () => {
  const status = ref<Phase>('LOBBY')
  const hostKey = ref<string | null>(null)
  const rounds = ref(0)
  const currentRound = ref(0)
  const currentTurnKey = ref<string | null>(null)
  const turnEndsAt = ref<number | null>(null)
  const startAt = ref<number | null>(null)

  const players = ref<LobbyPlayer[]>([])
  const chat = ref<ChatLine[]>([])
  const error = ref<string | null>(null)

  // 내 역할/단어 (개인 수신)
  const role = ref<{ isMafia: boolean; word: string | null } | null>(null)

  // 투표
  const candidates = ref<VoteCandidate[]>([])
  const voteInfo = ref<{ voted: number; total: number }>({ voted: 0, total: 0 })
  const myVote = ref<string | null>(null)

  // 결과
  const result = ref<GameResult | null>(null)

  function reset() {
    status.value = 'LOBBY'
    hostKey.value = null
    rounds.value = 0
    currentRound.value = 0
    currentTurnKey.value = null
    turnEndsAt.value = null
    startAt.value = null
    players.value = []
    chat.value = []
    error.value = null
    role.value = null
    candidates.value = []
    voteInfo.value = { voted: 0, total: 0 }
    myVote.value = null
    result.value = null
  }

  function pushSystem(text: string) {
    chat.value.push({ key: chatSeq++, system: true, text })
  }

  function connect(roomId: string, auth: SocketAuth) {
    if (socket) return
    reset()

    // env VITE_WS_URL은 sketch-pic 기준이라 who-drew 네임스페이스로 교체한다.
    const configured = (import.meta.env.VITE_WS_URL as string) || ''
    let wsUrl = configured.trim().replace(/\/sketch-pic$/, '/who-drew')
    if (!wsUrl && typeof window !== 'undefined') {
      wsUrl = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/who-drew`
    }

    const transports = import.meta.env.DEV ? ['websocket'] : ['polling', 'websocket']
    socket = io(wsUrl, {
      auth: { roomId, ...auth },
      transports,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    })

    socket.on('connect', () => {
      error.value = null
    })
    socket.on('connect_error', (e: Error) => {
      error.value = e.message || '소켓 연결에 실패했습니다.'
    })
    socket.on('disconnect', (reason: string) => {
      if (reason !== 'io client disconnect') {
        error.value = `소켓 연결이 끊어졌습니다: ${reason}`
      }
    })
    socket.on('error', (e: { code?: string; message?: string }) => {
      error.value = e.message ?? '오류가 발생했습니다.'
    })

    socket.on('lobby:state', (s: LobbyState) => {
      status.value = s.status
      hostKey.value = s.hostKey
      rounds.value = s.rounds
      currentRound.value = s.currentRound
      currentTurnKey.value = s.currentTurnKey
      turnEndsAt.value = s.turnEndsAt
      startAt.value = s.startAt
      players.value = s.players
    })

    socket.on('chat:message', (m: { senderId: string; nickname: string; text: string }) => {
      chat.value.push({
        key: chatSeq++,
        senderId: m.senderId,
        nickname: m.nickname,
        text: m.text,
      })
    })
    socket.on('chat:system', (m: { text: string }) => pushSystem(m.text))

    socket.on('game:started', () => {
      result.value = null
      myVote.value = null
      candidates.value = []
      historyCb?.([]) // 새 게임 → 공유 캔버스 비우기
    })

    socket.on('role:info', (r: { isMafia: boolean; word: string | null }) => {
      role.value = r
    })

    socket.on('turn:current', (t: { turnKey: string; currentRound: number; endsAt: number }) => {
      currentTurnKey.value = t.turnKey
      currentRound.value = t.currentRound
      turnEndsAt.value = t.endsAt
    })

    // 공유 캔버스
    socket.on('draw:history', (h: { strokes: { by: string; seg: Stroke }[] }) => {
      historyCb?.(h.strokes ?? [])
    })
    socket.on('draw:stroke', (d: { by: string; seg: Stroke }) => {
      remoteStrokeCb?.(d.seg, d.by)
    })
    // 새 게임 시작 등: 공유 캔버스 비우기 (히스토리 콜백을 빈 배열로 재사용)
    socket.on('draw:clear', () => historyCb?.([]))

    // 투표
    socket.on('vote:start', (v: { candidates: VoteCandidate[]; endsAt: number }) => {
      candidates.value = v.candidates
      myVote.value = null
      turnEndsAt.value = v.endsAt
      voteInfo.value = { voted: 0, total: v.candidates.length }
    })
    socket.on('vote:update', (v: { voted: number; total: number }) => {
      voteInfo.value = v
    })

    // 결과
    socket.on('game:result', (r: GameResult) => {
      result.value = r
    })
    socket.on('game:stopped', () => {
      pushSystem('게임이 중단되었습니다.')
      result.value = null
    })
  }

  function disconnect() {
    socket?.disconnect()
    socket = null
    remoteStrokeCb = null
    historyCb = null
    reset()
  }

  // ===== 액션 =====
  function startGame() {
    socket?.emit('game:start')
  }
  function stopGame() {
    socket?.emit('game:stop')
  }
  function sendStroke(seg: Stroke) {
    if (seg.length) socket?.emit('draw:stroke', { seg })
  }
  // 그리는 도중 실시간 중계 (저장/턴 넘김 없음). pointerup에서 sendStroke로 최종 commit.
  function sendLive(seg: Stroke) {
    if (seg.length) socket?.emit('draw:live', { seg })
  }
  function vote(targetKey: string) {
    myVote.value = targetKey
    socket?.emit('vote:cast', { targetKey })
  }
  function sendChat(text: string) {
    const t = text.trim()
    if (t) socket?.emit('chat:send', { text: t })
  }

  // 캔버스 컴포넌트가 등록하는 핸들러
  function onRemoteStroke(cb: ((seg: Stroke, by: string) => void) | null) {
    remoteStrokeCb = cb
  }
  function onHistory(cb: ((strokes: { by: string; seg: Stroke }[]) => void) | null) {
    historyCb = cb
  }

  return {
    status,
    hostKey,
    rounds,
    currentRound,
    currentTurnKey,
    turnEndsAt,
    startAt,
    players,
    chat,
    error,
    role,
    candidates,
    voteInfo,
    myVote,
    result,
    connect,
    disconnect,
    startGame,
    stopGame,
    sendStroke,
    sendLive,
    vote,
    sendChat,
    onRemoteStroke,
    onHistory,
  }
})

interface LobbyState {
  status: Phase
  hostKey: string | null
  rounds: number
  currentRound: number
  currentTurnKey: string | null
  turnEndsAt: number | null
  startAt: number | null
  players: LobbyPlayer[]
}
