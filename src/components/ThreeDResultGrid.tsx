import { useEffect, useState } from 'react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import type { GeneratedModel } from '../lib/threeDProviders'
import ThreeDSaveOptions from './ThreeDSaveOptions'

type Props = {
  items: GeneratedModel[]
  notes: string[]
  prompt?: string
  onModelSaved?: () => void
}

export default function ThreeDResultGrid({ items, notes, prompt, onModelSaved }: Props) {
  const [viewerReady, setViewerReady] = useState(false)
  const [downloadingTextureIndex, setDownloadingTextureIndex] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    const existing = document.querySelector('script[data-model-viewer]') as HTMLScriptElement | null
    if (existing) {
      if (!cancelled) setViewerReady(true)
      return () => {
        cancelled = true
      }
    }

    const script = document.createElement('script')
    script.type = 'module'
    script.src = 'https://unpkg.com/@google/model-viewer@^4.0.0/dist/model-viewer.min.js'
    script.setAttribute('data-model-viewer', 'true')
    script.onload = () => {
      if (!cancelled) setViewerReady(true)
    }
    script.onerror = () => {
      console.error('Failed to load model-viewer script')
      if (!cancelled) setViewerReady(false)
    }
    document.head.appendChild(script)

    return () => {
      cancelled = true
    }
  }, [])

  if (!items.length && !notes.length) return null

  const downloadTextures = async (item: GeneratedModel, index: number) => {
    if (!item.textures.length) {
      alert('No texture outputs were found.')
      return
    }
    try {
      setDownloadingTextureIndex(index)
      const zip = new JSZip()
      let counter = 1
      for (const texture of item.textures) {
        const blob = await fetchAsBlob(texture.url)
        const ext = inferExtension(texture.contentType)
        const name = `texture-${String(counter).padStart(2, '0')}.${ext}`
        zip.file(name, blob)
        counter += 1
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      saveAs(zipBlob, 'hyper3d-textures.zip')
    } catch (error) {
      console.error('Failed to download textures', error)
      alert('Failed to download textures. Please try again later.')
    } finally {
      setDownloadingTextureIndex(prev => (prev === index ? null : prev))
    }
  }

  return (
    <section aria-label="Generated 3D model results" className="space-y-3">
      {items.length > 0 && (
        <ul className="space-y-4">
          {items.map((item, index) => (
            <li key={index} className="border rounded-md bg-white shadow-sm">
              <div className="p-4 space-y-4">
                <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h3 className="text-lg font-semibold">Generated model {index + 1}</h3>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                    <span>Format: {item.options.geometryFormat}</span>
                    <span>Material: {item.options.material}</span>
                    <span>Quality: {item.options.quality}</span>
                    <span>Mode: {item.options.conditionMode}</span>
                  </div>
                </header>

                <div className="rounded-md border bg-gray-900">
                  {viewerReady ? (
                    <model-viewer
                      src={item.remoteUrl}
                      alt={`Hyper3D model ${index + 1}`}
                      camera-controls
                      autoplay
                      shadow-intensity="1"
                      style={{ width: '100%', height: '320px', backgroundColor: 'rgba(17,24,39,1)' }}
                    />
                  ) : (
                    <div className="h-80 flex items-center justify-center text-sm text-gray-400">
                      Loading 3D preview…
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => downloadTextures(item, index)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    disabled={downloadingTextureIndex === index}
                  >
                    {downloadingTextureIndex === index ? 'Compressing…' : 'Download all textures'}
                  </button>
                  <span className="self-center text-xs text-gray-600">Filename: {item.fileName}</span>
                  {item.seed !== undefined && (
                    <span className="self-center text-xs text-gray-600">Seed: {item.seed}</span>
                  )}
                  {item.options.useHyper && (
                    <span className="self-center text-xs text-purple-600">HyperMode</span>
                  )}
                  {item.options.tier === 'Sketch' && (
                    <span className="self-center text-xs text-gray-600">Tier: Sketch</span>
                  )}
                  {item.options.TAPose && (
                    <span className="self-center text-xs text-gray-600">TA pose</span>
                  )}
                  {item.options.addons.length > 0 && (
                    <span className="self-center text-xs text-gray-600">Add-ons: {item.options.addons.join(', ')}</span>
                  )}
                </div>

                <ThreeDSaveOptions
                  model={item}
                  index={index}
                  prompt={prompt}
                  getModelBlob={() => fetchAsBlob(item.remoteUrl)}
                  onUploadSuccess={onModelSaved}
                />

                {item.textures.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Texture preview</h4>
                    <ul className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {item.textures.map((texture, textureIndex) => (
                        <li key={textureIndex} className="border rounded overflow-hidden bg-gray-50">
                          <img
                            src={texture.url}
                            alt={`Texture ${textureIndex + 1}`}
                            className="w-full h-32 object-cover"
                          />
                          <div className="px-2 py-1 text-xs text-gray-600">
                            <p>{texture.width} × {texture.height}</p>
                            <p>{texture.contentType ?? 'image/png'}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {notes.length > 0 && (
        <div className="bg-gray-50 border rounded p-3">
          <h3 className="font-medium mb-2">Notes</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
            {notes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

const fetchAsBlob = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch file: ${res.status}`)
  }
  return await res.blob()
}

const inferExtension = (contentType?: string) => {
  if (!contentType) return 'png'
  const normalized = contentType.toLowerCase()
  if (normalized.includes('png')) return 'png'
  if (normalized.includes('jpeg') || normalized.includes('jpg')) return 'jpg'
  if (normalized.includes('webp')) return 'webp'
  if (normalized.includes('exr')) return 'exr'
  if (normalized.includes('tiff') || normalized.includes('tif')) return 'tif'
  const [, subtype] = normalized.split('/')
  return subtype?.split(';')[0] || 'png'
}
