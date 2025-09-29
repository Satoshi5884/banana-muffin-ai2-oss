export async function downscaleToDataUrl(file: File, opts?: { maxSize?: number; quality?: number; mime?: string }) {
  const maxSize = opts?.maxSize ?? 1280
  const quality = opts?.quality ?? 0.85
  const outMime = opts?.mime ?? 'image/jpeg'

  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    const { width, height } = fitSize(img.naturalWidth || img.width, img.naturalHeight || img.height, maxSize)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0, width, height)
    const dataUrl = canvas.toDataURL(outMime, quality)
    return { dataUrl, mime: outMime, name: file.name }
  } finally {
    URL.revokeObjectURL(url)
  }
}

function fitSize(w: number, h: number, max: number) {
  if (w <= max && h <= max) return { width: w, height: h }
  const scale = Math.min(max / w, max / h)
  return { width: Math.round(w * scale), height: Math.round(h * scale) }
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(e)
    img.src = url
  })
}

