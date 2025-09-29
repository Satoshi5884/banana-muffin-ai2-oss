import type { Language } from '../contexts/LanguageContext'

const LAST_UPDATED = '2025-02-15'
const ISSUES_URL = 'https://github.com/Satoshi5884/banana-muffin-ai2-oss/issues'
const PROJECT_REPO = 'https://github.com/Satoshi5884/banana-muffin-ai2-oss'

export interface LegalSection {
  heading: string
  body: string[]
}

export interface LegalPageCopy {
  backLabel: string
  title: string
  lastUpdatedLabel: string
  intro?: string
  sections: LegalSection[]
  contact: {
    heading: string
    label: string
    cta: string
    href: string
  }
}

export const TERMS_COPY: Record<Language, LegalPageCopy> = {
  en: {
    backLabel: '← Back to Landing',
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
        body: ['We may update these Terms as needed. Changes become effective when published within the repository or application UI.'],
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
    contact: {
      heading: 'Contact',
      label: 'Questions or concerns? Open an issue on GitHub.',
      cta: 'Open Issues Page',
      href: ISSUES_URL,
    },
  },
  ja: {
    backLabel: '← ランディングページへ戻る',
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
        body: ['必要に応じて本規約を改定する場合があります。改定後の内容はリポジトリまたはアプリ内で通知した時点で効力を生じます。'],
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
    contact: {
      heading: 'お問い合わせ',
      label: 'お問い合わせやご意見はGitHubのIssueでお知らせください。',
      cta: 'Issueページを開く',
      href: ISSUES_URL,
    },
  },
}

export const PRIVACY_COPY: Record<Language, LegalPageCopy> = {
  en: {
    backLabel: '← Back to Landing',
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
        body: ['Personal data is not shared with third parties except when required by law, with your consent, or to protect the Service and its users.'],
      },
      {
        heading: '4. External Services',
        body: ['We rely on Google Cloud services such as Firebase Authentication, Firestore, and Cloud Storage, as well as Google Gemini or other AI providers. Review their policies at https://policies.google.com/privacy.'],
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
        body: ['You may request access, correction, or deletion of personal data stored within the project by opening an issue or contacting the maintainers.'],
      },
      {
        heading: '8. Cookies and Local Storage',
        body: ['Cookies and browser storage are used to maintain sessions and improve usability. You can disable them in your browser, but certain features may stop working.'],
      },
      {
        heading: '9. Policy Updates',
        body: ['We may update this Privacy Policy. Changes take effect when published in the repository or the application UI.'],
      },
    ],
    contact: {
      heading: 'Contact',
      label: 'For privacy questions, open an issue on GitHub and the maintainers will respond.',
      cta: 'Open Issues Page',
      href: ISSUES_URL,
    },
  },
  ja: {
    backLabel: '← ランディングページへ戻る',
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
        body: ['法令に基づく場合、本人の同意がある場合、本サービスやユーザーを保護する必要がある場合を除き、個人情報を第三者へ提供しません。'],
      },
      {
        heading: '4. 外部サービスの利用',
        body: ['Firebase Authentication、Firestore、Cloud StorageなどのGoogleクラウドサービス、およびGoogle Gemini等のAIプロバイダを利用します。各社のポリシー (https://policies.google.com/privacy) をご確認ください。'],
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
        body: ['保存されている個人データの開示・訂正・削除等を希望する場合は、GitHub Issue等を通じてご連絡ください。'],
      },
      {
        heading: '8. Cookie等の利用',
        body: ['セッション維持や利便性向上のためCookieやローカルストレージを利用します。ブラウザ設定で無効化できますが、一部機能が利用できなくなる場合があります。'],
      },
      {
        heading: '9. ポリシーの改定',
        body: ['必要に応じて本ポリシーを改定することがあります。改定内容はリポジトリまたはアプリ内で公表した時点で効力を生じます。'],
      },
    ],
    contact: {
      heading: 'お問い合わせ',
      label: 'プライバシーに関するご質問はGitHubのIssueでご連絡ください。',
      cta: 'Issueページを開く',
      href: ISSUES_URL,
    },
  },
}

export const COMMERCE_COPY: Record<Language, LegalPageCopy> = {
  en: {
    backLabel: '← Back to Landing',
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
    contact: {
      heading: 'Contact',
      label: 'For legal notices or required disclosures, please use the GitHub Issues tracker.',
      cta: 'Open Repository',
      href: PROJECT_REPO,
    },
  },
  ja: {
    backLabel: '← ランディングページへ戻る',
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
    contact: {
      heading: '連絡先',
      label: '法的な通知や情報開示が必要な場合はGitHub Issueをご利用ください。',
      cta: 'リポジトリを開く',
      href: PROJECT_REPO,
    },
  },
}
