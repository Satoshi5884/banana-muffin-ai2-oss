import { Link } from 'react-router-dom'
import AuthButton from '../components/AuthButton'
import LanguageToggle from '../components/LanguageToggle'
import { useLanguage } from '../contexts/LanguageContext'
import type { Language } from '../contexts/LanguageContext'

interface FeatureCopy {
  title: string
  desc: string
}

interface StepCopy {
  label: string
  title: string
  desc: string
}

interface LandingCopy {
  headerOpenApp: string
  hero: {
    heading: string
    description: string
    ctaPrimary: string
    ctaSecondary: string
    subtext: string
  }
  features: FeatureCopy[]
  howItWorks: {
    heading: string
    steps: StepCopy[]
    note: string
  }
  cta: {
    heading: string
    description: string
    primary: string
  }
  openSource: {
    heading: string
    description: string
    adminCard: {
      title: string
      bullets: string[]
      cta: string
    }
    selfHostCard: {
      title: string
      bullets: string[]
      cta: string
    }
  }
  community: {
    heading: string
    description: string
    actions: {
      type: 'external' | 'internal'
      label: string
      href?: string
      to?: string
    }[]
  }
}

const LANDING_COPY: Record<Language, LandingCopy> = {
  en: {
    headerOpenApp: 'Open the App',
    hero: {
      heading: 'Generate AI Images with nano-banana & Seedream - OSS Version',
      description:
        'Banana-muffin AI OSS combines Google Gemini 2.5 Flash Image Preview (nano-banana) with fal.ai Seedream v4 Edit / Text-to-Image. This open source version provides both prompt-only generation and advanced image editing capabilities with administrator-controlled access.',
      ctaPrimary: 'Get Started (Request Access)',
      ctaSecondary: 'View Features',
      subtext: 'Easy Google Account login. Open source with administrator approval required.',
    },
    features: [
      {
        title: 'Fast Generation',
        desc: 'Utilizing Gemini 2.5 Flash Image Preview for batch generation of up to 4 candidates. Quick comparison and selection.',
      },
      {
        title: 'Input Image Compositing/Conversion',
        desc: 'Drag & drop to add images. Advanced image editing with Gemini plus Seedream v4 Edit capabilities.',
      },
      {
        title: 'High-Quality Text-to-Image',
        desc: 'Seedream v4 Text-to-Image generates high-quality candidates quickly from text instructions alone.',
      },
      {
        title: 'History and Storage',
        desc: 'Automatic prompt history saving. Cloud storage and gallery viewing available for approved users.',
      },
      {
        title: 'User-Friendly Interface',
        desc: 'Simple and intuitive operation. Designed with accessibility in mind.',
      },
      {
        title: 'Download/Share',
        desc: 'Generated images can be saved as PNG. ZIP batch saving also supported.',
      },
      {
        title: 'Open Source',
        desc: 'Fully open source project. Self-hostable with administrator approval workflow.',
      },
      {
        title: 'Administrator Control',
        desc: 'Built-in user approval system. Administrators control access to generation features.',
      },
      {
        title: 'Privacy Focused',
        desc: 'Self-hosted deployment options. Your data stays under your control.',
      },
      {
        title: 'Secure Authentication',
        desc: 'Sign in with Google—no password management or additional accounts required.',
      },
    ],
    howItWorks: {
      heading: 'How to Get Started',
      steps: [
        {
          label: 'Step 1',
          title: 'Sign in with Google',
          desc: 'Use the sign-in button in the upper-right corner to authenticate.',
        },
        {
          label: 'Step 2',
          title: 'Craft Your Prompt',
          desc: 'Add optional reference images and provide clear instructions.',
        },
        {
          label: 'Step 3',
          title: 'Review & Save Results',
          desc: 'Download or store your favorite outputs in just a click.',
        },
      ],
      note: 'Note: Depending on provider rate limits, you may need to wait briefly between generations.',
    },
    cta: {
      heading: 'Try Banana-muffin AI Today',
      description: 'Start for free and scale with administrator-managed upgrades.',
      primary: 'Launch the Generator',
    },
    openSource: {
      heading: 'Open Source Project',
      description: 'Self-hosted AI image generation with administrator-controlled access.',
      adminCard: {
        title: 'Administrator Approval Required',
        bullets: [
          '• New users require administrator approval',
          '• Request access through Google Account login',
          '• Approval status visible in user interface',
          '• Administrators control feature access',
        ],
        cta: 'Request Access',
      },
      selfHostCard: {
        title: 'Self-Hosted Deployment',
        bullets: [
          '• Deploy on your own infrastructure',
          '• Full control over user data and access',
          '• Configure your own AI API keys',
          '• Customize approval workflows',
        ],
        cta: 'View on GitHub',
      },
    },
    community: {
      heading: 'Join the Community',
      description: 'Contribute to the development of open source AI image generation tools',
      actions: [
        {
          type: 'external',
          label: 'Report Issues',
          href: 'https://github.com/Satoshi5884/banana-muffin-ai2-oss/issues',
        },
        {
          type: 'external',
          label: 'Contribute',
          href: 'https://github.com/Satoshi5884/banana-muffin-ai2-oss/blob/main/CONTRIBUTING.md',
        },
        {
          type: 'internal',
          label: 'Legal Information',
          to: '/commerce',
        },
      ],
    },
  },
  ja: {
    headerOpenApp: 'アプリを開く',
    hero: {
      heading: 'nano-bananaとSeedreamでAI画像生成 ― OSS版',
      description:
        'Banana-muffin AI OSS は Google Gemini 2.5 Flash Image Preview (nano-banana) と fal.ai Seedream v4 Edit / Text-to-Image を組み合わせ、プロンプトのみの生成と高度な画像編集を管理者承認付きで提供します。',
      ctaPrimary: 'アクセスをリクエストして始める',
      ctaSecondary: '機能を見る',
      subtext: 'Googleアカウントで簡単ログイン。管理者承認が必要なオープンソースアプリです。',
    },
    features: [
      {
        title: '高速生成',
        desc: 'Gemini 2.5 Flash Image Preview により最大4候補を一括生成。素早く比較・選択できます。',
      },
      {
        title: '画像合成・変換',
        desc: 'ドラッグ＆ドロップで画像を追加し、GeminiとSeedream v4 Editで高度な編集が可能。',
      },
      {
        title: '高品質テキスト生成',
        desc: 'Seedream v4 Text-to-Image がテキスト指示だけで高品質な候補を高速生成します。',
      },
      {
        title: '履歴とストレージ',
        desc: 'プロンプト履歴を自動保存。承認ユーザー向けにクラウド保存とギャラリー閲覧を提供します。',
      },
      {
        title: '使いやすいUI',
        desc: 'シンプルで直感的な操作感。アクセシビリティにも配慮しています。',
      },
      {
        title: 'ダウンロード/共有',
        desc: '生成画像はPNGで保存可能。ZIPでの一括ダウンロードにも対応。',
      },
      {
        title: 'オープンソース',
        desc: '完全にオープンソースのプロジェクト。管理者承認ワークフロー付きでセルフホストできます。',
      },
      {
        title: '管理者コントロール',
        desc: '承認システムを標準搭載。管理者が生成機能へのアクセスを制御できます。',
      },
      {
        title: 'プライバシー重視',
        desc: 'セルフホストでの運用に対応。データを自分たちで管理できます。',
      },
      {
        title: '安全な認証',
        desc: 'Googleでログインできるため、追加のパスワード管理は不要です。',
      },
    ],
    howItWorks: {
      heading: '使い方',
      steps: [
        {
          label: 'ステップ1',
          title: 'Googleでサインイン',
          desc: '右上のサインインボタンから認証します。',
        },
        {
          label: 'ステップ2',
          title: 'プロンプトを作成',
          desc: '必要に応じて参照画像を追加し、指示を入力します。',
        },
        {
          label: 'ステップ3',
          title: '結果を確認・保存',
          desc: '気に入った結果をワンクリックでダウンロードまたは保存できます。',
        },
      ],
      note: '※ プロバイダのレート制限によっては生成の間に待機時間が発生する場合があります。',
    },
    cta: {
      heading: 'Banana-muffin AI を体験',
      description: 'まずは無料で始め、必要に応じて管理者がアップグレードを管理します。',
      primary: 'ジェネレーターを起動',
    },
    openSource: {
      heading: 'オープンソースプロジェクト',
      description: '管理者制御のセルフホストAI画像生成を実現します。',
      adminCard: {
        title: '管理者承認が必要',
        bullets: [
          '• 新規ユーザーは管理者の承認が必要',
          '• Googleログインからアクセスを申請',
          '• 承認状況はUI上で確認可能',
          '• 管理者が機能アクセスを制御',
        ],
        cta: 'アクセスをリクエスト',
      },
      selfHostCard: {
        title: 'セルフホスト配備',
        bullets: [
          '• 自身のインフラにデプロイ可能',
          '• ユーザーデータとアクセスを自分で管理',
          '• 独自のAI APIキーを設定',
          '• 承認ワークフローをカスタマイズ',
        ],
        cta: 'GitHubで見る',
      },
    },
    community: {
      heading: 'コミュニティに参加',
      description: 'オープンソースのAI画像生成ツール開発に参加しましょう',
      actions: [
        {
          type: 'external',
          label: 'Issueを報告',
          href: 'https://github.com/Satoshi5884/banana-muffin-ai2-oss/issues',
        },
        {
          type: 'external',
          label: 'コントリビュート',
          href: 'https://github.com/Satoshi5884/banana-muffin-ai2-oss/blob/main/CONTRIBUTING.md',
        },
        {
          type: 'internal',
          label: '法令情報',
          to: '/commerce',
        },
      ],
    },
  },
}

