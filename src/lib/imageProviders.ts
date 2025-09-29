import { ValidationError, type QueueStatus } from '@fal-ai/client'
import { getFalClient } from './falClient'

export type BackoffEventDetail = { attempt: number; delayMs: number; reason: '429' | '503' | 'other' }
export const geminiEvents: EventTarget = new EventTarget()

export type ImageProviderId = 'nano-banana' | 'seedream-v4-edit' | 'seedream-v4-text-to-image'

export type ImageProviderInfo = {
  id: ImageProviderId
  label: string
  shortLabel: string
  description: string
  requiresKey: 'gemini' | 'fal'
  requiresBaseImage: boolean
  maxInputImages: number
  maxCandidates: number
}

export const IMAGE_PROVIDERS: ImageProviderInfo[] = [
  {
    id: 'nano-banana',
    label: 'nano-banana (Gemini 2.5 Flash Image Preview)',
    shortLabel: 'nano-banana',
    description: 'Generate images with Google Gemini 2.5 Flash Image Preview.',
    requiresKey: 'gemini',
    requiresBaseImage: false,
    maxInputImages: 3,
    maxCandidates: 4,
  },
  {
    id: 'seedream-v4-edit',
    label: 'fal.ai Seedream v4 Edit',
    shortLabel: 'Seedream v4 Edit',
    description: 'Edit input images via fal.ai/bytedance/seedream/v4/edit.',
    requiresKey: 'fal',
    requiresBaseImage: true,
    maxInputImages: 4,
    maxCandidates: 4,
  },
  {
    id: 'seedream-v4-text-to-image',
    label: 'fal.ai Seedream v4 Text-to-Image',
    shortLabel: 'Seedream v4 Text',
    description: 'Create high-quality images from text using fal.ai/bytedance/seedream/v4/text-to-image.',
    requiresKey: 'fal',
    requiresBaseImage: false,
    maxInputImages: 0,
    maxCandidates: 4,
  },
]

export type GenerateImagesOptions = {
  provider: ImageProviderId
  prompt: string
  negativePrompt?: string
  inputFiles: { dataUrl: string; mime: string }[]
  candidateCount: number
  geminiApiKey?: string
  falCredentials?: string
}

export async function generateImages(options: GenerateImagesOptions) {
  if (options.provider === 'nano-banana') {
    const apiKey = options.geminiApiKey
    if (!apiKey) {
      throw new Error('Gemini API key (VITE_GEMINI_API_KEY) is not configured.')
    }
    return generateWithGemini({
      apiKey,
      prompt: options.prompt,
      negativePrompt: options.negativePrompt,
      inputFiles: options.inputFiles,
      candidateCount: options.candidateCount,
    })
  }

  if (options.provider === 'seedream-v4-edit') {
    const credentials = options.falCredentials
    if (!credentials) {
      throw new Error('fal.ai API key (VITE_FAL_KEY) is not configured.')
    }
    return generateWithSeedream({
      credentials,
      prompt: options.prompt,
      negativePrompt: options.negativePrompt,
      inputFiles: options.inputFiles,
      candidateCount: options.candidateCount,
    })
  }

  if (options.provider === 'seedream-v4-text-to-image') {
    const credentials = options.falCredentials
    if (!credentials) {
      throw new Error('fal.ai API key (VITE_FAL_KEY) is not configured.')
    }
    return generateWithSeedreamText({
      credentials,
      prompt: options.prompt,
      negativePrompt: options.negativePrompt,
      candidateCount: options.candidateCount,
    })
  }

  throw new Error('Unsupported provider.')
}

