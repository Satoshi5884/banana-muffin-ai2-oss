import { Link } from 'react-router-dom'
import LanguageToggle from '../components/LanguageToggle'
import { useLanguage } from '../contexts/LanguageContext'
import type { Language } from '../contexts/LanguageContext'

interface ResourceLink {
  name: string
  url: string
}

const RESOURCE_LINKS: ResourceLink[] = [
  { name: 'Gemini', url: 'https://gemini.google.com/app' },
  { name: 'Google AI Studio', url: 'https://aistudio.google.com/' },
  { name: 'Midjourney', url: 'https://www.midjourney.com/' },
  { name: 'ChatGPT', url: 'https://chatgpt.com/' },
  { name: 'Sora', url: 'https://sora.chatgpt.com/' },
  { name: 'MV to PIC', url: 'https://satoshi5884.github.io/mv-to-pic/' },
  { name: 'Suno MV Gen for All', url: 'https://satoshi5884.github.io/suno-mv-gen-for-all/' },
  { name: 'Suno', url: 'https://suno.com/home' },
  { name: 'ElevenLabs', url: 'https://elevenlabs.io/app/home' },
  { name: 'LRC Maker', url: 'https://lrc-maker.github.io/#/' },
  { name: 'Genspark', url: 'https://www.genspark.ai/' },
]

const LINKS_COPY: Record<Language, {
  backLabel: string
  title: string
  description: string
  footnote: string
}> = {
  en: {
    backLabel: '← Back to Generator',
    title: 'Helpful Links for Generated Assets',
    description:
      'External services for editing, animating, adding audio, and exploring creative ideas with generated media.',
    footnote: 'All links point to third-party sites. Review each service\'s terms and policies before use.',
  },
  ja: {
    backLabel: '← ジェネレーターに戻る',
    title: '生成コンテンツ向けの便利リンク集',
    description: '生成した素材の編集・アニメ化・音声付与・アイデア拡張に役立つ外部サービスをまとめています。',
    footnote: '各リンクは第三者のサイトです。利用前に各サービスの利用規約やポリシーをご確認ください。',
  },
}

export default function LinksPage() {
  const { language } = useLanguage()
  const copy = LINKS_COPY[language]

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Link to="/app" className="text-blue-600 hover:underline">
              {copy.backLabel}
            </Link>
            <LanguageToggle size="sm" />
          </div>

          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{copy.title}</h1>
            <p className="mt-2 text-sm text-gray-600">{copy.description}</p>
          </div>

          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {RESOURCE_LINKS.map(item => (
              <li key={item.url} className="group">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-full p-4 rounded-lg border bg-white shadow-sm hover:shadow transition-shadow"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-gray-900 group-hover:underline">{item.name}</span>
                    <svg
                      className="w-4 h-4 text-gray-400 group-hover:text-gray-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M7 17L17 7" />
                      <path d="M7 7h10v10" />
                    </svg>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 break-all">{item.url}</div>
                </a>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-xs text-gray-500">{copy.footnote}</p>
        </div>
      </div>
    </div>
  )
}
