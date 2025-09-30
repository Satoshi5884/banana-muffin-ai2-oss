import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject
} from 'firebase/storage'
import { 
  doc, 
  addDoc, 
  collection, 
  getDocs, 
  deleteDoc, 
  updateDoc,
  query, 
  where, 
  orderBy,
  Timestamp
} from 'firebase/firestore'
import { storage, db } from '../config/firebase'

// Generate tags and comments with AI
export type TagCommentLanguage = 'en' | 'ja'

export const generateImageTagsAndComment = async (
  apiKey: string,
  imageDataUrl: string,
  prompt?: string,
  language: TagCommentLanguage = 'en'
): Promise<{ tags: string[]; comment: string }> => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent`
  
  const base64 = imageDataUrl.split(',')[1]
  const mimeType = imageDataUrl.split(',')[0].split(':')[1].split(';')[0]
  
  const analysisPrompt = prompt 
    ? `Analyze this image, taking into account the generation prompt "${prompt}".`
    : `Analyze this image and describe its key characteristics.`

  const isJapanese = language === 'ja'
  const languageLabel = isJapanese ? 'Japanese' : 'English'
  const commentInstruction = isJapanese
    ? 'Write the comment in Japanese, summarising the most important details in about two sentences.'
    : 'Write the comment in English, summarising the most important details in about two sentences.'
  const tagsInstruction = isJapanese
    ? 'Provide five Japanese keywords that describe the subject, style, colors, or mood of the image.'
    : 'Provide five English keywords that describe the subject, style, colors, or mood of the image.'
  const sampleComment = isJapanese
    ? 'シーンの中心的な要素を2文程度で要約した日本語コメント'
    : 'Concise English description (around 2 sentences)'
  const fallbackTags = isJapanese
    ? ['AI生成', '画像', 'アート', 'デジタル', 'クリエイティブ']
    : ['AI-generated', 'image', 'art', 'digital', 'creative']
  const fallbackComment = isJapanese
    ? 'AIが生成した画像です。'
    : 'AI-generated image.'
  
  const requestBody = {
    contents: [{
      parts: [
        { text: `${analysisPrompt}

Respond in ${languageLabel}.

Return a JSON response using the following format:
{
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "comment": "${sampleComment}"
}

