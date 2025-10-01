import { Link } from 'react-router-dom'
import LanguageToggle from '../components/LanguageToggle'
import { useLanguage } from '../contexts/LanguageContext'
import type { Language } from '../contexts/LanguageContext'

const HELP_COPY: Record<Language, {
  backLabel: string
  title: string
  subtitle: string
  videoSectionTitle: string
  videoDescription: string
  githubSectionTitle: string
  githubDescription: string
  githubLinkText: string
  guideTitle: string
  steps: {
    title: string
    description: string
  }[]
}> = {
  en: {
    backLabel: '← Back to Generator',
    title: 'Help & User Guide',
    subtitle: 'Learn how to use Banana-muffin AI for image, video, and 3D model generation.',
    videoSectionTitle: '📺 Video Tutorial',
    videoDescription: 'Watch our comprehensive tutorial to get started quickly:',
    githubSectionTitle: '📦 GitHub Repository',
    githubDescription: 'This is an open-source project. View the source code, report issues, or contribute:',
    githubLinkText: 'View on GitHub',
    guideTitle: '📖 Quick Start Guide',
    steps: [
      {
        title: '1. Sign In',
        description: 'Click the "Sign in with Google" button to authenticate. New users will be placed in pending status until approved by an administrator.'
      },
      {
        title: '2. Wait for Approval',
        description: 'Free plan users need administrator approval before using generation features. Pro and Admin users have immediate access.'
      },
      {
        title: '3. Choose Generation Mode',
        description: 'Select from Image Generation, Image→Video, Image→3D, or Markdown Notes modes depending on what you want to create.'
      },
      {
        title: '4. Configure Settings',
        description: 'Choose your AI provider, adjust parameters like aspect ratio, candidate count, and other options based on your needs.'
      },
      {
        title: '5. Enter Prompt',
        description: 'Write a detailed description of what you want to generate. For image editing modes, upload your base image as well.'
      },
      {
        title: '6. Generate & Save',
        description: 'Click Generate and wait for results. You can save your favorite outputs to cloud storage (Pro/Admin only).'
      },
      {
        title: '7. Manage Content',
        description: 'Access your saved images, videos, and 3D models from the gallery. Download them individually or in bulk as ZIP files.'
      },
      {
        title: '8. Monitor Usage',
        description: 'Check your daily and monthly quotas in the usage panel. Pro users have limited credits that reset monthly.'
      }
    ]
  },
  ja: {
    backLabel: '← ジェネレーターに戻る',
    title: 'ヘルプ＆使い方ガイド',
    subtitle: 'Banana-muffin AI で画像、動画、3Dモデルを生成する方法を学びましょう。',
    videoSectionTitle: '📺 チュートリアル動画',
    videoDescription: '包括的なチュートリアル動画で素早く始められます：',
    githubSectionTitle: '📦 GitHubリポジトリ',
    githubDescription: 'これはオープンソースプロジェクトです。ソースコードの閲覧、問題報告、貢献が可能です：',
    githubLinkText: 'GitHubで見る',
    guideTitle: '📖 クイックスタートガイド',
    steps: [
      {
        title: '1. サインイン',
        description: '「Googleでサインイン」ボタンをクリックして認証します。新規ユーザーは管理者の承認待ちステータスになります。'
      },
      {
        title: '2. 承認を待つ',
        description: 'Freeプランのユーザーは、生成機能を使用する前に管理者の承認が必要です。ProおよびAdminユーザーはすぐにアクセスできます。'
      },
      {
        title: '3. 生成モードを選択',
        description: '作成したいものに応じて、画像生成、画像→動画、画像→3D、Markdownノートのモードから選択します。'
      },
      {
        title: '4. 設定を構成',
        description: 'AIプロバイダーを選択し、アスペクト比、候補数、その他のオプションをニーズに応じて調整します。'
      },
      {
        title: '5. プロンプトを入力',
        description: '生成したいものの詳細な説明を書きます。画像編集モードの場合は、ベース画像もアップロードします。'
      },
      {
        title: '6. 生成して保存',
        description: '「生成」をクリックして結果を待ちます。お気に入りの出力をクラウドストレージに保存できます（Pro/Adminのみ）。'
      },
      {
        title: '7. コンテンツを管理',
        description: 'ギャラリーから保存した画像、動画、3Dモデルにアクセスします。個別にダウンロードするか、ZIPファイルで一括ダウンロードできます。'
      },
      {
        title: '8. 使用状況を監視',
        description: '使用状況パネルで日次および月次のクォータを確認します。Proユーザーには毎月リセットされる限定クレジットがあります。'
      }
    ]
  }
}

export default function HelpPage() {
  const { language } = useLanguage()
  const copy = HELP_COPY[language]

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

          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{copy.title}</h1>
            <p className="mt-2 text-sm text-gray-600">{copy.subtitle}</p>
          </div>

          {/* Video Tutorial Section */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-3">{copy.videoSectionTitle}</h2>
            <p className="text-sm text-gray-600 mb-4">{copy.videoDescription}</p>
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded-lg shadow"
                src="https://www.youtube.com/embed/TZWajTzyGlk"
                title="Banana-muffin AI Tutorial"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </section>

          {/* GitHub Repository Section */}
          <section className="mb-8 p-4 bg-gray-50 rounded-lg border">
            <h2 className="text-xl font-bold text-gray-900 mb-3">{copy.githubSectionTitle}</h2>
            <p className="text-sm text-gray-600 mb-3">{copy.githubDescription}</p>
            <a
              href="https://github.com/Satoshi5884/banana-muffin-ai2-oss"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              {copy.githubLinkText}
            </a>
          </section>

          {/* Quick Start Guide */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">{copy.guideTitle}</h2>
            <div className="space-y-4">
              {copy.steps.map((step, index) => (
                <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-700">{step.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
