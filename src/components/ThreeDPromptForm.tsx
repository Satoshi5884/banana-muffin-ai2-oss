import { useEffect, useMemo, useState } from 'react'
import ImageDrop from './ImageDrop'
import SavedImagePickerModal from './SavedImagePickerModal'
import type {
  ThreeDProviderId,
  ThreeDProviderInfo,
  ConditionMode,
  GeometryFormat,
  MaterialType,
  QualityPreset,
  TierType,
  AddonType,
} from '../lib/threeDProviders'

type ProviderOption = ThreeDProviderInfo & { hasKey: boolean }

type SubmitParams = {
  prompt?: string
  inputImages: { dataUrl: string; mime: string }[]
  conditionMode: ConditionMode
  geometryFormat: GeometryFormat
  material: MaterialType
  quality: QualityPreset
  useHyper: boolean
  tier: TierType
  TAPose: boolean
  addons: AddonType[]
  bboxCondition?: number[]
  seed?: number
}

type Props = {
  onSubmit: (params: SubmitParams) => void
  loading: boolean
  disabled?: boolean
  provider: ThreeDProviderId
  providers: ProviderOption[]
  onProviderChange: (id: ThreeDProviderId) => void
  providerDescription: string
  providerHasKey: boolean
  initialImage?: { dataUrl: string; mime: string } | null
}

