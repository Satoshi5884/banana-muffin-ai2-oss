import { Link } from 'react-router-dom'

export default function LinksPage() {
  const links: { name: string; url: string }[] = [
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

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-4">
            <Link to="/app" className="text-blue-600 hover:underline">← Back to Generator</Link>
          </div>
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Helpful Links for Generated Assets</h1>
            <p className="mt-2 text-sm text-gray-600">External services for editing, animating, adding audio, and exploring creative ideas with generated media.</p>
          </div>

          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {links.map((item) => (
              <li key={item.url} className="group">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-full p-4 rounded-lg border bg-white shadow-sm hover:shadow transition-shadow"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-gray-900 group-hover:underline">{item.name}</span>
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M7 17L17 7" />
                      <path d="M7 7h10v10" />
                    </svg>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 break-all">{item.url}</div>
                </a>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-xs text-gray-500">All links point to third-party sites. Review each service's terms and policies before use.</p>
        </div>
      </div>
    </div>
  )
}
