import { Link } from 'react-router-dom'
import AuthButton from '../components/AuthButton'

export default function LandingPage() {
  return (
    <div className="bg-white text-gray-900">
      {/* Hero */}
      <header className="border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg font-bold">Banana-muffin AI OSS</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/app" className="hidden sm:inline-block px-3 py-1.5 text-sm rounded-md bg-gray-900 text-white hover:bg-black">Open the App</Link>
            <AuthButton />
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 py-16 sm:py-24">
            <div className="max-w-2xl">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                Generate AI Images with nano-banana & Seedream - OSS Version
              </h1>
              <p className="mt-5 text-lg text-gray-600">
                Banana-muffin AI OSS combines Google Gemini 2.5 Flash Image Preview (nano-banana) with 
                fal.ai Seedream v4 Edit / Text-to-Image. This open source version provides both prompt-only generation 
                and advanced image editing capabilities with administrator-controlled access.
              </p>
              <div className="mt-8 flex items-center gap-3">
                <Link to="/app" className="px-5 py-3 rounded-lg bg-gray-900 text-white hover:bg-black font-medium">
                  Get Started (Request Access)
                </Link>
                <a href="#features" className="px-5 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium">
                  View Features
                </a>
              </div>
              <p className="mt-3 text-sm text-gray-500">
                Easy Google Account login. Open source with administrator approval required.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-16 sm:py-24 bg-gray-50 border-t border-b">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                title="Fast Generation"
                desc="Utilizing Gemini 2.5 Flash Image Preview for batch generation of up to 4 candidates. Quick comparison and selection."
              />
              <FeatureCard
                title="Input Image Compositing/Conversion"
                desc="Drag & drop to add images. Advanced image editing with Gemini plus Seedream v4 Edit capabilities."
              />
              <FeatureCard
                title="High-Quality Text-to-Image"
                desc="Seedream v4 Text-to-Image generates high-quality candidates quickly from text instructions alone."
              />
              <FeatureCard
                title="History and Storage"
                desc="Automatic prompt history saving. Cloud storage and gallery viewing available for approved users."
              />
              <FeatureCard
                title="User-Friendly Interface"
                desc="Simple and intuitive operation. Designed with accessibility in mind."
              />
              <FeatureCard
                title="Download/Share"
                desc="Generated images can be saved as PNG. ZIP batch saving also supported."
              />
              <FeatureCard
                title="Open Source"
                desc="Fully open source project. Self-hostable with administrator approval workflow."
              />
              <FeatureCard
                title="Administrator Control"
                desc="Built-in user approval system. Administrators control access to generation features."
              />
              <FeatureCard
                title="Privacy Focused"
                desc="Self-hosted deployment options. Your data stays under your control."
              />
              <FeatureCard
                title="Secure Authentication"
                desc="Sign in with Google—no password management or additional accounts required."
              />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 sm:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold">How to Get Started</h2>
            <ol className="mt-6 grid sm:grid-cols-3 gap-6 text-gray-700">
              <li className="p-5 rounded-lg border bg-white">
                <div className="text-sm font-semibold text-gray-500">Step 1</div>
                <div className="mt-1 font-semibold">Sign in with Google</div>
                <p className="mt-2 text-sm text-gray-600">Use the sign-in button in the upper-right corner to authenticate.</p>
              </li>
              <li className="p-5 rounded-lg border bg-white">
                <div className="text-sm font-semibold text-gray-500">Step 2</div>
                <div className="mt-1 font-semibold">Craft Your Prompt</div>
                <p className="mt-2 text-sm text-gray-600">Add optional reference images and provide clear instructions.</p>
              </li>
              <li className="p-5 rounded-lg border bg-white">
                <div className="text-sm font-semibold text-gray-500">Step 3</div>
                <div className="mt-1 font-semibold">Review & Save Results</div>
                <p className="mt-2 text-sm text-gray-600">Download or store your favorite outputs in just a click.</p>
              </li>
            </ol>
            <p className="mt-6 text-sm text-gray-500">
              Note: Depending on provider rate limits, you may need to wait briefly between generations.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-24 bg-gray-50 border-t">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold">Try Banana-muffin AI Today</h2>
            <p className="mt-3 text-gray-600">Start for free and scale with administrator-managed upgrades.</p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link to="/app" className="px-5 py-3 rounded-lg bg-gray-900 text-white hover:bg-black font-medium">
                Launch the Generator
              </Link>
              <AuthButton />
            </div>
          </div>
        </section>

        {/* Open Source Information */}
        <section className="py-16 sm:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center">Open Source Project</h2>
            <p className="mt-3 text-gray-600 text-center">Self-hosted AI image generation with administrator-controlled access.</p>
            <div className="mt-10 grid sm:grid-cols-2 gap-8">
              {/* Access Model */}
              <div className="p-6 rounded-xl border bg-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold">Administrator Approval Required</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• New users require administrator approval</li>
                  <li>• Request access through Google Account login</li>
                  <li>• Approval status visible in user interface</li>
                  <li>• Administrators control feature access</li>
                </ul>
                <div className="mt-6">
                  <Link to="/app" className="inline-block w-full text-center px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50">
                    Request Access
                  </Link>
                </div>
              </div>

              {/* Self-Hosting */}
              <div className="p-6 rounded-xl border bg-white shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold">Self-Hosted Deployment</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Deploy on your own infrastructure</li>
                  <li>• Full control over user data and access</li>
                  <li>• Configure your own AI API keys</li>
                  <li>• Customize approval workflows</li>
                </ul>
                <div className="mt-6">
                  <a 
                    href="https://github.com/your-repo/banana-muffin-ai-oss" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block w-full text-center px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
                  >
                    View on GitHub
                  </a>
                </div>
              </div>
            </div>
            
            {/* Community Section */}
            <div className="mt-12 text-center">
              <h3 className="text-xl font-semibold mb-4">Join the Community</h3>
              <p className="text-gray-600 mb-6">Contribute to the development of open source AI image generation tools</p>
              <div className="flex justify-center gap-4">
                <a 
                  href="https://github.com/your-repo/banana-muffin-ai-oss/issues" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Report Issues
                </a>
                <a 
                  href="https://github.com/your-repo/banana-muffin-ai-oss/blob/main/CONTRIBUTING.md" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Contribute
                </a>
                <Link to="/commerce" className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                  Legal Information
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-6 rounded-xl border bg-white shadow-sm hover:shadow transition-shadow">
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{desc}</p>
    </div>
  )
}
