import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../services/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { Message } from '../components/Message'
import '../css/Profile.css'

export function Profile() {
  const { user, userRole, logout } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [showMessagingModal, setShowMessagingModal] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchUserData()
  }, [user, navigate])

  // Re-fetch user data when displayName might need updating
  useEffect(() => {
    if (user && !displayName) {
      fetchUserData()
    }
  }, [user, displayName])

  const fetchUserData = async () => {
    if (!user) return
    try {
      const userDocRef = doc(db, 'users', user.uid)
      const userDocSnap = await getDoc(userDocRef)
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data()
        if (userData.displayName) {
          setDisplayName(userData.displayName)
        } else {
          setDisplayName(user.email || 'User')
        }
      } else {
        setDisplayName(user.email || 'User')
      }
    } catch (err) {
      console.error('Error fetching user data:', err)
      setDisplayName(user.email || 'User')
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleDashboard = () => {
    navigate('/dashboard')
  }

  return (
    <>
      <div className="profile-page">
        <div className="profile-container">
          {/* User Profile Card */}
          <div className="profile-card">
            <div className="profile-header-top">
              
              <div className="profile-details">
                <h1 className="profile-display-name">{displayName}</h1>
                <p className="profile-email">{user?.email}</p>
              </div>
              <button onClick={handleLogout} className="btn-logout-header">
                Logout
              </button>
            </div>
          </div>


          {/* Messaging Section */}
          <div className="messaging-card">
            <div className="card-header">
              <h2> {userRole === 'admin' ? 'Customer Messages' : 'Message us for Customization'}</h2>
            </div>
            <div className="card-content">
              <button 
                onClick={() => setShowMessagingModal(true)} 
                className="btn btn-primary btn-lg"
              >
                {userRole === 'admin' ? 'View Messages' : 'Open Chat'}
              </button>
            </div>
          </div>

          {/* Admin Section */}
          {userRole === 'admin' && (
            <div className="dashboard-card">
              <div className="card-header">
                <h2>Dashboard</h2>
              </div>
              <div className="card-content">
                <button onClick={handleDashboard} className="btn btn-primary btn-lg">
                  Open Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messaging Component */}
      <Message 
        user={user}
        userRole={userRole}
        displayName={displayName}
        isOpen={showMessagingModal}
        onClose={() => setShowMessagingModal(false)}
      />
    </>
  )
}
