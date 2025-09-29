import { useEffect, useMemo, useState } from 'react'
import { saveAs } from 'file-saver'
import { ref, getBlob } from 'firebase/storage'
import { storage } from '../config/firebase'
import { useAuth } from '../contexts/AuthContext'
import {
  getUserModels,
  deleteModelFromStorage,
  formatStorageSize,
  type ModelMetadata,
} from '../lib/storage'

const ITEMS_PER_PAGE = 6

type Props = {
  onStorageUpdated?: () => void
}

export default function ModelGallery({ onStorageUpdated }: Props) {
  const { user, canUseStorage, updateStorageUsage } = useAuth()
  const [allModels, setAllModels] = useState<ModelMetadata[]>([])
  const [filteredModels, setFilteredModels] = useState<ModelMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [viewerReady, setViewerReady] = useState(false)

  const loadModels = async () => {
    if (!user || !canUseStorage()) {
      setAllModels([])
      setFilteredModels([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const list = await getUserModels(user.uid)
      setAllModels(list)
      setFilteredModels(list)
    } catch (err) {
      console.error('Failed to fetch 3D model list:', err)
      setError('Unable to load saved 3D models.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadModels()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

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

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredModels(allModels)
      setCurrentPage(1)
      return
    }

    const keyword = searchQuery.trim().toLowerCase()
    const matches = allModels.filter(model => {
      const originalName = (model.originalFileName ?? '').toLowerCase()
      const prompt = (model.prompt ?? '').toLowerCase()
      const format = (model.format ?? '').toLowerCase()
      const material = (model.material ?? '').toLowerCase()
      const quality = (model.quality ?? '').toLowerCase()
      return (
        originalName.includes(keyword) ||
        prompt.includes(keyword) ||
        format.includes(keyword) ||
        material.includes(keyword) ||
        quality.includes(keyword)
      )
    })

    setFilteredModels(matches)
    setCurrentPage(1)
  }, [searchQuery, allModels])

  const totalPages = Math.max(1, Math.ceil(filteredModels.length / ITEMS_PER_PAGE))

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  const paginatedModels = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredModels.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredModels, currentPage])

  const handleDelete = async (model: ModelMetadata) => {
    if (!confirm('Delete this 3D model?')) return
    setDeletingId(model.id)
    try {
      await deleteModelFromStorage(model.id)
      await updateStorageUsage(-model.fileSize)
      await loadModels()
      onStorageUpdated?.()
    } catch (err) {
      console.error('Failed to delete 3D model:', err)
      alert('Failed to delete the 3D model.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDownload = async (model: ModelMetadata) => {
    try {
      const blob = await loadModelBlob(model)
      const extension = model.originalFileName?.split('.').pop() || 'glb'
      const fileName = model.originalFileName || `hyper3d-model-${model.id}.${extension}`
      saveAs(blob, fileName)
    } catch (err) {
      console.error('Failed to download 3D model:', err)
      alert('Failed to download the 3D model.')
    }
  }

  if (!user || !canUseStorage()) {
    return <p className="text-sm text-gray-600">3D model storage is not available for your account.</p>
  }

  if (loading) {
    return <p className="text-sm text-gray-600">Loading…</p>
  }

  if (error) {
    return (
      <div className="space-y-3 text-sm">
        <p className="text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => void loadModels()}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Reload
        </button>
      </div>
    )
  }

  const emptyMessage = searchQuery.trim()
    ? 'No 3D models match your filters.'
    : 'No saved 3D models yet.'

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full sm:max-w-md items-center gap-2">
          <input
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by filename, prompt, format, or material"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">{filteredModels.length} items</span>
          <button
            type="button"
            onClick={() => void loadModels()}
            className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-100"
          >
            Reload
          </button>
        </div>
      </div>

      {filteredModels.length === 0 ? (
        <p className="text-sm text-gray-600">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {paginatedModels.map(model => (
            <article key={model.id} className="border rounded-md bg-white shadow-sm">
              <div className="p-4 space-y-3">
                <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold break-all">{model.originalFileName || model.fileName}</h3>
                    <p className="text-xs text-gray-500">Saved: {model.createdAt.toLocaleString()}</p>
                  </div>
                  <p className="text-xs text-gray-500">Size: {formatStorageSize(model.fileSize)}</p>
                </header>

                <div className="rounded-md border bg-gray-900">
                  {viewerReady ? (
                    <model-viewer
                      src={model.downloadURL}
                      alt={model.originalFileName ?? model.fileName}
                      camera-controls
                      autoplay
                      shadow-intensity="1"
                      style={{ width: '100%', height: '280px', backgroundColor: 'rgba(17,24,39,1)' }}
                    />
                  ) : (
                    <div className="h-72 flex items-center justify-center text-sm text-gray-400">
                      Loading 3D preview…
                    </div>
                  )}
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                  <div><span className="font-medium">Format:</span> {model.format}</div>
                  <div><span className="font-medium">Material:</span> {model.material}</div>
                  <div><span className="font-medium">Quality:</span> {model.quality}</div>
                  <div><span className="font-medium">Hyper:</span> {model.useHyper ? 'Enabled' : 'Disabled'}</div>
                  <div><span className="font-medium">Tier:</span> {model.tier}</div>
                  <div><span className="font-medium">TA pose:</span> {model.TAPose ? 'Enabled' : 'Disabled'}</div>
                  {model.seed !== undefined && (
                    <div><span className="font-medium">Seed:</span> {model.seed}</div>
                  )}
                  {model.addons.length > 0 && (
                    <div className="sm:col-span-2"><span className="font-medium">Add-ons:</span> {model.addons.join(', ')}</div>
                  )}
                </dl>

                {model.prompt && (
                  <div className="text-xs text-gray-600 bg-gray-50 rounded-md p-3 whitespace-pre-wrap break-words">
                    <span className="font-medium">Prompt:</span> {model.prompt}
                  </div>
                )}

                <footer className="flex flex-wrap items-center gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => void handleDownload(model)}
                    className="px-3 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                  >
                    Download
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(model)}
                    disabled={deletingId === model.id}
                    className={`px-3 py-2 rounded-md text-white ${deletingId === model.id ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                  >
                    {deletingId === model.id ? 'Deleting…' : 'Delete'}
                  </button>
                </footer>
              </div>
            </article>
          ))}
        </div>
      )}

      {filteredModels.length > ITEMS_PER_PAGE && (
        <nav className="flex items-center justify-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md border ${currentPage === 1 ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'hover:bg-gray-100 border-gray-300'}`}
          >
            Previous
          </button>
          <span className="text-gray-600">{currentPage} / {totalPages}</span>
          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded-md border ${currentPage === totalPages ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'hover:bg-gray-100 border-gray-300'}`}
          >
            Next
          </button>
        </nav>
      )}
    </div>
  )
}

const loadModelBlob = async (model: ModelMetadata) => {
  if (model.storagePath) {
    const storageRef = ref(storage, model.storagePath)
    return await getBlob(storageRef)
  }
  const res = await fetch(model.downloadURL)
  if (!res.ok) {
    throw new Error('Failed to download the model.')
  }
  return await res.blob()
}
