import { useEffect, useState } from 'react'
import { ref, getBlob } from 'firebase/storage'
import { useAuth } from '../contexts/AuthContext'
import { storage } from '../config/firebase'
import { getUserImages, type ImageMetadata } from '../lib/storage'
import { blobToDataUrl } from '../lib/media'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSelect: (image: { dataUrl: string; mime: string; name?: string }) => void | Promise<void>
}

export default function SavedImagePickerModal({ isOpen, onClose, onSelect }: Props) {
  const { user, canUseStorage } = useAuth()
  const [images, setImages] = useState<ImageMetadata[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectingId, setSelectingId] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !user || !canUseStorage()) return
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const fetched = await getUserImages(user.uid, 60)
        setImages(fetched)
      } catch (err) {
        console.error('Failed to fetch saved images', err)
        setError('Could not load saved images.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [isOpen, user, canUseStorage])

  const handleSelect = async (image: ImageMetadata) => {
    try {
      setSelectingId(image.id)
      setError(null)
      const blob = await loadImageBlob(image)
      const dataUrl = await blobToDataUrl(blob)
      await onSelect({ dataUrl, mime: blob.type || image.mimeType || 'image/png', name: image.originalFileName })
    } catch (err) {
      console.error('Failed to load saved image', err)
      setError('Unable to load the selected image. Please try again shortly.')
    } finally {
      setSelectingId(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white w-full max-w-3xl rounded-lg shadow-xl flex flex-col max-h-full">
        <header className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">Select a Saved Image</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Close
          </button>
        </header>
        <div className="p-4 overflow-y-auto space-y-3">
          {!user || !canUseStorage() ? (
            <p className="text-sm text-gray-600">Saved images are not available for your account.</p>
          ) : loading ? (
            <p className="text-sm text-gray-600">Loading…</p>
          ) : images.length === 0 ? (
            <p className="text-sm text-gray-600">No saved images yet.</p>
          ) : (
            <ul className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {images.map(image => (
                <li key={image.id} className="border rounded-md overflow-hidden bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => handleSelect(image)}
                    className="w-full text-left focus:outline-none"
                    disabled={selectingId === image.id}
                  >
                    <img
                      src={image.downloadURL}
                      alt={image.originalFileName}
                      className="w-full h-40 object-cover"
                    />
                    <div className="px-3 py-2 text-xs text-gray-700 space-y-1">
                      <p className="font-medium truncate" title={image.originalFileName}>{image.originalFileName}</p>
                      <p>{new Date(image.createdAt).toLocaleString()}</p>
                      {image.tags?.length ? (
                        <p className="text-gray-500 truncate">#{image.tags.slice(0, 3).join(' #')}</p>
                      ) : null}
                      {selectingId === image.id && (
                        <p className="text-purple-600">Loading…</p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>
        <footer className="px-4 py-3 border-t text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
        </footer>
      </div>
    </div>
  )
}

const loadImageBlob = async (image: ImageMetadata): Promise<Blob> => {
  if (image.storagePath) {
    try {
      return await getBlob(ref(storage, image.storagePath))
    } catch (error) {
      console.warn('Unable to fetch image from Storage. Falling back to downloadURL.', error)
    }
  }

  const res = await fetch(image.downloadURL)
  if (!res.ok) {
    throw new Error(`Failed to download image (status: ${res.status})`)
  }
  return await res.blob()
}
