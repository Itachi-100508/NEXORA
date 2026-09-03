import api from './api'
import { withFallback, asList, asTotal } from './phase1Fallback'
import { getVersionedResults, getVersionedResultById } from './mock'

const resultVersionService = {
  getAll: async () => {
    const { result, offline } = await withFallback(() => api.get('/results/versions'), () => getVersionedResults())
    return { data: asList(result), total: asTotal(result), offline }
  },
  getByResultId: async (resultId) => {
    const { result, offline } = await withFallback(() => api.get(`/results/${resultId}/versions`), () => getVersionedResultById(resultId))
    return { data: result, offline }
  },
  getDiff: async (resultId, from, to) => {
    const entry = await getVersionedResultById(resultId)
    if (!entry || !entry.versions) return { data: null, offline: true }
    const a = entry.versions.find((v) => v.version === Number(from))
    const b = entry.versions.find((v) => v.version === Number(to))
    if (!a || !b) return { data: null, offline: true }
    const subjectDiffs = entry.versions[entry.versions.length - 1].subjects.map((s) => {
      const oldS = a.subjects.find((x) => x.name === s.name)
      const newS = b.subjects.find((x) => x.name === s.name)
      return {
        subject: s.name,
        oldMarks: oldS ? oldS.marks : null,
        newMarks: newS ? newS.marks : null,
        diff: newS && oldS ? newS.marks - oldS.marks : null,
      }
    })
    return {
      data: {
        fromVersion: a.version,
        toVersion: b.version,
        oldPercentage: a.percentage,
        newPercentage: b.percentage,
        oldCgpa: a.cgpa,
        newCgpa: b.cgpa,
        subjects: subjectDiffs,
      },
      offline: true,
    }
  },
}

export { resultVersionService }
