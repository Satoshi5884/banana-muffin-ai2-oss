import { ValidationError, type QueueStatus } from '@fal-ai/client'
import { getFalClient } from './falClient'

export type VideoProviderId =
  | 'seedance-lite-image-to-video'
  | 'seedance-lite-reference-to-video'

export type GenerateVideoOptions = {
  provider: VideoProviderId
  prompt: string
  inputImage: { dataUrl: string; mime: string }
  endImage?: { dataUrl: string; mime: string }
  referenceImage?: { dataUrl: string; mime: string }
  duration?: '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12'
  resolution?: '480p' | '720p' | '1080p'
  cameraFixed?: boolean
  seed?: number
  falCredentials: string
}

export type VideoProviderInfo = {
  id: VideoProviderId
  label: string
  shortLabel: string
  description: string
  requiresKey: 'fal'
  endpoint: string
}

export const VIDEO_PROVIDERS: VideoProviderInfo[] = [
  {
    id: 'seedance-lite-image-to-video',
    label: 'Seedance Lite Image-to-Video',
    shortLabel: 'Image→Video',
    description: 'Generate up to 12-second videos from an input image and prompt.',
    requiresKey: 'fal',
    endpoint: 'fal-ai/bytedance/seedance/v1/lite/image-to-video',
  },
  {
    id: 'seedance-lite-reference-to-video',
    label: 'Seedance Lite Reference-to-Video',
    shortLabel: 'Reference→Video',
    description: 'Generate videos while preserving reference-image characteristics.',
    requiresKey: 'fal',
    endpoint: 'fal-ai/bytedance/seedance/v1/lite/reference-to-video',
  },
]

export type GeneratedVideo = {
  blob: Blob
  mime: string
  objectUrl: string
  remoteUrl: string
  seed?: number
}

export async function generateVideo(options: GenerateVideoOptions) {
  const client = getFalClient(options.falCredentials)
  const endpoint =
    options.provider === 'seedance-lite-reference-to-video'
      ? 'fal-ai/bytedance/seedance/v1/lite/reference-to-video'
      : 'fal-ai/bytedance/seedance/v1/lite/image-to-video'

  const payload: Record<string, unknown> = {
    prompt: options.prompt,
    image_url: await dataUrlToFile(options.inputImage, 'input'),
  }

  if (options.endImage) {
    payload.end_image_url = await dataUrlToFile(options.endImage, 'end')
  }
  if (options.provider === 'seedance-lite-reference-to-video' && options.referenceImage) {
    payload.reference_image_url = await dataUrlToFile(options.referenceImage, 'reference')
  }
  if (options.duration) payload.duration = options.duration
  if (options.resolution) payload.resolution = options.resolution
  if (typeof options.cameraFixed === 'boolean') payload.camera_fixed = options.cameraFixed
  if (typeof options.seed === 'number') payload.seed = options.seed

  try {
    const { data, requestId } = await client.subscribe(endpoint, {
      input: payload,
      onQueueUpdate(update) {
        logQueueUpdate(update)
      },
    })

    console.log('Seedance request completed:', requestId, data)

    const outputs = extractVideoOutputs(data)
    if (outputs.length === 0) {
      throw new Error('No video was generated. Please review your inputs.')
    }

    const videos: GeneratedVideo[] = []
    const notes: string[] = []
    const seen = new Set<string>()
    const fallbackSeed = typeof (data as any)?.seed === 'number' ? Number((data as any).seed) : undefined

    for (const output of outputs) {
      if (seen.has(output.url)) continue
      seen.add(output.url)

      const { blob, objectUrl } = await fetchVideoAsObjectUrl(output.url)
      const mime = blob.type || 'video/mp4'
      videos.push({
        blob,
        mime,
        objectUrl,
        remoteUrl: output.url,
        seed: output.seed ?? fallbackSeed,
      })
    }

    const seeds = Array.from(new Set(videos.map(v => v.seed).filter((v): v is number => typeof v === 'number')))
    if (seeds.length > 0) {
      notes.push(`Seed: ${seeds.join(', ')}`)
    }

    if (typeof (data as any)?.duration === 'number') {
      notes.push(`Duration: ${(data as any).duration.toFixed ? (data as any).duration.toFixed(2) : (data as any).duration}s`)
    }
    if (typeof (data as any)?.resolution === 'string') {
      notes.push(`Resolution: ${(data as any).resolution}`)
    }

    return { videos, notes, raw: data } as const
  } catch (error) {
    console.error('Seedance request failed:', error)
    if (error instanceof ValidationError) {
      const fieldError = error.fieldErrors[0]
      if (fieldError) {
        throw new Error(`Seedance API error: ${fieldError.loc.join('.')} - ${fieldError.msg}`)
      }
      throw new Error(`Seedance API validation error: ${error.message}`)
    }
    if (error instanceof Error) {
      throw new Error(`Seedance API error: ${error.message}`)
    }
    throw error
  }
}

