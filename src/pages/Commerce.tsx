import { useState } from 'react'
import { Link } from 'react-router-dom'

type Language = 'en' | 'ja'

const LAST_UPDATED = '2025-02-15'
const PROJECT_REPO = 'https://github.com/your-repo/banana-muffin-ai-oss'

const COMMERCE_CONTENT: Record<Language, {
  title: string
  lastUpdatedLabel: string
  sections: Array<{ heading: string; body: string[] }>
  contactHeading: string
  contactLabel: string
  contactCta: string
}> = {
  en: {
    title: 'Legal Information',
    lastUpdatedLabel: `Last updated: ${LAST_UPDATED}`,
    sections: [
      {
        heading: 'Project Overview',
        body: [
          'Project name: Banana-muffin AI OSS',
          'Project type: open source software for AI image, video, and 3D generation.',
          'Maintainers: volunteer OSS contributors; no single legal entity is represented.',
        ],
      },
      {
        heading: 'Contact and Support',
        body: [
          'Primary contact: GitHub Issues in the project repository.',
          'All technical support, feature requests, or legal concerns should be raised through the repository.',
        ],
      },
      {
        heading: 'Service Description',
        body: [
          'The project offers administrator-controlled access to AI generation workflows for self-hosted deployments.',
          'Distributions are provided “as is” without commercial guarantees.',
        ],
      },
      {
        heading: 'Usage Conditions',
        body: [
          'Administrator approval is required before production features (image/video/3D generation) become available.',
          'Free plans may have zero credits or reduced storage capacity.',
          'Hosting organizations are responsible for compliance with applicable laws, model provider terms, and data protection requirements.',
        ],
      },
      {
        heading: 'Technical Requirements',
        body: [
          'Recommended browsers: latest versions of Chrome, Edge, Safari, or Firefox.',
          'External AI providers (e.g., Google Gemini, fal.ai) require valid API keys managed by the host organization.',
        ],
      },
      {
        heading: 'Data & Privacy',
        body: [
          'User accounts, stored assets, and logs are managed by the hosting administrator, following the published Privacy Policy.',
          'Users may request removal of their stored assets through the project issue tracker.',
        ],
      },
      {
        heading: 'Open Source Notices',
        body: [
          'Source code, licensing terms, and contributor guidelines are available in the public repository.',
          'License: GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).',
          `Repository URL: ${PROJECT_REPO}`,
        ],
      },
    ],
    contactHeading: 'Contact',
    contactLabel: 'For legal notices or required disclosures, please use the GitHub Issues tracker.',
    contactCta: 'Open Repository',
  },
  ja: {
    title: '法令情報',
    lastUpdatedLabel: `最終更新日: ${LAST_UPDATED}`,
    sections: [
      {
        heading: 'プロジェクト概要',
        body: [
          'プロジェクト名: Banana-muffin AI OSS',
          '区分: AI画像・動画・3D生成を扱うオープンソースソフトウェア。',
          'メンテナ: ボランティアのOSSコントリビュータ（特定の法人を代表するものではありません）。',
        ],
      },
      {
        heading: '連絡先・サポート',
        body: [
          '基本的な連絡手段: GitHubリポジトリのIssue。',
          '技術サポート、機能要望、法的懸念はリポジトリを通じてお知らせください。',
        ],
      },
      {
        heading: 'サービス内容',
        body: [
          '管理者承認を前提に、セルフホスト環境でAI生成ワークフローを利用できるようにするプロジェクトです。',
          '本ソフトウェアは現状有姿で提供され、商用保証はありません。',
        ],
      },
      {
        heading: '利用条件',
        body: [
          '画像・動画・3D生成などの本番機能を利用するには管理者の承認が必要です。',
          '無料プランではクレジットが0または保存容量が制限されることがあります。',
          'ホスティングする組織は、関連法規やモデル提供者の利用規約、データ保護要件の遵守に責任を負います。',
        ],
      },
      {
        heading: '技術要件',
        body: [
          '推奨ブラウザ: Chrome / Edge / Safari / Firefox の最新版。',
          'Google Geminiやfal.aiなど外部AIプロバイダを利用する場合、ホスト側で有効なAPIキーを管理する必要があります。',
        ],
      },
      {
        heading: 'データ・プライバシー',
        body: [
          'ユーザーアカウントや保存データ、ログは公開中のプライバシーポリシーに従い管理者が管理します。',
          '保存データの削除を希望する場合はGitHub Issueでリクエストしてください。',
        ],
      },
      {
        heading: 'オープンソース表記',
        body: [
          'ソースコード、ライセンス、コントリビューションガイドラインは公開リポジトリで確認できます。',
          'ライセンス: GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later)。',
          `リポジトリURL: ${PROJECT_REPO}`,
        ],
      },
    ],
    contactHeading: '連絡先',
    contactLabel: '法的な通知や情報開示が必要な場合はGitHub Issueをご利用ください。',
    contactCta: 'リポジトリを開く',
  },
}

export default function CommercePage() {
  const [language, setLanguage] = useState<Language>('en')
  const t = COMMERCE_CONTENT[language]
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
                href={PROJECT_REPO}
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