async function generateWithGemini({
  apiKey,
  prompt,
  negativePrompt,
  inputFiles,
  candidateCount,
}: {
  apiKey: string
  prompt: string
  negativePrompt?: string
  inputFiles: { dataUrl: string; mime: string }[]
  candidateCount: number
}) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent'

  const parts: any[] = [{ text: prompt }]
  for (const f of inputFiles) {
    const base64 = f.dataUrl.split(',')[1] ?? ''
    parts.push({ inlineData: { mimeType: f.mime, data: base64 } })
  }

  let includeResponseMime = false
  const buildBody = (reduce: boolean) => ({
    contents: [{ parts }],
    generationConfig: {
      candidateCount: reduce ? 1 : candidateCount,
      ...(negativePrompt ? { negativePrompt } : {}),
      ...(includeResponseMime ? { response_mime_type: 'image/png' } : {}),
    },
  })

  const parseRetryAfterMs = (res: Response, json: any): number | null => {
    const hdr = res.headers.get('retry-after')
    if (hdr) {
      const sec = Number(hdr)
      if (!Number.isNaN(sec)) return Math.max(0, sec * 1000)
      const when = Date.parse(hdr)
      if (!Number.isNaN(when)) return Math.max(0, when - Date.now())
    }
    try {
      const details = json?.error?.details
      if (Array.isArray(details)) {
        for (const d of details) {
          if (d?.['@type'] === 'type.googleapis.com/google.rpc.RetryInfo') {
            const s = d?.retryDelay as string | undefined
            if (s && s.endsWith('s')) {
              const n = Number(s.replace('s', ''))
              if (!Number.isNaN(n)) return Math.max(0, Math.round(n * 1000))
            }
          }
        }
      }
    } catch {}
    return null
  }

  const doFetch = async (attempt = 0): Promise<any> => {
    const reqBody = buildBody(attempt > 0 && candidateCount > 1)

    console.log('Gemini request body:', JSON.stringify(reqBody, null, 2))

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(reqBody),
    })
    if (!res.ok) {
      const maybeJson = await res.clone().json().catch(() => null)
      if ((res.status === 429 || res.status === 503) && attempt < 3) {
        const hinted = parseRetryAfterMs(res, maybeJson)
        const base = 300 * 2 ** attempt + Math.random() * 300
        const delay = Math.min(60000, Math.max(hinted ?? base, 300))
        const reason: BackoffEventDetail['reason'] = res.status === 429 ? '429' : '503'
        try {
          geminiEvents.dispatchEvent(new CustomEvent<BackoffEventDetail>('gemini:backoff', {
            detail: { attempt: attempt + 1, delayMs: delay, reason },
          }))
        } catch {}
        await new Promise(r => setTimeout(r, delay))
        try {
          geminiEvents.dispatchEvent(new CustomEvent<BackoffEventDetail>('gemini:backoff-complete', {
            detail: { attempt: attempt + 1, delayMs: 0, reason },
          }))
        } catch {}
        return doFetch(attempt + 1)
      }
      const txt = maybeJson ? JSON.stringify(maybeJson) : (await res.text().catch(() => ''))
      throw new Error(`Gemini API error ${res.status}: ${txt || res.statusText}`)
    }
    return res.json()
  }

  const json = await doFetch()

  console.log('Gemini API response:', JSON.stringify(json, null, 2))

  const images: { blob: Blob; mime: string; dataUrl: string }[] = []
  const notes: string[] = []

  const candidates = json.candidates ?? []
  console.log('Gemini candidates found:', candidates.length)

  if (!Array.isArray(candidates) || candidates.length === 0) {
    const pf = json.promptFeedback
    if (pf?.blockReason) {
      throw new Error(`Output was blocked: ${pf.blockReason}`)
    }
  }
  for (const cand of candidates) {
    const content = (cand && cand.content) ?? {}
    const cparts = (content && content.parts) ?? []
    console.log('Gemini parts found in candidate:', cparts.length)

    for (const p of cparts) {
      console.log('Gemini processing part:', { hasText: !!p?.text, hasInlineData: !!p?.inlineData })

      if (p && p.text) {
        notes.push(String(p.text))
        console.log('Gemini added text note:', p.text)
      } else if (p && p.inlineData && p.inlineData.data && p.inlineData.mimeType?.startsWith('image/')) {
        const mime = p.inlineData.mimeType as string
        const b64 = p.inlineData.data as string
        const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
        const blob = new Blob([bin], { type: mime })
        const dataUrl = `data:${mime};base64,${b64}`
        images.push({ blob, mime, dataUrl })
        console.log('Gemini added image:', mime, 'size:', bin.length)
      }
    }
  }
  return { images, notes, raw: json } as const
}

