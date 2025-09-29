# Contributing to Banana-muffin AI OSS

Thank you for your interest in contributing to Banana-muffin AI OSS! This project is an open source AI image generation tool with administrator-controlled access.

## How to Contribute

### 🐛 Reporting Bugs

1. **Check existing issues** to avoid duplicates
2. **Create a detailed issue** with:
   - Clear description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment information (browser, OS, etc.)
   - Screenshots if applicable

### 💡 Suggesting Features

1. **Check existing issues** for similar requests
2. **Create a feature request** with:
   - Clear description of the proposed feature
   - Use case and benefits
   - Potential implementation approach
   - Mock-ups or examples if applicable

### 🔧 Code Contributions

#### Prerequisites
- Node.js 18+ and npm
- Firebase project setup
- API keys for Gemini and fal.ai

#### Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/banana-muffin-ai-oss.git
   cd banana-muffin-ai-oss
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

#### Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow existing code style
   - Add tests if applicable
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm run lint
   npm run build
   ```

4. **Commit with clear messages**
   ```bash
   git commit -m "feat: add new feature description"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

#### Code Style Guidelines

- **TypeScript**: Use strict typing
- **React**: Functional components with hooks
- **Styling**: Tailwind CSS classes
- **Naming**: camelCase for variables, PascalCase for components
- **Imports**: Group and sort imports logically

#### Commit Message Convention

Use [Conventional Commits](https://conventionalcommits.org/):
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### 📖 Documentation

- **Update README.md** for setup changes
- **Add inline comments** for complex logic
- **Update type definitions** as needed
- **Document new environment variables**

### 🧪 Testing

- Test the complete user flow: registration → approval → generation
- Verify administrator approval workflow
- Check responsive design on different screen sizes
- Test with different browsers

## Project Architecture

### Key Components
- **Frontend**: React + TypeScript + Vite
- **Authentication**: Firebase Auth with Google provider
- **Database**: Firestore for user data and history
- **Storage**: Firebase Storage for images (Pro/Admin users)
- **AI Services**: Google Gemini + fal.ai APIs

### Administrator Approval System
- New users require admin approval to use generation features
- Approval status: `pending`, `approved`, `rejected`
- Admin panel provides approval management interface

### User Roles
- **Free**: No generation access until approved by admin
- **Pro**: Limited generation with approval required
- **Admin**: Unlimited access and user management capabilities

## Code of Conduct

This project follows a standard Code of Conduct:
- Be respectful and inclusive
- Focus on constructive feedback
- Help maintain a welcoming environment
- Report inappropriate behavior

## Questions?

- **General questions**: Open a GitHub Discussion
- **Bug reports**: Create an Issue
- **Security concerns**: Email maintainers privately

## License

By contributing to this project, you agree that your contributions will be licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).

Thank you for contributing to Banana-muffin AI OSS! 🎨
