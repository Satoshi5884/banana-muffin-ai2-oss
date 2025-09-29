import { useState } from 'react'
import { Link } from 'react-router-dom'

type Language = 'en' | 'ja'

const LAST_UPDATED = '2025-02-15'
const CONTACT_URL = 'https://github.com/your-repo/banana-muffin-ai-oss/issues'

const TERMS_CONTENT: Record<Language, {
  title: string
  lastUpdatedLabel: string
  intro: string
  sections: Array<{ heading: string; body: string[] }>
  contactHeading: string
  contactLabel: string
  contactCta: string
}> = {
  en: {
    title: 'Banana-muffin AI OSS Terms of Use',
    lastUpdatedLabel: `Last updated: ${LAST_UPDATED}`,
    intro:
      'These Terms of Use (the “Terms”) govern access to and use of the Banana-muffin AI OSS project (the “Service”) maintained by the OSS maintainers (“we”, “us”). By using the Service you agree to be bound by these Terms.',
    sections: [
      {
        heading: '1. Scope',
        body: [
          'The Terms apply to every interaction between you and the maintainers regarding the Service.',
          'Supplementary guidelines or policies may be published. When they conflict with these Terms, the supplementary provisions prevail.',
        ],
      },
      {
        heading: '2. Accounts and Access',
        body: [
          'Some features require signing in with an external identity provider such as Google.',
          'You are responsible for safeguarding your credentials and must not share or transfer your account.',
        ],
      },
      {
        heading: '3. Acceptable Use',
        body: [
          'You may not violate laws, infringe third-party rights, or interfere with the security and reliability of the Service.',
          'You may not misuse generated results for illegal, harmful, or deceptive purposes.',
          'You may not attempt to reverse engineer, overload, or disrupt external APIs integrated with the Service.',
        ],
      },
      {
        heading: '4. Generated Content',
        body: [
          'Ownership and licensing of generated outputs follow the policies of each underlying model provider. Review those policies before reusing the content.',
          'Generated results are not guaranteed to be accurate or suitable for any particular purpose. You are solely responsible for verifying legality and fitness for use.',
        ],
      },
      {
        heading: '5. Plans and Quotas',
        body: [
          'Access to image, video, or 3D generation is controlled by administrator approval and plan configuration.',
          'Free plans may have zero credits or limited storage. Administrators may adjust limits or suspend features at any time.',
        ],
      },
      {
        heading: '6. Changes and Availability',
        body: [
          'We may suspend or discontinue any part of the Service for maintenance, security, legal, or operational reasons.',
          'External APIs or infrastructure providers may change their behavior, which can impact Service availability or functionality.',
        ],
      },
      {
        heading: '7. Disclaimer of Warranties',
        body: [
          'The Service is provided “as is” without warranties of any kind, whether express or implied.',
          'We do not guarantee uninterrupted operation, freedom from defects, or fitness for a particular purpose.',
        ],
      },
      {
        heading: '8. Limitation of Liability',
        body: [
          'We are not liable for damages arising from your use of or inability to use the Service, except where liability cannot be excluded under applicable law.',
          'Where liability cannot be excluded, it is limited to the total fees (if any) paid to the maintainers during the month in which the claim arose.',
        ],
      },
      {
        heading: '9. Data Handling',
        body: [
          'Personal information and usage data are handled according to the OSS Privacy Policy.',
          'Aggregated, non-personal statistics may be used to improve the Service.',
        ],
      },
      {
        heading: '10. Updates to the Terms',
        body: [
          'We may update these Terms as needed. Changes become effective when published within the repository or application UI.',
        ],
      },
      {
        heading: '11. Governing Law and Disputes',
        body: [
          'Unless local law requires otherwise, disputes related to the Service are governed by the laws of the maintainers’ principal place of business.',
          'Disputes should first be raised through the project issue tracker. Good-faith negotiation is encouraged before legal action.',
        ],
      },
      {
        heading: '12. Open Source License',
        body: [
          'This project is released under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).',
          'Contributions upstream are accepted only if they are provided under the same license terms.',
          'The complete license text is available in the repository at LICENSE.',
        ],
      },
    ],
    contactHeading: 'Contact',
    contactLabel: 'Questions or concerns? Open an issue on GitHub.',
    contactCta: 'Open Issues Page',
  },
  ja: {
    title: 'Banana-muffin AI OSS 利用規約',
    lastUpdatedLabel: `最終更新日: ${LAST_UPDATED}`,
    intro:
      '本利用規約（以下「本規約」）は、OSSメンテナ（以下「当方」）が提供・管理する「Banana-muffin AI OSS」（以下「本サービス」）の利用条件を定めるものです。ユーザーは本サービスを利用することで本規約に同意したものとみなします。',
    sections: [
      {
        heading: '1. 適用範囲',
        body: [
          '本規約は、ユーザーと当方との間で行われる本サービスに関するすべての利用関係に適用されます。',
          '当方は必要に応じてガイドライン等を定めることがあります。これらが本規約と矛盾する場合、ガイドライン等が優先します。',
        ],
      },
      {
        heading: '2. アカウントと利用資格',
        body: [
          '一部機能の利用にはGoogleなどの外部認証によるログインが必要です。',
          'ユーザーは認証情報を自己の責任で管理し、第三者と共有・譲渡してはいけません。',
        ],
      },
      {
        heading: '3. 禁止事項',
        body: [
          '法令違反、公序良俗違反、第三者の権利侵害となる行為を禁止します。',
          '本サービスや外部APIのセキュリティ・安定性を損なう行為、過度な負荷を与える行為を禁止します。',
          '生成物を違法・有害な目的で利用することを禁止します。',
        ],
      },
      {
        heading: '4. 生成コンテンツの取扱い',
        body: [
          '生成物の権利関係は利用する各モデル提供者のポリシーに従います。事前に必ず確認してください。',
          '生成結果の正確性・適法性は保証されません。利用に際してはユーザーの責任で内容を確認してください。',
        ],
      },
      {
        heading: '5. プランとクォータ',
        body: [
          '画像・動画・3D生成機能の利用可否は管理者の承認やプラン設定によって制御されます。',
          '無料プランではクレジットや保存容量が制限されることがあります。当方は必要に応じて制限を変更または機能を停止できます。',
        ],
      },
      {
        heading: '6. 変更・停止',
        body: [
          '保守・セキュリティ・法的要請などの理由により、本サービスの全部または一部を中断・終了する場合があります。',
          '外部APIやインフラの変更により、本サービスの提供内容が変更・停止されることがあります。',
        ],
      },
      {
        heading: '7. 免責事項',
        body: [
          '本サービスは現状有姿で提供され、明示または黙示を問わずいかなる保証も行いません。',
          '本サービスの中断・エラー・特定目的への適合性等について当方は保証しません。',
        ],
      },
      {
        heading: '8. 責任の制限',
        body: [
          'ユーザーが本サービスの利用または利用不能により被った損害について、適用法で免責が認められる範囲で当方は責任を負いません。',
          '責任が免れない場合でも、当該月にユーザーが当方へ支払った金額（無料の場合は0円）を上限とします。',
        ],
      },
      {
        heading: '9. データの取扱い',
        body: [
          '個人情報や利用データは、別途定めるプライバシーポリシーに従い取り扱います。',
          '統計的に処理した非個人情報は、サービス改善のため利用することがあります。',
        ],
      },
      {
        heading: '10. 規約の改定',
        body: [
          '必要に応じて本規約を改定する場合があります。改定後の内容はリポジトリまたはアプリ内で通知した時点で効力を生じます。',
        ],
      },
      {
        heading: '11. 準拠法・紛争解決',
        body: [
          '適用法に特段の定めがない限り、本サービスに関する紛争は当方の主たる活動地の法令に準拠します。',
          '紛争が生じた場合は、まずGitHubのIssue等で協議し、円滑な解決に努めます。',
        ],
      },
      {
        heading: '12. ライセンス',
        body: [
          '本プロジェクトは GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later) の下で提供されています。',
          'プロジェクトへのコントリビューションは同一のライセンス条件で公開されることに同意したものとみなします。',
          'ライセンス全文はリポジトリ内の LICENSE ファイルで確認できます。',
        ],
      },
    ],
    contactHeading: 'お問い合わせ',
    contactLabel: 'お問い合わせやご意見はGitHubのIssueでお知らせください。',
    contactCta: 'Issueページを開く',
  },
}

export default function TermsPage() {
  const [language, setLanguage] = useState<Language>('en')
  const t = TERMS_CONTENT[language]
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
