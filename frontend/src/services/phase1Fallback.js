/**
 * Network / offline errors and common "endpoint missing" HTTP statuses
 * that should trigger a fallback to mock data instead of crashing the page.
 *
 * 401 / 403 are NEVER swallowed — auth errors must always propagate.
 */
function shouldFallback(error) {
  // True network failure (no response at all)
  if (!error?.response) return true
  if (error?.code === 'ECONNABORTED') return true
  if (error?.message === 'Network Error') return true

  const status = error?.response?.status
  // Endpoint doesn't exist on this backend — safe to fall back
  if ([404, 405, 501].includes(status)) return true

  // Everything else (including 401/403/400/500) — do NOT fall back
  return false
}

export async function withFallback(apiCall, mockCall) {
  try {
    const res = await apiCall()
    return { result: res, offline: false }
  } catch (error) {
    if (!shouldFallback(error)) throw error
    const mock = await mockCall()
    return { result: mock, offline: true }
  }
}

export function asList(result) {
  return Array.isArray(result) ? result : Array.isArray(result?.data) ? result.data : []
}

export function asTotal(result) {
  return typeof result?.total === 'number' ? result.total : asList(result).length
}