${tagsInstruction}
${commentInstruction}` },
        { inlineData: { mimeType, data: base64 } }
      ]
    }],
    generationConfig: { candidateCount: 1 }
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    try {
      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          tags: Array.isArray(parsed.tags) && parsed.tags.length > 0 ? parsed.tags : fallbackTags,
          comment: typeof parsed.comment === 'string' && parsed.comment.trim() ? parsed.comment : fallbackComment
        }
      }
    } catch (parseError) {
      console.warn('JSON parse failed, using fallback')
    }

    // Fallback: default tags and comment
    return {
      tags: fallbackTags,
      comment: fallbackComment
    }
  } catch (error) {
    console.error('Tag and comment generation failed:', error)
    return {
      tags: fallbackTags.slice(0, 2),
      comment: fallbackComment
    }
  }
}

export interface ImageMetadata {
  id: string
  userId: string
  fileName: string
  originalFileName: string
  fileSize: number
  mimeType: string
  downloadURL: string
  storagePath: string
  createdAt: Date
  promptId?: string
  prompt?: string
  generatedComment?: string
  tags: string[]
  isOriginalImage: boolean
  relatedImages?: string[]
}

export interface VideoMetadata {
  id: string
  userId: string
  fileName: string
  originalFileName: string
  fileSize: number
  mimeType: string
  downloadURL: string
  storagePath: string
  createdAt: Date
  prompt?: string
  provider?: string
  durationSeconds?: number
  resolution?: string
  seed?: number
  relatedImageIds?: string[]
}

export interface ModelMetadata {
  id: string
  userId: string
  fileName: string
  originalFileName: string
  fileSize: number
  mimeType: string
  downloadURL: string
  storagePath: string
  createdAt: Date
  prompt?: string
  provider: string
  seed?: number
  format: string
  material: string
  quality: string
  useHyper: boolean
  tier: string
  TAPose: boolean
  addons: string[]
  texturePreviews?: { url: string; width: number; height: number; contentType?: string }[]
}

// Upload image to Firebase Storage
export const uploadImageToStorage = async (
  userId: string,
  blob: Blob,
  originalFileName: string,
  promptId?: string,
  prompt?: string,
  generatedComment?: string,
  tags: string[] = [],
  isOriginalImage: boolean = false,
  relatedImages: string[] = []
): Promise<ImageMetadata> => {
  // Generate file name (timestamp + random string)
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const extension = originalFileName.split('.').pop() || 'png'
  const fileName = `${timestamp}_${randomString}.${extension}`
  
  // Build storage path
  const storagePath = `users/${userId}/images/${fileName}`
  const storageRef = ref(storage, storagePath)
  
  try {
    // Upload file
    const snapshot = await uploadBytes(storageRef, blob)
    const downloadURL = await getDownloadURL(snapshot.ref)
    
    // Persist metadata in Firestore
    const imageData = {
      userId,
      fileName,
      originalFileName,
      fileSize: blob.size,
      mimeType: blob.type,
      downloadURL,
      storagePath,
      createdAt: Timestamp.now(),
      promptId: promptId || null,
      prompt: prompt || null,
      generatedComment: generatedComment || null,
      tags,
      isOriginalImage,
      relatedImages
    }
    
    const docRef = await addDoc(collection(db, 'images'), imageData)
    
    return {
      id: docRef.id,
      userId,
      fileName,
      originalFileName,
      fileSize: blob.size,
      mimeType: blob.type,
      downloadURL,
      storagePath,
      createdAt: new Date(),
      promptId: promptId || undefined,
      prompt: prompt || undefined,
      generatedComment: generatedComment || undefined,
      tags,
      isOriginalImage,
      relatedImages
    }
  } catch (error) {
    console.error('Image upload error:', error)
    throw error
  }
}

export const uploadVideoToStorage = async (
  userId: string,
  blob: Blob,
  originalFileName: string,
  options: {
    prompt?: string
    provider?: string
    durationSeconds?: number
    resolution?: string
    seed?: number
    relatedImageIds?: string[]
  } = {}
): Promise<VideoMetadata> => {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const extension = originalFileName.split('.').pop() || 'mp4'
  const fileName = `${timestamp}_${randomString}.${extension}`

  const storagePath = `users/${userId}/videos/${fileName}`
  const storageRef = ref(storage, storagePath)

  try {
    const snapshot = await uploadBytes(storageRef, blob)
    const downloadURL = await getDownloadURL(snapshot.ref)

    const videoData = {
      userId,
      fileName,
      originalFileName,
      fileSize: blob.size,
      mimeType: blob.type || 'video/mp4',
      downloadURL,
      storagePath,
      createdAt: Timestamp.now(),
      prompt: options.prompt ?? null,
      provider: options.provider ?? null,
      durationSeconds: options.durationSeconds ?? null,
      resolution: options.resolution ?? null,
      seed: options.seed ?? null,
      relatedImageIds: options.relatedImageIds ?? [],
    }

    const docRef = await addDoc(collection(db, 'videos'), videoData)

    return {
      id: docRef.id,
      userId,
      fileName,
      originalFileName,
      fileSize: blob.size,
      mimeType: blob.type || 'video/mp4',
      downloadURL,
      storagePath,
      createdAt: new Date(),
      prompt: options.prompt,
      provider: options.provider,
      durationSeconds: options.durationSeconds,
      resolution: options.resolution,
      seed: options.seed,
      relatedImageIds: options.relatedImageIds,
    }
  } catch (error) {
    console.error('Video upload error:', error)
    throw error
  }
}

export const uploadModelToStorage = async (
  userId: string,
  blob: Blob,
  originalFileName: string,
  options: {
    prompt?: string
    provider: string
    seed?: number
    format: string
    material: string
    quality: string
    useHyper: boolean
    tier: string
    TAPose: boolean
    addons: string[]
    texturePreviews?: { url: string; width: number; height: number; contentType?: string }[]
  }
): Promise<ModelMetadata> => {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const extension = originalFileName.split('.').pop() || 'glb'
  const fileName = `${timestamp}_${randomString}.${extension}`

  const storagePath = `users/${userId}/models/${fileName}`
  const storageRef = ref(storage, storagePath)
  const contentType = blob.type || inferModelContentType(extension)

  try {
    const snapshot = await uploadBytes(storageRef, blob, { contentType })
    const downloadURL = await getDownloadURL(snapshot.ref)

    const payload = {
      userId,
      fileName,
      originalFileName,
      fileSize: blob.size,
      mimeType: contentType,
      downloadURL,
      storagePath,
      createdAt: Timestamp.now(),
      prompt: options.prompt ?? null,
      provider: options.provider,
      seed: typeof options.seed === 'number' ? options.seed : null,
      format: options.format,
      material: options.material,
      quality: options.quality,
      useHyper: options.useHyper,
      tier: options.tier,
      TAPose: options.TAPose,
      addons: options.addons,
      texturePreviews: options.texturePreviews ?? [],
    }

    const docRef = await addDoc(collection(db, 'models'), payload)

    return {
      id: docRef.id,
      userId,
      fileName,
      originalFileName,
      fileSize: blob.size,
      mimeType: contentType,
      downloadURL,
      storagePath,
      createdAt: new Date(),
      prompt: options.prompt,
      provider: options.provider,
      seed: options.seed,
      format: options.format,
      material: options.material,
      quality: options.quality,
      useHyper: options.useHyper,
      tier: options.tier,
      TAPose: options.TAPose,
      addons: options.addons,
      texturePreviews: options.texturePreviews,
    }
  } catch (error) {
    console.error('Failed to upload 3D model:', error)
    throw error
  }
}

const inferModelContentType = (extension: string) => {
  const ext = extension.toLowerCase()
  if (ext === 'glb') return 'model/gltf-binary'
  if (ext === 'gltf') return 'model/gltf+json'
  if (ext === 'fbx') return 'application/octet-stream'
  if (ext === 'usdz') return 'model/vnd.usdz+zip'
  if (ext === 'obj') return 'model/obj'
  if (ext === 'stl') return 'model/stl'
  return 'application/octet-stream'
}

export const getUserModels = async (
  userId: string,
  limit?: number
): Promise<ModelMetadata[]> => {
  try {
    const q = query(
      collection(db, 'models'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )

    const querySnapshot = await getDocs(q)
    const models: ModelMetadata[] = []

    querySnapshot.forEach(docSnap => {
      const data = docSnap.data()
      models.push({
        id: docSnap.id,
        userId: data.userId,
        fileName: data.fileName,
        originalFileName: data.originalFileName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        downloadURL: data.downloadURL,
        storagePath: data.storagePath,
        createdAt: data.createdAt.toDate(),
        prompt: data.prompt || undefined,
        provider: data.provider,
        seed: typeof data.seed === 'number' ? data.seed : undefined,
        format: data.format,
        material: data.material,
        quality: data.quality,
        useHyper: Boolean(data.useHyper),
        tier: data.tier,
        TAPose: Boolean(data.TAPose),
        addons: Array.isArray(data.addons) ? data.addons : [],
        texturePreviews: Array.isArray(data.texturePreviews) ? data.texturePreviews : [],
      })
    })

    if (typeof limit === 'number' && Number.isFinite(limit)) {
      const capped = Math.max(0, Math.floor(limit))
      return capped > 0 ? models.slice(0, capped) : []
    }

    return models
  } catch (error) {
    console.error('3D model list error:', error)
    throw error
  }
}

// Retrieve user video list
export const getUserVideos = async (
  userId: string,
  limit?: number
): Promise<VideoMetadata[]> => {
  try {
    const q = query(
      collection(db, 'videos'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )

    const querySnapshot = await getDocs(q)
    const videos: VideoMetadata[] = []

    querySnapshot.forEach(docSnap => {
      const data = docSnap.data()
      videos.push({
        id: docSnap.id,
        userId: data.userId,
        fileName: data.fileName,
        originalFileName: data.originalFileName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        downloadURL: data.downloadURL,
        storagePath: data.storagePath,
        createdAt: data.createdAt.toDate(),
        prompt: data.prompt || undefined,
        provider: data.provider || undefined,
        durationSeconds: typeof data.durationSeconds === 'number' ? data.durationSeconds : undefined,
        resolution: data.resolution || undefined,
        seed: typeof data.seed === 'number' ? data.seed : undefined,
        relatedImageIds: data.relatedImageIds || [],
      })
    })

    if (typeof limit === 'number' && Number.isFinite(limit)) {
      const capped = Math.max(0, Math.floor(limit))
      return capped > 0 ? videos.slice(0, capped) : []
    }

    return videos
  } catch (error) {
    console.error('Video list error:', error)
    throw error
  }
}

// Retrieve user image list
export const getUserImages = async (
  userId: string,
  limit?: number
): Promise<ImageMetadata[]> => {
  try {
    const q = query(
      collection(db, 'images'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    
    const querySnapshot = await getDocs(q)
    const images: ImageMetadata[] = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      images.push({
        id: doc.id,
        userId: data.userId,
        fileName: data.fileName,
        originalFileName: data.originalFileName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        downloadURL: data.downloadURL,
        storagePath: data.storagePath,
        createdAt: data.createdAt.toDate(),
        promptId: data.promptId,
        prompt: data.prompt,
        generatedComment: data.generatedComment,
        tags: data.tags || [],
        isOriginalImage: data.isOriginalImage || false,
        relatedImages: data.relatedImages || []
      })
    })
    
    if (typeof limit === 'number' && Number.isFinite(limit)) {
      const capped = Math.max(0, Math.floor(limit))
      return capped > 0 ? images.slice(0, capped) : []
    }

    return images
  } catch (error) {
    console.error('Image list error:', error)
    throw error
  }
}

// Delete image (Storage + Firestore)
export const deleteImageFromStorage = async (imageId: string): Promise<void> => {
  try {
    // Fetch metadata from Firestore
    const imageDoc = doc(db, 'images', imageId)
    const imageData = await getDocs(query(
      collection(db, 'images'),
      where('__name__', '==', imageId)
    ))
    
    if (imageData.empty) {
      throw new Error('Image metadata not found')
    }
    
    const data = imageData.docs[0].data()
    const storagePath = data.storagePath
    
    // Delete from Storage
    const storageRef = ref(storage, storagePath)
    await deleteObject(storageRef)
    
    // Delete from Firestore
    await deleteDoc(imageDoc)
  } catch (error) {
    console.error('Image deletion error:', error)
    throw error
  }
}

// Delete video (Storage + Firestore)
export const deleteVideoFromStorage = async (videoId: string): Promise<void> => {
  try {
    const videoDoc = doc(db, 'videos', videoId)
    const videoData = await getDocs(query(
      collection(db, 'videos'),
      where('__name__', '==', videoId)
    ))

    if (videoData.empty) {
      throw new Error('Video metadata not found')
    }

    const data = videoData.docs[0].data()
    const storagePath = data.storagePath

    const storageRef = ref(storage, storagePath)
    await deleteObject(storageRef)

    await deleteDoc(videoDoc)
  } catch (error) {
    console.error('Video deletion error:', error)
    throw error
  }
}

export const deleteModelFromStorage = async (modelId: string): Promise<void> => {
  try {
    const modelDoc = doc(db, 'models', modelId)
    const modelData = await getDocs(query(
      collection(db, 'models'),
      where('__name__', '==', modelId)
    ))

    if (modelData.empty) {
      throw new Error('3D model metadata not found')
    }

    const data = modelData.docs[0].data()
    const storagePath = data.storagePath

    const storageRef = ref(storage, storagePath)
    await deleteObject(storageRef)

    await deleteDoc(modelDoc)
  } catch (error) {
    console.error('3D model deletion error:', error)
    throw error
  }
}

// Calculate user storage usage
export const calculateStorageUsage = async (userId: string): Promise<number> => {
  try {
    const [images, videos, models] = await Promise.all([
      getUserImages(userId, 1000),
      getUserVideos(userId, 1000),
      getUserModels(userId, 1000),
    ])
    const imageBytes = images.reduce((total, image) => total + (image.fileSize || 0), 0)
    const videoBytes = videos.reduce((total, video) => total + (video.fileSize || 0), 0)
    const modelBytes = models.reduce((total, model) => total + (model.fileSize || 0), 0)
    return imageBytes + videoBytes + modelBytes
  } catch (error) {
    console.error('Storage usage calculation error:', error)
    return 0
  }
}

// Format storage capacity
export const formatStorageSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  if (bytes === Number.MAX_SAFE_INTEGER) return '∞'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// Validate storage capacity
export const canUploadFile = (
  currentUsage: number,
  quota: number,
  fileSize: number
): { canUpload: boolean; reason?: string } => {
  if (quota === 0) {
    return { canUpload: false, reason: 'Storage feature is not enabled' }
  }
  
  if (quota === Number.MAX_SAFE_INTEGER) {
    return { canUpload: true }
  }
  
  if (currentUsage + fileSize > quota) {
    const needed = formatStorageSize(fileSize)
    const available = formatStorageSize(Math.max(0, quota - currentUsage))
    return { 
      canUpload: false, 
      reason: `Insufficient capacity. Required: ${needed}, available: ${available}` 
    }
  }
  
  return { canUpload: true }
}

// Derive file size from image blob
export const getImageSize = (dataUrl: string): number => {
  // Extract the base64 segment from data:image/png URLs
  const base64 = dataUrl.split(',')[1]
  if (!base64) return 0
  
  // Compute base64 size (including padding)
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return Math.ceil((base64.length * 3) / 4) - padding
}

// Convert a DataURL into a Blob
export const dataUrlToBlob = (dataUrl: string): Blob => {
  const [header, data] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] || 'image/png'
  const binary = atob(data)
  const array = new Uint8Array(binary.length)
  
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i)
  }
  
  return new Blob([array], { type: mime })
}

// Save original image to storage
export const saveOriginalImage = async (
  userId: string,
  imageDataUrl: string,
  originalFileName: string,
  apiKey: string
): Promise<ImageMetadata> => {
  const blob = dataUrlToBlob(imageDataUrl)
  
  // Generate tags and comment for the original image
  const { tags, comment } = await generateImageTagsAndComment(apiKey, imageDataUrl)
  const originalTags = ['original', 'input-image', ...tags]
  
  return await uploadImageToStorage(
    userId,
    blob,
    originalFileName,
    undefined,
    undefined,
    comment,
    originalTags,
    true, // isOriginalImage = true
    []
  )
}

// Save generated image with relationships
export const saveGeneratedImages = async (
  userId: string,
  images: { dataUrl: string; blob: Blob; mime: string }[],
  prompt: string,
  apiKey: string,
  originalImageIds: string[] = []
): Promise<ImageMetadata[]> => {
  const savedImages: ImageMetadata[] = []
  
  for (let i = 0; i < images.length; i++) {
    const image = images[i]
    const { tags, comment } = await generateImageTagsAndComment(apiKey, image.dataUrl, prompt)
    
    const savedImage = await uploadImageToStorage(
      userId,
      image.blob,
      `generated_${Date.now()}_${i + 1}.png`,
      undefined,
      prompt,
      comment,
      tags,
      false, // isOriginalImage = false
      originalImageIds
    )
    
    savedImages.push(savedImage)
  }
  
  return savedImages
}

// Update image metadata
export const updateImageMetadata = async (
  imageId: string,
  updates: {
    tags?: string[]
    generatedComment?: string
    prompt?: string
  }
): Promise<void> => {
  try {
    const imageDoc = doc(db, 'images', imageId)
    const updateData: any = {}
    
    if (updates.tags !== undefined) updateData.tags = updates.tags
    if (updates.generatedComment !== undefined) updateData.generatedComment = updates.generatedComment
    if (updates.prompt !== undefined) updateData.prompt = updates.prompt
    
    await updateDoc(imageDoc, updateData)
  } catch (error) {
    console.error('Image metadata update error:', error)
    throw error
  }
}

// Search images by tag, comment, or prompt
export const searchImages = async (
  userId: string,
  searchQuery: string,
  filters?: {
    tags?: string[]
    isOriginalImage?: boolean
    dateRange?: { start: Date; end: Date }
  }
): Promise<ImageMetadata[]> => {
  try {
    const q = query(
      collection(db, 'images'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    
    const querySnapshot = await getDocs(q)
    const images: ImageMetadata[] = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      images.push({
        id: doc.id,
        userId: data.userId,
        fileName: data.fileName,
        originalFileName: data.originalFileName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        downloadURL: data.downloadURL,
        storagePath: data.storagePath,
        createdAt: data.createdAt.toDate(),
        promptId: data.promptId,
        prompt: data.prompt,
        generatedComment: data.generatedComment,
        tags: data.tags || [],
        isOriginalImage: data.isOriginalImage || false,
        relatedImages: data.relatedImages || []
      })
    })
    
    // Apply client-side filters
    return images.filter(image => {
      const lowerQuery = searchQuery.toLowerCase()
      
      // Text search across tags, comments, prompt, filename
      const matchesText = !searchQuery || 
        image.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
        (image.generatedComment && image.generatedComment.toLowerCase().includes(lowerQuery)) ||
        (image.prompt && image.prompt.toLowerCase().includes(lowerQuery)) ||
        image.originalFileName.toLowerCase().includes(lowerQuery)
      
      // Tag filter
      const matchesTags = !filters?.tags?.length || 
        filters.tags.some(tag => image.tags.includes(tag))
      
      // Original image filter
      const matchesOriginal = filters?.isOriginalImage === undefined || 
        image.isOriginalImage === filters.isOriginalImage
      
      // Date filter
      const matchesDate = !filters?.dateRange || 
        (image.createdAt >= filters.dateRange.start && image.createdAt <= filters.dateRange.end)
      
      return matchesText && matchesTags && matchesOriginal && matchesDate
    })
  } catch (error) {
    console.error('Image search error:', error)
    return []
  }
}

// Retrieve all unique tags
export const getUserImageTags = async (userId: string): Promise<string[]> => {
  try {
    const images = await getUserImages(userId, 1000)
    const allTags = images.flatMap(image => image.tags)
    return [...new Set(allTags)].sort()
  } catch (error) {
    console.error('Tag fetch error:', error)
    return []
  }
}
