import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  where,
  Timestamp
} from 'firebase/firestore'
import { db } from '../config/firebase'
import type { UserRole, ApprovalStatus } from '../contexts/AuthContext'

export interface PromptHistory {
  id: string
  userId: string
  prompt: string
  candidateCount: number
  createdAt: Date
  favorite: boolean
  tags: string[]
}

export interface UserManagement {
  uid: string
  email: string
  displayName: string
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
}

export interface MarkdownDocument {
  id: string
  userId: string
  content: string
  createdAt: Date
  updatedAt: Date
}

const FREE_PLAN_MARKDOWN_LIMIT = 5

export const getMarkdownLimitByRole = (role: UserRole): number => {
  return role === 'free' ? FREE_PLAN_MARKDOWN_LIMIT : Number.MAX_SAFE_INTEGER
}

export const createMarkdownDocument = async (
  userId: string,
  content: string
): Promise<string> => {
  const now = Timestamp.now()
  const docRef = await addDoc(collection(db, 'markdownDocuments'), {
    userId,
    content,
    createdAt: now,
    updatedAt: now
  })
  return docRef.id
}

export const updateMarkdownDocument = async (
  documentId: string,
  content: string
): Promise<void> => {
  const target = doc(db, 'markdownDocuments', documentId)
  await updateDoc(target, {
    content,
    updatedAt: Timestamp.now()
  })
}

export const deleteMarkdownDocument = async (documentId: string): Promise<void> => {
  await deleteDoc(doc(db, 'markdownDocuments', documentId))
}