const dataUrlToFile = async (
  source: { dataUrl: string; mime: string },
  baseName: string
) => {
  const res = await fetch(source.dataUrl)
  if (!res.ok) {
    throw new Error('Failed to load the input image.')
  }
  const blob = await res.blob()
  const inferredMime = blob.type || source.mime
  const ext = mimeToExtension(inferredMime)
  const name = `${baseName}.${ext}`
  return new File([blob], name, { type: inferredMime })
}

const fetchVideoAsObjectUrl = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Failed to retrieve the generated video.')
  }
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  return { blob, objectUrl }
}

const mimeToExtension = (mime: string) => {
  if (!mime) return 'bin'
  const [, subtype] = mime.split('/')
  if (!subtype) return 'bin'
  if (subtype.includes('mp4')) return 'mp4'
  if (subtype.includes('quicktime')) return 'mov'
  if (subtype.includes('webm')) return 'webm'
  return subtype.split(';')[0] || 'bin'
}

const extractVideoOutputs = (data: unknown): { url: string; seed?: number }[] => {
  if (!data) return []
  const outputs: { url: string; seed?: number }[] = []
  const maybe = data as Record<string, unknown>

  const direct = maybe.video
  if (typeof direct === 'string') {
    outputs.push({ url: direct })
  } else if (direct && typeof direct === 'object') {
    const obj = direct as Record<string, unknown>
    if (typeof obj.url === 'string') {
      outputs.push({ url: obj.url, seed: typeof obj.seed === 'number' ? obj.seed : undefined })
    }
  }

  const videos = maybe.videos
  if (Array.isArray(videos)) {
    for (const item of videos) {
      if (typeof item === 'string') {
        outputs.push({ url: item })
      } else if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>
        if (typeof obj.url === 'string') {
          outputs.push({ url: obj.url, seed: typeof obj.seed === 'number' ? obj.seed : undefined })
        }
      }
    }
  }

  const generics = maybe.outputs
  if (Array.isArray(generics)) {
    for (const item of generics) {
      if (!item || typeof item !== 'object') continue
      const obj = item as Record<string, unknown>
      if (typeof obj.url === 'string') {
        outputs.push({ url: obj.url })
      }
      if (obj.video && typeof obj.video === 'object') {
        const ref = obj.video as Record<string, unknown>
        if (typeof ref.url === 'string') {
          outputs.push({ url: ref.url, seed: typeof ref.seed === 'number' ? ref.seed : undefined })
        }
      }
    }
  }

  return outputs
}

const logQueueUpdate = (update: QueueStatus | Record<string, unknown>) => {
  if (!update) return
  try {
    if ((update as QueueStatus).status) {
      const status = (update as QueueStatus).status
      if (status === 'IN_QUEUE') {
        console.log('Seedance queue position:', (update as QueueStatus & { queue_position?: number }).queue_position)
      } else if (status === 'IN_PROGRESS') {
        console.log('Seedance processing...')
      } else if (status === 'COMPLETED') {
        console.log('Seedance completed')
      }
    }
  } catch (e) {
    console.warn('Failed to parse Seedance queue update', e)
  }
}
