import { Link } from 'react-router-dom'
import LanguageToggle from './LanguageToggle'
import { useLanguage } from '../contexts/LanguageContext'
import type { Language } from '../contexts/LanguageContext'

const FOOTER_COPY: Record<Language, {
  licenseLabel: string
  githubLabel: string
  helpfulLinksLabel: string
  termsLabel: string
  privacyLabel: string
  commerceLabel: string
}> = {
  en: {
    licenseLabel: 'MIT License',
    githubLabel: 'GitHub',
    helpfulLinksLabel: 'Helpful Links',
    termsLabel: 'Terms of Use',
    privacyLabel: 'Privacy Policy',
    commerceLabel: 'Legal Information',
  },
  ja: {
    licenseLabel: 'MIT ライセンス',
    githubLabel: 'GitHub',
    helpfulLinksLabel: '関連リンク',
    termsLabel: '利用規約',
    privacyLabel: 'プライバシーポリシー',
    commerceLabel: '法令情報',
  },
}

export default function Footer() {
  const { language } = useLanguage()
  const copy = FOOTER_COPY[language]

  return (
    <footer className="border-t bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3">
            <Link to="/" className="font-semibold text-gray-800 hover:text-gray-900">
              Banana-muffin AI OSS
            </Link>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500">© {new Date().getFullYear()}</span>
            <span className="text-gray-400">•</span>
            <a
              href="https://github.com/Satoshi5884/banana-muffin-ai2-oss/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900"
            >
              {copy.licenseLabel}
            </a>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-4">
            <LanguageToggle size="sm" />
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/Satoshi5884/banana-muffin-ai2-oss"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-900"
              >
                {copy.githubLabel}
              </a>
              <span className="hidden sm:inline text-gray-300">|</span>
              <Link to="/links" className="hover:text-gray-900">
                {copy.helpfulLinksLabel}
              </Link>
              <span className="hidden sm:inline text-gray-300">|</span>
              <Link to="/terms" className="hover:text-gray-900">
                {copy.termsLabel}
              </Link>
              <span className="hidden sm:inline text-gray-300">|</span>
              <Link to="/privacy" className="hover:text-gray-900">
                {copy.privacyLabel}
              </Link>
              <span className="hidden sm:inline text-gray-300">|</span>
              <Link to="/commerce" className="hover:text-gray-900">
                {copy.commerceLabel}
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </footer>
  )
}
