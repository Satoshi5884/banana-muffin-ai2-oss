import { useEffect, useMemo, useState } from 'react'
import ImageDrop from './ImageDrop'
import DrawingCanvas from './DrawingCanvas'
import type { ImageProviderId } from '../lib/imageProviders'

type ProviderOption = {
  id: ImageProviderId
  label: string
  shortLabel: string
  requiresKey: 'gemini' | 'fal'
  requiresBaseImage: boolean
  maxInputImages: number
  hasKey: boolean
  maxCandidates: number
}

type Props = {
  onSubmit: (params: {
    prompt: string
    negativePrompt?: string
    files: { dataUrl: string; mime: string }[]
    candidateCount: number
  }) => void
  loading: boolean
  disabled?: boolean
  backoffSeconds?: number | null
  provider: ImageProviderId
  providers: ProviderOption[]
  onProviderChange: (id: ImageProviderId) => void
  providerDescription: string
  providerHasKey: boolean
  requiresBaseImage: boolean
  maxFiles: number
  maxCandidates: number
}

export default function PromptForm({
  onSubmit,
  loading,
  disabled,
  backoffSeconds,
  provider,
  providers,
  onProviderChange,
  providerDescription,
  providerHasKey,
  requiresBaseImage,
  maxFiles,
  maxCandidates,
}: Props) {
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [showNegativePrompt, setShowNegativePrompt] = useState(false)
  const [files, setFiles] = useState<{ dataUrl: string; mime: string; name: string }[]>([])
  const [count, setCount] = useState(1)
  const [showSketch, setShowSketch] = useState(false)

  const allowImages = maxFiles > 0

  useEffect(() => {
    setFiles(prev => (prev.length > maxFiles ? prev.slice(0, maxFiles) : prev))
  }, [maxFiles])

  useEffect(() => {
    if (!allowImages) {
      setShowSketch(false)
    }
  }, [allowImages])

  const canSubmit = useMemo(
    () =>
      !disabled &&
      !loading &&
      providerHasKey &&
      prompt.trim().length > 0 &&
      (!requiresBaseImage || files.length > 0),
    [disabled, loading, providerHasKey, prompt, requiresBaseImage, files.length]
  )

  useEffect(() => {
    if (count > maxCandidates) {
      setCount(maxCandidates)
    }
  }, [maxCandidates, count])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit({
      prompt: prompt.trim(),
      negativePrompt: negativePrompt.trim() || undefined,
      files: files.map(f => ({ dataUrl: f.dataUrl, mime: f.mime })),
      candidateCount: count,
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4" aria-label="Image Generation Form">
      <div>
        <label htmlFor="provider" className="block text-sm font-medium text-gray-700">Model provider</label>
        <select
          id="provider"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-400 p-2"
          value={provider}
          onChange={e => onProviderChange(e.target.value as ImageProviderId)}
        >
          {providers.map(p => (
            <option key={p.id} value={p.id}>
              {p.shortLabel}{p.hasKey ? '' : ' (API key not set)'}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">{providerDescription}</p>
        {!providerHasKey && (
          <p className="mt-1 text-xs text-red-500">API key for the selected provider is not set.</p>
        )}
        {requiresBaseImage && (
          <p className="mt-1 text-xs text-amber-600">This provider requires input images.</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">Prompt</label>
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
          id="prompt"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-400 p-3"
          rows={4}
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Example: Blend the second image naturally into a cafe scene while preserving the subject's characteristics"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={() => setShowNegativePrompt(!showNegativePrompt)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <svg
              className={`w-4 h-4 transform transition-transform ${showNegativePrompt ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Negative Prompt (Optional)
          </button>
          {showNegativePrompt && negativePrompt && (
            <button
              type="button"
              onClick={() => setNegativePrompt('')}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              title="Clear negative prompt"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </button>
          )}
        </div>
        {showNegativePrompt && (
          <textarea
            id="negative"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-400 p-3"
            rows={2}
            value={negativePrompt}
            onChange={e => setNegativePrompt(e.target.value)}
            placeholder="Example: low quality, blur"
          />
        )}
      </div>

      {allowImages ? (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Input Images{requiresBaseImage ? ' (Required)' : ' (Optional)'} - Max {maxFiles}
            </label>
            <ImageDrop files={files} setFiles={setFiles} max={maxFiles} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setShowSketch(v => !v)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                aria-expanded={showSketch}
                aria-controls="sketch-panel"
              >
                <svg
                  className={`w-4 h-4 transform transition-transform ${showSketch ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Sketch (optional)
              </button>
              <span className="text-xs text-gray-500">Send the sketch as composition guidance</span>
            </div>
            {showSketch && (
              <div id="sketch-panel" className="mt-2 w-full max-w-full overflow-hidden">
                <DrawingCanvas
                  width={768}
                  height={512}
                  className="w-full"
                  onExport={(dataUrl, mime) => {
                    if (files.length >= maxFiles) {
                      alert('Maximum number of images reached. Please remove existing images before adding more.')
                      return
                    }
                    setFiles(prev => [...prev, { dataUrl, mime, name: 'sketch.png' }])
                  }}
                />
              </div>
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-500">This provider does not use input images.</p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <label htmlFor="cand" className="text-sm font-medium text-gray-700">Number of Images</label>
        <select
          id="cand"
          className="rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-400 p-2 w-28"
          value={count}
          onChange={e => setCount(Number(e.target.value))}
          aria-label="Number of images to generate"
        >
          {Array.from({ length: Math.max(1, maxCandidates) }, (_, i) => i + 1).map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div>
        <button
          type="submit"
          disabled={!canSubmit}
          className={`px-4 py-2 rounded-md text-white w-full sm:w-auto ${canSubmit ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
          aria-label="Generate images"
        >
          {loading ? (backoffSeconds != null ? `Retry in ${backoffSeconds}s` : 'Generating...') : 'Generate'}
        </button>
      </div>
    </form>
  )
}
