import { useEffect, useMemo, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Banner from './components/Banner'
import PromptForm from './components/PromptForm'
import ResultGrid from './components/ResultGrid'
import AuthButton from './components/AuthButton'
import UsageQuota from './components/UsageQuota'
import StorageQuota from './components/StorageQuota'
import PromptHistory from './components/PromptHistory'
import AdminPanel from './components/AdminPanel'
import ImageGallery from './components/ImageGallery'
import VideoGallery from './components/VideoGallery'
import ModelGallery from './components/ModelGallery'
import MarkdownEditor from './components/MarkdownEditor'
import {
  generateImages,
  geminiEvents,
  IMAGE_PROVIDERS,
  type BackoffEventDetail,
  type ImageProviderId,
} from './lib/imageProviders'
import {
  generateVideo,
  VIDEO_PROVIDERS,
  type VideoProviderId,
  type GeneratedVideo,
} from './lib/videoProviders'
import VideoPromptForm from './components/VideoPromptForm'
import VideoResultGrid from './components/VideoResultGrid'
import {
  generateThreeD,
  THREE_D_PROVIDERS,
  type ThreeDProviderId,
  type GenerateThreeDOptions,
  type GeneratedModel as GeneratedThreeDModel,
} from './lib/threeDProviders'
import ThreeDPromptForm from './components/ThreeDPromptForm'
import ThreeDResultGrid from './components/ThreeDResultGrid'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { savePromptToHistory } from './lib/firestore'
import LandingPage from './pages/Landing'
import TermsPage from './pages/Terms'
import PrivacyPage from './pages/Privacy'
import CommercePage from './pages/Commerce'
import SettingsPage from './pages/Settings'
import LinksPage from './pages/Links'
import HelpPage from './pages/Help'
import Footer from './components/Footer'

function AppContent() {
  const rawGeminiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
  const rawFalKey = import.meta.env.VITE_FAL_KEY as string | undefined
  const geminiKey = rawGeminiKey?.trim() ?? ''
  const falKey = rawFalKey?.trim() ?? ''
  const LAST_PROVIDER_STORAGE_KEY = 'banana-muffin:last-provider'
  const LAST_VIDEO_PROVIDER_STORAGE_KEY = 'banana-muffin:last-video-provider'
  const LAST_THREED_PROVIDER_STORAGE_KEY = 'banana-muffin:last-3d-provider'
  const { user, userProfile, canUseGeneration, recordGeneration } = useAuth()
  const [showAdmin, setShowAdmin] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [galleryView, setGalleryView] = useState<'images' | 'videos' | 'models' | null>(null)
  const [storageUpdated, setStorageUpdated] = useState(0)
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [originalImageIds, setOriginalImageIds] = useState<string[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<{ dataUrl: string; blob: Blob; mime: string }[]>([])
  const [notes, setNotes] = useState<string[]>([])
  const [videoItems, setVideoItems] = useState<GeneratedVideo[]>([])
  const [videoNotes, setVideoNotes] = useState<string[]>([])
  const [videoConfig, setVideoConfig] = useState<{ duration: string; resolution: string } | null>(null)
  const [videoSourceImage, setVideoSourceImage] = useState<{ dataUrl: string; mime: string } | null>(null)
  const [threeDItems, setThreeDItems] = useState<GeneratedThreeDModel[]>([])
  const [threeDNotes, setThreeDNotes] = useState<string[]>([])
  const [threeDSourceImage, setThreeDSourceImage] = useState<{ dataUrl: string; mime: string } | null>(null)
  const [backoffMs, setBackoffMs] = useState<number | null>(null)
  const backoffTimerRef = useRef<number | null>(null)

  const [mode, setMode] = useState<'image' | 'image-to-video' | 'image-to-3d' | 'markdown'>('image')
  const [provider, setProvider] = useState<ImageProviderId>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem(LAST_PROVIDER_STORAGE_KEY) as ImageProviderId | null
      if (saved) return saved
    }
    const firstWithKey = IMAGE_PROVIDERS.find(info =>
      info.requiresKey === 'gemini' ? geminiKey.length > 0 : falKey.length > 0
    )
    return firstWithKey?.id ?? 'nano-banana'
  })
  const [videoProvider, setVideoProvider] = useState<VideoProviderId>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem(LAST_VIDEO_PROVIDER_STORAGE_KEY) as VideoProviderId | null
      if (saved) return saved
    }
    return 'seedance-lite-image-to-video'
  })
  const [threeDProvider, setThreeDProvider] = useState<ThreeDProviderId>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem(LAST_THREED_PROVIDER_STORAGE_KEY) as ThreeDProviderId | null
      if (saved) return saved
    }
    return 'hyper3d-rodin'
  })

  const providerOptions = useMemo(
    () =>
      IMAGE_PROVIDERS.map(info => ({
        ...info,
        hasKey: info.requiresKey === 'gemini' ? geminiKey.length > 0 : falKey.length > 0,
      })),
    [geminiKey, falKey]
  )

  const videoProviderOptions = useMemo(
    () =>
      VIDEO_PROVIDERS.map(info => ({
        ...info,
        hasKey: falKey.length > 0,
      })),
    [falKey]
  )

  const threeDProviderOptions = useMemo(
    () =>
      THREE_D_PROVIDERS.map(info => ({
        ...info,
        hasKey: falKey.length > 0,
      })),
    [falKey]
  )

  const providerInfo = useMemo(() => {
    return providerOptions.find(p => p.id === provider) ?? providerOptions[0]
  }, [provider, providerOptions])

  const videoProviderInfo = useMemo(() => {
    return videoProviderOptions.find(p => p.id === videoProvider) ?? videoProviderOptions[0]
  }, [videoProviderOptions, videoProvider])

  const threeDProviderInfo = useMemo(() => {
    return threeDProviderOptions.find(p => p.id === threeDProvider) ?? threeDProviderOptions[0]
  }, [threeDProviderOptions, threeDProvider])

  const imageProviderHasKey = providerInfo ? providerInfo.hasKey : false
  const videoProviderHasKey = videoProviderInfo ? videoProviderInfo.hasKey : false
  const threeDProviderHasKey = threeDProviderInfo ? threeDProviderInfo.hasKey : false

  const disabled = useMemo(() => {
    if (!user) return true
    if (mode === 'image') {
      return !imageProviderHasKey
    }
    if (mode === 'image-to-video') {
      if (!videoProviderHasKey) return true
      if (userProfile?.role === 'free') return true
      return false
    }
    if (mode === 'image-to-3d') {
      if (!threeDProviderHasKey) return true
      if (userProfile?.role === 'free') return true
      return false
    }
    if (mode === 'markdown') {
      return false
    }
    return true
  }, [user, mode, imageProviderHasKey, videoProviderHasKey, threeDProviderHasKey, userProfile?.role])

  const providerSubtitle = useMemo(() => {
    if (mode === 'image') {
      return `Generate AI images with ${providerInfo?.shortLabel ?? 'nano-banana'}.`
    }
    if (mode === 'image-to-video') {
      return `Generate videos from images with ${videoProviderInfo?.shortLabel ?? 'Image→Video'}.`
    }
    if (mode === 'image-to-3d') {
      return `Generate 3D models from images with ${threeDProviderInfo?.shortLabel ?? 'Hyper3D'}.`
    }
    return 'Manage text with Markdown notes.'
  }, [mode, providerInfo?.shortLabel, videoProviderInfo?.shortLabel, threeDProviderInfo?.shortLabel])

  const hasAnyResults =
    items.length > 0 ||
    notes.length > 0 ||
    videoItems.length > 0 ||
    videoNotes.length > 0 ||
    threeDItems.length > 0 ||
    threeDNotes.length > 0

  useEffect(() => {
    if (!providerInfo) {
      const fallback = providerOptions.find(p => p.hasKey) ?? providerOptions[0]
      if (fallback && fallback.id !== provider) {
        setProvider(fallback.id)
      }
      return
    }

    if (!providerInfo.hasKey) {
      const fallback = providerOptions.find(p => p.hasKey)
      if (fallback && fallback.id !== providerInfo.id) {
        setProvider(fallback.id)
      }
    }
  }, [providerOptions, providerInfo, provider])

  useEffect(() => {
    if (!videoProviderInfo) {
      const fallback = videoProviderOptions.find(p => p.hasKey) ?? videoProviderOptions[0]
      if (fallback && fallback.id !== videoProvider) {
        setVideoProvider(fallback.id)
      }
      return
    }

    if (!videoProviderInfo.hasKey) {
      const fallback = videoProviderOptions.find(p => p.hasKey)
      if (fallback && fallback.id !== videoProviderInfo.id) {
        setVideoProvider(fallback.id)
      }
    }
  }, [videoProviderOptions, videoProviderInfo, videoProvider])

  useEffect(() => {
    if (!threeDProviderInfo) {
      const fallback = threeDProviderOptions.find(p => p.hasKey) ?? threeDProviderOptions[0]
      if (fallback && fallback.id !== threeDProvider) {
        setThreeDProvider(fallback.id)
      }
      return
    }

    if (!threeDProviderInfo.hasKey) {
      const fallback = threeDProviderOptions.find(p => p.hasKey)
      if (fallback && fallback.id !== threeDProviderInfo.id) {
        setThreeDProvider(fallback.id)
      }
    }
  }, [threeDProviderOptions, threeDProviderInfo, threeDProvider])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (providerInfo?.hasKey) {
      window.localStorage.setItem(LAST_PROVIDER_STORAGE_KEY, providerInfo.id)
    }
  }, [providerInfo?.id, providerInfo?.hasKey])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (videoProviderInfo?.hasKey) {
      window.localStorage.setItem(LAST_VIDEO_PROVIDER_STORAGE_KEY, videoProviderInfo.id)
    }
  }, [videoProviderInfo?.id, videoProviderInfo?.hasKey])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (threeDProviderInfo?.hasKey) {
      window.localStorage.setItem(LAST_THREED_PROVIDER_STORAGE_KEY, threeDProviderInfo.id)
    }
  }, [threeDProviderInfo?.id, threeDProviderInfo?.hasKey])

  const handleProviderChange = (id: ImageProviderId) => {
    setProvider(id)
  }

  const handleVideoProviderChange = (id: VideoProviderId) => {
    setVideoProvider(id)
  }

  const handleThreeDProviderChange = (id: ThreeDProviderId) => {
    setThreeDProvider(id)
  }

  const bannerMessage = useMemo(() => {
    if (mode === 'image') {
      if (!providerInfo || imageProviderHasKey) return undefined
      const keyName = providerInfo.requiresKey === 'gemini' ? 'VITE_GEMINI_API_KEY' : 'VITE_FAL_KEY'
      return `To use ${providerInfo.label}, please set ${keyName}. Refer to .env.example to configure environment variables.`
    }
    if (mode === 'image-to-video') {
      if (userProfile?.role === 'free') {
        return 'Video generation is not available for Free plan users. Contact an administrator for approval.'
      }
      if (!videoProviderInfo || videoProviderHasKey) return undefined
      return `To use ${videoProviderInfo.label}, please set VITE_FAL_KEY. Refer to .env.example to configure environment variables.`
    }
    if (mode === 'image-to-3d') {
      if (userProfile?.role === 'free') {
        return '3D generation is not available for Free plan users. Contact an administrator for approval.'
      }
      if (!threeDProviderInfo || threeDProviderHasKey) return undefined
      return `To use ${threeDProviderInfo.label}, please set VITE_FAL_KEY. Refer to .env.example to configure environment variables.`
    }
    return undefined
  }, [mode, providerInfo, imageProviderHasKey, videoProviderInfo, videoProviderHasKey, threeDProviderInfo, threeDProviderHasKey, userProfile?.role])

  const handleImageSubmit = async ({
    prompt,
    negativePrompt,
    files,
    candidateCount,
  }: {
    prompt: string
    negativePrompt?: string
    files: { dataUrl: string; mime: string }[]
    candidateCount: number
  }) => {
    if (disabled || !user || !userProfile || !providerInfo) return

    if (!canUseGeneration({ type: 'image', units: Math.max(1, candidateCount) })) {
      if (userProfile?.role === 'free') {
        if (userProfile.approvalStatus === 'pending') {
          setError('Your account is pending administrator approval. Please wait for approval before using generation features.')
        } else if (userProfile.approvalStatus === 'rejected') {
          setError('Your access request has been rejected. Please contact the administrator.')
        } else {
          setError('Free plan users cannot use generation features. Please contact administrator for upgrade.')
        }
      } else if (userProfile?.role === 'pro') {
        setError('Insufficient credits available. Please wait for next month reset or contact administrator.')
      } else {
        setError('Usage limit reached. Please contact administrator.')
      }
      return
    }

    if (providerInfo.requiresBaseImage && files.length === 0) {
      setError(`${providerInfo.shortLabel} requires input images to be added.`)
      return
    }

    setLoading(true)
    setError(null)
    setCurrentPrompt(prompt)

    try {
      // Save input images if any (Pro/Admin only)
      const savedOriginalIds: string[] = []
      if (files.length > 0 && userProfile && (userProfile.role === 'pro' || userProfile.role === 'admin')) {
        // Original image saving will be implemented later
        // const { saveOriginalImage } = await import('./lib/storage')
        // for (const file of files) {
        //   const savedOriginal = await saveOriginalImage(user.uid, file.dataUrl, 'original.png', apiKey)
        //   savedOriginalIds.push(savedOriginal.id)
        // }
      }
      setOriginalImageIds(savedOriginalIds)
      
      const res = await generateImages({
        provider,
        prompt,
        negativePrompt,
        inputFiles: files,
        candidateCount,
        geminiApiKey: geminiKey || undefined,
        falCredentials: falKey || undefined,
      })
      setItems(res.images)
      setNotes(res.notes)
      
      // Save prompt to history
      await savePromptToHistory(user.uid, prompt, candidateCount)
      
      // Update usage count
      if (res.images.length > 0) {
        await recordGeneration({ type: 'image', units: res.images.length })
      }
      
      if (res.images.length === 0 && res.notes.length === 0) {
        setError('No images were returned. Please adjust your prompt or input images.')
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'An error occurred'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleVideoSubmit = async ({
    prompt,
    inputImage,
    referenceImage,
    duration,
    resolution,
    cameraFixed,
    seed,
  }: {
    prompt: string
    inputImage: { dataUrl: string; mime: string }
    referenceImage?: { dataUrl: string; mime: string }
    duration: '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12'
    resolution: '480p' | '720p' | '1080p'
    cameraFixed: boolean
    seed?: number
  }) => {
    if (disabled || !user || !userProfile || !videoProviderInfo) return

    if (userProfile.role === 'free') {
      if (userProfile.approvalStatus === 'pending') {
        setError('Your account is pending administrator approval. Video generation requires approval.')
      } else if (userProfile.approvalStatus === 'rejected') {
        setError('Your access request has been rejected. Please contact the administrator.')
      } else {
        setError('Video generation is not available for Free plan users. Contact administrator for upgrade.')
      }
      return
    }

    if (!canUseGeneration({ type: 'video', units: 1 })) {
      setError('Insufficient credits available. Please wait for next month reset or contact administrator.')
      return
    }

    setLoading(true)
    setError(null)
    setCurrentPrompt(prompt)
    setVideoConfig({ duration, resolution })

    try {
      const res = await generateVideo({
        provider: videoProvider,
        prompt,
        inputImage,
        referenceImage,
        duration,
        resolution,
        cameraFixed,
        seed,
        falCredentials: falKey || '',
      })

      setVideoItems(prev => {
        prev.forEach(item => URL.revokeObjectURL(item.objectUrl))
        return res.videos
      })
      setVideoNotes(res.notes)

      await savePromptToHistory(user.uid, prompt, res.videos.length || 1)
      if (res.videos.length > 0) {
        await recordGeneration({ type: 'video', units: res.videos.length })
      }

      if (res.videos.length === 0 && res.notes.length === 0) {
        setError('No videos were returned. Please adjust your prompt or input images.')
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'An error occurred'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleThreeDSubmit = async ({
    prompt,
    inputImages,
    conditionMode,
    geometryFormat,
    material,
    quality,
    useHyper,
    tier,
    TAPose,
    addons,
    bboxCondition,
    seed,
  }: Omit<GenerateThreeDOptions, 'provider' | 'falCredentials'>) => {
    if (disabled || !user || !userProfile || !threeDProviderInfo) return

    if (userProfile.role === 'free') {
      if (userProfile.approvalStatus === 'pending') {
        setError('Your account is pending administrator approval. 3D generation requires approval.')
      } else if (userProfile.approvalStatus === 'rejected') {
        setError('Your access request has been rejected. Please contact the administrator.')
      } else {
        setError('3D generation is not available for Free plan users. Contact administrator for upgrade.')
      }
      return
    }

    if (!threeDProviderHasKey) {
      setError('Please set VITE_FAL_KEY to use Hyper3D.')
      return
    }

    if (!canUseGeneration({ type: 'threeD', units: 1 })) {
      setError('Insufficient credits available. Please wait for next month reset or contact administrator.')
      return
    }

    setLoading(true)
    setError(null)
    setCurrentPrompt(prompt?.trim() ?? '')
    if (inputImages[0]) {
      setThreeDSourceImage(inputImages[0])
    }

    try {
      const res = await generateThreeD({
        provider: threeDProvider,
        prompt,
        inputImages,
        conditionMode,
        geometryFormat,
        material,
        quality,
        useHyper,
        tier,
        TAPose,
        addons,
        bboxCondition,
        seed,
        falCredentials: falKey || '',
      })

      setThreeDItems(res.models)
      setThreeDNotes(res.notes)

      const historyPrompt = prompt?.trim() ? prompt.trim() : 'Image→3D Request'
      await savePromptToHistory(user.uid, historyPrompt, res.models.length)
      if (res.models.length > 0) {
        await recordGeneration({ type: 'threeD', units: res.models.length })
      }

      if (res.models.length === 0 && res.notes.length === 0) {
        setError('No 3D models were returned. Please adjust your prompt or input images.')
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'An error occurred'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const clearResults = () => {
    setItems([])
    setNotes([])
    setVideoItems(prev => {
      prev.forEach(item => URL.revokeObjectURL(item.objectUrl))
      return []
    })
    setVideoNotes([])
    setVideoConfig(null)
    setVideoSourceImage(null)
    setThreeDItems([])
    setThreeDNotes([])
    setThreeDSourceImage(null)
    setCurrentPrompt('')
    setOriginalImageIds([])
    setError(null)
  }

  const handleSendToVideoMode = (image: { dataUrl: string; mime: string }) => {
    setVideoSourceImage(image)
    setVideoItems(prev => {
      prev.forEach(item => URL.revokeObjectURL(item.objectUrl))
      return []
    })
    setVideoNotes([])
    setVideoConfig(null)
    setError(null)
    setMode('image-to-video')
  }

  const handleSendToThreeDMode = (image: { dataUrl: string; mime: string }) => {
    setThreeDSourceImage(image)
    setThreeDItems([])
    setThreeDNotes([])
    setError(null)
    setMode('image-to-3d')
  }

  useEffect(() => {
    return () => {
      videoItems.forEach(item => URL.revokeObjectURL(item.objectUrl))
    }
  }, [videoItems])

  useEffect(() => {
    setError(null)
  }, [mode])

  // Listen backoff events to show countdown
  useEffect(() => {
    const onStart = (ev: Event) => {
      const e = ev as CustomEvent<BackoffEventDetail>
      setBackoffMs(e.detail.delayMs)
    }
    const onEnd = () => {
      setBackoffMs(null)
    }
    geminiEvents.addEventListener('gemini:backoff', onStart as EventListener)
    geminiEvents.addEventListener('gemini:backoff-complete', onEnd as EventListener)
    return () => {
      geminiEvents.removeEventListener('gemini:backoff', onStart as EventListener)
      geminiEvents.removeEventListener('gemini:backoff-complete', onEnd as EventListener)
    }
  }, [])

  // Countdown tick, only when active
  useEffect(() => {
    if (backoffMs == null) return
    if (backoffTimerRef.current) window.clearInterval(backoffTimerRef.current)
    backoffTimerRef.current = window.setInterval(() => {
      setBackoffMs(v => (v == null ? v : Math.max(0, v - 1000)))
    }, 1000)
    return () => {
      if (backoffTimerRef.current) window.clearInterval(backoffTimerRef.current)
      backoffTimerRef.current = null
    }
  }, [backoffMs !== null])

  useEffect(() => {
    if (mode !== 'image' || provider !== 'nano-banana') {
      setBackoffMs(null)
    }
  }, [provider, mode])

  if (showAdmin && userProfile?.role === 'admin') {
    return (
      <div className="min-h-screen bg-white text-gray-900">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowAdmin(false)}
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                Back to Main Page
              </button>
              <AuthButton />
            </div>
          </div>
          <AdminPanel />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <Banner show={Boolean(bannerMessage)} message={bannerMessage ?? undefined} />
      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        {user && (
          <aside className={`${showHistory ? 'w-full md:w-80' : 'w-full md:w-16'} transition-all duration-300 bg-white border-r md:h-screen md:sticky md:top-0 overflow-hidden`}>
            <div className="p-4">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-100"
                title={showHistory ? 'Close History' : 'Open History'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {showHistory && <span className="ml-2">History</span>}
              </button>
            </div>
            {showHistory && (
              <div className="px-4 pb-4">
                <PromptHistory />
              </div>
            )}
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 max-w-5xl mx-auto p-4 space-y-6">
          <header className="pt-4 pb-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
              <div>
                <a href="/" className="text-2xl font-bold hover:underline">Banana-muffin AI OSS</a>
                <p className="text-sm text-gray-600">{providerSubtitle}</p>
              </div>
              <div className="flex items-center gap-4">
                {userProfile?.role === 'admin' && (
                  <button
                    onClick={() => setShowAdmin(true)}
                    className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                  >
                    Admin Panel
                  </button>
                )}
                <Link
                  to="/help"
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                >
                  Help
                </Link>
                {user && (
                  <Link
                    to="/settings"
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Settings
                  </Link>
                )}
                <AuthButton />
              </div>
            </div>
          </header>

          {user && <UsageQuota />}
          {user && userProfile?.role !== 'free' && <StorageQuota />}

          <section className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => setMode('image')}
                className={`px-3 py-1 text-sm rounded-md border ${mode === 'image' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
              >
                Image Generation
              </button>
              <button
                type="button"
                onClick={() => setMode('image-to-video')}
                className={`px-3 py-1 text-sm rounded-md border ${mode === 'image-to-video' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
              >
                Image→Video
              </button>
              <button
                type="button"
                onClick={() => setMode('image-to-3d')}
                className={`px-3 py-1 text-sm rounded-md border ${mode === 'image-to-3d' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
              >
                Image→3D
              </button>
              <button
                type="button"
                onClick={() => setMode('markdown')}
                className={`px-3 py-1 text-sm rounded-md border ${mode === 'markdown' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
              >
                Markdown Notes
              </button>
            </div>

            {mode === 'image' ? (
              <PromptForm
                onSubmit={handleImageSubmit}
                loading={loading}
                disabled={disabled}
                backoffSeconds={provider === 'nano-banana' && backoffMs != null ? Math.ceil(backoffMs / 1000) : null}
                provider={provider}
                providers={providerOptions}
                onProviderChange={handleProviderChange}
                providerDescription={providerInfo?.description ?? ''}
                providerHasKey={imageProviderHasKey}
                requiresBaseImage={providerInfo?.requiresBaseImage ?? false}
                maxFiles={providerInfo?.maxInputImages ?? 3}
                maxCandidates={providerInfo?.maxCandidates ?? 1}
              />
            ) : mode === 'image-to-video' ? (
              <VideoPromptForm
                onSubmit={handleVideoSubmit}
                loading={loading}
                disabled={disabled}
                provider={videoProvider}
                providers={videoProviderOptions}
                onProviderChange={handleVideoProviderChange}
                providerDescription={videoProviderInfo?.description ?? ''}
                providerHasKey={videoProviderHasKey}
                initialImage={videoSourceImage}
              />
            ) : mode === 'image-to-3d' ? (
              <ThreeDPromptForm
                onSubmit={handleThreeDSubmit}
                loading={loading}
                disabled={disabled}
                provider={threeDProvider}
                providers={threeDProviderOptions}
                onProviderChange={handleThreeDProviderChange}
                providerDescription={threeDProviderInfo?.description ?? ''}
                providerHasKey={threeDProviderHasKey}
                initialImage={threeDSourceImage}
              />
            ) : (
              <div className="space-y-4">
                <MarkdownEditor />
              </div>
            )}

            {error && (
              <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>
            )}
            {mode === 'image' && backoffMs !== null && (
              <div className="mt-3 p-2 rounded border bg-amber-50 border-amber-200 text-amber-800" aria-live="polite">
                Rate limited, waiting... Retry in {Math.ceil((backoffMs ?? 0)/1000)} seconds
              </div>
            )}
            {!user && (
              <div className="mt-3 p-3 rounded border bg-blue-50 border-blue-200 text-blue-800">
                Please login with your Google account to use image, video, and 3D generation features.
              </div>
            )}
          </section>

          {galleryView ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {galleryView === 'images'
                    ? 'Image Gallery'
                    : galleryView === 'videos'
                      ? 'Video Gallery'
                      : '3D Model Gallery'}
                </h2>
                <button
                  onClick={() => setGalleryView(null)}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  Back to Generation
                </button>
              </div>
              {galleryView === 'images' ? (
                <ImageGallery key={`images-${storageUpdated}`} />
              ) : galleryView === 'videos' ? (
                <VideoGallery
                  key={`videos-${storageUpdated}`}
                  onUseFrameAsInput={image => {
                    setVideoSourceImage(image)
                    setMode('image-to-video')
                    setGalleryView(null)
                  }}
                  onStorageUpdated={() => setStorageUpdated(prev => prev + 1)}
                />
              ) : (
                <ModelGallery
                  key={`models-${storageUpdated}`}
                  onStorageUpdated={() => setStorageUpdated(prev => prev + 1)}
                />
              )}
            </div>
          ) : (
            <>
              {userProfile?.role !== 'free' && (
                <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mb-4">
                  <button
                    onClick={() => setGalleryView('images')}
                    className="px-4 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                  >
                    📷 View Saved Images
                  </button>
                  <button
                    onClick={() => setGalleryView('videos')}
                    className="px-4 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                  >
                    🎬 View Saved Videos
                  </button>
                  <button
                    onClick={() => setGalleryView('models')}
                    className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                  >
                    🧊 View Saved 3D Models
                  </button>
                </div>
              )}
              {mode !== 'markdown' && (
                <>
                  {hasAnyResults && (
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold">Generation Results</h2>
                      <button
                        onClick={clearResults}
                        className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-1"
                        title="Clear generation results"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Clear Results
                      </button>
                    </div>
                  )}
                  <ResultGrid 
                    items={items} 
                    notes={notes} 
                    prompt={currentPrompt}
                    originalImageIds={originalImageIds}
                    onImageSaved={() => setStorageUpdated(prev => prev + 1)}
                    onSendToVideoMode={handleSendToVideoMode}
                    onSendToThreeDMode={handleSendToThreeDMode}
                  />
                  <VideoResultGrid
                    items={videoItems}
                    notes={videoNotes}
                    prompt={currentPrompt}
                    provider={videoProvider}
                    duration={videoConfig?.duration}
                    resolution={videoConfig?.resolution}
                    relatedImageIds={originalImageIds}
                    onVideoSaved={() => setStorageUpdated(prev => prev + 1)}
                    onFrameCaptured={image => {
                      setVideoSourceImage(image)
                      setMode('image-to-video')
                    }}
                    onFrameSaved={() => setStorageUpdated(prev => prev + 1)}
                  />
                  <ThreeDResultGrid
                    items={threeDItems}
                    notes={threeDNotes}
                    prompt={currentPrompt}
                    onModelSaved={() => setStorageUpdated(prev => prev + 1)}
                  />
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-white">
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/app" element={<AppContent />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/commerce" element={<CommercePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/links" element={<LinksPage />} />
              <Route path="/help" element={<HelpPage />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