export default function ThreeDPromptForm({
  onSubmit,
  loading,
  disabled,
  provider,
  providers,
  onProviderChange,
  providerDescription,
  providerHasKey,
  initialImage,
}: Props) {
  const [prompt, setPrompt] = useState('')
  const [inputFiles, setInputFiles] = useState<{ dataUrl: string; mime: string; name: string }[]>([])
  const [conditionMode, setConditionMode] = useState<ConditionMode>('concat')
  const [geometryFormat, setGeometryFormat] = useState<GeometryFormat>('glb')
  const [material, setMaterial] = useState<MaterialType>('PBR')
  const [quality, setQuality] = useState<QualityPreset>('medium')
  const [useHyper, setUseHyper] = useState(false)
  const [tier, setTier] = useState<TierType>('Regular')
  const [tapose, setTapose] = useState(false)
  const [addonHighPack, setAddonHighPack] = useState(false)
  const [seed, setSeed] = useState('')
  const [bboxText, setBboxText] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => {
    if (initialImage) {
      setInputFiles(prev => {
        if (prev.length > 0 && prev[0].dataUrl === initialImage.dataUrl) return prev
        return [{ dataUrl: initialImage.dataUrl, mime: initialImage.mime, name: 'input.png' }]
      })
    }
  }, [initialImage?.dataUrl])

  const currentProvider = useMemo(() => {
    return providers.find(p => p.id === provider)
  }, [providers, provider])

  const maxImages = currentProvider?.maxInputImages ?? 4
  const minImages = currentProvider?.minInputImages ?? 1
  const conditionModes = currentProvider?.supportedConditionModes ?? ['concat']
  const formats = currentProvider?.supportedFormats ?? ['glb']
  const materials = currentProvider?.supportedMaterials ?? ['PBR']
  const qualities = currentProvider?.supportedQualities ?? ['medium']

  const canSubmit = useMemo(() => {
    if (disabled || loading) return false
    if (!providerHasKey) return false
    if (inputFiles.length < minImages) return false
    return true
  }, [disabled, loading, providerHasKey, inputFiles.length, minImages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    const seedValue = seed.trim() ? Number(seed.trim()) : undefined
    if (seedValue !== undefined && Number.isNaN(seedValue)) {
      alert('Seed must be a numeric value.')
      return
    }

    let bboxCondition: number[] | undefined
    if (bboxText.trim()) {
      const parsed = bboxText
        .split(',')
        .map(v => Number(v.trim()))
        .filter(v => !Number.isNaN(v))
      if (parsed.length === 0) {
        alert('Please enter the bounding box as comma-separated numbers, e.g., 1,1,1.')
        return
      }
      bboxCondition = parsed
    }

    onSubmit({
      prompt: prompt.trim() || undefined,
      inputImages: inputFiles.map(f => ({ dataUrl: f.dataUrl, mime: f.mime })),
      conditionMode,
      geometryFormat,
      material,
      quality,
      useHyper,
      tier,
      TAPose: tapose,
      addons: addonHighPack ? ['HighPack'] : [],
      bboxCondition,
      seed: seedValue,
    })
  }

  const handleSavedImageSelect = async (image: { dataUrl: string; mime: string; name?: string }) => {
    setInputFiles(prev => {
      if (prev.length >= maxImages) {
        alert(`You can upload up to ${maxImages} input images. Remove existing ones before adding more.`)
        return prev
      }
      return [...prev, { dataUrl: image.dataUrl, mime: image.mime, name: image.name || `saved-${prev.length + 1}.png` }]
    })
    setPickerOpen(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="3D generation form">
      <div>
        <label htmlFor="threed-provider" className="block text-sm font-medium text-gray-700">3D provider</label>
        <select
          id="threed-provider"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-400 p-2"
          value={provider}
          onChange={e => onProviderChange(e.target.value as ThreeDProviderId)}
        >
          {providers.map(p => (
            <option key={p.id} value={p.id}>
              {p.shortLabel}{p.hasKey ? '' : ' (API key not configured)'}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">{providerDescription}</p>
        {!providerHasKey && (
          <p className="mt-1 text-xs text-red-500">The selected provider does not have an API key configured.</p>
        )}
        <p className="mt-1 text-xs text-gray-500">{`Input images: ${minImages}–${maxImages} files`}</p>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="threed-prompt" className="block text-sm font-medium text-gray-700">Prompt (optional)</label>
          {prompt && (
            <button
              type="button"
              onClick={() => setPrompt('')}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              title="Clear prompt"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </button>
          )}
        </div>
        <textarea
          id="threed-prompt"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-400 p-3"
          rows={3}
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Example: Realistic ceramic mug with warm glaze and smooth silhouette"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Input images (required) up to {maxImages} files</label>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
          >
            Choose from saved images
          </button>
        </div>
        <ImageDrop files={inputFiles} setFiles={setInputFiles} max={maxImages} />
      </div>

      <details className="bg-gray-50 rounded-md border p-3">
        <summary className="text-sm font-medium cursor-pointer select-none">Advanced options</summary>
        <div className="mt-3 space-y-3 text-sm text-gray-700">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span>Condition mode</span>
              <select
                value={conditionMode}
                onChange={e => setConditionMode(e.target.value as ConditionMode)}
                className="rounded border-gray-300 p-2"
              >
                {conditionModes.map(mode => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span>Geometry format</span>
              <select
                value={geometryFormat}
                onChange={e => setGeometryFormat(e.target.value as GeometryFormat)}
                className="rounded border-gray-300 p-2"
              >
                {formats.map(format => (
                  <option key={format} value={format}>{format}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span>Material</span>
              <select
                value={material}
                onChange={e => setMaterial(e.target.value as MaterialType)}
                className="rounded border-gray-300 p-2"
              >
                {materials.map(materialOption => (
                  <option key={materialOption} value={materialOption}>{materialOption}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span>Quality</span>
              <select
                value={quality}
                onChange={e => setQuality(e.target.value as QualityPreset)}
                className="rounded border-gray-300 p-2"
              >
                {qualities.map(qualityOption => (
                  <option key={qualityOption} value={qualityOption}>{qualityOption}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={useHyper}
                onChange={e => setUseHyper(e.target.checked)}
                className="rounded border-gray-300"
                disabled={!currentProvider?.supportsHyper}
              />
              <span>Enable Hyper mode</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={tapose}
                onChange={e => setTapose(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span>Apply TA pose</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={addonHighPack}
                onChange={e => setAddonHighPack(e.target.checked)}
                className="rounded border-gray-300"
                disabled={!currentProvider?.supportsAddons}
              />
              <span>HighPack (high-resolution textures)</span>
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span>Tier</span>
            <select
              value={tier}
              onChange={e => setTier(e.target.value as TierType)}
              className="rounded border-gray-300 p-2"
            >
              <option value="Regular">Regular</option>
              <option value="Sketch">Sketch</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span>Seed (optional)</span>
            <input
              type="text"
              value={seed}
              onChange={e => setSeed(e.target.value)}
              className="rounded border-gray-300 p-2"
              placeholder="Number between 0 and 65535"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span>Bounding box (optional)</span>
            <input
              type="text"
              value={bboxText}
              onChange={e => setBboxText(e.target.value)}
              className="rounded border-gray-300 p-2"
              placeholder="Example: 1,1,1"
            />
            <span className="text-xs text-gray-500">Specify X, Y, Z lengths as comma-separated numbers.</span>
          </label>
        </div>
      </details>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!canSubmit}
          className={`px-4 py-2 rounded-md text-white ${canSubmit ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
        >
          {loading ? 'Generating…' : 'Generate 3D model'}
        </button>
      </div>

      <SavedImagePickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSavedImageSelect}
      />
    </form>
  )
}
