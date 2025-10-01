# Banana-muffin AI OSS

An open source AI image generation application with administrator-controlled access. Built with React, Firebase, and integrated with Google Gemini and fal.ai for high-quality image generation.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-19.x-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)

## 📺 Demo & Tutorial

Watch our comprehensive tutorial video to learn how to set up and use Banana-muffin AI:

[![Banana-muffin AI Tutorial](https://img.youtube.com/vi/TZWajTzyGlk/maxresdefault.jpg)](https://youtu.be/TZWajTzyGlk)

[▶️ Watch on YouTube](https://youtu.be/TZWajTzyGlk)

## ✨ Features

### 🎨 AI Image Generation
- **Google Gemini 2.5 Flash Image Preview** integration for high-speed generation
- **fal.ai Seedream v4** Edit & Text-to-Image support
- Text prompts and image input combination
- Multiple image generation (1-4 images per request)
- Negative prompt support
- Various aspect ratios (1:1, 4:3, 16:9)

### 🔐 Administrator Approval System
- **New user approval required** - Administrators control access to generation features
- **Approval status tracking** - Users can see their approval status in real-time
- **Role-based access control** - Free/Pro/Admin roles with different permissions
- **Admin panel** - Comprehensive user management interface

### 👥 User Roles & Permissions
- **Free**: Requires administrator approval, no generation access until approved
- **Pro**: Approved users with limited generation quotas
- **Admin**: Unlimited access with full user management capabilities

### 📚 Content Management
- **Prompt history** with automatic saving
- **Favorite prompts** functionality
- **Cloud storage** for approved users (Firebase Storage)
- **Gallery viewing** with ZIP batch download
- **Storage quota management**

### 🛠 Self-Hosting Ready
- **Complete source code** available
- **Docker support** (coming soon)
- **Environment-based configuration**
- **Firebase integration** for authentication and storage

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Firebase project
- Google Gemini API key
- fal.ai API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Satoshi5884/banana-muffin-ai2-oss.git
   cd banana-muffin-ai2-oss
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Firebase configuration**
   - Create Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Google provider)
   - Create Firestore database
   - Enable Firebase Storage
   - Deploy security rules:
   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only storage
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

### Environment Variables

```env
# AI API Keys
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_FAL_KEY=your_fal_api_key

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Firebase Admin (for Netlify Functions)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

## 🏗 Architecture

### Technology Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth (Google OAuth)
- **Database**: Firestore
- **Storage**: Firebase Storage
- **AI Services**: Google Gemini + fal.ai
- **Deployment**: Netlify / Self-hosted

### Database Schema

#### Users Collection
```typescript
interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL: string | null
  role: 'free' | 'pro' | 'admin'
  approvalStatus: 'pending' | 'approved' | 'rejected'
  createdAt: Date
  usageCount: {
    daily: number
    monthly: number
    lastReset: { daily: Date; monthly: Date }
  }
  storageUsed: number
  storageQuota: number
}
```

#### Other Collections
- **prompts**: User prompt history and favorites
- **images**: Stored image metadata and download URLs

## 👨‍💼 Administrator Setup

### Initial Admin User
1. Sign up through the application
2. Manually set role to 'admin' in Firestore console
3. Set approvalStatus to 'approved'
4. Refresh application to access admin panel

### Admin Capabilities
- **User Management**: View all users, approve/reject access requests
- **Role Assignment**: Change user roles (Free/Pro/Admin)
- **Usage Monitoring**: View usage statistics and reset user quotas
- **Content Moderation**: Access to all user-generated content

## 🔒 Security Considerations

### Production Deployment
⚠️ **Important**: This application uses client-side API keys for development. For production:

1. **Implement API Proxy**: Route API calls through your backend
2. **IP Restrictions**: Configure API key restrictions in Google Console
3. **Rate Limiting**: Implement server-side rate limiting
4. **Environment Security**: Secure environment variable management

### Data Privacy
- User authentication via Firebase Auth
- All user data stored in your Firebase project
- Image storage under your control
- No data sent to third parties except AI API providers

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

### Areas for Contribution
- **New AI Providers**: Add support for additional AI image generation services
- **UI/UX Improvements**: Enhance user interface and experience
- **Performance Optimization**: Improve loading times and responsiveness
- **Documentation**: Improve setup guides and API documentation
- **Testing**: Add comprehensive test coverage

## 📦 Deployment

### Netlify (Recommended)
1. Connect GitHub repository to Netlify
2. Configure environment variables
3. Deploy with automatic builds

### Self-Hosted
1. Build production version: `npm run build`
2. Serve `dist` folder with web server
3. Configure environment variables on server

### Docker (Coming Soon)
```bash
docker build -t banana-muffin-ai-oss .
docker run -p 3000:3000 banana-muffin-ai-oss
```

## 📄 License

Banana-muffin AI OSS is licensed under the MIT License. See the [LICENSE](LICENSE) file for the full text.

## 🙏 Acknowledgments

- **Google Gemini** for advanced image generation capabilities
- **fal.ai** for high-quality image editing and generation
- **Firebase** for authentication and database services
- **React Team** for the excellent frontend framework
- **Tailwind CSS** for utility-first styling

## 🐛 Issues & Support

- **Bug Reports**: [GitHub Issues](https://github.com/Satoshi5884/banana-muffin-ai2-oss/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/Satoshi5884/banana-muffin-ai2-oss/discussions)
- **Documentation**: [Project Wiki](https://github.com/Satoshi5884/banana-muffin-ai2-oss/wiki)

## 🗺 Roadmap

- [ ] Docker containerization
- [ ] Multi-language UI support
- [ ] Additional AI provider integrations
- [ ] Advanced admin analytics
- [ ] API documentation
- [ ] Mobile app support

---

**Made with ❤️ by the OSS community**

---

# Banana-muffin AI OSS（日本語）

管理者がアクセスを制御できるオープンソースのAI画像生成アプリケーションです。ReactとFirebaseを基盤に、Google Geminiとfal.aiを連携させて高品質な画像生成を提供します。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-19.x-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)

## 📺 デモ＆チュートリアル

Banana-muffin AI のセットアップと使い方を学ぶための包括的なチュートリアル動画をご覧ください：

[![Banana-muffin AI チュートリアル](https://img.youtube.com/vi/TZWajTzyGlk/maxresdefault.jpg)](https://youtu.be/TZWajTzyGlk)

[▶️ YouTubeで視聴](https://youtu.be/TZWajTzyGlk)

## ✨ 特長

### 🎨 AI画像生成
- **Google Gemini 2.5 Flash Image Preview** と連携し高速な生成が可能
- **fal.ai Seedream v4** の編集およびテキスト→画像変換に対応
- テキストプロンプトと画像入力の組み合わせをサポート
- 1回のリクエストで1〜4枚の画像を生成
- ネガティブプロンプトに対応
- 1:1、4:3、16:9 など複数のアスペクト比を提供

### 🔐 管理者承認システム
- **新規ユーザー承認が必須** — 管理者が生成機能へのアクセスを制御
- **承認状況の追跡** — ユーザーはリアルタイムで承認状況を確認可能
- **ロールベースのアクセス制御** — Free/Pro/Admin の各ロールに応じて権限を付与
- **管理者パネル** — 包括的なユーザー管理インターフェース

### 👥 ユーザーロールと権限
- **Free**: 管理者承認が必要で、承認されるまで生成機能は利用不可
- **Pro**: 承認済みユーザーで生成回数に上限あり
- **Admin**: 無制限の生成と全ユーザー管理機能を利用可能

### 📚 コンテンツ管理
- **プロンプト履歴** を自動保存
- **お気に入りプロンプト** 機能
- **クラウドストレージ**（Firebase Storage）を承認済みユーザー向けに提供
- **ギャラリー閲覧** と ZIP での一括ダウンロード
- **ストレージ割り当て** を管理

### 🛠 セルフホスティング対応
- **完全なソースコード** を公開
- **Docker対応**（近日公開予定）
- **環境変数ベースの設定**
- **Firebase連携** による認証・ストレージ管理

## 🚀 クイックスタート

### 前提条件
- Node.js 18 以上と npm
- Firebase プロジェクト
- Google Gemini API キー
- fal.ai API キー

### インストール手順

1. **リポジトリをクローン**
   ```bash
   git clone https://github.com/Satoshi5884/banana-muffin-ai2-oss.git
   cd banana-muffin-ai2-oss
   ```

2. **依存関係をインストール**
   ```bash
   npm install
   ```

3. **環境変数を設定**
   ```bash
   cp .env.example .env
   # .env を開いて設定を編集
   ```

4. **Firebase を構成**
   - [Firebase Console](https://console.firebase.google.com/) でプロジェクトを作成
   - 認証（Google プロバイダー）を有効化
   - Firestore データベースを作成
   - Firebase Storage を有効化
   - セキュリティルールをデプロイ:
   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only storage
   ```

5. **開発サーバーを起動**
   ```bash
   npm run dev
   ```

### 環境変数

```env
# AI API Keys
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_FAL_KEY=your_fal_api_key

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Firebase Admin (for Netlify Functions)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

## 🏗 アーキテクチャ

### 技術スタック
- **フロントエンド**: React 19 + TypeScript + Vite
- **スタイリング**: Tailwind CSS
- **認証**: Firebase Auth（Google OAuth）
- **データベース**: Firestore
- **ストレージ**: Firebase Storage
- **AIサービス**: Google Gemini + fal.ai
- **デプロイ**: Netlify / セルフホスト

### データベーススキーマ

#### Users コレクション
```typescript
interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL: string | null
  role: 'free' | 'pro' | 'admin'
  approvalStatus: 'pending' | 'approved' | 'rejected'
  createdAt: Date
  usageCount: {
    daily: number
    monthly: number
    lastReset: { daily: Date; monthly: Date }
  }
  storageUsed: number
  storageQuota: number
}
```

#### その他のコレクション
- **prompts**: ユーザーのプロンプト履歴とお気に入り
- **images**: 保存された画像のメタデータとダウンロードURL

## 👨‍💼 管理者セットアップ

### 初期管理者ユーザー
1. アプリケーションからユーザー登録
2. Firestore コンソールでロールを `admin` に手動変更
3. approvalStatus を `approved` に設定
4. アプリケーションを更新して管理者パネルにアクセス

### 管理者の機能
- **ユーザー管理**: 全ユーザーの閲覧とアクセスリクエストの承認/却下
- **ロール割り当て**: Free / Pro / Admin のロール変更
- **利用状況の監視**: 使用統計の確認とクオータのリセット
- **コンテンツモデレーション**: すべてのユーザー生成コンテンツへアクセス

## 🔒 セキュリティ上の注意

### 本番環境での運用
⚠️ **重要**: 本アプリは開発中、クライアント側で API キーを使用します。 本番運用では以下を実施してください。

1. **API プロキシを実装**: API 呼び出しをバックエンド経由にする
2. **IP 制限**: Google Console で API キーに制限を設定
3. **レート制限**: サーバー側でのレート制限を導入
4. **環境のセキュリティ**: 環境変数を安全に管理

### データプライバシー
- Firebase Auth によるユーザー認証
- すべてのユーザーデータは自身の Firebase プロジェクトに保存
- 画像ストレージは管理者の制御下
- AI API プロバイダー以外の第三者にデータは送信されません

## 🤝 コントリビューション

貢献を歓迎しています。ガイドラインは [CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。

### 開発ワークフロー
1. リポジトリをフォーク
2. フィーチャーブランチを作成
3. テストを含めて変更を加える
4. プルリクエストを送信

### 募集している貢献領域
- **新しい AI プロバイダー**: 追加の画像生成サービス統合
- **UI/UX 改善**: ユーザーインターフェースと体験の向上
- **パフォーマンス最適化**: 読み込み速度とレスポンス改善
- **ドキュメント**: セットアップガイドと API ドキュメントの整備
- **テスト**: テストカバレッジの強化

## 📦 デプロイ

### Netlify（推奨）
1. GitHub リポジトリを Netlify と接続
2. 環境変数を設定
3. 自動ビルドでデプロイ

### セルフホスト
1. プロダクションビルド: `npm run build`
2. `dist` フォルダーを任意の Web サーバーで配信
3. サーバー上で環境変数を設定

### Docker（近日公開）
```bash
docker build -t banana-muffin-ai-oss .
docker run -p 3000:3000 banana-muffin-ai-oss
```

## 📄 ライセンス

Banana-muffin AI OSS は MIT ライセンスでライセンスされています。詳細は [LICENSE](LICENSE) を参照してください。

## 🙏 謝辞

- 先進的な画像生成機能を提供する **Google Gemini**
- 高品質な画像編集と生成を提供する **fal.ai**
- 認証とデータベースサービスを提供する **Firebase**
- 優れたフロントエンドフレームワークを提供する **React Team**
- ユーティリティファーストなスタイリングを可能にする **Tailwind CSS**

## 🐛 課題とサポート

- **バグ報告**: [GitHub Issues](https://github.com/Satoshi5884/banana-muffin-ai2-oss/issues)
- **機能要望**: [GitHub Discussions](https://github.com/Satoshi5884/banana-muffin-ai2-oss/discussions)
- **ドキュメント**: [Project Wiki](https://github.com/Satoshi5884/banana-muffin-ai2-oss/wiki)

## 🗺 ロードマップ

- [ ] Docker コンテナ化
- [ ] 多言語 UI 対応
- [ ] 追加の AI プロバイダー統合
- [ ] 高度な管理者向け分析
- [ ] API ドキュメント
- [ ] モバイルアプリ対応

---

**OSS コミュニティの情熱で作られています**
