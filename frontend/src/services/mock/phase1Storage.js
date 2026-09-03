const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

export function readStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return Array.isArray(fallback) && !Array.isArray(parsed) ? fallback : parsed
  } catch {
    return fallback
  }
}

export function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage may be unavailable (private mode); ignore
  }
}

export { delay }
