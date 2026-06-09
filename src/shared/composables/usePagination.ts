import { computed, ref } from 'vue'

interface UsePaginationOptions {
  limit?: number // 페이지당 항목 수 (기본 9)
  pageWindow?: number // 한 그룹에 보이는 페이지 수 (기본 10)
}

/**
 * 페이지 번호 기반 페이지네이션 상태.
 * - page: 1부터 시작
 * - 10페이지(pageWindow) 단위 그룹: 1~10, 11~20 ... 이전/다음으로 그룹 이동
 * - 전체가 1페이지면 showPagination=false
 */
export function usePagination(options: UsePaginationOptions = {}) {
  const limit = options.limit ?? 9
  const pageWindow = options.pageWindow ?? 10

  const page = ref(1)
  const total = ref(0)

  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit)))

  // 현재 페이지가 속한 그룹의 시작/끝 페이지
  const groupStart = computed(() => Math.floor((page.value - 1) / pageWindow) * pageWindow + 1)
  const groupEnd = computed(() => Math.min(groupStart.value + pageWindow - 1, totalPages.value))

  const pages = computed(() => {
    const arr: number[] = []
    for (let p = groupStart.value; p <= groupEnd.value; p++) arr.push(p)
    return arr
  })

  const hasPrevGroup = computed(() => groupStart.value > 1)
  const hasNextGroup = computed(() => groupEnd.value < totalPages.value)
  const showPagination = computed(() => totalPages.value > 1)

  function setPage(p: number) {
    page.value = Math.min(Math.max(1, p), totalPages.value)
  }
  function prevGroup() {
    setPage(groupStart.value - 1) // 이전 그룹의 마지막 페이지
  }
  function nextGroup() {
    setPage(groupEnd.value + 1) // 다음 그룹의 첫 페이지
  }

  return {
    page,
    limit,
    total,
    totalPages,
    pages,
    hasPrevGroup,
    hasNextGroup,
    showPagination,
    setPage,
    prevGroup,
    nextGroup,
  }
}
