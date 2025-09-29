import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  createMarkdownDocument,
  deleteMarkdownDocument,
  getMarkdownDocuments,
  getMarkdownLimitByRole,
  updateMarkdownDocument,
  type MarkdownDocument,
} from '../lib/firestore'

interface CodeBlock {
  id: string
  language: string
  code: string
}

const extractCodeBlocks = (markdown: string): CodeBlock[] => {
  const blocks: CodeBlock[] = []
  const lines = markdown.split(/\r?\n/)
  let inCodeBlock = false
  let language = ''
  const buffer: string[] = []

  lines.forEach(line => {
    const trimmed = line.trim()
    if (trimmed.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true
        language = trimmed.slice(3).trim()
        buffer.length = 0
      } else {
        inCodeBlock = false
        const code = buffer.join('\n')
        blocks.push({
          id: `${blocks.length}`,
          language,
          code,
        })
      }
      return
    }

    if (inCodeBlock) {
      buffer.push(line)
    }
  })

  return blocks
}

const getTitleFromContent = (content: string): string => {
  const firstLine = content.split(/\r?\n/).find(line => line.trim().length > 0) ?? ''
  return firstLine.replace(/^#+\s*/, '').slice(0, 80) || 'Untitled'
}

const formatDateTime = (value: Date): string => {
  return value.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const MarkdownEditor = () => {
  const { user, userProfile } = useAuth()
  const [documents, setDocuments] = useState<MarkdownDocument[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copyInfo, setCopyInfo] = useState<{ docId: string; blockId: string } | null>(null)
  const [compactBlockIndex, setCompactBlockIndex] = useState<Record<string, number>>({})
  const [page, setPage] = useState(0)

  const limit = userProfile ? getMarkdownLimitByRole(userProfile.role) : Number.MAX_SAFE_INTEGER

  const isEditingExisting = Boolean(selectedId)
  const remainingSlots = limit === Number.MAX_SAFE_INTEGER ? Number.MAX_SAFE_INTEGER : Math.max(0, limit - documents.length)
  const reachedLimitForNew = !isEditingExisting && limit !== Number.MAX_SAFE_INTEGER && documents.length >= limit
  const saveDisabled = saving || reachedLimitForNew

  const PAGE_SIZE = 8
  const totalPages = Math.max(1, Math.ceil(documents.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages - 1)
  const startIndex = currentPage * PAGE_SIZE
  const endIndex = startIndex + PAGE_SIZE
  const paginatedDocuments = documents.slice(startIndex, endIndex)

  useEffect(() => {
    if (!user) {
      setDocuments([])
      setSelectedId(null)
      setContent('')
      return
    }

    let cancelled = false

    const fetchDocs = async () => {
      setLoading(true)
      try {
        const docs = await getMarkdownDocuments(user.uid, 200)
        if (cancelled) return
        setDocuments(docs)
        setSelectedId(prev => {
          const current = prev ? docs.find(doc => doc.id === prev) : undefined
          const fallback = docs[0]
          const nextDoc = current ?? fallback
          setContent(nextDoc ? nextDoc.content : '')
          return nextDoc ? nextDoc.id : null
        })
      } catch (e) {
        if (!cancelled) {
          console.error(e)
          setError('Failed to load Markdown documents.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void fetchDocs()

    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    if (!copyInfo) return
    const timeout = window.setTimeout(() => setCopyInfo(null), 2000)
    return () => window.clearTimeout(timeout)
  }, [copyInfo])

  useEffect(() => {
    setPage(prev => Math.min(prev, Math.max(0, totalPages - 1)))
  }, [totalPages])

  if (!user || !userProfile) {
    return (
      <div className="border rounded-md p-4 bg-white">
        <h2 className="text-lg font-semibold">Markdown Notes</h2>
        <p className="mt-2 text-sm text-gray-600">Sign in to create and save Markdown notes.</p>
      </div>
    )
  }

  const selectedCodeBlocks = useMemo(() => extractCodeBlocks(content), [content])

  const refreshDocuments = async (highlightId?: string) => {
    if (!user) return
    setLoading(true)
    try {
      const docs = await getMarkdownDocuments(user.uid, 200)
      setDocuments(docs)
      const targetId = highlightId ?? selectedId
      const targetIndex = targetId ? docs.findIndex(entry => entry.id === targetId) : -1
      const targetDoc = targetIndex >= 0 ? docs[targetIndex] : undefined

      if (targetDoc) {
        setSelectedId(targetDoc.id)
        setContent(targetDoc.content)
        setPage(Math.floor(targetIndex / PAGE_SIZE))
      } else if (docs.length > 0) {
        setSelectedId(docs[0].id)
        setContent(docs[0].content)
        setPage(0)
      } else {
        setSelectedId(null)
        setContent('')
        setPage(0)
      }
    } catch (e) {
      console.error(e)
      setError('Failed to refresh Markdown documents.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (doc: MarkdownDocument) => {
    setSelectedId(doc.id)
    setContent(doc.content)
    setFeedback(null)
    setError(null)
  }

  const handleCreateNew = () => {
    setSelectedId(null)
    setContent('')
    setFeedback(null)
    setError(null)
  }

  const handleSave = async () => {
    if (!user || !userProfile) {
      setError('Sign in before saving.')
      return
    }
    if (!content.trim()) {
      setError('Enter text before saving.')
      return
    }
    if (!isEditingExisting && limit !== Number.MAX_SAFE_INTEGER && documents.length >= limit) {
      setError(`Free plans can store up to ${limit} notes. Delete an existing note or upgrade your plan.`)
      return
    }

    setSaving(true)
    setError(null)

    try {
      if (isEditingExisting && selectedId) {
        await updateMarkdownDocument(selectedId, content)
        setFeedback('Note updated.')
        await refreshDocuments(selectedId)
      } else {
        const newId = await createMarkdownDocument(user.uid, content)
        setFeedback('Note saved.')
        await refreshDocuments(newId)
      }
    } catch (e) {
      console.error(e)
      setError('An error occurred while saving.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (docId: string) => {
    if (!user) return
    const confirmed = window.confirm('Delete this note?')
    if (!confirmed) return

    setSaving(true)
    try {
      await deleteMarkdownDocument(docId)
      setFeedback('Note deleted.')
      if (selectedId === docId) {
        setSelectedId(null)
        setContent('')
      }
      await refreshDocuments()
    } catch (e) {
      console.error(e)
      setError('An error occurred while deleting.')
    } finally {
      setSaving(false)
    }
  }

  const handleCopy = async (docId: string, block: CodeBlock) => {
    try {
      await navigator.clipboard.writeText(block.code)
      setCopyInfo({ docId, blockId: block.id })
    } catch (e) {
      console.error(e)
      setError('Failed to copy to clipboard.')
    }
  }

  const cycleCompactBlock = (docId: string, delta: number, total: number) => {
    setCompactBlockIndex(prev => {
      const current = prev[docId] ?? 0
      const next = ((current + delta) % total + total) % total
      return { ...prev, [docId]: next }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Markdown Notes</h2>
            <div className="text-xs text-gray-500">
              {limit === Number.MAX_SAFE_INTEGER ? 'Saved notes: unlimited' : `Saved notes: ${documents.length} / ${limit}`}
            </div>
          </div>
          <textarea
            className="w-full h-56 border rounded-md p-3 text-sm font-mono bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Write in Markdown. Start code blocks with ```lang."
            value={content}
            onChange={event => {
              setContent(event.target.value)
              setFeedback(null)
              setError(null)
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saveDisabled}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isEditingExisting ? 'Update' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleCreateNew}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              New note
            </button>
            <button
              type="button"
              onClick={() => {
                setContent('')
                setFeedback(null)
                setError(null)
              }}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Clear content
            </button>
            {remainingSlots !== Number.MAX_SAFE_INTEGER && (
              <span className="text-xs text-gray-500">
                Remaining slots: {remainingSlots}
              </span>
            )}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {reachedLimitForNew && (
            <p className="text-xs text-amber-600">Delete an existing note or upgrade your plan to create a new one.</p>
          )}
          {feedback && <p className="text-sm text-green-600">{feedback}</p>}
        </div>
        <div className="w-full lg:w-1/2 border rounded-md p-3 bg-white">
          <h3 className="text-sm font-semibold text-gray-700">Code blocks in this note</h3>
          {selectedCodeBlocks.length > 0 ? (
            <div className="mt-2 space-y-2 max-h-80 overflow-auto pr-1">
              {selectedCodeBlocks.map(block => (
                <div key={block.id} className="border rounded-md bg-gray-900 text-gray-100 text-xs font-mono">
                  <div className="flex items-center justify-between px-2 py-1 border-b border-gray-800">
                    <span className="text-gray-300">
                      {block.language ? `${block.language} code` : 'Code'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedId ?? 'new', block)}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                    >
                      {copyInfo && copyInfo.docId === (selectedId ?? 'new') && copyInfo.blockId === block.id ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-2 overflow-auto whitespace-pre-wrap break-words max-h-48">{block.code}</pre>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-gray-500">Code blocks wrapped with ``` appear here.</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Saved notes</h3>
        {loading && <p className="text-sm text-gray-500">Loading...</p>}
        {!loading && documents.length === 0 && (
          <p className="text-sm text-gray-500">No notes yet. Try saving a Markdown memo.</p>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-600">
          <span>
            {documents.length === 0
              ? 'No notes saved yet.'
              : `Showing ${startIndex + 1}–${Math.min(endIndex, documents.length)} of ${documents.length}`}
          </span>
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(prev => Math.max(0, prev - 1))}
                className="px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-40"
                disabled={currentPage === 0}
              >
                ◀ Previous page
              </button>
              <span className="text-gray-500">
                Page {currentPage + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
                className="px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-40"
                disabled={currentPage >= totalPages - 1}
              >
                Next page ▶
              </button>
            </div>
          )}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {paginatedDocuments.map(doc => {
            const title = getTitleFromContent(doc.content)
            const snippetLines = doc.content.split(/\r?\n/).slice(0, 6)
            const snippet = snippetLines.join('\n')
            const docBlocks = extractCodeBlocks(doc.content)
            const isCompact = true
            const requestedIndex = compactBlockIndex[doc.id] ?? 0
            const safeIndex = docBlocks.length > 0 ? Math.min(Math.max(requestedIndex, 0), docBlocks.length - 1) : 0
            const blocksToShow = isCompact
              ? (docBlocks.length > 0 ? [docBlocks[safeIndex]] : [])
              : docBlocks
            const showNavigation = isCompact && docBlocks.length > 1
            return (
              <article
                key={doc.id}
                className={`border rounded-md p-3 bg-white shadow-sm ${selectedId === doc.id ? 'border-blue-300' : 'border-gray-200'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 break-words">{title}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Created: {formatDateTime(doc.createdAt)} / Updated: {formatDateTime(doc.updatedAt)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleSelect(doc)}
                      className="px-2 py-1 border rounded hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(doc.id)}
                      className="px-2 py-1 border border-red-200 text-red-600 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-600 whitespace-pre-wrap break-words bg-gray-50 border rounded p-2 max-h-32 overflow-auto">
                  {snippet}
                  {doc.content.length > snippet.length ? '\n…' : ''}
                </div>
                {docBlocks.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {blocksToShow.map(block => (
                      <div key={block.id} className="border rounded bg-gray-900 text-gray-100 text-xs font-mono p-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-300">
                            {block.language ? `${block.language} code` : 'Code'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(doc.id, block)}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                          >
                            {copyInfo && copyInfo.docId === doc.id && copyInfo.blockId === block.id ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <pre className={`overflow-auto whitespace-pre-wrap break-words ${isCompact ? 'max-h-24 text-[11px]' : 'max-h-48'}`}>{block.code}</pre>
                      </div>
                    ))}
                    {showNavigation && (
                      <div className="flex flex-wrap justify-between items-center gap-2 text-[11px] text-gray-400">
                        <button
                          type="button"
                          onClick={() => cycleCompactBlock(doc.id, -1, docBlocks.length)}
                          className="px-2 py-1 border rounded hover:bg-gray-50"
                        >
                          ◀ Previous block
                        </button>
                        <span>{safeIndex + 1} / {docBlocks.length}</span>
                        <button
                          type="button"
                          onClick={() => cycleCompactBlock(doc.id, 1, docBlocks.length)}
                          className="px-2 py-1 border rounded hover:bg-gray-50"
                        >
                          Next block ▶
                        </button>
                      </div>
                    )}
                    {isCompact && docBlocks.length > blocksToShow.length && (
                      <p className="text-[11px] text-gray-400">Select “Edit” to view every code block.</p>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-gray-500">No code blocks detected.</p>
                )}
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default MarkdownEditor
