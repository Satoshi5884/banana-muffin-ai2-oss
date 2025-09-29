import LegalPageLayout from '../components/LegalPageLayout'
import { useLanguage } from '../contexts/LanguageContext'
import { COMMERCE_COPY } from '../content/legalPages'

export default function CommercePage() {
  const { language } = useLanguage()
  return <LegalPageLayout content={COMMERCE_COPY[language]} />
}