async function generateWithSeedream({
  credentials,
  prompt,
  negativePrompt,
  inputFiles,
  candidateCount,
}: {
  credentials: string
  prompt: string
  negativePrompt?: string
  inputFiles: { dataUrl: string; mime: string }[]
  candidateCount: number
}) {
  if (inputFiles.length === 0) {
    throw new Error('Seedream v4 Edit requires at least one input image.')
  }

  const client = getFalClient(credentials)
  const inputImages = await Promise.all(
    inputFiles.map(async (file, index) => {
      const res = await fetch(file.dataUrl)
      if (!res.ok) {
        throw new Error('Failed to load input images.')
      }
      const blob = await res.blob()
      const name = `input-${index + 1}.${mimeToExtension(blob.type || file.mime)}`
      return new File([blob], name, { type: blob.type || file.mime })
    })
  )

  const maxOutputs = Math.max(1, Math.min(candidateCount, Math.max(1, 15 - inputImages.length)))
  const truncated = candidateCount > maxOutputs
  const payload: Record<string, unknown> = {
    prompt,
    num_images: 1,
    max_images: maxOutputs,
  }
  if (negativePrompt) {
    payload.negative_prompt = negativePrompt
  }
  if (inputImages.length > 0) {
    payload.image_urls = inputImages
  }

  console.log('Seedream request payload keys:', Object.keys(payload))

  try {
    const { data, requestId } = await client.subscribe('fal-ai/bytedance/seedream/v4/edit', {
      input: payload,
      onQueueUpdate(update) {
        logQueueUpdate(update)
      },
    })

    console.log('Seedream request completed:', requestId, data)

    const images: { blob: Blob; mime: string; dataUrl: string }[] = []
    const notes: string[] = []

    const results = extractImageUrls(data)
    if (results.length === 0) {
      throw new Error('Seedream v4 Edit returned no images. Check your parameters.')
    }

    for (const url of results) {
      const { blob, dataUrl } = await fetchImageAsDataUrl(url)
      images.push({ blob, mime: blob.type || 'image/png', dataUrl })
    }

    if (typeof (data as any)?.seed !== 'undefined') {
      notes.push(`Seed: ${(data as any).seed}`)
    }

    if (truncated) {
      notes.push(`Requested ${candidateCount} images, but API returned up to ${maxOutputs} due to total image limits.`)
    }

    return { images, notes, raw: data } as const
  } catch (error) {
    console.error('Seedream request failed:', error)
    if (error instanceof ValidationError) {
      console.error('Seedream validation body:', error.body)
    }
    if (error instanceof ValidationError) {
      const fieldError = error.fieldErrors[0]
      if (fieldError) {
        throw new Error(`Seedream API error: ${fieldError.loc.join('.')} - ${fieldError.msg}`)
      }
      throw new Error(`Seedream API validation error: ${error.message}`)
    }
    if (error instanceof Error) {
      throw new Error(`Seedream API error: ${error.message}`)
    }
    throw error
  }
}

function mimeToExtension(mime: string) {
  if (!mime) return 'png'
  const [, subtype] = mime.split('/')
  if (!subtype) return 'png'
  if (subtype.includes('jpeg')) return 'jpg'
  return subtype.split(';')[0] || 'png'
}

