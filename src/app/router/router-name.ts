export const ROUTE_NAME = {
  HOME: 'home',
  LOGIN: 'login',
  GAME_LIST: 'game-list',
  GAME_ROOMS: 'game-rooms',
  NOTICE: 'notice',
  NOTICE_DETAIL: 'notice-detail',

  // games — 각 게임이 자기 route를 가짐 (값 = gameId)
  SKETCH_PICK: 'sketch-pick',
  WHO_DREW: 'who-drew',
} as const
