import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  getPromptHistory,
  getFavoritePrompts,
  togglePromptFavorite,
  deletePromptFromHistory,
  updatePromptTags,
  getUserPromptTags,
  type PromptHistory
} from '../lib/firestore'

export default function PromptHistoryComponent() {
  const { user } = useAuth()
  const [prompts, setPrompts] = useState<PromptHistory[]>([])
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null)
  const [editingTags, setEditingTags] = useState('')

  const loadPrompts = async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = showFavoritesOnly
        ? await getFavoritePrompts(user.uid)
        : await getPromptHistory(user.uid, 20)
      setPrompts(data)
    } catch (error) {
      console.error('Prompt history fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTags = async () => {
    if (!user) return
    try {
      const tags = await getUserPromptTags(user.uid)
      setAvailableTags(tags)
    } catch (error) {
      console.error('Tag fetch error:', error)
    }
  }

  useEffect(() => {
    loadPrompts()
  }, [user, showFavoritesOnly])

  useEffect(() => {
    loadTags()
  }, [user])

  const handleToggleFavorite = async (promptId: string, favorite: boolean) => {
    try {
      await togglePromptFavorite(promptId, favorite)
      await loadPrompts()
    } catch (error) {
      console.error('Favorite update error:', error)
    }
  }

  const handleDelete = async (promptId: string) => {
    if (!confirm('Delete this prompt?')) return
    try {
      await deletePromptFromHistory(promptId)
      await loadPrompts()
    } catch (error) {
      console.error('Prompt delete error:', error)
    }
  }

  const handleUsePrompt = (prompt: string) => {
    // Prompt application to the form is complex in the current architecture,
    // so for now, copy to clipboard
    navigator.clipboard.writeText(prompt).then(() => {
      alert('Prompt copied to clipboard')
    })
  }

  const handleEditTags = (prompt: PromptHistory) => {
    setEditingPromptId(prompt.id)
    setEditingTags(prompt.tags.join(', '))
  }

  const handleSaveTags = async (promptId: string) => {
    const tags = editingTags
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean)
    const uniqueTags = Array.from(new Set(tags))
    try {
      await updatePromptTags(promptId, uniqueTags)
      setEditingPromptId(null)
      setEditingTags('')
      await loadPrompts()
      await loadTags()
    } catch (error) {
      console.error('Tag update error:', error)
    }
  }

  const handleCancelEdit = () => {
    setEditingPromptId(null)
    setEditingTags('')
  }

  if (!user) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Prompt History</h3>
        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={`text-xs px-2 py-1 rounded ${
            showFavoritesOnly 
              ? 'bg-yellow-100 text-yellow-700' 
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {showFavoritesOnly ? 'All' : 'Favorites'}
        </button>
      </div>

      {loading ? (
        <div className="text-center text-sm text-gray-500 py-4">
          Loading...
        </div>
      ) : prompts.length === 0 ? (
        <div className="text-center text-sm text-gray-500 py-4">
          {showFavoritesOnly ? 'No favorites found' : 'No history found'}
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {prompts.map((prompt) => (
            <div key={prompt.id} className="bg-gray-50 rounded-lg p-3 text-xs">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 truncate font-medium">
                    {prompt.prompt}
                  </p>
                  <p className="text-gray-500 mt-1">
                    {new Date(prompt.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleToggleFavorite(prompt.id, !prompt.favorite)}
                    className={`p-1 rounded ${
                      prompt.favorite
                        ? 'text-yellow-500 hover:text-yellow-600'
                        : 'text-gray-400 hover:text-yellow-500'
                    }`}
                    title={prompt.favorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(prompt.id)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded"
                    title="Delete"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {editingPromptId === prompt.id ? (
                <div className="mb-2">
                  <input
                    type="text"
                    value={editingTags}
                    onChange={e => setEditingTags(e.target.value)}
                    list={`tags-${prompt.id}`}
                    className="w-full px-2 py-1 border rounded"
                  />
                  <datalist id={`tags-${prompt.id}`}>
                    {availableTags.map(tag => (
                      <option key={tag} value={tag} />
                    ))}
                  </datalist>
                  <div className="flex justify-end gap-2 mt-1">
                    <button
                      onClick={handleCancelEdit}
                      className="px-2 py-1 text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveTags(prompt.id)}
                      className="px-2 py-1 text-blue-500 hover:text-blue-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between mb-2">
                  <div className="flex flex-wrap gap-1">
                    {prompt.tags.length > 0 ? (
                      prompt.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-1 py-0.5 bg-gray-200 rounded"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400">No tags</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleEditTags(prompt)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    Edit
                  </button>
                </div>
              )}

              <button
                onClick={() => handleUsePrompt(prompt.prompt)}
                className="w-full text-left px-2 py-1 bg-white rounded border text-gray-700 hover:bg-gray-50 text-xs"
              >
                Copy to Clipboard
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}