import { useState } from 'react'
import { saveAs } from 'file-saver'
import { useAuth } from '../contexts/AuthContext'
import { canUploadFile, uploadVideoToStorage } from '../lib/storage'
import type { VideoProviderId } from '../lib/videoProviders'

interface Props {
  video: { blob: Blob; mime: string }
  index: number
  prompt?: string
  providerId: VideoProviderId
  duration?: string
  resolution?: string
  seed?: number
  relatedImageIds?: string[]
  onUploadSuccess?: () => void
}

export default function VideoSaveOptions({
  video,
  index,
  prompt,
  providerId,
  duration,
  resolution,
  seed,
  relatedImageIds = [],
  onUploadSuccess,
}: Props) {
  const { user, userProfile, canUseStorage, getStorageQuota, updateStorageUsage } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleDownload = () => {
    const fileName = `seedance-video-${Date.now()}-${index + 1}.mp4`
    saveAs(video.blob, fileName)
  }

  const handleCloudSave = async () => {
    if (!user || !userProfile || !canUseStorage()) return

    setUploading(true)
    setStatus('idle')

    try {
      const { used, total } = getStorageQuota()
      const fileSize = video.blob.size
      const uploadCheck = canUploadFile(used, total, fileSize)
      if (!uploadCheck.canUpload) {
        alert(uploadCheck.reason || 'Not enough available storage to upload this video.')
        return
      }

      const extension = video.mime.includes('webm') ? 'webm' : video.mime.includes('quicktime') ? 'mov' : 'mp4'
      const fileName = `seedance-video-${Date.now()}-${index + 1}.${extension}`

      await uploadVideoToStorage(user.uid, video.blob, fileName, {
        prompt,
        provider: providerId,
        durationSeconds: duration ? Number(duration) : undefined,
        resolution,
        seed,
        relatedImageIds,
      })

      await updateStorageUsage(fileSize)
      setStatus('success')
      onUploadSuccess?.()
      setTimeout(() => setStatus('idle'), 3000)
    } catch (error) {
      console.error('Failed to upload video to cloud storage:', error)
      setStatus('error')
      alert('Saving to cloud storage failed.')
      setTimeout(() => setStatus('idle'), 3000)
    } finally {
      setUploading(false)
    }
  }

  const isProOrAdmin = userProfile?.role === 'pro' || userProfile?.role === 'admin'

  return (
    <div className="flex flex-col gap-2 text-sm">
      <button
        type="button"
        onClick={handleDownload}
        className="px-3 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
      >
        Download Video
      </button>

      {isProOrAdmin && canUseStorage() && (
        <button
          type="button"
          onClick={handleCloudSave}
          disabled={uploading}
          className={`px-3 py-2 rounded-md text-white ${uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {uploading ? 'Saving…' : 'Save to Cloud'}
        </button>
      )}

      {status === 'success' && (
        <span className="text-emerald-600">Upload completed.</span>
      )}
      {status === 'error' && (
        <span className="text-red-500">Upload failed.</span>
      )}
    </div>
  )
}