async function fetchImageAsDataUrl(url: string) {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Failed to fetch generated images.')
  }
  const blob = await res.blob()
  const dataUrl = await blobToDataUrl(blob)
  return { blob, dataUrl }
}

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to encode generated image.'))
    reader.onload = () => resolve(String(reader.result))
    reader.readAsDataURL(blob)
  })

const extractImageUrls = (data: unknown): string[] => {
  if (!data) return []
  const urls: string[] = []
  const maybe = data as Record<string, unknown>

  const images = maybe.images
  if (Array.isArray(images)) {
    for (const item of images) {
      if (typeof item === 'string') {
        urls.push(item)
      } else if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>
        if (typeof obj.url === 'string') urls.push(obj.url)
        if (Array.isArray(obj.urls)) {
          for (const inner of obj.urls) {
            if (typeof inner === 'string') urls.push(inner)
          }
        }
      }
    }
  }

  if (typeof maybe.image === 'string') {
    urls.push(maybe.image)
  }

  if (Array.isArray(maybe.outputs)) {
    for (const output of maybe.outputs) {
      if (output && typeof output === 'object') {
        const url = (output as Record<string, unknown>).url
        if (typeof url === 'string') urls.push(url)
      }
    }
  }

  return Array.from(new Set(urls))
}

const logQueueUpdate = (update: QueueStatus | Record<string, unknown>) => {
  if (!update) return
  try {
    if ((update as QueueStatus).status) {
      const status = (update as QueueStatus).status
      if (status === 'IN_QUEUE') {
        console.log('Seedream queue position:', (update as QueueStatus & { queue_position?: number }).queue_position)
      } else if (status === 'IN_PROGRESS') {
        console.log('Seedream processing...')
      } else if (status === 'COMPLETED') {
        console.log('Seedream completed')
      }
    }
  } catch (e) {
    console.warn('Failed to parse Seedream queue update', e)
  }
}

async function generateWithSeedreamText({
  credentials,
  prompt,
  negativePrompt,
  candidateCount,
}: {
  credentials: string
  prompt: string
  negativePrompt?: string
  candidateCount: number
}) {
  const client = getFalClient(credentials)

  const payload: Record<string, unknown> = {
    prompt,
    num_images: Math.max(1, Math.min(candidateCount, 4)),
  }
  if (negativePrompt) {
    payload.negative_prompt = negativePrompt
  }

  console.log('Seedream text-to-image payload keys:', Object.keys(payload))

  try {
    const { data, requestId } = await client.subscribe('fal-ai/bytedance/seedream/v4/text-to-image', {
      input: payload,
      onQueueUpdate(update) {
        logQueueUpdate(update)
      },
    })

    console.log('Seedream text request completed:', requestId, data)

    const images: { blob: Blob; mime: string; dataUrl: string }[] = []
    const notes: string[] = []

    const results = extractImageUrls(data)
    if (results.length === 0) {
      throw new Error('Seedream v4 Text-to-Image returned no images. Try adjusting the prompt.')
    }

    for (const url of results) {
      const { blob, dataUrl } = await fetchImageAsDataUrl(url)
      images.push({ blob, mime: blob.type || 'image/png', dataUrl })
    }

    if (typeof (data as any)?.seed !== 'undefined') {
      notes.push(`Seed: ${(data as any).seed}`)
    }

    return { images, notes, raw: data } as const
  } catch (error) {
    console.error('Seedream text request failed:', error)
    if (error instanceof ValidationError) {
      console.error('Seedream text validation body:', error.body)
    }
    if (error instanceof ValidationError) {
      const fieldError = error.fieldErrors[0]
      if (fieldError) {
        throw new Error(`Seedream Text API error: ${fieldError.loc.join('.')} - ${fieldError.msg}`)
      }
      throw new Error(`Seedream Text API validation error: ${error.message}`)
    }
    if (error instanceof Error) {
      throw new Error(`Seedream Text API error: ${error.message}`)
    }
    throw error
  }
}
