---
name: phase1-fallback-fix
description: Fixed critical fallback bug that prevented Phase 1/2 pages from gracefully falling back to mock data
metadata:
  type: project
---

Fixed the critical `withFallback` bug in `frontend/src/services/phase1Fallback.js`.

**Problem:** The `isNetworkError()` function only checked `!error?.response`, which meant HTTP 404/405/501 responses from missing backend endpoints were NOT caught as "offline" conditions. Pages would crash with errors instead of falling back to mock data.

**Solution:** Enhanced `shouldFallback()` to treat 404/405/501 as safe fallback conditions while preserving 401/403 error propagation:

```javascript
function shouldFallback(error) {
  if (!error?.response) return true
  if (error?.code === 'ECONNABORTED') return true
  if (error?.message === 'Network Error') return true
  if ([404, 405, 501].includes(error?.response?.status)) return true
  return false
}
```

Impact: All 14 Phase 1/2 services now correctly fall back to mock data when backend endpoints return 404, making the prototype fully demonstrable.

Related memories: [[phase1-data]], [[phase2-data]], [[mock-infrastructure]]