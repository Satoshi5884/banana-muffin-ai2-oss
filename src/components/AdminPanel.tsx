import { useState, useEffect } from 'react'
import { getAllUsers, updateUserRole, resetUserUsage, getUsageStats, updateUserApprovalStatus, getPendingApprovalUsers, type UserManagement } from '../lib/firestore'
import type { UserRole, ApprovalStatus } from '../contexts/AuthContext'

export default function AdminPanel() {
  const [users, setUsers] = useState<UserManagement[]>([])
  const [pendingUsers, setPendingUsers] = useState<UserManagement[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'users' | 'pending' | 'stats'>('pending')

  const loadData = async () => {
    setLoading(true)
    try {
      const [usersData, pendingData, statsData] = await Promise.all([
        getAllUsers(),
        getPendingApprovalUsers(),
        getUsageStats()
      ])
      setUsers(usersData)
      setPendingUsers(pendingData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    try {
      await updateUserRole(uid, newRole)
      await loadData()
    } catch (error) {
      console.error('Role update error:', error)
      alert('Failed to update role')
    }
  }

  const handleApprovalStatusChange = async (uid: string, newStatus: ApprovalStatus) => {
    try {
      await updateUserApprovalStatus(uid, newStatus)
      await loadData()
    } catch (error) {
      console.error('Approval status update error:', error)
      alert('Failed to update approval status')
    }
  }

  const handleResetUsage = async (uid: string) => {
    if (!confirm('Reset this user\'s usage count?')) return
    try {
      await resetUserUsage(uid)
      await loadData()
    } catch (error) {
      console.error('Usage reset error:', error)
      alert('Failed to reset usage count')
    }
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700'
      case 'pro': return 'bg-green-100 text-green-700'
      case 'free': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getApprovalStatusColor = (status: ApprovalStatus) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'rejected': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending Approvals ({pendingUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            User Management ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stats'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Usage Statistics
          </button>
        </nav>
      </div>

      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Users Awaiting Approval</h3>
              <p className="text-sm text-gray-500">Review and approve/reject user access requests</p>
            </div>
            {pendingUsers.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <div className="text-gray-500">No pending approvals</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registration Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingUsers.map((user) => (
                      <tr key={user.uid}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.displayName || 'Not set'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.createdAt.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleApprovalStatusChange(user.uid, 'approved')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleApprovalStatusChange(user.uid, 'rejected')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Approval Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usage Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registration Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.uid}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.displayName || 'Not set'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.uid, e.target.value as UserRole)}
                          className={`text-sm rounded-full px-2 py-1 font-medium border ${getRoleColor(user.role)}`}
                        >
                          <option value="free">Free</option>
                          <option value="pro">Pro</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.approvalStatus}
                          onChange={(e) => handleApprovalStatusChange(user.uid, e.target.value as ApprovalStatus)}
                          className={`text-sm rounded-full px-2 py-1 font-medium border ${getApprovalStatusColor(user.approvalStatus)}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 space-y-0.5">
                          <div>Daily: {user.usageCount.daily}</div>
                          <div>Monthly: {user.usageCount.monthly}{user.role === 'pro' ? ' credits' : ''}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleResetUsage(user.uid)}
                          className="text-orange-600 hover:text-orange-900"
                        >
                          Reset Usage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stats' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 border">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
          </div>
          
          <div className="bg-white rounded-lg p-6 border">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Users by Role</h3>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Free:</span>
                <span className="font-medium">{stats.usersByRole.free}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pro:</span>
                <span className="font-medium">{stats.usersByRole.pro}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Admin:</span>
                <span className="font-medium">{stats.usersByRole.admin}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Total Prompts</h3>
            <p className="text-3xl font-bold text-green-600">{stats.totalPrompts}</p>
          </div>

          <div className="bg-white rounded-lg p-6 border">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Daily Active Users</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.dailyActiveUsers}</p>
          </div>

          <div className="bg-white rounded-lg p-6 border">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Monthly Active Users</h3>
            <p className="text-3xl font-bold text-orange-600">{stats.monthlyActiveUsers}</p>
          </div>

          <div className="bg-white rounded-lg p-6 border">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Data Refresh</h3>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Reload Data
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
