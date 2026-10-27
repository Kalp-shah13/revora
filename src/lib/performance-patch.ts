'use client'

/**
 * Patch for Next.js / React 19 development mode bug:
 * "Failed to execute 'measure' on 'Performance': '<Component>' cannot have a negative time stamp"
 * which occurs during async Server Component streaming across LAN mobile connections.
 */
if (typeof window !== 'undefined' && !(window as any).__nextPerfMeasurePatched) {
  (window as any).__nextPerfMeasurePatched = true
  const originalMeasure = window.Performance.prototype.measure

  ;(window.Performance.prototype.measure as any) = function (
    this: any,
    name: string,
    startMarkOrOptions?: string | PerformanceMeasureOptions,
    endMark?: string,
  ) {
    try {
      if (startMarkOrOptions && typeof startMarkOrOptions === 'object') {
        if (typeof startMarkOrOptions.start === 'number' && startMarkOrOptions.start < 0) {
          startMarkOrOptions.start = 0
        }
        if (typeof startMarkOrOptions.end === 'number' && startMarkOrOptions.end < 0) {
          startMarkOrOptions.end = 0
        }
      }
      return originalMeasure.call(this, name, startMarkOrOptions as any, endMark)
    } catch (e: any) {
      if (
        e?.message &&
        (e.message.includes('negative time stamp') ||
          e.message.includes('cannot have a negative') ||
          e.name === 'DOMException')
      ) {
        // Harmless dev-only Next.js/React Server Component profiler timestamp mismatch
        return undefined as any
      }
      throw e
    }
  }
}
