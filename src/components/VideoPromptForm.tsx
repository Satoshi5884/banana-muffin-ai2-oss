import { useEffect, useMemo, useState } from 'react'
import ImageDrop from './ImageDrop'
import SavedImagePickerModal from './SavedImagePickerModal'
import type { VideoProviderId, VideoProviderInfo } from '../lib/videoProviders'

type ProviderOption = VideoProviderInfo & { hasKey: boolean }

type SubmitParams = {
  prompt: string
  inputImage: { dataUrl: string; mime: string }
  referenceImage?: { dataUrl: string; mime: string }
  duration: '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12'
  resolution: '480p' | '720p' | '1080p'
  cameraFixed: boolean
  seed?: number
}

type Props = {
  onSubmit: (params: SubmitParams) => void
  loading: boolean
  disabled?: boolean
  provider: VideoProviderId
  providers: ProviderOption[]
  onProviderChange: (id: VideoProviderId) => void
  providerDescription: string
  providerHasKey: boolean
  initialImage?: { dataUrl: string; mime: string } | null
}

export default function VideoPromptForm({
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
  const [referenceFiles, setReferenceFiles] = useState<{ dataUrl: string; mime: string; name: string }[]>([])
  const [duration, setDuration] = useState<'3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12'>('5')
  const [resolution, setResolution] = useState<'480p' | '720p' | '1080p'>('720p')
  const [cameraFixed, setCameraFixed] = useState(false)
  const [seed, setSeed] = useState('')
  const [pickerTarget, setPickerTarget] = useState<'input' | 'reference' | null>(null)

  useEffect(() => {
    if (initialImage) {
      setInputFiles([{ dataUrl: initialImage.dataUrl, mime: initialImage.mime, name: 'input.png' }])
    }
  }, [initialImage?.dataUrl])

  const requiresReferenceImage = provider === 'seedance-lite-reference-to-video'

  const currentProvider = useMemo(() => {
    return providers.find(p => p.id === provider)
  }, [providers, provider])

  const canSubmit = useMemo(() => {
    return (
      !disabled &&
      !loading &&
      providerHasKey &&
      prompt.trim().length > 0 &&
      inputFiles.length > 0 &&
      (!requiresReferenceImage || referenceFiles.length > 0)
    )
  }, [disabled, loading, providerHasKey, prompt, inputFiles.length, requiresReferenceImage, referenceFiles.length])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    const seedValue = seed.trim() ? Number(seed.trim()) : undefined
    if (seedValue !== undefined && Number.isNaN(seedValue)) {
      alert('Seed must be a numeric value.')
      return
    }

    onSubmit({
      prompt: prompt.trim(),
      inputImage: { dataUrl: inputFiles[0].dataUrl, mime: inputFiles[0].mime },
      referenceImage: requiresReferenceImage && referenceFiles[0]
        ? { dataUrl: referenceFiles[0].dataUrl, mime: referenceFiles[0].mime }
        : undefined,
      duration,
      resolution,
      cameraFixed,
      seed: seedValue,
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4" aria-label="Image to Video Generation Form">
      <div>
        <label htmlFor="video-provider" className="block text-sm font-medium text-gray-700">Video Model</label>
        <select
          id="video-provider"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-400 p-2"
          value={provider}
          onChange={e => onProviderChange(e.target.value as VideoProviderId)}
        >
          {providers.map(p => (
            <option key={p.id} value={p.id}>
              {p.shortLabel}{p.hasKey ? '' : ' (API key not configured)'}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">{providerDescription}</p>
        {currentProvider?.endpoint && (
          <p className="mt-1 text-xs text-gray-600">
            API: <code className="bg-gray-100 px-1 py-0.5 rounded">{currentProvider.endpoint}</code>
          </p>
        )}
        {!providerHasKey && (
          <p className="mt-1 text-xs text-red-500">The selected provider does not have an API key configured.</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="video-prompt" className="block text-sm font-medium text-gray-700">Prompt</label>
          {prompt && (
            <button
              type="button"
              onClick={() => setPrompt('')}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              title="Clear Prompt"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </button>
          )}
        </div>
        <textarea
          id="video-prompt"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-400 p-3"
          rows={4}
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Example: cinematic scene of the main character turning back on a sunset beach"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Input image (required)
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          <button
            type="button"
            onClick={() => setPickerTarget('input')}
            className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
          >
            Choose from saved images
          </button>
          {inputFiles.length > 0 && (
            <span className="text-xs text-gray-500 self-center">Currently using {inputFiles[0].name || 'selected image'}</span>
          )}
        </div>
        <ImageDrop files={inputFiles} setFiles={setInputFiles} max={1} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Reference image (optional){requiresReferenceImage ? ' – recommended for this provider' : ''}
          </span>
          {referenceFiles.length > 0 && (
            <button
              type="button"
              onClick={() => setReferenceFiles([])}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          <button
            type="button"
            onClick={() => setPickerTarget('reference')}
            className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
          >
            Choose from saved images
          </button>
          {referenceFiles.length > 0 && (
            <span className="text-xs text-gray-500 self-center">Currently using {referenceFiles[0].name || 'selected reference image'}</span>
          )}
        </div>
        <ImageDrop files={referenceFiles} setFiles={setReferenceFiles} max={1} />
        <p className="mt-1 text-xs text-gray-500">Use this to keep style or character consistent.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="flex flex-col text-sm text-gray-700">
          <span className="font-medium mb-1">Video Length</span>
          <select
            className="rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-400 p-2"
            value={duration}
            onChange={e => setDuration(e.target.value as SubmitParams['duration'])}
          >
            {['3','4','5','6','7','8','9','10','11','12'].map(option => (
              <option key={option} value={option}>{option} sec</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-sm text-gray-700">
          <span className="font-medium mb-1">Resolution</span>
          <select
            className="rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-400 p-2"
            value={resolution}
            onChange={e => setResolution(e.target.value as SubmitParams['resolution'])}
          >
            <option value="480p">480p (fast)</option>
            <option value="720p">720p (standard)</option>
            <option value="1080p">1080p (high quality)</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={cameraFixed}
            onChange={e => setCameraFixed(e.target.checked)}
            className="rounded border-gray-300"
          />
          Lock camera
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="video-seed">Seed (optional)</label>
        <input
          id="video-seed"
          type="text"
          value={seed}
          onChange={e => setSeed(e.target.value)}
          placeholder="Use -1 for random"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-400 p-2"
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={!canSubmit}
          className={`px-4 py-2 rounded-md text-white w-full sm:w-auto ${canSubmit ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
        >
          {loading ? 'Generating Video...' : 'Generate Video'}
        </button>
      </div>

      <SavedImagePickerModal
        isOpen={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        onSelect={async saved => {
          if (pickerTarget === 'reference') {
            setReferenceFiles([{ dataUrl: saved.dataUrl, mime: saved.mime, name: saved.name ?? 'saved-reference.png' }])
          } else {
            setInputFiles([{ dataUrl: saved.dataUrl, mime: saved.mime, name: saved.name ?? 'saved-image.png' }])
          }
          setPickerTarget(null)
        }}
      />
    </form>
  )
}
