export const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(new Error('Failed to convert to DataURL.'))
    reader.readAsDataURL(blob)
  })

export type ExtractFrameResult = {
  blob: Blob
  dataUrl: string
  duration: number
  actualTime: number
}

type ExtractFrameOptions = {
  blob: Blob
  timeSec: number
  mimeType?: string
}

export const extractFrameFromVideoBlob = async ({
  blob,
  timeSec,
  mimeType = 'image/png',
}: ExtractFrameOptions): Promise<ExtractFrameResult> => {
  const objectUrl = URL.createObjectURL(blob)

  return await new Promise<ExtractFrameResult>((resolve, reject) => {
    const video = document.createElement('video')
    let cleaned = false

    const cleanUp = () => {
      if (cleaned) return
      cleaned = true
      video.pause()
      video.removeAttribute('src')
      try {
        video.load()
      } catch (error) {
        console.warn('video.load() failed during cleanup', error)
      }
      URL.revokeObjectURL(objectUrl)
    }

    const fail = (error: unknown) => {
      cleanUp()
      reject(error instanceof Error ? error : new Error('Failed to extract video frame.'))
    }

    const drawFrame = () => {
      const width = video.videoWidth
      const height = video.videoHeight

      if (!width || !height) {
        throw new Error('Failed to determine video frame dimensions.')
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Failed to obtain canvas context.')
      }

      ctx.drawImage(video, 0, 0, width, height)

      canvas.toBlob(async blobResult => {
        try {
          if (!blobResult) {
            throw new Error('Failed to generate frame image.')
          }

          const finalBlob = mimeType && blobResult.type !== mimeType
            ? blobResult.slice(0, blobResult.size, mimeType)
            : blobResult
          const dataUrl = await blobToDataUrl(finalBlob)

          cleanUp()
          resolve({
            blob: finalBlob,
            dataUrl,
            duration: Number.isFinite(video.duration) ? video.duration : 0,
            actualTime: video.currentTime,
          })
        } catch (error) {
          fail(error)
        }
      }, mimeType)
    }

    const handleSeeked = () => {
      let rafId: number | null = null

      const cancelRaf = () => {
        if (rafId !== null) {
          window.cancelAnimationFrame(rafId)
          rafId = null
        }
      }

      const performDraw = () => {
        cancelRaf()
        video.removeEventListener('loadeddata', waitForData)
        try {
          drawFrame()
        } catch (error) {
          fail(error)
        }
      }

      const tryWhenReady = (attempt: number) => {
        if (
          video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
          video.videoWidth > 0 &&
          video.videoHeight > 0
        ) {
          performDraw()
          return
        }

        if (attempt >= 12) {
          performDraw()
          return
        }

        rafId = window.requestAnimationFrame(() => tryWhenReady(attempt + 1))
      }

      const waitForData = () => {
        cancelRaf()
        rafId = window.requestAnimationFrame(() => tryWhenReady(0))
      }

      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        waitForData()
      } else {
        video.addEventListener('loadeddata', waitForData, { once: true })
      }
    }

    const handleLoadedMetadata = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0
      const epsilon = 0.05
      let target = Number.isFinite(timeSec) && timeSec >= 0 ? timeSec : 0

      if (duration > 0) {
        if (target >= duration) {
          target = Math.max(0, duration - epsilon)
        }
      } else {
        target = 0
      }

      video.addEventListener('seeked', handleSeeked, { once: true })

      try {
        if (video.currentTime === target) {
          handleSeeked()
        } else {
          video.currentTime = target
        }
      } catch (error) {
        fail(error)
      }
    }

    video.preload = 'auto'
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.playsInline = true
    video.src = objectUrl

    video.addEventListener('error', () => fail(new Error('Failed to load the video.')))
    video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true })
  })
}
