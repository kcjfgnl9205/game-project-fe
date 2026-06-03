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

/** 참가자 목록 표시용 뷰 모델. 실데이터는 lobby:state(LobbyPlayer)에서 매핑된다. */
export interface Participant {
  id: string
  rank: number
  nickname: string
  score: number
  isHost?: boolean
  isDrawing?: boolean
  isMe?: boolean
}

export interface ChatLine {
  key: number
  system?: boolean // 진행 안내(그림 시작/정답 등) 시스템 메시지
  senderId?: string
  nickname?: string
  text: string
}

// 그리기 선분 한 조각. 좌표/두께는 해상도 독립을 위해 고정 기준(0~CANVAS_RES)으로 주고받는다.
export interface Stroke {
  // 좌표는 CANVAS_RES(1000) 기준 정수. 소수점은 화질에 무의미하므로 반올림해 전송한다.
  x0: number
  y0: number
  x1: number
  y1: number
  // color/size는 한 획 내내 동일하므로 획 시작(또는 값 변경) 세그먼트에만 싣는다.
  // 이후 세그먼트는 직전 값을 그대로 유지(캔버스 ctx 상태가 보존됨)한다.
  color?: string
  size?: number
}

interface LobbyState {
  status: GamePhase
  hostKey: string
  turnCount: number
  currentDrawerKey: string | null
  players: LobbyPlayer[]
  endsAt?: number | null
}

interface SocketAuth {
  token?: string
  guestId?: string
  nickname: string
}

// socket은 반응형일 필요가 없어 모듈 스코프에 둔다.
let socket: Socket | null = null
let chatSeq = 0
// 원격 그리기 이벤트를 캔버스 컴포넌트로 전달하는 콜백 (연속 스트림이라 ref보다 콜백이 적합)
// stroke는 한 프레임 분량을 배열(batch)로 묶어 주고받는다.
let remoteStrokeCb: ((s: Stroke[]) => void) | null = null
let remoteClearCb: (() => void) | null = null

