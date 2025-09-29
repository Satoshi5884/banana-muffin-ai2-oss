import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import ImageSaveOptions from './ImageSaveOptions'

type Item = { dataUrl: string; blob: Blob; mime: string }
type Props = { 
  items: Item[]
  notes: string[]
  prompt?: string
  originalImageIds?: string[]
  onImageSaved?: () => void 
  onSendToVideoMode?: (image: { dataUrl: string; mime: string }) => void
  onSendToThreeDMode?: (image: { dataUrl: string; mime: string }) => void
}

export default function ResultGrid({ items, notes, prompt, originalImageIds, onImageSaved, onSendToVideoMode, onSendToThreeDMode }: Props) {
  const saveAll = async () => {
    if (!items.length) return
    const zip = new JSZip()
    items.forEach((it, idx) => {
      const ext = it.mime.split('/')[1] || 'png'
      zip.file(`result-${String(idx+1).padStart(3,'0')}.${ext}`, it.blob)
    })
    const blob = await zip.generateAsync({ type: 'blob' })
    saveAs(blob, 'images.zip')
  }



  if (!items.length && !notes.length) return null

  return (
    <section aria-label="Generation results" className="space-y-3">
      {items.length > 0 && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Generation Results</h2>
          <button onClick={saveAll} className="px-3 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">Save All (ZIP)</button>
        </div>
      )}

      {items.length > 0 && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((it, idx) => (
            <li key={idx} className="border rounded-md overflow-hidden bg-white shadow-sm">
              <img src={it.dataUrl} alt={`Generated image ${idx+1}`} className="w-full h-64 object-cover" />
              {(onSendToVideoMode || onSendToThreeDMode) && (
                <div className="p-3 border-b bg-gray-50 space-y-2">
                  {onSendToVideoMode && (
                    <button
                      type="button"
                      onClick={() => onSendToVideoMode({ dataUrl: it.dataUrl, mime: it.mime })}
                      className="w-full px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
                    >
                      Create Video from This Image
                    </button>
                  )}
                  {onSendToThreeDMode && (
                    <button
                      type="button"
                      onClick={() => onSendToThreeDMode({ dataUrl: it.dataUrl, mime: it.mime })}
                      className="w-full px-3 py-2 text-sm bg-amber-100 text-amber-700 rounded-md hover:bg-amber-200"
                    >
                      Create 3D Model from This Image
                    </button>
                  )}
                </div>
              )}
              <div className="p-3">
                <ImageSaveOptions 
                  image={it} 
                  index={idx} 
                  prompt={prompt}
                  originalImageIds={originalImageIds}
                  onUploadSuccess={onImageSaved}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {notes.length > 0 && (
        <div className="bg-gray-50 border rounded p-3">
          <h3 className="font-medium mb-2">Notes</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
            {notes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </div>
      )}
    </section>
  )
}

