// 비회원(게스트) 식별자. 프론트에서 UUID를 만들어 보관하고, 같은 사람을 계속 식별한다.
const GUEST_ID_KEY = 'puzmu.guestId'
const GUEST_NICKNAME_KEY = 'puzmu.guestNickname'

/** 게스트 UUID. 없으면 생성해서 localStorage에 저장한다. */
export function getGuestId(): string {
  let id = localStorage.getItem(GUEST_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(GUEST_ID_KEY, id)
  }
  return id
}

/**
 * 게스트 표시 이름. 저장된 게 없으면 랜덤 기본값을 만들어 저장한다.
 * 한 번 정해진 기본값을 재사용해야 생성/입장 시 같은 이름으로 식별된다.
 */
export function getGuestNickname(): string {
  let nickname = localStorage.getItem(GUEST_NICKNAME_KEY)
  if (!nickname) {
    nickname = `게스트${Math.floor(1000 + Math.random() * 9000)}`
    localStorage.setItem(GUEST_NICKNAME_KEY, nickname)
  }
  return nickname
}

export function setGuestNickname(nickname: string): void {
  localStorage.setItem(GUEST_NICKNAME_KEY, nickname)
}
