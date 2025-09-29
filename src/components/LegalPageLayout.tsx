import { Link } from 'react-router-dom'
import LanguageToggle from './LanguageToggle'
import type { LegalPageCopy } from '../content/legalPages'

interface LegalPageLayoutProps {
  content: LegalPageCopy
}

export default function LegalPageLayout({ content }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="text-blue-600 hover:underline">
              {content.backLabel}
            </Link>
            <LanguageToggle size="sm" />
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{content.title}</h1>
            <p className="text-sm text-gray-500">{content.lastUpdatedLabel}</p>
          </div>

          <div className="prose max-w-none text-gray-800">
            {content.intro ? <p>{content.intro}</p> : null}
            {content.sections.map(section => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                {section.body.map((paragraph, index) => (
                  <p key={`${section.heading}-${index}`}>{paragraph}</p>
                ))}
              </section>
            ))}
            <section>
              <h2>{content.contact.heading}</h2>
              <p>{content.contact.label}</p>
              <a
                href={content.contact.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:underline"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 3h7m0 0v7m0-7L10 14" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5v14h14" />
                </svg>
                {content.contact.cta}
              </a>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