export const getMarkdownDocuments = async (
  userId: string,
  limitCount: number = 100
): Promise<MarkdownDocument[]> => {
  const q = query(
    collection(db, 'markdownDocuments'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  )

  const snapshot = await getDocs(q)
  const docs: MarkdownDocument[] = []

  snapshot.forEach(entry => {
    const data = entry.data()
    docs.push({
      id: entry.id,
      userId: data.userId,
      content: data.content,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate?.() ?? data.createdAt.toDate()
    })
  })

  return docs
}

// Save prompt history
export const savePromptToHistory = async (
  userId: string,
  prompt: string,
  candidateCount: number,
  tags: string[] = []
): Promise<string> => {
  const promptData = {
    userId,
    prompt,
    candidateCount,
    createdAt: Timestamp.now(),
    favorite: false,
    tags
  }

  const docRef = await addDoc(collection(db, 'prompts'), promptData)
  return docRef.id
}

// Fetch prompt history
export const getPromptHistory = async (
  userId: string,
  limitCount: number = 50
): Promise<PromptHistory[]> => {
  const q = query(
    collection(db, 'prompts'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  )

  const querySnapshot = await getDocs(q)
  const prompts: PromptHistory[] = []

  querySnapshot.forEach((doc) => {
    const data = doc.data()
    prompts.push({
      id: doc.id,
      userId: data.userId,
      prompt: data.prompt,
      candidateCount: data.candidateCount,
      createdAt: data.createdAt.toDate(),
      favorite: data.favorite || false,
      tags: data.tags || []
    })
  })

  return prompts
}

// Toggle favorite flag for a prompt
export const togglePromptFavorite = async (
  promptId: string,
  favorite: boolean
): Promise<void> => {
  const promptRef = doc(db, 'prompts', promptId)
  await updateDoc(promptRef, { favorite })
}

// Delete prompt history entry
export const deletePromptFromHistory = async (promptId: string): Promise<void> => {
  await deleteDoc(doc(db, 'prompts', promptId))
}

// Fetch favorite prompts
export const getFavoritePrompts = async (userId: string): Promise<PromptHistory[]> => {
  const q = query(
    collection(db, 'prompts'),
    where('userId', '==', userId),
    where('favorite', '==', true),
    orderBy('createdAt', 'desc')
  )

  const querySnapshot = await getDocs(q)
  const prompts: PromptHistory[] = []

  querySnapshot.forEach((doc) => {
    const data = doc.data()
    prompts.push({
      id: doc.id,
      userId: data.userId,
      prompt: data.prompt,
      candidateCount: data.candidateCount,
      createdAt: data.createdAt.toDate(),
      favorite: data.favorite,
      tags: data.tags || []
    })
  })

  return prompts
}

// Search prompt history
export const searchPromptHistory = async (
  userId: string,
  searchQuery: string,
  filters?: {
    favorite?: boolean
    tags?: string[]
    dateRange?: { start: Date; end: Date }
  }
): Promise<PromptHistory[]> => {
  // Fetch all history records first
  const allPrompts = await getPromptHistory(userId, 1000)
  
  // Apply client-side filtering
  return allPrompts.filter(prompt => {
    const lowerQuery = searchQuery.toLowerCase()
    
    // Text search (prompt content, tags)
    const matchesText = !searchQuery || 
      prompt.prompt.toLowerCase().includes(lowerQuery) ||
      prompt.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    
    // Favorite filter
    const matchesFavorite = filters?.favorite === undefined || 
      prompt.favorite === filters.favorite
    
    // Tag filter
    const matchesTags = !filters?.tags?.length || 
      filters.tags.some(tag => prompt.tags.includes(tag))
    
    // Date filter
    const matchesDate = !filters?.dateRange || 
      (prompt.createdAt >= filters.dateRange.start && prompt.createdAt <= filters.dateRange.end)
    
    return matchesText && matchesFavorite && matchesTags && matchesDate
  })
}

// Update prompt tags
export const updatePromptTags = async (
  promptId: string,
  tags: string[]
): Promise<void> => {
  const promptRef = doc(db, 'prompts', promptId)
  await updateDoc(promptRef, { tags })
}

// Fetch all prompt tags for a user
export const getUserPromptTags = async (userId: string): Promise<string[]> => {
  try {
    const prompts = await getPromptHistory(userId, 1000)
    const allTags = prompts.flatMap(prompt => prompt.tags)
    return [...new Set(allTags)].sort()
  } catch (error) {
    console.error('Prompt tag fetch error:', error)
    return []
  }
}

// Admin: fetch all users
export const getAllUsers = async (): Promise<UserManagement[]> => {
  const querySnapshot = await getDocs(collection(db, 'users'))
  const users: UserManagement[] = []

  querySnapshot.forEach((doc) => {
    const data = doc.data()
    users.push({
      uid: doc.id,
      email: data.email,
      displayName: data.displayName,
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
      }
    })
  })

  return users.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

// Admin: update user role
export const updateUserRole = async (uid: string, role: UserRole): Promise<void> => {
  const userRef = doc(db, 'users', uid)
  await updateDoc(userRef, { role })
}

// Admin: update user approval status
export const updateUserApprovalStatus = async (uid: string, approvalStatus: ApprovalStatus): Promise<void> => {
  const userRef = doc(db, 'users', uid)
  await updateDoc(userRef, { approvalStatus })
}

// Admin: fetch pending users
export const getPendingApprovalUsers = async (): Promise<UserManagement[]> => {
  const q = query(collection(db, 'users'), where('approvalStatus', '==', 'pending'))
  const querySnapshot = await getDocs(q)
  const users: UserManagement[] = []

  querySnapshot.forEach((doc) => {
    const data = doc.data()
    users.push({
      uid: doc.id,
      email: data.email,
      displayName: data.displayName,
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
      }
    })
  })

  return users.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

// Admin: reset user usage counters
export const resetUserUsage = async (uid: string): Promise<void> => {
  const userRef = doc(db, 'users', uid)
  const now = Timestamp.now()
  
  await updateDoc(userRef, {
    'usageCount.daily': 0,
    'usageCount.monthly': 0,
    'usageCount.lastReset.daily': now,
    'usageCount.lastReset.monthly': now
  })
}

// Fetch usage statistics
export const getUsageStats = async () => {
  const usersSnapshot = await getDocs(collection(db, 'users'))
  const promptsSnapshot = await getDocs(collection(db, 'prompts'))
  
  const stats = {
    totalUsers: 0,
    usersByRole: { free: 0, pro: 0, admin: 0 },
    totalPrompts: promptsSnapshot.size,
    dailyActiveUsers: 0,
    monthlyActiveUsers: 0
  }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  usersSnapshot.forEach((doc) => {
    const data = doc.data()
    stats.totalUsers++
    stats.usersByRole[data.role as UserRole]++
    
    // Users active today
    if (data.usageCount.daily > 0) {
      const lastDailyReset = data.usageCount.lastReset.daily.toDate()
      if (lastDailyReset >= today) {
        stats.dailyActiveUsers++
      }
    }
    
    // Users active this month
    if (data.usageCount.monthly > 0) {
      const lastMonthlyReset = data.usageCount.lastReset.monthly.toDate()
      if (lastMonthlyReset >= monthStart) {
        stats.monthlyActiveUsers++
      }
    }
  })

  return stats
}
