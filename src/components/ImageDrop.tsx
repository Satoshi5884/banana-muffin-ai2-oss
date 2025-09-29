import { useCallback, useEffect, useRef } from 'react'
import { downscaleToDataUrl } from '../lib/image'

type FileItem = { dataUrl: string; mime: string; name: string }
type Props = { files: FileItem[]; setFiles: (f: FileItem[]) => void; max?: number }

export default function ImageDrop({ files, setFiles, max = 3 }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const dropRef = useRef<HTMLDivElement | null>(null)

  const canAddMore = files.length < max

  const readFiles = async (list: FileList | null) => {
    if (!list) return
    const remaining = Math.max(0, max - files.length)
    const slice = Array.from(list).filter(f => f.type.startsWith('image/')).slice(0, remaining)
    const reads = slice.map(async (f) => {
      // Downscale/compress to reduce token usage and avoid 429
      try {
        const o = await downscaleToDataUrl(f, { maxSize: 1280, quality: 0.85, mime: 'image/jpeg' })
        return { dataUrl: o.dataUrl, mime: o.mime, name: o.name }
      } catch {
        // Fallback: raw
        const fr = new FileReader()
        const p = new Promise<FileItem>((resolve, reject) => {
          fr.onerror = () => reject(new Error('failed to read'))
          fr.onload = () => resolve({ dataUrl: String(fr.result), mime: f.type, name: f.name })
        })
        fr.readAsDataURL(f)
        return p
      }
    })
    const newItems = await Promise.all(reads)
    setFiles([...files, ...newItems])
  }

  const onDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    await readFiles(e.dataTransfer.files)
  }, [files])

  const onBrowse = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const onChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    await readFiles(e.target.files)
    if (inputRef.current) inputRef.current.value = ''
  }, [files])

  useEffect(() => {
    const el = dropRef.current
    if (!el) return
    const prevent = (e: DragEvent) => { e.preventDefault() }
    el.addEventListener('dragover', prevent)
    return () => el.removeEventListener('dragover', prevent)
  }, [])

  useEffect(() => {
    const handler = async (e: ClipboardEvent) => {
      if (!canAddMore) return
      const items = e.clipboardData?.items
      if (!items) return
      const files: File[] = []
      for (const it of items) {
        if (it.kind === 'file') {
          const f = it.getAsFile()
          if (f && f.type.startsWith('image/')) files.push(f)
        }
      }
      if (files.length) {
        const list = { length: files.length, item: (i: number) => files[i]!, [Symbol.iterator]: function*() { for (const f of files) yield f } } as any as FileList
        await readFiles(list)
      }
    }
    document.addEventListener('paste', handler)
    return () => document.removeEventListener('paste', handler)
  }, [files, canAddMore])

  const removeAt = (i: number) => {
    const next = files.slice()
    next.splice(i, 1)
    setFiles(next)
  }

  return (
    <div className="space-y-3">
      <div ref={dropRef} onDrop={onDrop} className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer focus-ring"
           tabIndex={0} role="button" aria-label="Add images" onClick={onBrowse}>
        <p className="text-sm text-gray-600">Drag & drop here, paste, or click to select</p>
        <p className="text-xs text-gray-500">Up to {max} images (currently {files.length}).</p>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={onChange} />

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Selected Images ({files.length}/{max})</span>
            <button
              type="button"
              onClick={() => setFiles([])}
              className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
              title="Clear all images"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear all
            </button>
          </div>
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-3" aria-label="Selected images">
            {files.map((f, i) => (
              <li key={i} className="relative group border rounded-md overflow-hidden">
                <img src={f.dataUrl} alt={f.name} className="w-full h-32 object-cover" />
                <button type="button" onClick={() => removeAt(i)}
                  className="absolute top-1 right-1 bg-black/60 text-white text-xs px-2 py-1 rounded focus-ring"
                  aria-label={`Remove image ${i+1}`}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
