import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../services/firebase'
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import '../css/Profile.css'

export function Profile() {
  const { user, userRole, logout } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [showMessagingModal, setShowMessagingModal] = useState(false)
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [inboxUsers, setInboxUsers] = useState([]) // for admin: list of users who messaged
  const [selectedConversationUser, setSelectedConversationUser] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchUserData()
    if (userRole === 'admin') {
      fetchInboxUsers()
    } else {
      // for regular users, load messages between user and shared admin
      fetchMessages('admin')
    }
  }, [user, navigate, userRole])

  const fetchUserData = async () => {
    try {
      const userDocRef = doc(db, 'users', user.uid)
      const userDocSnap = await getDoc(userDocRef)
      if (userDocSnap.exists()) {
        setDisplayName(userDocSnap.data().displayName || 'User')
      }
    } catch (err) {
      console.error('Error fetching user data:', err)
    }
  }

  // Admin inbox: list unique users who have messaged the shared admin
  const fetchInboxUsers = async () => {
    try {
      const q = query(
        collection(db, 'messages'),
        where('participants', 'array-contains', 'admin')
      )
      const snap = await getDocs(q)
      const map = new Map()
      for (const d of snap.docs) {
        const data = d.data()
        // identify the other participant(s) excluding 'admin'
        const other = (data.participants || []).find((p) => p !== 'admin')
        if (!other) continue
        const cur = map.get(other) || { userId: other, lastMessage: null, unread: 0 }
        // update last message if newer
        if (!cur.lastMessage || (data.createdAt && cur.lastMessage.createdAt && data.createdAt.seconds > cur.lastMessage.createdAt.seconds) || !cur.lastMessage.createdAt) {
          cur.lastMessage = { text: data.message, createdAt: data.createdAt }
        }
        // unread counts removed for now (simpler shared inbox)
        map.set(other, cur)
      }

      // fetch user info for each other participant
      const users = []
      for (const [userId, info] of map.entries()) {
        try {
          const userDoc = await getDoc(doc(db, 'users', userId))
          users.push({
            userId,
            displayName: userDoc.exists() ? (userDoc.data().displayName || userDoc.data().email || 'User') : 'User',
            email: userDoc.exists() ? userDoc.data().email : '',
            lastMessage: info.lastMessage,
            unread: 0,
          })
        } catch (e) {
          users.push({ userId, displayName: 'User', email: '', lastMessage: info.lastMessage, unread: info.unread || 0 })
        }
      }

      // sort by lastMessage desc
      users.sort((a, b) => {
        const ta = a.lastMessage?.createdAt?.seconds || 0
        const tb = b.lastMessage?.createdAt?.seconds || 0
        return tb - ta
      })

      setInboxUsers(users)
    } catch (err) {
      console.error('Error fetching inbox users:', err)
    }
  }

  const fetchMessages = async (otherParticipant) => {
    setLoadingMessages(true)
    try {
      // Query messages that involve the other participant (user or 'admin')
      const messagesQuery = query(
        collection(db, 'messages'),
        where('participants', 'array-contains', otherParticipant),
        orderBy('createdAt', 'asc')
      )
      const messagesSnapshot = await getDocs(messagesQuery)
      const userMessages = messagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setMessages(userMessages)
    } catch (err) {
      console.error('Error fetching messages:', err)
    }
    setLoadingMessages(false)
  }

  // auto-scroll to latest message when messages change or modal opens
  useEffect(() => {
    if (!messagesEndRef.current) return
    // use requestAnimationFrame to wait for DOM updates
    const raf = requestAnimationFrame(() => {
      try {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
      } catch (e) {
        messagesEndRef.current.scrollIntoView()
      }
    })
    return () => cancelAnimationFrame(raf)
  }, [messages, showMessagingModal, selectedConversationUser])

  // admin messages handled via inbox -> selecting a user will call fetchMessages(userId)

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return

    try {
      let receiverId = null
      let participants = []
      if (userRole === 'admin') {
        // admin must have selected a user conversation
        if (!selectedConversationUser) return
        receiverId = selectedConversationUser
        participants = [selectedConversationUser, 'admin']
      } else {
        // regular user: route to shared admin inbox
        receiverId = 'admin'
        participants = [user.uid, 'admin']
      }

      await addDoc(collection(db, 'messages'), {
        senderId: user.uid,
        senderName: displayName,
        receiverId,
        participants,
        message: messageInput,
        createdAt: serverTimestamp(),
        isRead: false
      })

      setMessageInput('')
      if (userRole === 'admin') {
        // refresh conversation and inbox
        fetchMessages(selectedConversationUser)
        fetchInboxUsers()
      } else {
        fetchMessages('admin')
      }
    } catch (err) {
      console.error('Error sending message:', err)
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
              {/* <p className="card-description">
                {userRole === 'admin' 
                  ? 'Manage and respond to customer messages.' 
                  : 'Send us a message to request customizations for your order.'}
              </p> */}
            </div>
          </div>

          {/* Admin Section */}
          {userRole === 'admin' && (
            <div className="dashboard-card">
              <div className="card-header">
                <h2>Dashboard</h2>
              </div>
              <div className="card-content">
                {/* <p className="card-description">
                  Access your admin dashboard to manage orders, users, and store settings.
                </p> */}
                <button onClick={handleAdminDashboard} className="btn btn-primary btn-lg">
                  Open Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messaging Modal */}
      {showMessagingModal && (
        <div className="modal-overlay" onClick={() => setShowMessagingModal(false)}>
          <div className="messaging-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="messaging-modal-header">
              <h3>{userRole === 'admin' ? 'Customer Messages' : 'Customization'}</h3>
              <button 
                className="modal-close-btn1" 
                onClick={() => setShowMessagingModal(false)}
              >
                ✕
              </button>
            </div>

            {userRole === 'admin' ? (
              <div className="admin-inbox">
                <div className="inbox-list">
                  {inboxUsers.length === 0 ? (
                    <div className="empty-state"><p>No conversations yet</p></div>
                  ) : (
                    inboxUsers.map(u => (
                      <button
                        key={u.userId}
                        className={`inbox-item ${selectedConversationUser === u.userId ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedConversationUser(u.userId)
                          fetchMessages(u.userId)
                        }}
                      >
                        <div className="inbox-left">
                          <div className="inbox-avatar">{u.displayName?.charAt(0)?.toUpperCase() || 'U'}</div>
                        </div>
                        <div className="inbox-mid">
                          <div className="inbox-name">{u.displayName}</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : null}

            <div className="messages-container">
              {loadingMessages ? (
                <div className="loading-state">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="empty-state">
                  <p>No messages yet. Start a conversation!</p>
                </div>
              ) : (
                <div className="messages-list">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`message-bubble ${msg.senderId === user.uid ? 'sent' : 'received'}`}
                    >
                      <p className="message-sender">{msg.senderName}</p>
                      <p className="message-text">{msg.message}</p>
                      {/* <span className="message-time">
                        {msg.createdAt?.toDate?.().toLocaleString() || 'Just now'}
                      </span> */}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="message-input-area">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className="message-input"
              />
              <button onClick={handleSendMessage} className="btn-send">
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