export default function LandingPage() {
  const { language } = useLanguage()
  const copy = LANDING_COPY[language]

  return (
    <div className="bg-white text-gray-900">
      <header className="border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg font-bold">Banana-muffin AI OSS</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageToggle size="sm" />
            <Link
              to="/app"
              className="hidden sm:inline-block px-3 py-1.5 text-sm rounded-md bg-gray-900 text-white hover:bg-black"
            >
              {copy.headerOpenApp}
            </Link>
            <AuthButton />
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 py-16 sm:py-24">
            <div className="max-w-2xl">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">{copy.hero.heading}</h1>
              <p className="mt-5 text-lg text-gray-600">{copy.hero.description}</p>
              <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Link
                  to="/app"
                  className="px-5 py-3 rounded-lg bg-gray-900 text-white hover:bg-black font-medium"
                >
                  {copy.hero.ctaPrimary}
                </Link>
                <a
                  href="#features"
                  className="px-5 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                >
                  {copy.hero.ctaSecondary}
                </a>
              </div>
              <p className="mt-3 text-sm text-gray-500">{copy.hero.subtext}</p>
            </div>
          </div>
        </section>

        <section id="features" className="py-16 sm:py-24 bg-gray-50 border-t border-b">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {copy.features.map(feature => (
                <FeatureCard key={feature.title} title={feature.title} desc={feature.desc} />
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold">{copy.howItWorks.heading}</h2>
            <ol className="mt-6 grid sm:grid-cols-3 gap-6 text-gray-700">
              {copy.howItWorks.steps.map(step => (
                <li key={step.label} className="p-5 rounded-lg border bg-white">
                  <div className="text-sm font-semibold text-gray-500">{step.label}</div>
                  <div className="mt-1 font-semibold">{step.title}</div>
                  <p className="mt-2 text-sm text-gray-600">{step.desc}</p>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-sm text-gray-500">{copy.howItWorks.note}</p>
          </div>
        </section>

        <section className="py-16 sm:py-24 bg-gray-50 border-t">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold">{copy.cta.heading}</h2>
            <p className="mt-3 text-gray-600">{copy.cta.description}</p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link
                to="/app"
                className="px-5 py-3 rounded-lg bg-gray-900 text-white hover:bg-black font-medium"
              >
                {copy.cta.primary}
              </Link>
              <AuthButton />
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center">{copy.openSource.heading}</h2>
            <p className="mt-3 text-gray-600 text-center">{copy.openSource.description}</p>
            <div className="mt-10 grid sm:grid-cols-2 gap-8">
              <div className="p-6 rounded-xl border bg-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold">{copy.openSource.adminCard.title}</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  {copy.openSource.adminCard.bullets.map(bullet => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Link
                    to="/app"
                    className="inline-block w-full text-center px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
                  >
                    {copy.openSource.adminCard.cta}
                  </Link>
                </div>
              </div>

              <div className="p-6 rounded-xl border bg-white shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold">{copy.openSource.selfHostCard.title}</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  {copy.openSource.selfHostCard.bullets.map(bullet => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
                <div className="mt-6">
                  <a
                    href="https://github.com/Satoshi5884/banana-muffin-ai2-oss"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block w-full text-center px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
                  >
                    {copy.openSource.selfHostCard.cta}
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <h3 className="text-xl font-semibold mb-4">{copy.community.heading}</h3>
              <p className="text-gray-600 mb-6">{copy.community.description}</p>
              <div className="flex flex-wrap justify-center gap-4">
                {copy.community.actions.map(action =>
                  action.type === 'external' ? (
                    <a
                      key={action.label}
                      href={action.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      {action.label}
                    </a>
                  ) : (
                    <Link
                      key={action.label}
                      to={action.to ?? '#'}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      {action.label}
                    </Link>
                  ),
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function FeatureCard({ title, desc }: FeatureCopy) {
  return (
    <div className="p-6 rounded-xl border bg-white shadow-sm hover:shadow transition-shadow">
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{desc}</p>
    </div>
  )
}
