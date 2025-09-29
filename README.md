# Banana-muffin AI OSS

An open source AI image generation application with administrator-controlled access. Built with React, Firebase, and integrated with Google Gemini and fal.ai for high-quality image generation.

![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)
![React](https://img.shields.io/badge/react-19.x-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)

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
   git clone https://github.com/your-org/banana-muffin-ai-oss.git
   cd banana-muffin-ai-oss
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

Banana-muffin AI OSS is licensed under the GNU Affero General Public License v3.0 or later. See the [LICENSE](LICENSE) file for the full text. Contributions are accepted only if they are provided under the same license terms.

## 🙏 Acknowledgments

- **Google Gemini** for advanced image generation capabilities
- **fal.ai** for high-quality image editing and generation
- **Firebase** for authentication and database services
- **React Team** for the excellent frontend framework
- **Tailwind CSS** for utility-first styling

## 🐛 Issues & Support

- **Bug Reports**: [GitHub Issues](https://github.com/your-org/banana-muffin-ai-oss/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/your-org/banana-muffin-ai-oss/discussions)
- **Documentation**: [Project Wiki](https://github.com/your-org/banana-muffin-ai-oss/wiki)

## 🗺 Roadmap

- [ ] Docker containerization
- [ ] Multi-language UI support
- [ ] Additional AI provider integrations
- [ ] Advanced admin analytics
- [ ] API documentation
- [ ] Mobile app support

---

**Made with ❤️ by the OSS community**
