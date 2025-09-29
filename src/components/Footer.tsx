import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <Link to="/" className="font-semibold text-gray-800 hover:text-gray-900">Banana-muffin AI OSS</Link>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500">© {new Date().getFullYear()}</span>
            <span className="text-gray-400">•</span>
            <a 
              href="https://github.com/your-org/banana-muffin-ai-oss/blob/main/LICENSE" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-gray-900"
            >
              GNU AGPL v3.0-or-later
            </a>
          </div>
          <nav className="flex items-center gap-4">
            <a 
              href="https://github.com/your-org/banana-muffin-ai-oss" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-gray-900"
            >
              GitHub
            </a>
            <span className="text-gray-300">|</span>
            <Link to="/links" className="hover:text-gray-900">Helpful Links</Link>
            <span className="text-gray-300">|</span>
            <Link to="/terms" className="hover:text-gray-900">Terms of Use</Link>
            <span className="text-gray-300">|</span>
            <Link to="/privacy" className="hover:text-gray-900">Privacy Policy</Link>
            <span className="text-gray-300">|</span>
            <Link to="/commerce" className="hover:text-gray-900">Legal Information</Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
