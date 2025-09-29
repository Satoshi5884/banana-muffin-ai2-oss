import { useRef, useState } from 'react'
import { saveAs } from 'file-saver'
import { useAuth } from '../contexts/AuthContext'
import { canUploadFile, uploadModelToStorage } from '../lib/storage'
import type { GeneratedModel } from '../lib/threeDProviders'

type Props = {
  model: GeneratedModel
  index: number
  prompt?: string
  getModelBlob: () => Promise<Blob>
  onUploadSuccess?: () => void
}

export default function ThreeDSaveOptions({ model, index, prompt, getModelBlob, onUploadSuccess }: Props) {
  const { user, userProfile, canUseStorage, getStorageQuota, updateStorageUsage } = useAuth()
  const [downloading, setDownloading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const cachedBlob = useRef<Blob | null>(null)

  const ensureBlob = async () => {
    if (cachedBlob.current) return cachedBlob.current
    const blob = await getModelBlob()
    cachedBlob.current = blob
    return blob
  }

  const download = async () => {
    try {
      setDownloading(true)
      const blob = await ensureBlob()
      const fileName = model.fileName || `hyper3d-model-${Date.now()}-${index + 1}.glb`
      saveAs(blob, fileName)
    } catch (error) {
      console.error('Failed to download 3D model:', error)
      alert('The 3D model could not be downloaded. Please try again in a moment.')
    } finally {
      setDownloading(false)
    }
  }

  const saveToCloud = async () => {
    if (!user || !userProfile || !canUseStorage()) return

    try {
      setSaving(true)
      setStatus('idle')
      const blob = await ensureBlob()

      const { used, total } = getStorageQuota()
      const check = canUploadFile(used, total, blob.size)
      if (!check.canUpload) {
        alert(check.reason || 'Not enough available storage to upload this model.')
        return
      }

      const originalName = model.fileName || `hyper3d-model-${Date.now()}-${index + 1}.glb`

      await uploadModelToStorage(user.uid, blob, originalName, {
        prompt,
        provider: 'hyper3d-rodin',
        seed: model.seed,
        format: model.options.geometryFormat,
        material: model.options.material,
        quality: model.options.quality,
        useHyper: model.options.useHyper,
        tier: model.options.tier,
        TAPose: model.options.TAPose,
        addons: model.options.addons,
        texturePreviews: model.textures,
      })

      await updateStorageUsage(blob.size)
      setStatus('success')
      onUploadSuccess?.()
      setTimeout(() => setStatus('idle'), 3000)
    } catch (error) {
      console.error('Failed to upload 3D model to cloud:', error)
      setStatus('error')
      alert('Uploading the 3D model to cloud storage failed.')
      setTimeout(() => setStatus('idle'), 3000)
    } finally {
      setSaving(false)
    }
  }

  const isProOrAdmin = userProfile?.role === 'pro' || userProfile?.role === 'admin'

  return (
    <div className="flex flex-col gap-2 text-sm">
      <button
        type="button"
        onClick={download}
        disabled={downloading}
        className={`px-3 py-2 rounded-md text-white ${downloading ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
      >
        {downloading ? 'Downloading…' : 'Download Model'}
      </button>

      {isProOrAdmin && canUseStorage() && (
        <button
          type="button"
          onClick={saveToCloud}
          disabled={saving}
          className={`px-3 py-2 rounded-md text-white ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {saving ? 'Saving…' : 'Save to Cloud'}
      </button>
      )}

      {status === 'success' && <span className="text-emerald-600">Upload completed.</span>}
      {status === 'error' && <span className="text-red-500">Upload failed.</span>}
    </div>
  )
}
