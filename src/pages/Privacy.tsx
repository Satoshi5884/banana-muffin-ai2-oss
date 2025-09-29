import { useState } from 'react'
import { Link } from 'react-router-dom'

type Language = 'en' | 'ja'

const LAST_UPDATED = '2025-02-15'
const CONTACT_URL = 'https://github.com/your-repo/banana-muffin-ai-oss/issues'

const PRIVACY_CONTENT: Record<Language, {
  title: string
  lastUpdatedLabel: string
  intro: string
  sections: Array<{ heading: string; body: string[] }>
  contactHeading: string
  contactLabel: string
  contactCta: string
}> = {
  en: {
    title: 'Privacy Policy',
    lastUpdatedLabel: `Last updated: ${LAST_UPDATED}`,
    intro:
      'This Privacy Policy explains how the Banana-muffin AI OSS maintainers (“we”, “us”) collect, use, and protect information when you interact with the open-source Service.',
    sections: [
      {
        heading: '1. Information We Collect',
        body: [
          'Authentication data: user identifiers, email address, and display name received from Google Sign-In.',
          'Usage data: prompt history, generation counts, moderation decisions, and related metadata.',
          'Stored assets: images, videos, or 3D files you explicitly save to project storage.',
          'Technical data: access logs, device/browser information, and identifiers derived from cookies or local storage.',
        ],
      },
      {
        heading: '2. How We Use the Data',
        body: [
          'Operate, maintain, and improve the Service.',
          'Authenticate users and enforce rate limits or quotas.',
          'Detect, investigate, and prevent abuse or security incidents.',
          'Respond to support requests submitted through the repository.',
          'Generate aggregated statistics that do not identify individuals.',
        ],
      },
      {
        heading: '3. Sharing with Third Parties',
        body: [
          'Personal data is not shared with third parties except when required by law, with your consent, or to protect the Service and its users.',
        ],
      },
      {
        heading: '4. External Services',
        body: [
          'We rely on Google Cloud services such as Firebase Authentication, Firestore, and Cloud Storage, as well as Google Gemini or other AI providers. Review their policies at https://policies.google.com/privacy.',
        ],
      },
      {
        heading: '5. Data Retention',
        body: [
          'Data is retained only for as long as necessary to fulfill the purposes described above or to comply with legal obligations.',
          'When you delete stored assets, we remove associated data within a reasonable timeframe.',
        ],
      },
      {
        heading: '6. Security Measures',
        body: [
          'We implement role-based access controls, encryption in transit, and activity logging to help safeguard data.',
          'Despite safeguards, no method of storage or transmission is completely secure. Use the Service with awareness of related risks.',
        ],
      },
      {
        heading: '7. Your Rights',
        body: [
          'You may request access, correction, or deletion of personal data stored within the project by opening an issue or contacting the maintainers.',
        ],
      },
      {
        heading: '8. Cookies and Local Storage',
        body: [
          'Cookies and browser storage are used to maintain sessions and improve usability. You can disable them in your browser, but certain features may stop working.',
        ],
      },
      {
        heading: '9. Policy Updates',
        body: [
          'We may update this Privacy Policy. Changes take effect when published in the repository or the application UI.',
        ],
      },
    ],
    contactHeading: 'Contact',
    contactLabel: 'For privacy questions, open an issue on GitHub and the maintainers will respond.',
    contactCta: 'Open Issues Page',
  },
  ja: {
    title: 'プライバシーポリシー',
    lastUpdatedLabel: `最終更新日: ${LAST_UPDATED}`,
    intro:
      '本プライバシーポリシーは、OSSメンテナ（以下「当方」）がオープンソース版「Banana-muffin AI」（以下「本サービス」）において取得・利用する情報とその保護方針を説明するものです。',
    sections: [
      {
        heading: '1. 取得する情報',
        body: [
          '認証情報: Googleログインから取得するユーザーID、メールアドレス、表示名など。',
          '利用情報: プロンプト履歴、生成回数、モデレーション記録などのメタデータ。',
          '保存データ: ユーザーが明示的にクラウドへ保存する画像・動画・3Dファイル。',
          '技術情報: アクセスログ、デバイス/ブラウザ情報、Cookieやローカルストレージに由来する識別子。',
        ],
      },
      {
        heading: '2. 利用目的',
        body: [
          '本サービスの提供・維持・改善のため。',
          'ユーザー認証およびレート制限やクォータの管理のため。',
          '不正利用やセキュリティインシデントの検知・防止のため。',
          'リポジトリを通じたお問い合わせへの対応のため。',
          '個人を特定しない統計情報を作成し、サービス改善に役立てるため。',
        ],
      },
      {
        heading: '3. 第三者提供',
        body: [
          '法令に基づく場合、本人の同意がある場合、本サービスやユーザーを保護する必要がある場合を除き、個人情報を第三者へ提供しません。',
        ],
      },
      {
        heading: '4. 外部サービスの利用',
        body: [
          'Firebase Authentication、Firestore、Cloud StorageなどのGoogleクラウドサービス、およびGoogle Gemini等のAIプロバイダを利用します。各社のポリシー (https://policies.google.com/privacy) をご確認ください。',
        ],
      },
      {
        heading: '5. データの保存期間',
        body: [
          '上記目的の達成に必要な期間、または法令で義務付けられる期間のみデータを保持します。',
          'ユーザーが保存データを削除した場合、合理的な範囲で速やかに関連データを削除します。',
        ],
      },
      {
        heading: '6. セキュリティ対策',
        body: [
          'アクセス権限管理、通信暗号化、操作ログ記録などを通じてデータ保護に努めます。',
          'ただし、あらゆる手段が完全に安全であるとは限りません。リスクを理解した上で本サービスをご利用ください。',
        ],
      },
      {
        heading: '7. ユーザーの権利',
        body: [
          '保存されている個人データの開示・訂正・削除等を希望する場合は、GitHub Issue等を通じてご連絡ください。',
        ],
      },
      {
        heading: '8. Cookie等の利用',
        body: [
          'セッション維持や利便性向上のためCookieやローカルストレージを利用します。ブラウザ設定で無効化できますが、一部機能が利用できなくなる場合があります。',
        ],
      },
      {
        heading: '9. ポリシーの改定',
        body: [
          '必要に応じて本ポリシーを改定することがあります。改定内容はリポジトリまたはアプリ内で公表した時点で効力を生じます。',
        ],
      },
    ],
    contactHeading: 'お問い合わせ',
    contactLabel: 'プライバシーに関するご質問はGitHubのIssueでご連絡ください。',
    contactCta: 'Issueページを開く',
  },
}

export default function PrivacyPage() {
  const [language, setLanguage] = useState<Language>('en')
  const t = PRIVACY_CONTENT[language]
  const backLabel = language === 'ja' ? '← ランディングページへ戻る' : '← Back to Landing'

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="text-blue-600 hover:underline">{backLabel}</Link>
            <div className="inline-flex rounded-md border border-gray-200 bg-gray-100 p-1 text-sm">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded ${language === 'en' ? 'bg-white shadow border border-gray-200' : 'text-gray-600'}`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('ja')}
                className={`px-3 py-1 rounded ${language === 'ja' ? 'bg-white shadow border border-gray-200' : 'text-gray-600'}`}
              >
                日本語
              </button>
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
            <p className="text-sm text-gray-500">{t.lastUpdatedLabel}</p>
          </div>

          <div className="prose max-w-none text-gray-800">
            <p>{t.intro}</p>
            {t.sections.map(section => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                {section.body.map(paragraph => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ))}
            <section>
              <h2>{t.contactHeading}</h2>
              <p>{t.contactLabel}</p>
              <a
                href={CONTACT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:underline"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 3h7m0 0v7m0-7L10 14" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5v14h14" />
                </svg>
                {t.contactCta}
              </a>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
