import { useLanguage } from '../contexts/LanguageContext'
import type { Language } from '../contexts/LanguageContext'

interface LanguageToggleProps {
  className?: string
  size?: 'sm' | 'md'
}

export default function LanguageToggle({ className = '', size = 'md' }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage()

  const buttonBase =
    'px-3 py-1 rounded transition-colors focus:outline-none focus-visible:ring focus-visible:ring-offset-1 focus-visible:ring-gray-400'
  const activeClasses = 'bg-white shadow border border-gray-200 text-gray-900'
  const inactiveClasses = 'text-gray-600 hover:text-gray-800'
  const containerPadding = size === 'sm' ? 'p-0.5 text-xs' : 'p-1 text-sm'
  const buttonPadding = size === 'sm' ? 'px-2 py-1' : ''

  const handleSetLanguage = (next: Language) => {
    if (next !== language) {
      setLanguage(next)
    }
  }

  return (
    <div className={`inline-flex rounded-md border border-gray-200 bg-gray-100 ${containerPadding} ${className}`.trim()}>
      <button
        type="button"
        onClick={() => handleSetLanguage('en')}
        className={`${buttonBase} ${buttonPadding} ${language === 'en' ? activeClasses : inactiveClasses}`}
        aria-pressed={language === 'en'}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => handleSetLanguage('ja')}
        className={`${buttonBase} ${buttonPadding} ${language === 'ja' ? activeClasses : inactiveClasses}`}
        aria-pressed={language === 'ja'}
      >
        日本語
      </button>
    </div>
  )
}
