import { ValidationError, type QueueStatus } from '@fal-ai/client'
import { getFalClient } from './falClient'

export type ThreeDProviderId = 'hyper3d-rodin'

export type ConditionMode = 'fuse' | 'concat'
export type GeometryFormat = 'glb' | 'usdz' | 'fbx' | 'obj' | 'stl'
export type MaterialType = 'PBR' | 'Shaded'
export type QualityPreset = 'high' | 'medium' | 'low' | 'extra-low'
export type TierType = 'Regular' | 'Sketch'
export type AddonType = 'HighPack'

export type ThreeDProviderInfo = {
  id: ThreeDProviderId
  label: string
  shortLabel: string
  description: string
  requiresKey: 'fal'
  minInputImages: number
  maxInputImages: number
  supportedConditionModes: ConditionMode[]
  supportedFormats: GeometryFormat[]
  supportedMaterials: MaterialType[]
  supportedQualities: QualityPreset[]
  supportsHyper: boolean
  supportsAddons: boolean
}

export const THREE_D_PROVIDERS: ThreeDProviderInfo[] = [
  {
    id: 'hyper3d-rodin',
    label: 'Hyper3D Rodin (Image→3D)',
    shortLabel: 'Hyper3D Rodin',
    description: 'Generate 3D models from input images using fal.ai/hyper3d/rodin.',
    requiresKey: 'fal',
    minInputImages: 1,
    maxInputImages: 6,
    supportedConditionModes: ['concat', 'fuse'],
    supportedFormats: ['glb', 'usdz', 'fbx', 'obj', 'stl'],
    supportedMaterials: ['PBR', 'Shaded'],
    supportedQualities: ['high', 'medium', 'low', 'extra-low'],
    supportsHyper: true,
    supportsAddons: true,
  },
]

export type GenerateThreeDOptions = {
  provider: ThreeDProviderId
  prompt?: string
  inputImages: { dataUrl: string; mime: string }[]
  conditionMode?: ConditionMode
  geometryFormat?: GeometryFormat
  material?: MaterialType
  quality?: QualityPreset
  useHyper?: boolean
  tier?: TierType
  TAPose?: boolean
  bboxCondition?: number[]
  addons?: AddonType[]
  seed?: number
  falCredentials: string
}

export type GeneratedModel = {
  remoteUrl: string
  fileName: string
  mime: string
  seed?: number
  textures: { url: string; width: number; height: number; contentType?: string }[]
  options: {
    conditionMode: ConditionMode
    geometryFormat: GeometryFormat
    material: MaterialType
    quality: QualityPreset
    useHyper: boolean
    tier: TierType
    TAPose: boolean
    addons: AddonType[]
  }
}

