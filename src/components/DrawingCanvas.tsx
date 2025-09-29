import { useEffect, useMemo, useRef, useState } from 'react'

type Stroke = {
  color: string
  size: number
  mode: 'draw' | 'erase'
  points: { x: number; y: number }[]
}

type Props = {
  width?: number
  height?: number
  minWidth?: number
  initialColor?: string
  initialSize?: number
  className?: string
  // Called when user clicks "add image" button
  onExport?: (dataUrl: string, mime: string) => void
}

export default function DrawingCanvas({
  width = 768,
  height = 512,
  minWidth = 120,
  initialColor = '#111111',
  initialSize = 6,
  className,
  onExport,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const bgImgRef = useRef<HTMLImageElement | null>(null)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const lastStrokeRef = useRef<Stroke | null>(null)
  const [color, setColor] = useState(initialColor)
  const [size, setSize] = useState(initialSize)
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen')
  const [bgDataUrl, setBgDataUrl] = useState<string | null>(null)
  const [deviceRatio, setDeviceRatio] = useState(1)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileSize, setMobileSize] = useState<'s' | 'm' | 'l'>('m')

  // Resize canvas for device pixel ratio crispness
  useEffect(() => {
    const ratio = Math.max(1, Math.min(3, window.devicePixelRatio || 1))
    setDeviceRatio(ratio)
  }, [])

  // Track viewport for mobile-specific sizing
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 640px)')
    const onMQ = () => setIsMobile(mql.matches)
    onMQ()
    mql.addEventListener('change', onMQ)
    return () => mql.removeEventListener('change', onMQ)
  }, [])

  // Draw all
  const redraw = useMemo(() => {
    return () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')!
      ctx.save()
      // Clear
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw background image if any
      const img = bgImgRef.current
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }

      // Draw each stroke
      for (const s of strokes) {
        ctx.save()
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.lineWidth = s.size * deviceRatio
        if (s.mode === 'erase') {
          ctx.globalCompositeOperation = 'destination-out'
        } else {
          ctx.globalCompositeOperation = 'source-over'
          ctx.strokeStyle = s.color
        }
        ctx.beginPath()
        for (let i = 0; i < s.points.length; i++) {
          const p = s.points[i]
          const px = p.x * deviceRatio
          const py = p.y * deviceRatio
          if (i === 0) {
            ctx.moveTo(px, py)
          } else {
            ctx.lineTo(px, py)
          }
        }
        ctx.stroke()
        ctx.restore()
      }

      ctx.restore()
    }
  }, [strokes, deviceRatio])

  // Ensure canvas size respects DPR and container size
  const containerRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const resize = () => {
      const el = canvasRef.current
      const box = containerRef.current
      if (!el || !box) return
      const parentWidth = box.clientWidth
      // Use the smaller of the parent width or configured width as the base size
      const base = Math.min(parentWidth, width)
      // On mobile, apply an extra scale factor based on the selected size
      const scale = isMobile ? (mobileSize === 's' ? 0.75 : mobileSize === 'm' ? 0.9 : 1.0) : 1.0
      const scaled = Math.round(base * scale)
      const dynamicMinWidth = Math.min(minWidth, parentWidth)
      const w = Math.max(dynamicMinWidth, scaled)
      const aspect = height / width
      const h = Math.round(w * aspect)
      el.style.width = `${w}px`
      el.style.height = `${h}px`
      el.width = Math.round(w * deviceRatio)
      el.height = Math.round(h * deviceRatio)
      redraw()
    }
    resize()
    const ro = new ResizeObserver(resize)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [width, height, minWidth, deviceRatio, redraw, isMobile, mobileSize])

  // Background image loader updates redraw
  useEffect(() => {
    if (!bgDataUrl) {
      bgImgRef.current = null
      redraw()
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => { bgImgRef.current = img; redraw() }
    img.onerror = () => { bgImgRef.current = null; redraw() }
    img.src = bgDataUrl
  }, [bgDataUrl, redraw])

  const start = (x: number, y: number) => {
    const s: Stroke = {
      color,
      size,
      mode: tool === 'eraser' ? 'erase' : 'draw',
      points: [{ x, y }],
    }
    lastStrokeRef.current = s
    setStrokes(prev => [...prev, s])
  }
  const move = (x: number, y: number) => {
    const last = lastStrokeRef.current
    if (!last) return
    last.points.push({ x, y })
    // draw incremental to keep it responsive
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')!
      ctx.save()
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = last.size * deviceRatio
      if (last.mode === 'erase') {
        ctx.globalCompositeOperation = 'destination-out'
      } else {
        ctx.globalCompositeOperation = 'source-over'
        ctx.strokeStyle = last.color
      }
      const len = last.points.length
      const a = last.points[len - 2]
      const b = last.points[len - 1]
      ctx.beginPath()
      ctx.moveTo(a.x * deviceRatio, a.y * deviceRatio)
      ctx.lineTo(b.x * deviceRatio, b.y * deviceRatio)
      ctx.stroke()
      ctx.restore()
    }
  }
  const end = () => {
    setIsDrawing(false)
    lastStrokeRef.current = null
  }

  // Pointer handlers (mouse + touch)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const getPos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      return { x: Math.max(0, Math.min(rect.width, x)), y: Math.max(0, Math.min(rect.height, y)) }
    }

    const onDown = (e: PointerEvent) => {
      e.preventDefault()
      canvas.setPointerCapture(e.pointerId)
      const { x, y } = getPos(e)
      start(x, y)
      setIsDrawing(true)
    }
    const onMove = (e: PointerEvent) => {
      if (!isDrawing) return
      const { x, y } = getPos(e)
      move(x, y)
    }
    const onUp = (e: PointerEvent) => {
      if (!isDrawing) return
      canvas.releasePointerCapture(e.pointerId)
      end()
    }
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [isDrawing, deviceRatio])

  const clearAll = () => {
    setStrokes([])
    lastStrokeRef.current = null
    redraw()
  }

  const undo = () => {
    setStrokes(prev => {
      const next = prev.slice(0, Math.max(0, prev.length - 1))
      return next
    })
  }

  useEffect(() => { redraw() }, [strokes, redraw])

  const handleBgFile = (file: File | null) => {
    if (!file) { setBgDataUrl(null); return }
    const reader = new FileReader()
    reader.onload = () => setBgDataUrl(String(reader.result))
    reader.readAsDataURL(file)
  }

  const exportPng = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    // Export ONLY strokes (transparent background) to use as composition alongside uploaded images
    const off = document.createElement('canvas')
    off.width = canvas.width
    off.height = canvas.height
    const ctx = off.getContext('2d')!
    for (const s of strokes) {
      ctx.save()
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = s.size * deviceRatio
      if (s.mode === 'erase') {
        ctx.globalCompositeOperation = 'destination-out'
      } else {
        ctx.globalCompositeOperation = 'source-over'
        ctx.strokeStyle = s.color
      }
      ctx.beginPath()
      for (let i = 0; i < s.points.length; i++) {
        const p = s.points[i]
        const px = p.x * deviceRatio
        const py = p.y * deviceRatio
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()
      ctx.restore()
    }
    const dataUrl = off.toDataURL('image/png')
    onExport?.(dataUrl, 'image/png')
  }

  return (
    <div className={`min-w-0 max-w-full ${className ?? ''}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center mb-3">
        {/* Mobile: quick canvas scale (S/M/L) */}
        <div className="flex items-center gap-2 text-sm sm:hidden">
          <span>Size</span>
          <div className="inline-flex border rounded overflow-hidden">
            <button
              type="button"
              className={`px-3 py-1 ${mobileSize==='s' ? 'bg-gray-200 text-gray-900' : 'bg-white text-gray-700'}`}
              onClick={() => setMobileSize('s')}
              aria-pressed={mobileSize==='s'}
              aria-label="Small canvas"
            >S</button>
            <button
              type="button"
              className={`px-3 py-1 border-l ${mobileSize==='m' ? 'bg-gray-200 text-gray-900' : 'bg-white text-gray-700'}`}
              onClick={() => setMobileSize('m')}
              aria-pressed={mobileSize==='m'}
              aria-label="Medium canvas"
            >M</button>
            <button
              type="button"
              className={`px-3 py-1 border-l ${mobileSize==='l' ? 'bg-gray-200 text-gray-900' : 'bg-white text-gray-700'}`}
              onClick={() => setMobileSize('l')}
              aria-pressed={mobileSize==='l'}
              aria-label="Large canvas"
            >L</button>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span>Color</span>
          <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-8 w-10 p-0 border rounded" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span>Brush</span>
          <input
            type="range"
            min={1}
            max={40}
            value={size}
            onChange={e => setSize(Number(e.target.value))}
            className="w-32 sm:w-40"
            aria-label="Brush thickness"
          />
          <span className="w-8 text-xs text-gray-600">{size}px</span>
        </label>
        <div className="flex items-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => setTool('pen')}
            className={`px-3 py-2 rounded border ${tool==='pen' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700'}`}
            aria-pressed={tool==='pen'}
            aria-label="Pen tool"
          >
            Pen
          </button>
          <button
            type="button"
            onClick={() => setTool('eraser')}
            className={`px-3 py-2 rounded border ${tool==='eraser' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700'}`}
            aria-pressed={tool==='eraser'}
            aria-label="Eraser tool"
          >
            Eraser
          </button>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label className="inline-flex items-center gap-2">
            <span>Background image</span>
            <input type="file" accept="image/*" onChange={e => handleBgFile(e.target.files?.[0] ?? null)} />
          </label>
          {bgDataUrl && (
            <button type="button" className="text-xs text-gray-600 hover:text-gray-800" onClick={() => setBgDataUrl(null)}>Clear background</button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 text-sm sm:ml-auto w-full sm:w-auto">
          <button type="button" onClick={undo} className="px-3 py-2 rounded border bg-white text-gray-700 flex-1 sm:flex-none">Undo</button>
          <button type="button" onClick={clearAll} className="px-3 py-2 rounded border bg-white text-gray-700 flex-1 sm:flex-none">Clear all</button>
          <button type="button" onClick={exportPng} className="px-3 py-2 rounded bg-green-600 text-white w-full sm:w-auto">Add sketch as image</button>
        </div>
      </div>
      <div ref={containerRef} className="w-full max-w-full min-w-0 overflow-hidden">
        <div className="relative border rounded-md overflow-hidden bg-[conic-gradient(at_25%_25%,#f9fafb_25%,#f3f4f6_0_50%,#f9fafb_0_75%,#f3f4f6_0)] bg-[length:20px_20px]">
          <canvas
            ref={canvasRef}
            className="block h-full touch-none cursor-crosshair mx-auto"
            style={{ touchAction: 'none' }}
          />
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-500">Tip: Overlay rough lines on a background image to convey composition. PNG export preserves transparency.</p>
    </div>
  )
}
