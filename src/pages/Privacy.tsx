import LegalPageLayout from '../components/LegalPageLayout'
import { useLanguage } from '../contexts/LanguageContext'
import { PRIVACY_COPY } from '../content/legalPages'

export default function PrivacyPage() {
  const { language } = useLanguage()
  return <LegalPageLayout content={PRIVACY_COPY[language]} />
}
