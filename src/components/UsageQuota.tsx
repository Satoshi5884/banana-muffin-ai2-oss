import { useAuth } from '../contexts/AuthContext'

export default function UsageQuota() {
  const { userProfile, getRemainingQuota } = useAuth()
  
  if (!userProfile) return null

  const quota = getRemainingQuota()
  const isAdmin = userProfile.role === 'admin'

  // Show approval status for OSS version
  if (userProfile.approvalStatus === 'pending') {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
        <div className="flex items-center justify-between">
          <div className="font-medium text-orange-900">
            Account Status (Free Plan)
          </div>
        </div>
        <div className="mt-2 text-orange-800">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
            <span>Pending administrator approval</span>
          </div>
          <div className="text-xs text-orange-600 mt-1">
            Please wait for an administrator to approve your account before using generation features.
          </div>
        </div>
      </div>
    )
  }

  if (userProfile.approvalStatus === 'rejected') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
        <div className="flex items-center justify-between">
          <div className="font-medium text-red-900">
            Account Status (Free Plan)
          </div>
        </div>
        <div className="mt-2 text-red-800">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            <span>Access request rejected</span>
          </div>
          <div className="text-xs text-red-600 mt-1">
            Your access request has been rejected. Contact administrator for more information.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
      <div className="flex items-center justify-between">
        <div className="font-medium text-blue-900">
          Usage Status ({userProfile.role} Plan)
        </div>
      </div>
      
      <div className="mt-2 space-y-1 text-blue-800">
        {userProfile.role === 'free' && (
          <div className="space-y-1">
            <div>
              Today: {userProfile.usageCount.daily}/0 times 
              <span className="text-red-600 ml-2">Free plan: No generations allowed</span>
            </div>
            <div className="text-xs text-blue-600">
              🎬 Video generation: Contact administrator for access
            </div>
            <div className="text-xs text-blue-600">
              💾 Storage features: Not available for Free plan
            </div>
          </div>
        )}
        
        {userProfile.role === 'pro' && (
          <div className="space-y-1">
            <div>
              This month: {userProfile.usageCount.monthly}/1000 credits
              {quota.monthly > 0 ? (
                <span className="text-green-600 ml-2">{quota.monthly} credits remaining</span>
              ) : (
                <span className="text-red-600 ml-2">No credits remaining</span>
              )}
            </div>
            <div className="text-xs text-blue-600">
              Image generation: 5 credits / Video generation: 20 credits / 3D generation: 40 credits
            </div>
          </div>
        )}
        
        {isAdmin && (
          <div className="text-green-600 font-medium">
            Unlimited usage available
          </div>
        )}
      </div>
    </div>
  )
}
