import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { blobToDataUrl, extractFrameFromVideoBlob } from '../lib/media'
import { canUploadFile, uploadImageToStorage } from '../lib/storage'

type ExtractMode = 'custom' | 'first' | 'last'
type ActionType = 'apply' | 'save'

interface Props {
  getVideoBlob: () => Promise<Blob>
  defaultFileName: string
  prompt?: string
  relatedImageIds?: string[]
  onApplyToInput?: (image: { dataUrl: string; mime: string; name?: string }) => void
  onSavedToStorage?: () => void
  durationHint?: number | null
}

export default function VideoFrameCaptureControls({
  getVideoBlob,
  defaultFileName,
  prompt,
  relatedImageIds = [],
  onApplyToInput,
  onSavedToStorage,
  durationHint = null,
}: Props) {
  const { user, userProfile, canUseStorage, getStorageQuota, updateStorageUsage } = useAuth()
  const [inputSeconds, setInputSeconds] = useState('0.0')
  const [action, setAction] = useState<ActionType>('apply')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [cachedBlob, setCachedBlob] = useState<Blob | null>(null)
  const [resolvedDuration, setResolvedDuration] = useState<number | null>(durationHint)

  const isProOrAdmin = userProfile?.role === 'pro' || userProfile?.role === 'admin'
  const storageAvailable = Boolean(user && isProOrAdmin && canUseStorage())

  const actionChoices = useMemo(() => {
    const choices: { value: ActionType; label: string }[] = []
    if (onApplyToInput) {
      choices.push({ value: 'apply', label: 'Apply to input image' })
    }
    if (storageAvailable) {
      choices.push({ value: 'save', label: 'Save to cloud' })
    }
    return choices
  }, [onApplyToInput, storageAvailable])

  useEffect(() => {
    if (actionChoices.length === 0) return
    if (!actionChoices.some(choice => choice.value === action)) {
      setAction(actionChoices[0].value)
    }
  }, [actionChoices, action])

  useEffect(() => {
    if (!actionChoices.length) {
      setStatus({ type: 'error', message: 'No available actions.' })
    }
  }, [actionChoices])

  if (actionChoices.length === 0) {
    return null
  }

  const ensureVideoBlob = async () => {
    if (cachedBlob) return cachedBlob
    const blob = await getVideoBlob()
    setCachedBlob(blob)
    return blob
  }

  const formatTime = (seconds: number) => Math.round(seconds * 10) / 10

  const buildOriginalName = (seconds: number, mime: string) => {
    const ext = mime.includes('png') ? 'png' : mime.includes('jpeg') ? 'jpg' : 'png'
    const basename = defaultFileName.replace(/\.[^/.]+$/, '') || 'video'
    const label = formatTime(seconds).toFixed(1)
    return `${basename}-frame-${label}s.${ext}`
  }

  const performSave = async (frameBlob: Blob, seconds: number) => {
    if (!user || !storageAvailable) {
      throw new Error('Cloud save is not available for your account.')
    }

    const { used, total } = getStorageQuota()
    const check = canUploadFile(used, total, frameBlob.size)
    if (!check.canUpload) {
      throw new Error(check.reason || 'Not enough storage capacity to save.')
    }

    const labelSeconds = formatTime(seconds).toFixed(1)
    const originalFileName = buildOriginalName(seconds, frameBlob.type)

    await uploadImageToStorage(
      user.uid,
      frameBlob,
      originalFileName,
      undefined,
      prompt,
      `Video frame (${labelSeconds}s)`,
      ['video-frame'],
      false,
      relatedImageIds ?? [],
    )

    await updateStorageUsage(frameBlob.size)
    onSavedToStorage?.()
    setStatus({ type: 'success', message: `Saved to cloud (${labelSeconds}s).` })
  }

  const performApply = async (frameBlob: Blob, seconds: number) => {
    if (!onApplyToInput) {
      throw new Error('Applying to input images is not supported.')
    }
    const dataUrl = await blobToDataUrl(frameBlob)
    const name = buildOriginalName(seconds, frameBlob.type)
    onApplyToInput({ dataUrl, mime: frameBlob.type || 'image/png', name })
    const labelSeconds = formatTime(seconds).toFixed(1)
    setStatus({ type: 'success', message: `Applied to input image (${labelSeconds}s).` })
  }

  const resolveTargetSeconds = (mode: ExtractMode) => {
    if (mode === 'first') return 0
    if (mode === 'last') {
      if (resolvedDuration && resolvedDuration > 0) {
        return resolvedDuration
      }
      return Number.POSITIVE_INFINITY
    }

    const parsed = Number.parseFloat(inputSeconds)
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new Error('Enter a number greater than or equal to 0 for the timestamp.')
    }
    return parsed
  }

  const handleExtract = async (mode: ExtractMode) => {
    setBusy(true)
    setStatus(null)

    try {
      const blob = await ensureVideoBlob()
      const targetSeconds = resolveTargetSeconds(mode)
      const { blob: frameBlob, actualTime, duration } = await extractFrameFromVideoBlob({
        blob,
        timeSec: targetSeconds,
        mimeType: 'image/png',
      })

      if (Number.isFinite(duration) && duration > 0) {
        setResolvedDuration(duration)
      }

      const effectiveSeconds = Number.isFinite(actualTime) ? actualTime : targetSeconds

      if (action === 'save') {
        await performSave(frameBlob, effectiveSeconds)
      } else {
        await performApply(frameBlob, effectiveSeconds)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to capture the frame.'
      setStatus({ type: 'error', message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
       <h4 className="text-sm font-semibold text-gray-700">Extract frames</h4>
      <div className="mt-2 space-y-2 text-xs text-gray-700">
        <div className="flex flex-wrap items-center gap-2">
          <label className="font-medium">Action</label>
          <select
            className="rounded border-gray-300 text-sm focus:ring-2 focus:ring-purple-400"
            value={action}
            onChange={e => setAction(e.target.value as ActionType)}
            disabled={busy}
          >
            {actionChoices.map(choice => (
              <option key={choice.value} value={choice.value}>
                {choice.label}
              </option>
            ))}
          </select>
          {action === 'save' && !storageAvailable && (
            <span className="text-red-500">Pro plan required to save.</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="font-medium" htmlFor={`${defaultFileName}-frame-time`}>
            Timestamp (0.1s increments)
          </label>
          <input
            id={`${defaultFileName}-frame-time`}
            type="number"
            min={0}
            step={0.1}
            value={inputSeconds}
            onChange={e => setInputSeconds(e.target.value)}
            className="w-24 rounded border-gray-300 p-1 text-sm focus:ring-2 focus:ring-purple-400"
            disabled={busy}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleExtract('custom')}
            disabled={busy}
            className={`px-3 py-1 rounded border text-sm ${busy ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'}`}
          >
            Run at timestamp
          </button>
          <button
            type="button"
            onClick={() => void handleExtract('first')}
            disabled={busy}
            className={`px-3 py-1 rounded border text-sm ${busy ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'}`}
          >
            First frame
          </button>
          <button
            type="button"
            onClick={() => void handleExtract('last')}
            disabled={busy}
            className={`px-3 py-1 rounded border text-sm ${busy ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}
          >
            Last frame
          </button>
        </div>

        {resolvedDuration !== null && resolvedDuration > 0 && (
          <p className="text-[11px] text-gray-500">Video length: {formatTime(resolvedDuration).toFixed(1)} s</p>
        )}
        {status && (
          <p className={status.type === 'success' ? 'text-emerald-600' : 'text-red-500'}>{status.message}</p>
        )}
        {busy && <p className="text-gray-500">Processing…</p>}
      </div>
    </div>
  )
}
