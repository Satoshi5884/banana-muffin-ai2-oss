import { useAuth } from '../contexts/AuthContext'
import { formatStorageSize } from '../lib/storage'

export default function StorageQuota() {
  const { userProfile, getStorageQuota, canUseStorage } = useAuth()
  
  if (!userProfile || !canUseStorage()) return null

  const { used, total, available } = getStorageQuota()
  const percentage = total === Number.MAX_SAFE_INTEGER ? 0 : Math.min(100, (used / total) * 100)

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium text-green-900">
          Storage Usage ({userProfile.role} Plan)
        </div>
        <div className="text-green-800">
          {formatStorageSize(used)} / {formatStorageSize(total)}
        </div>
      </div>
      
      {total !== Number.MAX_SAFE_INTEGER && (
        <div className="w-full bg-green-200 rounded-full h-2 mb-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              percentage > 90 ? 'bg-red-500' : 
              percentage > 75 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
      
      <div className="text-green-800 text-xs">
        {total === Number.MAX_SAFE_INTEGER ? (
          <span className="text-green-600 font-medium">Unlimited storage available</span>
        ) : (
          <>
            Available: {formatStorageSize(available)}
            {percentage > 90 && (
              <span className="text-red-600 font-medium ml-2">Storage running low</span>
            )}
          </>
        )}
      </div>
    </div>
  )
}