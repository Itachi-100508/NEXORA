import api from './api'
import { withFallback } from './phase1Fallback'
import { getIntegritySummary } from './mock'

const integrityService = {
  getSummary: async (resultId) => {
    const { result, offline } = await withFallback(() => api.get(`/results/${resultId}/integrity`), () => getIntegritySummary(resultId))
    return { data: result, offline }
  },
  verify: async (code) => {
    const { result, offline } = await withFallback(() => api.post('/results/integrity/verify', { code }), async () => {
      const { verifyResult } = await import('./mock')
      return verifyResult({ code })
    })
    return { data: result, offline }
  },
}

export { integrityService }
