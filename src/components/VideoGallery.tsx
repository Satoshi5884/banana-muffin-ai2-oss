import { useEffect, useMemo, useState } from 'react'
import { saveAs } from 'file-saver'
import { ref, getBlob } from 'firebase/storage'
import { useAuth } from '../contexts/AuthContext'
import {
  getUserVideos,
  deleteVideoFromStorage,
  formatStorageSize,
  type VideoMetadata,
} from '../lib/storage'
import { storage } from '../config/firebase'
import VideoFrameCaptureControls from './VideoFrameCaptureControls'

const ITEMS_PER_PAGE = 8

type Props = {
  onUseFrameAsInput?: (image: { dataUrl: string; mime: string; name?: string }) => void
  onStorageUpdated?: () => void
}

export default function VideoGallery({ onUseFrameAsInput, onStorageUpdated }: Props) {
  const { user, canUseStorage, updateStorageUsage } = useAuth()
  const [allVideos, setAllVideos] = useState<VideoMetadata[]>([])
  const [filteredVideos, setFilteredVideos] = useState<VideoMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set())

  const loadVideos = async () => {
    if (!user || !canUseStorage()) {
      setAllVideos([])
      setFilteredVideos([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const list = await getUserVideos(user.uid)
      setAllVideos(list)
      setFilteredVideos(list)
    } catch (err) {
      console.error('Failed to fetch video list:', err)
      setError('Unable to load saved videos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadVideos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredVideos(allVideos)
      setExpandedPrompts(new Set())
      setCurrentPage(1)
      return
    }

    const keyword = searchQuery.trim().toLowerCase()
    const matches = allVideos.filter(video => {
      const prompt = (video.prompt ?? '').toLowerCase()
      const originalName = (video.originalFileName ?? '').toLowerCase()
      const provider = (video.provider ?? '').toLowerCase()
      return (
        prompt.includes(keyword) ||
        originalName.includes(keyword) ||
        provider.includes(keyword)
      )
    })

    setFilteredVideos(matches)
    setExpandedPrompts(new Set())
    setCurrentPage(1)
  }, [searchQuery, allVideos])

  const totalPages = Math.max(1, Math.ceil(filteredVideos.length / ITEMS_PER_PAGE))

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  const paginatedVideos = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredVideos.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredVideos, currentPage])

  const handleDelete = async (video: VideoMetadata) => {
    if (!confirm('Delete this video?')) return
    setDeletingId(video.id)
    try {
      await deleteVideoFromStorage(video.id)
      await updateStorageUsage(-video.fileSize)
      await loadVideos()
      onStorageUpdated?.()
    } catch (err) {
      console.error('Failed to delete video:', err)
      alert('Failed to delete the video.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDownload = async (video: VideoMetadata) => {
    try {
      const blob = await loadVideoBlob(video)
      const ext = blob.type.includes('webm') ? 'webm' : blob.type.includes('quicktime') ? 'mov' : 'mp4'
      const fileName = video.originalFileName || `seedance-video-${video.id}.${ext}`
      saveAs(blob, fileName)
    } catch (err) {
      console.error('Failed to download video:', err)
      alert('Failed to download the video.')
    }
  }

  const togglePrompt = (id: string) => {
    setExpandedPrompts(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (!user || !canUseStorage()) {
    return <p className="text-sm text-gray-600">Video storage is not available for your account.</p>
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
          onClick={() => void loadVideos()}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Reload
        </button>
      </div>
    )
  }

  const emptyMessage = searchQuery.trim()
    ? 'No videos match your filters.'
    : 'No saved videos yet.'

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full sm:max-w-md items-center gap-2">
          <input
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by filename, prompt, or provider"
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
          <span className="text-gray-500">{filteredVideos.length} items</span>
          <button
            type="button"
            onClick={() => void loadVideos()}
            className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-100"
          >
            Reload
          </button>
        </div>
      </div>

      {filteredVideos.length === 0 ? (
        <p className="text-sm text-gray-600">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paginatedVideos.map(video => {
            const isExpanded = expandedPrompts.has(video.id)
            const promptText = video.prompt ?? ''
            const shouldToggle = promptText.length > 120
            const displayPrompt = isExpanded || !shouldToggle
              ? promptText
              : `${promptText.slice(0, 120)}…`
            const defaultFileName = video.originalFileName || video.fileName || 'saved-video.mp4'

            return (
              <div key={video.id} className="border rounded-lg bg-white shadow-sm overflow-hidden">
                <video
                  src={video.downloadURL}
                  controls
                  className="w-full h-64 object-cover bg-black"
                />
                <div className="p-4 space-y-3 text-sm text-gray-700">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="font-medium block truncate" title={video.originalFileName}>
                        {video.originalFileName || 'Saved video'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(video.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <span className="text-xs text-gray-600 whitespace-nowrap">
                      {formatStorageSize(video.fileSize)}
                    </span>
                  </div>

                  {promptText && (
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="whitespace-pre-wrap break-words">{displayPrompt}</div>
                      {shouldToggle && (
                        <button
                          type="button"
                          onClick={() => togglePrompt(video.id)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {isExpanded ? 'Collapse' : 'Expand'}
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                    {video.provider && <span className="px-2 py-1 bg-gray-100 rounded">{video.provider}</span>}
                    {video.resolution && <span className="px-2 py-1 bg-gray-100 rounded">{video.resolution}</span>}
                    {typeof video.durationSeconds === 'number' && (
                      <span className="px-2 py-1 bg-gray-100 rounded">{video.durationSeconds}s</span>
                    )}
                    {typeof video.seed === 'number' && (
                      <span className="px-2 py-1 bg-gray-100 rounded">Seed: {video.seed}</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownload(video)}
                      className="px-3 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                    >
                      Download
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(video)}
                      disabled={deletingId === video.id}
                      className={`px-3 py-2 rounded-md text-white ${deletingId === video.id ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                      {deletingId === video.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>

                  <VideoFrameCaptureControls
                    getVideoBlob={() => loadVideoBlob(video)}
                    defaultFileName={defaultFileName}
                    prompt={video.prompt}
                    relatedImageIds={video.relatedImageIds}
                    onApplyToInput={onUseFrameAsInput}
                    onSavedToStorage={onStorageUpdated}
                    durationHint={video.durationSeconds ?? null}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {filteredVideos.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-end gap-3 text-sm text-gray-700">
          <button
            type="button"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded border ${currentPage === 1 ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-300 hover:bg-gray-100'}`}
          >
            Previous
          </button>
          <span>{currentPage} / {totalPages} pages</span>
          <button
            type="button"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded border ${currentPage === totalPages ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-300 hover:bg-gray-100'}`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

const loadVideoBlob = async (video: VideoMetadata): Promise<Blob> => {
  if (video.storagePath) {
    try {
      return await getBlob(ref(storage, video.storagePath))
    } catch (error) {
      console.warn('Failed to fetch video from Storage. Falling back to downloadURL.', error)
    }
  }

  const res = await fetch(video.downloadURL)
  if (!res.ok) {
    throw new Error(`Failed to download: ${res.status}`)
  }
  return await res.blob()
}
