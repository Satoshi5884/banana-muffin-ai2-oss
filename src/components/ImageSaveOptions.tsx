import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { 
  uploadImageToStorage, 
  canUploadFile, 
  generateImageTagsAndComment
} from '../lib/storage'
import { saveAs } from 'file-saver'
import ImageCropModal from './ImageCropModal'

interface Props {
  image: { dataUrl: string; blob: Blob; mime: string }
  index: number
  prompt?: string
  originalImageIds?: string[]
  onUploadSuccess?: () => void
}

export default function ImageSaveOptions({ 
  image, 
  index, 
  prompt, 
  originalImageIds = [], 
  onUploadSuccess 
}: Props) {
  const { user, userProfile, canUseStorage, getStorageQuota, updateStorageUsage } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [showCropModal, setShowCropModal] = useState(false)
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string

  const handleLocalSave = () => {
    const fileName = `gemini-image-${Date.now()}-${index + 1}.png`
    saveAs(image.blob, fileName)
  }

  const handleCompressedSave = async () => {
    try {
      const img = new Image()
      
      const loadImage = new Promise<HTMLImageElement>((resolve, reject) => {
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('Failed to load image'))
      })
      
      img.src = image.dataUrl
      const loadedImg = await loadImage
      
      // Create canvas and compress
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Canvas not supported')
      }
      
      canvas.width = loadedImg.width
      canvas.height = loadedImg.height
      ctx.drawImage(loadedImg, 0, 0)
      
      // Start with high quality and reduce until under 500kB
      let quality = 0.9
      const tryCompress = (): Promise<Blob> => {
        return new Promise((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'))
              return
            }
            
            // If under 500kB or quality is too low, return blob
            if (blob.size <= 500 * 1024 || quality <= 0.1) {
              resolve(blob)
            } else {
              // Reduce quality and try again
              quality -= 0.1
              tryCompress().then(resolve).catch(reject)
            }
          }, 'image/jpeg', quality)
        })
      }
      
      const compressedBlob = await tryCompress()
      const fileName = `gemini-image-compressed-${Date.now()}-${index + 1}.jpg`
      saveAs(compressedBlob, fileName)
      
    } catch (error) {
      console.error('Compression failed:', error)
      alert('Compression failed. Please try normal save.')
    }
  }

  const handleCloudSave = async () => {
    if (!user || !userProfile || !canUseStorage()) return

    setUploading(true)
    setUploadStatus('idle')

    try {
      const { used, total } = getStorageQuota()
      const fileSize = image.blob.size
      
      const uploadCheck = canUploadFile(used, total, fileSize)
      if (!uploadCheck.canUpload) {
        alert(uploadCheck.reason || 'Cannot save due to insufficient capacity')
        return
      }

      const fileName = `gemini-image-${Date.now()}-${index + 1}.png`
      await uploadImageToStorage(
        user.uid,
        image.blob,
        fileName,
        undefined, // promptId
        prompt,
        undefined, // generatedComment
        [], // tags
        false, // isOriginalImage
        originalImageIds
      )

      // Update storage usage
      await updateStorageUsage(fileSize)
      
      setUploadStatus('success')
      onUploadSuccess?.()
      
      setTimeout(() => setUploadStatus('idle'), 3000)
    } catch (error) {
      console.error('Cloud save error:', error)
      setUploadStatus('error')
      alert('Cloud save failed')
      setTimeout(() => setUploadStatus('idle'), 3000)
    } finally {
      setUploading(false)
    }
  }

  const handleEnhancedCloudSave = async () => {
    if (!user || !userProfile || !canUseStorage() || !apiKey) return

    setGenerating(true)
    setUploadStatus('idle')

    try {
      const { used, total } = getStorageQuota()
      const fileSize = image.blob.size
      
      const uploadCheck = canUploadFile(used, total, fileSize)
      if (!uploadCheck.canUpload) {
        alert(uploadCheck.reason || 'Cannot save due to insufficient capacity')
        return
      }

      // Generate tags and comments with AI
      const { tags, comment } = await generateImageTagsAndComment(
        apiKey,
        image.dataUrl,
        prompt
      )

      const fileName = `gemini-image-${Date.now()}-${index + 1}.png`
      await uploadImageToStorage(
        user.uid,
        image.blob,
        fileName,
        undefined, // promptId
        prompt,
        comment,
        tags,
        false, // isOriginalImage
        originalImageIds
      )

      // Update storage usage
      await updateStorageUsage(fileSize)
      
      setUploadStatus('success')
      onUploadSuccess?.()
      
      alert(`✨ Enhanced save completed!\n📝 Comment: ${comment}\n🏷️ Tags: ${tags.join(', ')}`)
      setTimeout(() => setUploadStatus('idle'), 3000)
    } catch (error) {
      console.error('Enhanced save error:', error)
      setUploadStatus('error')
      alert('Enhanced save failed')
      setTimeout(() => setUploadStatus('idle'), 3000)
    } finally {
      setGenerating(false)
    }
  }

  const isProOrAdmin = userProfile?.role === 'pro' || userProfile?.role === 'admin'

  return (
    <>
      <ImageCropModal
        isOpen={showCropModal}
        onClose={() => setShowCropModal(false)}
        image={image}
        prompt={prompt}
        originalImageIds={originalImageIds}
        onImageSaved={onUploadSuccess}
      />
      <div className="space-y-2">
      {/* Local save (available for all users) */}
      <div className="space-y-1">
        <button
          onClick={handleLocalSave}
          className="w-full px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          title="Download to device (original quality)"
        >
          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          💾 Download
        </button>
        
        <button
          onClick={handleCompressedSave}
          className="w-full px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
          title="Compressed save to device (compressed to under 500kB)"
        >
          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          🗜️ Compressed Save
        </button>
      </div>

      {/* Crop options */}
      <button
        onClick={() => setShowCropModal(true)}
        className="w-full px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
        title="Crop image (16:9, 4:3, 3:4, 9:16)"
      >
        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4a4 4 0 014-4h2a4 4 0 014 4v12M7 16l10 10M7 16H4a4 4 0 01-4-4v-2a4 4 0 014-4h3M17 16v3a4 4 0 01-4 4h-2a4 4 0 01-4-4v-3" />
        </svg>
        ✂️ Crop
      </button>

      {/* Cloud save (Pro/Admin only) */}
      {canUseStorage() && !isProOrAdmin && (
        <button
          onClick={handleCloudSave}
          disabled={uploading}
          className={`w-full px-3 py-1 text-sm rounded transition-colors ${
            uploadStatus === 'success'
              ? 'bg-green-100 text-green-700'
              : uploadStatus === 'error'
              ? 'bg-red-100 text-red-700'
              : uploading
              ? 'bg-blue-100 text-blue-700'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
          title="Save to cloud"
        >
          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          {uploading ? 'Saving...' : 
           uploadStatus === 'success' ? 'Saved' :
           uploadStatus === 'error' ? 'Failed' : '☁️ Cloud Save'}
        </button>
      )}

      {/* Enhanced save options for Pro/Admin */}
      {canUseStorage() && isProOrAdmin && (
        <div className="space-y-1">
          <button
            onClick={handleCloudSave}
            disabled={uploading || generating}
            className={`w-full px-2 py-1 text-xs rounded transition-colors ${
              uploadStatus === 'success'
                ? 'bg-green-100 text-green-700'
                : uploadStatus === 'error'
                ? 'bg-red-100 text-red-700'
                : uploading
                ? 'bg-blue-100 text-blue-700'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
            title="Simple cloud save"
          >
            {uploading ? 'Saving...' : 
             uploadStatus === 'success' ? 'Saved' :
             uploadStatus === 'error' ? 'Failed' : '☁️ Simple Save'}
          </button>
          
          <button
            onClick={handleEnhancedCloudSave}
            disabled={uploading || generating || !apiKey}
            className={`w-full px-2 py-2 text-sm rounded font-medium transition-colors ${
              generating
                ? 'bg-purple-100 text-purple-700'
                : uploadStatus === 'success'
                ? 'bg-green-100 text-green-700'
                : uploadStatus === 'error'
                ? 'bg-red-100 text-red-700'
                : !apiKey
                ? 'bg-gray-100 text-gray-400'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
            }`}
            title="Enhanced save with AI analysis (includes prompt, tags, and comments)"
          >
            {generating ? '🤖 AI analyzing...' : 
             uploadStatus === 'success' ? '✨ Saved' :
             uploadStatus === 'error' ? '❌ Failed' :
             !apiKey ? '❌ API not set' : '✨ Enhanced Save (with AI Analysis)'}
          </button>
        </div>
      )}
      
      {!canUseStorage() && userProfile?.role === 'free' && (
        <div className="w-full px-3 py-1 text-xs bg-gray-50 text-gray-500 rounded text-center">
          Cloud save available in Pro version
        </div>
      )}
      </div>
    </>
  )
}
