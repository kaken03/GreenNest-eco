import React, { useState } from 'react'
import '../css/AdminOrdersDashboard.css'

export default function AdminUsersDashboard({
  loading,
  error,
  allUsers,
  stats,
  filterRole,
  setFilterRole,
  handleDeleteUser,
  handleChangeRole,
  formatDate,
}) {
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [editingRole, setEditingRole] = useState({})

  const handleViewUser = (user) => {
    setSelectedUser(user)
    setShowUserDetails(true)
  }

  const handleCloseDetails = () => {
    setShowUserDetails(false)
    setSelectedUser(null)
  }

  const handleRoleChange = (userId, newRole) => {
    setEditingRole(prev => ({ ...prev, [userId]: newRole }))
  }

  const handleSaveRole = (userId) => {
    const newRole = editingRole[userId]
    if (newRole) {
      handleChangeRole(userId, newRole)
      setEditingRole(prev => {
        const updated = { ...prev }
        delete updated[userId]
        return updated
      })
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, role: newRole })
      }
    }
  }

  const filteredUsers = filterRole === 'all' ? allUsers : allUsers.filter((u) => u.role === filterRole)

  return (
    <>
      <div className="users-management-section">
        <div className="filters-section">
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filterRole === 'all' ? 'active' : ''}`}
              onClick={() => setFilterRole('all')}
            >
              All Users ({stats.total})
            </button>
            <button
              className={`filter-btn ${filterRole === 'user' ? 'active' : ''}`}
              onClick={() => setFilterRole('user')}
            >
              Customers ({stats.customers})
            </button>
            <button
              className={`filter-btn ${filterRole === 'admin' ? 'active' : ''}`}
              onClick={() => setFilterRole('admin')}
            >
              Admins ({stats.admins})
            </button>
          </div>
        </div>

        {loading && <div className="loading">Loading users...</div>}
        {error && <div className="error-message">{error}</div>}

        {!loading && allUsers.length === 0 && (
          <div className="empty-state">
            <p>No users found</p>
          </div>
        )}

        {!loading && filteredUsers.length === 0 && (
          <div className="empty-state">
            <p>No {filterRole === 'all' ? 'users' : filterRole === 'admin' ? 'admins' : 'customers'} found</p>
          </div>
        )}

        {!loading && filteredUsers.length > 0 && (
          <div className="users-list-container">
            {filteredUsers.map((user) => (
              <div key={user.id} className="user-card">
                <div className="user-card-header">
                  <div className="user-info">
                    <span className="user-name">{user.displayName || 'No Name'}</span>
                    <span className="user-email">{user.email}</span>
                  </div>
                  <span className={`user-role-badge role-${user.role}`}>
                    {user.role === 'admin' ? 'Admin' : 'Customer'}
                  </span>
                </div>

                <div className="user-card-body">
                  <div className="user-details-grid">
                    <div className="detail-item">
                      <span className="detail-label">Joined</span>
                      <span className="detail-value">{formatDate(user.createdAt)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Last Active</span>
                      <span className="detail-value">{formatDate(user.lastActive)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Phone</span>
                      <span className="detail-value">{user.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="user-card-actions">
                  <button
                    className="action-btn view-details-btn"
                    onClick={() => handleViewUser(user)}
                  >
                    View Details
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete ${user.displayName || user.email}?`)) {
                        handleDeleteUser(user.id)
                      }
                    }}
                  >
                    Delete User
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="modal-overlay" onClick={handleCloseDetails}>
          <div className="modal-content details-modal user-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-body">
              <div className="details-section">
                <div className="detail-item-row">
                  <span className="detail-label">Name:</span>
                  <span className="detail-value">{selectedUser.displayName || 'No Name'}</span>
                </div>
                <div className="detail-item-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{selectedUser.email}</span>
                </div>
                <div className="detail-item-row">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{selectedUser.phone || 'Not provided'}</span>
                </div>
                <div className="detail-item-row">
                  <span className="detail-label">Address:</span>
                  <span className="detail-value">{selectedUser.address || 'Not provided'}</span>
                </div>
              </div>

              <div className="divider"></div>

              <div className="details-section">
                <div className="detail-item-row">
                  <span className="detail-label">Joined:</span>
                  <span className="detail-value">{formatDate(selectedUser.createdAt)}</span>
                </div>
                <div className="detail-item-row">
                  <span className="detail-label">Last Active:</span>
                  <span className="detail-value">{formatDate(selectedUser.lastActive)}</span>
                </div>
                <div className="detail-item-row">
                  <span className="detail-label">Account Status:</span>
                  <span className={`detail-badge role-${selectedUser.role}`}>
                    {selectedUser.role === 'admin' ? 'Admin' : 'Customer'}
                  </span>
                </div>
              </div>

              <div className="divider"></div>

              <div className="role-management-section">
                <h4 className="section-title">Change Role</h4>
                <div className="role-selector">
                  <select
                    value={editingRole[selectedUser.id] || selectedUser.role}
                    onChange={(e) => handleRoleChange(selectedUser.id, e.target.value)}
                    className="role-select-input"
                  >
                    <option value="user">Customer</option>
                    <option value="admin">Admin</option>
                  </select>
                  {editingRole[selectedUser.id] && editingRole[selectedUser.id] !== selectedUser.role && (
                    <button
                      className="action-btn save-role-btn"
                      onClick={() => handleSaveRole(selectedUser.id)}
                    >
                      Save Role
                    </button>
                  )}
                </div>
              </div>

              <button className="btn btn-primary btn-close-modal" onClick={handleCloseDetails}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
