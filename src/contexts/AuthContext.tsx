import React, { createContext, useContext, useEffect, useState } from 'react'
import { type User, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, googleProvider, db } from '../config/firebase'

export type UserRole = 'free' | 'pro' | 'admin'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

// OSS Version: Free plan has 0 generations, Pro plan has generous limits
const FREE_DAILY_LIMIT = 0
const FREE_MONTHLY_LIMIT = 0
const PRO_MONTHLY_CREDIT_LIMIT = 1000
const IMAGE_CREDIT_COST = 5
const VIDEO_CREDIT_COST = 20
const THREED_CREDIT_COST = 40

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL: string | null
  role: UserRole
  approvalStatus: ApprovalStatus
  createdAt: Date
  usageCount: {
    daily: number
    monthly: number
    lastReset: {
      daily: Date
      monthly: Date
    }
  }
  storageUsed: number
  storageQuota: number
}

type GenerationType = 'image' | 'video' | 'threeD'

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  canUseGeneration: (params: { type: GenerationType; units: number }) => boolean
  getRemainingQuota: () => { daily: number; monthly: number }
  recordGeneration: (params: { type: GenerationType; units: number }) => Promise<void>
  canUseStorage: () => boolean
  getStorageQuota: () => { used: number; total: number; available: number }
  updateStorageUsage: (sizeChange: number) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const resetUsageIfNeeded = (profile: UserProfile): UserProfile => {
    const now = new Date()
    const lastDailyReset = new Date(profile.usageCount.lastReset.daily)
    const lastMonthlyReset = new Date(profile.usageCount.lastReset.monthly)
    
    let updated = false
    const newProfile = { ...profile }

    // Reset daily count if it's a new day
    if (now.toDateString() !== lastDailyReset.toDateString()) {
      newProfile.usageCount.daily = 0
      newProfile.usageCount.lastReset.daily = now
      updated = true
    }

    // Reset monthly count if it's a new month
    if (now.getFullYear() !== lastMonthlyReset.getFullYear() ||
      now.getMonth() !== lastMonthlyReset.getMonth()) {
      newProfile.usageCount.monthly = 0
      newProfile.usageCount.lastReset.monthly = now
      updated = true
    }

    return updated ? newProfile : profile
  }

  const getStorageQuotaByRole = (role: UserRole): number => {
    switch (role) {
      case 'free': return 0 // Storage disabled for free users in OSS build
      case 'pro': return 500 * 1024 * 1024 // 500MB
      case 'admin': return Number.MAX_SAFE_INTEGER // Unlimited
      default: return 0
    }
  }

  const createUserProfile = async (user: User): Promise<UserProfile> => {
    const now = new Date()
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL,
      role: 'free',
      approvalStatus: 'pending',
      createdAt: now,
      usageCount: {
        daily: 0,
        monthly: 0,
        lastReset: {
          daily: now,
          monthly: now
        }
      },
      storageUsed: 0,
      storageQuota: getStorageQuotaByRole('free')
    }

    await setDoc(doc(db, 'users', user.uid), {
      ...profile,
      createdAt: now,
      usageCount: {
        ...profile.usageCount,
        lastReset: {
          daily: now,
          monthly: now
        }
      }
    })

    return profile
  }

  const fetchUserProfile = async (user: User): Promise<UserProfile> => {
    const userDoc = await getDoc(doc(db, 'users', user.uid))
    
    if (!userDoc.exists()) {
      return await createUserProfile(user)
    }

    const data = userDoc.data()
    const profile: UserProfile = {
      uid: data.uid,
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL,
      role: data.role,
      approvalStatus: data.approvalStatus || 'pending',
      createdAt: data.createdAt.toDate(),
      usageCount: {
        daily: data.usageCount.daily,
        monthly: data.usageCount.monthly,
        lastReset: {
          daily: data.usageCount.lastReset.daily.toDate(),
          monthly: data.usageCount.lastReset.monthly.toDate()
        }
      },
      storageUsed: data.storageUsed || 0,
      storageQuota: data.storageQuota || getStorageQuotaByRole(data.role)
    }

    let updatedProfile = resetUsageIfNeeded(profile)
    
    // Align storage quota with the current role definition
    const expectedQuota = getStorageQuotaByRole(updatedProfile.role)
    if (updatedProfile.storageQuota !== expectedQuota) {
      updatedProfile = { ...updatedProfile, storageQuota: expectedQuota }
    }
    
    if (updatedProfile !== profile) {
      await setDoc(doc(db, 'users', user.uid), {
        ...updatedProfile,
        createdAt: updatedProfile.createdAt,
        usageCount: {
          ...updatedProfile.usageCount,
          lastReset: {
            daily: updatedProfile.usageCount.lastReset.daily,
            monthly: updatedProfile.usageCount.lastReset.monthly
          }
        }
      })
      return updatedProfile
    }

    return profile
  }

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const profile = await fetchUserProfile(result.user)
      setUserProfile(profile)
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setUserProfile(null)
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  const getCreditsRequired = (type: GenerationType, units: number): number => {
    if (units <= 0) return 0
    const sanitizedUnits = Math.max(0, Math.floor(units))
    if (type === 'video') {
      return sanitizedUnits * VIDEO_CREDIT_COST
    }
    if (type === 'threeD') {
      return sanitizedUnits * THREED_CREDIT_COST
    }
    return sanitizedUnits * IMAGE_CREDIT_COST
  }

  const canUseGeneration = ({ type, units }: { type: GenerationType; units: number }): boolean => {
    if (!userProfile) return false

    const sanitizedUnits = Math.max(0, Math.floor(units))
    if (sanitizedUnits <= 0) return false

    if (userProfile.role === 'admin') {
      return true
    }

    if (userProfile.role === 'free') {
      if (userProfile.approvalStatus !== 'approved') return false
      const remainingDaily = Math.max(0, FREE_DAILY_LIMIT - userProfile.usageCount.daily)
      const remainingMonthly = Math.max(0, FREE_MONTHLY_LIMIT - userProfile.usageCount.monthly)
      if (remainingDaily <= 0 || remainingMonthly <= 0) {
        return false
      }
      return sanitizedUnits <= Math.min(remainingDaily, remainingMonthly)
    }

    if (userProfile.role === 'pro') {
      if (userProfile.approvalStatus !== 'approved') return false
      const creditsNeeded = getCreditsRequired(type, sanitizedUnits)
      const usedCredits = userProfile.usageCount.monthly || 0
      return usedCredits + creditsNeeded <= PRO_MONTHLY_CREDIT_LIMIT
    }

    return false
  }

  const getRemainingQuota = () => {
    if (!userProfile) return { daily: 0, monthly: 0 }

    if (userProfile.role === 'admin') {
      return { daily: Infinity, monthly: Infinity }
    }

    if (userProfile.role === 'pro') {
      if (userProfile.approvalStatus !== 'approved') {
        return { daily: 0, monthly: 0 }
      }
      const usedCredits = userProfile.usageCount.monthly || 0
      return {
        daily: Infinity,
        monthly: Math.max(0, PRO_MONTHLY_CREDIT_LIMIT - usedCredits)
      }
    }

    // Free plan - OSS version allows 0 generations
    return {
      daily: FREE_DAILY_LIMIT,
      monthly: FREE_MONTHLY_LIMIT
    }
  }

  const recordGeneration = async ({ type, units }: { type: GenerationType; units: number }) => {
    if (!userProfile || !user) return
    const sanitizedUnits = Math.max(0, Math.floor(units))
    if (sanitizedUnits <= 0) return

    if (userProfile.role === 'admin') return

    const usageCount = { ...userProfile.usageCount }

    if (userProfile.role === 'pro') {
      const creditsNeeded = getCreditsRequired(type, sanitizedUnits)
      if (creditsNeeded === 0) return
      usageCount.monthly = usageCount.monthly + creditsNeeded
    }

    const newProfile: UserProfile = {
      ...userProfile,
      usageCount
    }

    await setDoc(doc(db, 'users', user.uid), {
      ...newProfile,
      createdAt: newProfile.createdAt,
      usageCount: {
        ...newProfile.usageCount,
        lastReset: {
          daily: newProfile.usageCount.lastReset.daily,
          monthly: newProfile.usageCount.lastReset.monthly
        }
      }
    })

    setUserProfile(newProfile)
  }

  const canUseStorage = (): boolean => {
    if (!userProfile) return false
    return userProfile.role === 'pro' || userProfile.role === 'admin'
  }

  const getStorageQuota = () => {
    if (!userProfile) return { used: 0, total: 0, available: 0 }
    
    const used = userProfile.storageUsed
    const total = userProfile.storageQuota
    const available = Math.max(0, total - used)
    
    return { used, total, available }
  }

  const updateStorageUsage = async (sizeChange: number) => {
    if (!userProfile || !user) return

    const newStorageUsed = Math.max(0, userProfile.storageUsed + sizeChange)
    const newProfile = {
      ...userProfile,
      storageUsed: newStorageUsed
    }

    await setDoc(doc(db, 'users', user.uid), {
      ...newProfile,
      createdAt: newProfile.createdAt,
      usageCount: {
        ...newProfile.usageCount,
        lastReset: {
          daily: newProfile.usageCount.lastReset.daily,
          monthly: newProfile.usageCount.lastReset.monthly
        }
      }
    })

    setUserProfile(newProfile)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const profile = await fetchUserProfile(user)
          setUserProfile(profile)
        } catch (error) {
          console.error('Failed to fetch user profile:', error)
        }
      } else {
        setUserProfile(null)
      }
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    signInWithGoogle,
    logout,
    canUseGeneration,
    getRemainingQuota,
    recordGeneration,
    canUseStorage,
    getStorageQuota,
    updateStorageUsage
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