export const useGameStore = defineStore('sketch-pick-game', () => {
  const status = ref<GamePhase>('LOBBY')
  const players = ref<LobbyPlayer[]>([])
  const hostKey = ref<string | null>(null)
  const currentDrawerKey = ref<string | null>(null)
  const turnCount = ref(0)
  const turnEndsAt = ref<number | null>(null)
  const announcement = ref<string | null>(null)
  const chat = ref<ChatLine[]>([])
  const error = ref<string | null>(null)
  // 단어 선택 후보(출제자만 수신). WORD_SELECT 단계에서 출제자에게만 채워진다.
  const wordChoices = ref<string[]>([])
  // 현재 제시어(출제자만 수신). 서버가 출제자 소켓에만 turn:word로 보낸다.
  const word = ref<string | null>(null)
  // 제시어 글자 수(방 전체 수신). 맞히는 사람에게 ○○○ 형태로 보여줄 때 쓴다.
  const wordLength = ref(0)

  // 턴 경계에서 단어 관련 상태를 초기화한다(이전 턴 제시어 잔상 방지).
  function clearWord() {
    wordChoices.value = []
    word.value = null
    wordLength.value = 0
  }

  function reset() {
    status.value = 'LOBBY'
    players.value = []
    hostKey.value = null
    currentDrawerKey.value = null
    turnCount.value = 0
    turnEndsAt.value = null
    announcement.value = null
    chat.value = []
    error.value = null
    clearWord()
  }

  function connect(roomId: string, auth: SocketAuth) {
    if (socket) return // 이미 연결됨 (중복 연결 방지)
    reset()

    // WS는 REST(VITE_API_BASE_URL)와 반드시 같은 백엔드를 향해야 한다.
    // (REST는 원격, WS는 localhost로 갈리면 방을 만든 서버와 소켓이 붙는 서버가
    // 달라져 "room not found"가 난다.) 따라서 VITE_WS_URL을 그대로 따른다.
    const configured = (import.meta.env.VITE_WS_URL as string) || ''
    let wsUrl = configured.trim()
    if (!wsUrl && typeof window !== 'undefined') {
      wsUrl = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/sketch-pic`
    }
    console.debug('[sketch-pick] WS config', { configured, wsUrl })

    const transports = import.meta.env.DEV ? ['websocket'] : ['polling', 'websocket']
    console.debug('[sketch-pick] Creating socket with', {
      wsUrl,
      transports,
      auth: { roomId, guestId: auth.guestId ? '***' : 'none' },
    })

    socket = io(wsUrl, {
      auth: { roomId, ...auth },
      transports,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    })
    console.debug('[sketch-pick] Socket instance created')

    socket.on('connect', () => {
      error.value = null
      console.debug('[sketch-pick] socket connected', socket?.id)
    })

    socket.on('connect_error', (err: Error) => {
      error.value = err.message || '소켓 연결에 실패했습니다.'
      console.warn('[sketch-pick] connect_error', err)
    })

    socket.on('disconnect', (reason: string) => {
      if (reason !== 'io client disconnect') {
        error.value = `소켓 연결이 끊어졌습니다: ${reason}`
      }
    })

    const getPlayerName = (playerId: string) =>
      players.value.find((player) => player.playerId === playerId)?.nickname ?? '누군가'

    socket.on('lobby:state', (state: LobbyState) => {
      status.value = state.status
      hostKey.value = state.hostKey
      currentDrawerKey.value = state.currentDrawerKey
      turnCount.value = state.turnCount
      players.value = state.players
      turnEndsAt.value = state.endsAt ?? null
      if (state.status === 'LOBBY' && state.endsAt) {
        announcement.value = '2초 뒤 게임이 시작됩니다.'
      }
      console.debug('[sketch-pick] lobby:state', state)
    })

    socket.on('game:starting', (payload: { startsAt: number }) => {
      announcement.value = '2초 뒤 게임이 시작됩니다.'
      turnEndsAt.value = payload.startsAt
      console.debug('[sketch-pick] game:starting', payload)
    })

    socket.on('game:stopped', (payload: { reason: string }) => {
      if (payload.reason === 'not_enough_players') {
        announcement.value = '플레이어가 부족하여 대기 상태로 돌아갑니다.'
      }
      turnEndsAt.value = null
      clearWord()
    })

    // 출제자에게만 오는 후보 단어 3개. (서버가 drawer 소켓으로만 emit)
    socket.on('word:choices', (payload: { words: string[] }) => {
      wordChoices.value = payload.words
      console.debug('[sketch-pick] word:choices', payload)
    })

    // 출제자에게만 오는 확정 제시어. (서버가 drawer 소켓으로만 emit)
    socket.on('turn:word', (payload: { word: string }) => {
      word.value = payload.word
      console.debug('[sketch-pick] turn:word (출제자 전용)')
    })

    socket.on(
      'turn:choosing',
      (payload: { drawerId: string; turnCount: number; endsAt: number }) => {
        // 진행 중에는 lobby:state가 오지 않으므로 phase/출제자를 여기서 갱신한다.
        status.value = 'WORD_SELECT'
        currentDrawerKey.value = payload.drawerId
        turnCount.value = payload.turnCount
        const drawerName = getPlayerName(payload.drawerId)
        announcement.value = `${drawerName}님이 문제를 선택하고 있습니다.`
        turnEndsAt.value = payload.endsAt
        // 새 턴 선택 단계 진입: 이전 제시어/글자수 제거.
        // (wordChoices는 직전에 도착한 word:choices 값이라 건드리지 않는다.)
        word.value = null
        wordLength.value = 0
        console.debug('[sketch-pick] turn:choosing', payload)
      },
    )

    socket.on(
      'turn:start',
      (payload: { drawerId: string; turnCount: number; wordLength: number; endsAt: number }) => {
        status.value = 'DRAWING'
        currentDrawerKey.value = payload.drawerId
        turnCount.value = payload.turnCount
        turnEndsAt.value = payload.endsAt
        // 선택 단계 종료: 후보 제거, 글자 수 공개. (제시어 word는 뒤이어 turn:word로 갱신)
        wordChoices.value = []
        wordLength.value = payload.wordLength
        // "그림을 시작합니다" 안내는 서버가 chat:system으로 채팅에 남긴다.
        announcement.value = null
        console.debug('[sketch-pick] turn:start', payload)
      },
    )

    socket.on(
      'guess:correct',
      (payload: { playerId: string; nickname: string; scoreDelta: number }) => {
        // 정답 즉시 점수 반영(실시간). 정확한 합계는 turn:reveal에서 다시 동기화된다.
        players.value = players.value.map((p) =>
          p.playerId === payload.playerId ? { ...p, score: p.score + payload.scoreDelta } : p,
        )
        console.debug('[sketch-pick] guess:correct', payload)
      },
    )

    socket.on(
      'turn:reveal',
      (payload: {
        word: string | null
        reason: string
        turnScores: Record<string, number>
        sessionScores: { playerId: string; nickname: string; score: number }[]
      }) => {
        status.value = 'REVEAL'
        turnEndsAt.value = null
        // 진행 중에는 lobby:state가 없으므로 점수판을 여기서 정확히 동기화한다.
        // (서버 sessionScores는 배열이므로 Map으로 변환해 매칭)
        const scoreMap = new Map(payload.sessionScores.map((s) => [s.playerId, s.score]))
        players.value = players.value.map((p) => ({
          ...p,
          score: scoreMap.get(p.playerId) ?? p.score,
        }))
        // 정답 공개 안내는 서버가 chat:system으로 채팅에 남긴다.
        clearWord()
        console.debug('[sketch-pick] turn:reveal', payload)
      },
    )

    socket.on('chat:message', (msg: { senderId: string; nickname: string; text: string }) => {
      chat.value.push({ key: chatSeq++, ...msg })
    })

    // 진행 안내 시스템 메시지 (그림 시작/정답/정답 공개 등)
    socket.on('chat:system', (payload: { text: string; ts: number }) => {
      chat.value.push({ key: chatSeq++, system: true, text: payload.text })
    })

    socket.on('error', (e: { code?: string; message?: string }) => {
      error.value = e.message ?? '오류가 발생했습니다.'
    })

    // 다른 사람(출제자)의 그리기 → 캔버스에 반영 (한 프레임 분량 배열)
    socket.on('draw:stroke', (strokes: Stroke[]) => remoteStrokeCb?.(strokes))
    socket.on('draw:clear', () => remoteClearCb?.())
  }

  function sendChat(text: string) {
    const trimmed = text.trim()
    if (trimmed) socket?.emit('chat:send', { text: trimmed })
  }

  function startGame() {
    socket?.emit('game:start')
  }

  // 출제자가 후보 중 단어를 선택. (서버가 출제자 여부/단계를 검증)
  function pickWord(picked: string) {
    socket?.emit('word:pick', { word: picked })
  }

  // 그리기 relay (출제자만 서버가 받아 다른 사람에게 broadcast). 한 프레임 분량을 묶어 보낸다.
  function sendStroke(strokes: Stroke[]) {
    if (strokes.length) socket?.emit('draw:stroke', strokes)
  }
  function sendClear() {
    socket?.emit('draw:clear')
  }
  // 캔버스 컴포넌트가 원격 그리기 수신 핸들러를 등록/해제
  function onRemoteStroke(cb: ((s: Stroke[]) => void) | null) {
    remoteStrokeCb = cb
  }
  function onRemoteClear(cb: (() => void) | null) {
    remoteClearCb = cb
  }

  function disconnect() {
    socket?.close()
    socket = null
    remoteStrokeCb = null
    remoteClearCb = null
    reset()
  }

  return {
    status,
    players,
    hostKey,
    currentDrawerKey,
    turnCount,
    turnEndsAt,
    announcement,
    chat,
    error,
    wordChoices,
    word,
    wordLength,
    connect,
    sendChat,
    startGame,
    pickWord,
    sendStroke,
    sendClear,
    onRemoteStroke,
    onRemoteClear,
    disconnect,
  }
})
