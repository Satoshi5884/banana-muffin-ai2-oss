import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { 
  getUserImages, 
  deleteImageFromStorage, 
  formatStorageSize, 
  searchImages,
  updateImageMetadata,
  getUserImageTags,
  type ImageMetadata 
} from '../lib/storage'

export default function ImageGallery() {
  const { user, canUseStorage, updateStorageUsage } = useAuth()
  const [images, setImages] = useState<ImageMetadata[]>([])
  const [allImages, setAllImages] = useState<ImageMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showOriginalOnly, setShowOriginalOnly] = useState(false)
  const [editingData, setEditingData] = useState<{
    tags: string[]
    comment: string
    prompt: string
  }>({ tags: [], comment: '', prompt: '' })
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set())
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  
  const ITEMS_PER_PAGE = 12

  const loadImages = async () => {
    if (!user || !canUseStorage()) return
    
    setLoading(true)
    try {
      const [userImages, tags] = await Promise.all([
        getUserImages(user.uid),
        getUserImageTags(user.uid)
      ])
      setAllImages(userImages)
      setImages(userImages)
      setAvailableTags(tags)
    } catch (error) {
      console.error('Image list fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!user || !canUseStorage()) return
    
    try {
      const results = await searchImages(user.uid, searchQuery, {
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        isOriginalImage: showOriginalOnly ? true : undefined
      })
      setImages(results)
    } catch (error) {
      console.error('Search error:', error)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSelectedTags([])
    setShowOriginalOnly(false)
    setImages(allImages)
  }

  const startEdit = (image: ImageMetadata) => {
    setEditing(image.id)
    setEditingData({
      tags: [...image.tags],
      comment: image.generatedComment || '',
      prompt: image.prompt || ''
    })
  }

  const cancelEdit = () => {
    setEditing(null)
    setEditingData({ tags: [], comment: '', prompt: '' })
  }

  const saveEdit = async () => {
    if (!editing) return
    
    try {
      await updateImageMetadata(editing, {
        tags: editingData.tags,
        generatedComment: editingData.comment,
        prompt: editingData.prompt
      })
      await loadImages()
      setEditing(null)
    } catch (error) {
      console.error('Metadata update error:', error)
      alert('Update failed.')
    }
  }

  useEffect(() => {
    loadImages()
  }, [user])

  // Auto-search whenever the query or filters change
  useEffect(() => {
    if (searchQuery || selectedTags.length > 0 || showOriginalOnly) {
      handleSearch()
    } else {
      setImages(allImages)
    }
    // Reset pagination when filters change
    setCurrentPage(1)
    setExpandedPrompts(new Set())
  }, [searchQuery, selectedTags, showOriginalOnly, allImages])

  const handleDelete = async (image: ImageMetadata) => {
    if (!confirm('Are you sure you want to delete this image?')) return
    
    setDeleting(image.id)
    try {
      await deleteImageFromStorage(image.id)
      // Reduce recorded storage usage
      await updateStorageUsage(-image.fileSize)
      // Reload the list
      await loadImages()
    } catch (error) {
      console.error('Image deletion error:', error)
      alert('Failed to delete image')
    } finally {
      setDeleting(null)
    }
  }

  const handleDownloadImage = async (image: ImageMetadata) => {
    try {
      // Method 1: Try to use canvas to convert image to blob (works with CORS)
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      const downloadPromise = new Promise<void>((resolve, reject) => {
        img.onload = () => {
          try {
            // Create canvas and draw image
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            if (!ctx) {
              reject(new Error('Canvas not supported'))
              return
            }
            
            canvas.width = img.width
            canvas.height = img.height
            ctx.drawImage(img, 0, 0)
            
            // Convert to blob and download
            canvas.toBlob((blob) => {
              if (!blob) {
                reject(new Error('Failed to create blob'))
                return
              }
              
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = image.originalFileName
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(url)
              resolve()
            }, 'image/png')
          } catch (error) {
            reject(error)
          }
        }
        
        img.onerror = () => {
          reject(new Error('Failed to load image'))
        }
      })
      
      img.src = image.downloadURL
      await downloadPromise
      
    } catch (error) {
      console.error('Canvas download failed:', error)
      // Fallback: Direct download attempt
      try {
        const a = document.createElement('a')
        a.href = image.downloadURL + '&download=1'  // Add download parameter
        a.download = image.originalFileName
        a.target = '_blank'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } catch (e) {
        console.error('Direct download failed:', e)
        // Final fallback: open in new window
        const newWindow = window.open(image.downloadURL, '_blank')
        if (!newWindow) {
          alert('Download failed. Please disable popup blocker and try again, or right-click the image to save.')
        }
      }
    }
  }


  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(imageId)) {
        newSet.delete(imageId)
      } else {
        newSet.add(imageId)
      }
      return newSet
    })
  }

  const selectAllImages = () => {
    setSelectedImages(new Set(currentImages.map(img => img.id)))
  }

  const clearSelection = () => {
    setSelectedImages(new Set())
  }

  const handleBulkDelete = async () => {
    if (selectedImages.size === 0) return
    
    if (!confirm(`Are you sure you want to delete ${selectedImages.size} selected images?`)) return
    
    try {
      let totalSizeReduction = 0
      for (const imageId of selectedImages) {
        const image = images.find(img => img.id === imageId)
        if (image) {
          await deleteImageFromStorage(imageId)
          totalSizeReduction += image.fileSize
        }
      }
      
      await updateStorageUsage(-totalSizeReduction)
      setSelectedImages(new Set())
      setIsSelectionMode(false)
      await loadImages()
      
    } catch (error) {
      console.error('Batch deletion error:', error)
      alert('Batch deletion failed')
    }
  }

  const togglePromptExpansion = (imageId: string) => {
    setExpandedPrompts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(imageId)) {
        newSet.delete(imageId)
      } else {
        newSet.add(imageId)
      }
      return newSet
    })
  }

  // Pagination helpers
  const totalPages = Math.ceil(images.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentImages = images.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Reset expanded state when navigating to a new page
    setExpandedPrompts(new Set())
  }

  if (!user || !canUseStorage()) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>Image gallery is available for Pro plan and above</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">
            Saved Images ({images.length}/{allImages.length})
          </h2>
          {totalPages > 1 && (
            <p className="text-sm text-gray-600 mt-1">
              Page {currentPage} / {totalPages} (showing {startIndex + 1}-{Math.min(endIndex, images.length)} of {images.length})
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {isSelectionMode && (
            <>
              <span className="text-sm text-gray-600 self-center">
                {selectedImages.size} selected
              </span>
              <button
                onClick={selectAllImages}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Select all
              </button>
              <button
                onClick={clearSelection}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Clear selection
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={selectedImages.size === 0}
                className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
              >
                Delete selected
              </button>
              <button
                onClick={() => {setIsSelectionMode(false); setSelectedImages(new Set())}}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
            </>
          )}
          {!isSelectionMode && (
            <button
              onClick={() => setIsSelectionMode(true)}
              className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
            >
              Selection mode
            </button>
          )}
          <button
            onClick={loadImages}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Update
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        {/* Search bar */}
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by tags, comments, prompt, or filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={clearSearch}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Clear
          </button>
        </div>

        {/* Filter options */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* Tag filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Tags:</span>
            <select
              multiple
              value={selectedTags}
              onChange={(e) => setSelectedTags(Array.from(e.target.selectedOptions, option => option.value))}
              className="px-2 py-1 text-sm border rounded"
              size={1}
            >
              {availableTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
            {selectedTags.length > 0 && (
              <div className="flex gap-1">
                {selectedTags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded cursor-pointer"
                    onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
                  >
                    {tag} ×
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Original image filter */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOriginalOnly}
              onChange={(e) => setShowOriginalOnly(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-600">Show originals only</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>No saved images</p>
              <p className="text-sm mt-2">Generate images and use "Save to Cloud".</p>
            </div>
          </div>
        ) : (
          currentImages.map((image) => (
            <div key={image.id} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="relative">
                <img
                  src={image.downloadURL}
                  alt={image.originalFileName}
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
                {isSelectionMode && (
                  <div className="absolute top-2 left-2">
                    <input
                      type="checkbox"
                      checked={selectedImages.has(image.id)}
                      onChange={() => toggleImageSelection(image.id)}
                      className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="text-sm text-gray-900 font-medium truncate mb-1">
                  {image.originalFileName}
                  {image.isOriginalImage && (
                    <span className="ml-2 px-1 py-0.5 text-xs bg-orange-100 text-orange-700 rounded">
                      Original
                    </span>
                  )}
                  <button
                    onClick={() => startEdit(image)}
                    className="ml-2 px-1 py-0.5 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                  >
                    ✏️
                  </button>
                </div>

                {editing === image.id ? (
                  /* Edit mode */
                  <div className="space-y-3">
                    {/* Prompt editor */}
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">Prompt:</label>
                      <textarea
                        value={editingData.prompt}
                        onChange={(e) => setEditingData(prev => ({ ...prev, prompt: e.target.value }))}
                        className="w-full text-xs p-2 border rounded resize-none"
                        rows={2}
                        placeholder="Enter prompt..."
                      />
                    </div>

                    {/* Comment editor */}
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">Comment:</label>
                      <textarea
                        value={editingData.comment}
                        onChange={(e) => setEditingData(prev => ({ ...prev, comment: e.target.value }))}
                        className="w-full text-xs p-2 border rounded resize-none"
                        rows={2}
                        placeholder="Enter comment..."
                      />
                    </div>

                    {/* Tag editor */}
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">Tags (comma separated):</label>
                      <input
                        type="text"
                        value={editingData.tags.join(', ')}
                        onChange={(e) => setEditingData(prev => ({
                          ...prev,
                          tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                        }))}
                        className="w-full text-xs p-2 border rounded"
                        placeholder="tag1, tag2, tag3..."
                      />
                    </div>

                    {/* Save/cancel controls */}
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        className="flex-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <div>
                    {/* Prompt display */}
                    {image.prompt && (
                      <div className="text-xs text-gray-700 mb-2">
                        <button
                          type="button"
                          onClick={() => togglePromptExpansion(image.id)}
                          className="w-full flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100"
                        >
                          <div className="font-medium text-gray-900">📝 Prompt</div>
                          <svg
                            className={`w-4 h-4 transform transition-transform ${
                              expandedPrompts.has(image.id) ? 'rotate-90' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        {expandedPrompts.has(image.id) && (
                          <div className="mt-1 p-2 bg-gray-50 rounded">
                            <div className="break-words">{image.prompt}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* AI comment display */}
                    {image.generatedComment && (
                      <div className="text-xs text-gray-700 mb-2 p-2 bg-blue-50 rounded">
                        <div className="font-medium text-blue-900 mb-1">🤖 AIComment:</div>
                        <div className="text-blue-800 break-words">{image.generatedComment}</div>
                      </div>
                    )}

                    {/* Tag display */}
                    {image.tags && image.tags.length > 0 && (
                      <div className="mb-2">
                        <div className="flex flex-wrap gap-1">
                          {image.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded cursor-pointer"
                              onClick={() => {
                                setSelectedTags(prev =>
                                  prev.includes(tag) ? prev : [...prev, tag]
                                )
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 space-y-1 mb-3">
                      <div>{formatStorageSize(image.fileSize)}</div>
                      <div>{new Date(image.createdAt).toLocaleDateString('ja-JP')}</div>
                      {image.relatedImages && image.relatedImages.length > 0 && (
                        <div className="text-purple-600">
                          🔗 Related images: {image.relatedImages.length}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownloadImage(image)}
                          className="flex-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Download
                        </button>
                        <button
                          onClick={() => handleDelete(image)}
                          disabled={deleting === image.id}
                          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                        >
                          {deleting === image.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            First
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page: number
              if (totalPages <= 5) {
                page = i + 1
              } else if (currentPage <= 3) {
                page = i + 1
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i
              } else {
                page = currentPage - 2 + i
              }
              
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 text-sm border rounded ${
                    currentPage === page
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              )
            })}
          </div>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Last
          </button>
        </div>
      )}
      
      </div>
  )
}
