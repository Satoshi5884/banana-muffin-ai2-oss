import { useRef, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { uploadImageToStorage, canUploadFile } from '../lib/storage'

interface Props {
  isOpen: boolean
  onClose: () => void
  image: { dataUrl: string; blob: Blob; mime: string }
  prompt?: string
  originalImageIds?: string[]
  onImageSaved?: () => void
}

const ASPECT_RATIOS = [
  { label: '16:9 Landscape', ratio: 16 / 9 },
  { label: '4:3 Landscape', ratio: 4 / 3 },
  { label: '3:4 Portrait', ratio: 3 / 4 },
  { label: '9:16 Portrait', ratio: 9 / 16 },
]

export default function ImageCropModal({ 
  isOpen, 
  onClose, 
  image, 
  prompt, 
  originalImageIds = [], 
  onImageSaved 
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[0])
  const [cropData, setCropData] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialCropData, setInitialCropData] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const { user, userProfile, canUseStorage, getStorageQuota, updateStorageUsage } = useAuth()

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      canvas.width = 600
      canvas.height = Math.min(600, (img.height / img.width) * 600)
      
      const scale = canvas.width / img.width
      const scaledHeight = img.height * scale
      
      ctx.drawImage(img, 0, 0, canvas.width, scaledHeight)
      
      // Configure the default crop area
      const defaultWidth = Math.min(canvas.width * 0.8, canvas.height * 0.8 * selectedRatio.ratio)
      const defaultHeight = defaultWidth / selectedRatio.ratio
      
      setCropData({
        x: (canvas.width - defaultWidth) / 2,
        y: (scaledHeight - defaultHeight) / 2,
        width: defaultWidth,
        height: defaultHeight
      })
      
      setImageLoaded(true)
    }
    img.src = image.dataUrl
  }, [isOpen, image.dataUrl, selectedRatio])

  useEffect(() => {
    if (!imageLoaded || !canvasRef.current) return
    drawCropOverlay()
  }, [cropData, imageLoaded])

  const drawCropOverlay = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Redraw the image beneath the overlay
    const img = new Image()
    img.onload = () => {
      const scale = canvas.width / img.width
      const scaledHeight = img.height * scale
      
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, scaledHeight)
      
      // Draw the overlay mask
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Clear the crop area
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillRect(cropData.x, cropData.y, cropData.width, cropData.height)
      
      // Draw the crop outline
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 2
      ctx.strokeRect(cropData.x, cropData.y, cropData.width, cropData.height)
      
      // Draw a circular resize handle in the center
      const centerX = cropData.x + cropData.width / 2
      const centerY = cropData.y + cropData.height / 2
      const handleRadius = 8
      
      ctx.fillStyle = '#3b82f6'
      ctx.beginPath()
      ctx.arc(centerX, centerY, handleRadius, 0, 2 * Math.PI)
      ctx.fill()
      
      // Add the inner white circle for contrast
      ctx.fillStyle = 'white'
      ctx.beginPath()
      ctx.arc(centerX, centerY, handleRadius - 2, 0, 2 * Math.PI)
      ctx.fill()
    }
    img.src = image.dataUrl
  }

  const getCenterHandle = (x: number, y: number) => {
    const centerX = cropData.x + cropData.width / 2
    const centerY = cropData.y + cropData.height / 2
    const handleRadius = 8
    
    const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))
    return distance <= handleRadius ? 'center' : null
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Check the central handle before the drag region
    const centerHandle = getCenterHandle(x, y)
    if (centerHandle) {
      setIsResizing(true)
      setDragStart({ x, y })
      setInitialCropData({ ...cropData })
    } else if (x >= cropData.x && x <= cropData.x + cropData.width &&
               y >= cropData.y && y <= cropData.y + cropData.height) {
      setIsDragging(true)
      setDragStart({ x: x - cropData.x, y: y - cropData.y })
    }
  }

  const constrainAspectRatio = (width: number, height: number) => {
    const targetRatio = selectedRatio.ratio
    if (width / height > targetRatio) {
      width = height * targetRatio
    } else {
      height = width / targetRatio
    }
    return { width, height }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas || (!isDragging && !isResizing)) return
    
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    if (isDragging) {
      const newX = x - dragStart.x
      const newY = y - dragStart.y
      
      const maxX = canvas.width - cropData.width
      const maxY = canvas.height - cropData.height
      
      setCropData(prev => ({
        ...prev,
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      }))
    } else if (isResizing) {
      // Resize relative to the center
      const centerX = initialCropData.x + initialCropData.width / 2
      const centerY = initialCropData.y + initialCropData.height / 2
      
      // Compute the delta between current and starting cursor positions
      const deltaX = x - dragStart.x
      const deltaY = y - dragStart.y
      
      // Use the average delta to calculate a scale factor
      const scaleX = Math.abs(deltaX) / (initialCropData.width / 2)
      const scaleY = Math.abs(deltaY) / (initialCropData.height / 2)
      const scale = Math.max(scaleX, scaleY)
      
      // Determine expansion vs shrink based on movement direction
      const isExpanding = deltaX > 0 || deltaY > 0
      const finalScale = isExpanding ? 1 + scale : Math.max(0.1, 1 - scale)
      
      // Derive the new dimensions
      let newWidth = initialCropData.width * finalScale
      let newHeight = initialCropData.height * finalScale
      
      // Maintain the aspect ratio
      const constrained = constrainAspectRatio(newWidth, newHeight)
      newWidth = constrained.width
      newHeight = constrained.height
      
      // Recalculate the selection origin using the center
      let newX = centerX - newWidth / 2
      let newY = centerY - newHeight / 2
      
      // Keep the selection within the canvas
      if (newX < 0) {
        newX = 0
        newWidth = Math.min(newWidth, canvas.width)
      }
      if (newY < 0) {
        newY = 0
        newHeight = Math.min(newHeight, canvas.height)
      }
      if (newX + newWidth > canvas.width) {
        newX = canvas.width - newWidth
        if (newX < 0) {
          newX = 0
          newWidth = canvas.width
        }
      }
      if (newY + newHeight > canvas.height) {
        newY = canvas.height - newHeight
        if (newY < 0) {
          newY = 0
          newHeight = canvas.height
        }
      }
      
      // Enforce minimum selection size
      if (newWidth > 20 && newHeight > 20) {
        setCropData({
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight
        })
      }
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setIsResizing(false)
  }

  const handleRatioChange = (ratio: typeof ASPECT_RATIOS[0]) => {
    setSelectedRatio(ratio)
    
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    
    // Recalculate using the new aspect ratio
    const maxWidth = canvas.width * 0.8
    const maxHeight = canvas.height * 0.8
    
    let newWidth, newHeight
    if (maxWidth / ratio.ratio > maxHeight) {
      newHeight = maxHeight
      newWidth = newHeight * ratio.ratio
    } else {
      newWidth = maxWidth
      newHeight = newWidth / ratio.ratio
    }
    
    setCropData(prev => ({
      ...prev,
      width: newWidth,
      height: newHeight,
      x: (canvas.width - newWidth) / 2,
      y: (canvas.height - newHeight) / 2
    }))
  }

  const cropAndSave = async () => {
    if (!canvasRef.current) return
    
    setSaving(true)
    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Create a crop buffer canvas
      const cropCanvas = document.createElement('canvas')
      const cropCtx = cropCanvas.getContext('2d')
      if (!cropCtx) return

      // Load the source image
      const img = new Image()
      img.onload = async () => {
        const scaleX = img.width / canvas.width
        const scaleY = img.height / canvas.height
        
        // Calculate output dimensions while preserving the ratio
        const outputWidth = Math.floor(cropData.width * scaleX)
        const outputHeight = Math.floor(cropData.height * scaleY)
        
        cropCanvas.width = outputWidth
        cropCanvas.height = outputHeight
        
        // Draw the matching portion of the source image
        cropCtx.drawImage(
          img,
          cropData.x * scaleX,
          cropData.y * scaleY,
          cropData.width * scaleX,
          cropData.height * scaleY,
          0,
          0,
          outputWidth,
          outputHeight
        )

        // Convert the crop result to a Blob
        cropCanvas.toBlob(async (blob) => {
          if (!blob || !user || !userProfile) return

          try {
            if (canUseStorage()) {
              // Save to cloud storage
              const { used, total } = getStorageQuota()
              const uploadCheck = canUploadFile(used, total, blob.size)

              if (!uploadCheck.canUpload) {
                alert(uploadCheck.reason || 'Not enough available storage to save this image.')
                return
              }

              const fileName = `cropped-${selectedRatio.label.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.png`
              await uploadImageToStorage(
                user.uid,
                blob,
                fileName,
                undefined,
                prompt ? `${prompt} (Crop: ${selectedRatio.label})` : `Crop: ${selectedRatio.label}`,
                undefined,
                ['cropped', selectedRatio.label],
                false,
                originalImageIds
              )

              await updateStorageUsage(blob.size)
              onImageSaved?.()
              alert('Cropped image saved to cloud storage!')
            } else {
              // Save locally instead
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `cropped-${selectedRatio.label.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.png`
              a.click()
              URL.revokeObjectURL(url)
              alert('Cropped image downloaded successfully!')
            }

            onClose()
          } catch (error) {
            console.error('Failed to save cropped image:', error)
            alert('Saving the cropped image failed.')
          }
        }, 'image/png')
      }
      img.src = image.dataUrl
    } catch (error) {
      console.error('Cropping error:', error)
      alert('Cropping failed.')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Crop Image</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose Aspect Ratio
            </label>
            <div className="flex flex-wrap gap-2">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.label}
                  onClick={() => handleRatioChange(ratio)}
                  className={`px-3 py-2 text-sm rounded ${
                    selectedRatio.label === ratio.label
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {ratio.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Drag the blue frame to reposition, and use the center handle to resize.
            </p>
            <div className="border rounded overflow-hidden bg-gray-100">
              <canvas
                ref={canvasRef}
                className="block mx-auto cursor-move"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={cropAndSave}
              disabled={saving || !imageLoaded}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : canUseStorage() ? 'Crop & Save to Cloud' : 'Crop & Download'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
