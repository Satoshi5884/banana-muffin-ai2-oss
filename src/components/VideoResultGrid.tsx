import VideoSaveOptions from './VideoSaveOptions'
import VideoFrameCaptureControls from './VideoFrameCaptureControls'
import type { VideoProviderId } from '../lib/videoProviders'

type VideoItem = {
  objectUrl: string
  blob: Blob
  mime: string
  seed?: number
}

type Props = {
  items: VideoItem[]
  notes: string[]
  prompt?: string
  provider: VideoProviderId
  duration?: string
  resolution?: string
  relatedImageIds?: string[]
  onVideoSaved?: () => void
  onFrameCaptured?: (image: { dataUrl: string; mime: string; name?: string }) => void
  onFrameSaved?: () => void
}

export default function VideoResultGrid({
  items,
  notes,
  prompt,
  provider,
  duration,
  resolution,
  relatedImageIds,
  onVideoSaved,
  onFrameCaptured,
  onFrameSaved,
}: Props) {
  if (!items.length && !notes.length) return null

  return (
    <section aria-label="Generated video results" className="space-y-3">
      {items.length > 0 && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((video, index) => (
            <li key={index} className="border rounded-md overflow-hidden bg-white shadow-sm">
              <video
                src={video.objectUrl}
                controls
                className="w-full h-64 object-cover bg-black"
              />
              <div className="p-3">
                <VideoSaveOptions
                  video={video}
                  index={index}
                  prompt={prompt}
                  providerId={provider}
                  duration={duration}
                  resolution={resolution}
                  seed={video.seed}
                  relatedImageIds={relatedImageIds}
                  onUploadSuccess={onVideoSaved}
                />
                <VideoFrameCaptureControls
                  getVideoBlob={async () => video.blob}
                  defaultFileName={`generated-video-${index + 1}.${video.mime.includes('webm') ? 'webm' : video.mime.includes('quicktime') ? 'mov' : 'mp4'}`}
                  prompt={prompt}
                  relatedImageIds={relatedImageIds}
                  onApplyToInput={onFrameCaptured}
                  onSavedToStorage={onFrameSaved}
                  durationHint={duration ? Number(duration) : null}
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
            {notes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