export async function generateThreeD(options: GenerateThreeDOptions) {
  if (options.provider !== 'hyper3d-rodin') {
    throw new Error('Unsupported 3D provider.')
  }

  if (options.inputImages.length === 0) {
    throw new Error('Hyper3D Rodin requires at least one input image.')
  }

  const client = getFalClient(options.falCredentials)

  const files = await Promise.all(
    options.inputImages.map((image, index) => dataUrlToFile(image, `input-${index + 1}`))
  )

  const payload: Record<string, unknown> = {
    input_image_urls: files,
  }

  const prompt = options.prompt?.trim()
  if (prompt) payload.prompt = prompt

  const addonsList = Array.isArray(options.addons) ? options.addons : []

  payload.condition_mode = options.conditionMode ?? 'concat'
  payload.geometry_file_format = options.geometryFormat ?? 'glb'
  payload.material = options.material ?? 'PBR'
  payload.quality = options.quality ?? 'medium'
  payload.use_hyper = options.useHyper ?? false
  payload.tier = options.tier ?? 'Regular'
  if (typeof options.TAPose === 'boolean') payload.TAPose = options.TAPose
  if (Array.isArray(options.bboxCondition) && options.bboxCondition.length > 0) {
    payload.bbox_condition = options.bboxCondition
  }
  if (addonsList.length > 0) {
    payload.addons = addonsList.length === 1 ? addonsList[0] : addonsList
  }
  if (typeof options.seed === 'number') {
    payload.seed = options.seed
  }

  try {
    const { data, requestId } = await client.subscribe('fal-ai/hyper3d/rodin', {
      input: payload,
      onQueueUpdate(update) {
        logQueueUpdate(update)
      },
    })

    console.log('Hyper3D request completed:', requestId, data)

    const model = extractModelMesh(data)
    if (!model) {
      throw new Error('Failed to generate the 3D model. Check provider output.')
    }

    const textures = Array.isArray((data as any)?.textures)
      ? ((data as any).textures as Array<Record<string, unknown>>).map(t => ({
          url: typeof t.url === 'string' ? t.url : '',
          width: typeof t.width === 'number' ? t.width : 0,
          height: typeof t.height === 'number' ? t.height : 0,
          contentType: typeof t.content_type === 'string' ? t.content_type : undefined,
        })).filter(tex => tex.url)
      : []

    const notes: string[] = []
    const seed = typeof (data as any)?.seed === 'number' ? Number((data as any).seed) : undefined
    if (seed !== undefined) {
      notes.push(`Seed: ${seed}`)
    }
    notes.push(`Format: ${String(payload.geometry_file_format)}`)
    notes.push(`Material: ${String(payload.material)}`)
    notes.push(`Quality: ${String(payload.quality)}`)
    if (payload.condition_mode) notes.push(`Condition mode: ${String(payload.condition_mode)}`)
    if (payload.use_hyper) notes.push('Hyper mode: ON')
    if (payload.tier && payload.tier !== 'Regular') notes.push(`Tier: ${String(payload.tier)}`)
    if (payload.TAPose) notes.push('TA pose: Enabled')
    const normalizedAddons: AddonType[] = Array.isArray(payload.addons)
      ? (payload.addons as AddonType[])
      : typeof payload.addons === 'string'
        ? [payload.addons as AddonType]
        : []
    if (normalizedAddons.length > 0) {
      notes.push(`Add-ons: ${normalizedAddons.join(', ')}`)
    }

    const generated: GeneratedModel = {
      remoteUrl: model.url,
      fileName: model.fileName,
      mime: model.mime,
      seed,
      textures,
      options: {
        conditionMode: (payload.condition_mode as ConditionMode) ?? 'concat',
        geometryFormat: (payload.geometry_file_format as GeometryFormat) ?? 'glb',
        material: (payload.material as MaterialType) ?? 'PBR',
        quality: (payload.quality as QualityPreset) ?? 'medium',
        useHyper: Boolean(payload.use_hyper),
        tier: (payload.tier as TierType) ?? 'Regular',
        TAPose: Boolean(payload.TAPose),
        addons: normalizedAddons,
      },
    }

    const models: GeneratedModel[] = [generated]
    return { models, notes, raw: data } as const
  } catch (error) {
    console.error('Hyper3D request failed:', error)
    if (error instanceof ValidationError) {
      const fieldError = error.fieldErrors[0]
      if (fieldError) {
        throw new Error(`Hyper3D API error: ${fieldError.loc.join('.')} - ${fieldError.msg}`)
      }
      throw new Error(`Hyper3D API validation error: ${error.message}`)
    }
    if (error instanceof Error) {
      throw new Error(`Hyper3D API error: ${error.message}`)
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
    throw new Error('Failed to load input images.')
  }
  const blob = await res.blob()
  const inferredMime = blob.type || source.mime
  const ext = mimeToExtension(inferredMime)
  const name = `${baseName}.${ext}`
  return new File([blob], name, { type: inferredMime })
}

const extractModelMesh = (data: unknown) => {
  if (!data) return null
  const maybe = data as Record<string, unknown>
  const mesh = maybe.model_mesh
  if (!mesh) return null
  if (typeof mesh === 'string') {
    return {
      url: mesh,
      fileName: 'hyper3d-model.glb',
      mime: 'model/gltf-binary',
    }
  }
  if (mesh && typeof mesh === 'object') {
    const file = mesh as Record<string, unknown>
    if (typeof file.url === 'string') {
      return {
        url: file.url,
        fileName: typeof file.file_name === 'string' ? file.file_name : inferFileNameFromMime(String(file.content_type ?? 'model/gltf-binary')),
        mime: typeof file.content_type === 'string' ? file.content_type : 'model/gltf-binary',
      }
    }
  }
  return null
}

const inferFileNameFromMime = (mime: string) => {
  const ext = mimeToExtension(mime)
  return `hyper3d-model.${ext}`
}

const mimeToExtension = (mime: string) => {
  if (!mime) return 'bin'
  const normalized = mime.toLowerCase()
  if (normalized.includes('gltf') || normalized.includes('glb')) return 'glb'
  if (normalized.includes('usdz')) return 'usdz'
  if (normalized.includes('fbx')) return 'fbx'
  if (normalized.includes('obj')) return 'obj'
  if (normalized.includes('stl')) return 'stl'
  if (normalized.includes('zip')) return 'zip'
  const [, subtype] = normalized.split('/')
  return subtype?.split(';')[0] || 'bin'
}

const logQueueUpdate = (update: QueueStatus | Record<string, unknown>) => {
  if (!update) return
  try {
    if ((update as QueueStatus).status) {
      const status = (update as QueueStatus).status
      if (status === 'IN_QUEUE') {
        console.log('Hyper3D queue position:', (update as QueueStatus & { queue_position?: number }).queue_position)
      } else if (status === 'IN_PROGRESS') {
        console.log('Hyper3D processing...')
      } else if (status === 'COMPLETED') {
        console.log('Hyper3D completed')
      }
    }
  } catch (error) {
    console.warn('Failed to parse Hyper3D queue update', error)
  }
}
