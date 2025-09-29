import LegalPageLayout from '../components/LegalPageLayout'
import { useLanguage } from '../contexts/LanguageContext'
import { TERMS_COPY } from '../content/legalPages'

export default function TermsPage() {
  const { language } = useLanguage()
  return <LegalPageLayout content={TERMS_COPY[language]} />
}
