import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getPromptHistory, deletePromptFromHistory } from '../lib/firestore'
import { getUserImages, deleteImageFromStorage, formatStorageSize } from '../lib/storage'
import { googleProvider } from '../config/firebase'
import { deleteUser, reauthenticateWithPopup } from 'firebase/auth'
import { doc, deleteDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useState } from 'react'

export default function SettingsPage() {
  const { user, userProfile, getRemainingQuota, getStorageQuota } = useAuth()
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white border rounded-lg p-6">
            <h1 className="text-xl font-semibold">Settings</h1>
            <p className="mt-2 text-gray-600">Please login to view the settings page.</p>
            <div className="mt-4">
              <Link to="/" className="text-blue-600 hover:underline">Back to Home</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const remaining = getRemainingQuota()
  const storage = getStorageQuota()

  const handleDeleteAccount = async () => {
    if (!user || !userProfile) return
    const ok = confirm('Delete all account and saved data (images, history). Are you sure? This action cannot be undone.')
    if (!ok) return
    setDeleting(true)
    setMessage('Preparing...')
    setError(null)
    try {
      // Re-authentication (required if needed)
      setMessage('Verifying identity...')
      try {
        await reauthenticateWithPopup(user, googleProvider)
      } catch {
        // Skip (not needed if recently logged in)
      }

      // Delete images
      setMessage('Deleting image data...')
      try {
        const images = await getUserImages(user.uid, 1000)
        for (const img of images) {
          await deleteImageFromStorage(img.id)
        }
      } catch (e) {
        console.warn('Image deletion warning:', e)
      }

      // Delete prompt history
      setMessage('Deleting prompt history...')
      try {
        const prompts = await getPromptHistory(user.uid, 1000)
        for (const p of prompts) {
          await deletePromptFromHistory(p.id)
        }
      } catch (e) {
        console.warn('History deletion warning:', e)
      }

      // Delete Firestore user document
      setMessage('Deleting account data...')
      try {
        await deleteDoc(doc(db, 'users', user.uid))
      } catch (e) {
        console.warn('User document deletion warning:', e)
      }

      // Delete Firebase Auth user
      setMessage('Deleting account...')
      await deleteUser(user)
      setMessage('Deletion completed')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error occurred during deletion'
      setError(msg)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Settings</h1>
          <Link to="/app" className="text-blue-600 hover:underline">Back to Generation</Link>
        </div>

        {/* Account Status */}
        <section className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold">Account Status</h2>
          <div className="mt-3 text-gray-700">
            <p>Current Role: <span className="font-medium capitalize">{userProfile.role}</span></p>
            <p>Approval Status: <span className={`font-medium capitalize ${
              userProfile.approvalStatus === 'approved' ? 'text-green-600' :
              userProfile.approvalStatus === 'pending' ? 'text-orange-600' :
              'text-red-600'
            }`}>{userProfile.approvalStatus}</span></p>
            
            {userProfile.approvalStatus === 'pending' && (
              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
                  <h3 className="font-medium text-orange-900">Pending Administrator Approval</h3>
                </div>
                <p className="text-sm text-orange-700 mt-2">
                  Your account is awaiting approval from an administrator. You will be able to use generation features once approved.
                </p>
              </div>
            )}
            
            {userProfile.approvalStatus === 'rejected' && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <h3 className="font-medium text-red-900">Access Request Rejected</h3>
                </div>
                <p className="text-sm text-red-700 mt-2">
                  Your access request has been rejected. Please contact an administrator for more information.
                </p>
              </div>
            )}
            
            {userProfile.approvalStatus === 'approved' && userProfile.role === 'free' && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900">Free Plan (OSS Version)</h3>
                <p className="text-sm text-blue-700 mt-2">
                  This is the open source version. Free plan users have limited access to generation features.
                  Contact an administrator for additional permissions.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Usage Statistics */}
        <section className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold">Usage Statistics</h2>
          <div className="mt-3 grid sm:grid-cols-2 gap-4 text-gray-700">
            <div className="p-4 rounded-md bg-gray-50 border">
              <div className="text-sm text-gray-500">Today's Generations</div>
              <div className="mt-1 font-semibold">
                {userProfile.usageCount.daily}
                {userProfile.role === 'free' ? ` / 0` : ' / ∞'}
              </div>
              <div className="text-xs text-gray-500 mt-1">Remaining: {remaining.daily === Infinity ? '∞' : remaining.daily}</div>
            </div>
            <div className="p-4 rounded-md bg-gray-50 border">
              <div className="text-sm text-gray-500">Monthly Usage</div>
              <div className="mt-1 font-semibold">
                {userProfile.usageCount.monthly}
                {userProfile.role === 'pro' ? ' / 1000 credits' : ' / ∞'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Remaining: {remaining.monthly === Infinity ? '∞' : `${remaining.monthly} credits`}
              </div>
            </div>
          </div>
        </section>

        {/* Storage */}
        <section className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold">Storage</h2>
          <div className="mt-3 text-gray-700">
            <p>
              Usage: <span className="font-medium">{formatStorageSize(storage.used)}</span>
              {' '} / {storage.total === 0 ? 'Disabled (Free)' : storage.total === Number.MAX_SAFE_INTEGER ? 'Unlimited' : formatStorageSize(storage.total)}
            </p>
            {storage.total > 0 && (
              <p className="mt-1 text-sm text-gray-600">Remaining: {formatStorageSize(storage.available)}</p>
            )}
          </div>
        </section>

        {/* Account Deletion */}
        <section className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-600">Delete Account</h2>
          <p className="mt-2 text-sm text-gray-600">Permanently delete your account and all saved data (images, history). This action cannot be undone.</p>
          <div className="mt-4 flex items-center gap-3">
            <button 
              className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              onClick={handleDeleteAccount}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Account'}
            </button>
            {message && <span className="text-sm text-gray-500">{message}</span>}
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        </section>
      </div>
    </div>
  )
}
