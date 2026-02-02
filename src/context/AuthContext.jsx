import React, { createContext, useState, useEffect, useContext } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth, db } from '../services/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          setUser(currentUser)
          // Fetch user role from Firestore
          const userDocRef = doc(db, 'users', currentUser.uid)
          const userDocSnap = await getDoc(userDocRef)
          if (userDocSnap.exists()) {
            setUserRole(userDocSnap.data().role)
          }
        } else {
          setUser(null)
          setUserRole(null)
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    })

    return unsubscribe
  }, [])

  const register = async (email, password, displayName, role = 'student') => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const newUser = userCredential.user

      // Store user data in Firestore
      try {
        await setDoc(doc(db, 'users', newUser.uid), {
          uid: newUser.uid,
          email: email,
          displayName: displayName,
          role: role,
          createdAt: new Date(),
          orders: [],
        })
        console.log('User document created successfully:', newUser.uid)
      } catch (firestoreError) {
        console.error('Firestore error:', firestoreError)
        throw new Error(`Failed to save user data: ${firestoreError.message}`)
      }

      setUser(newUser)
      setUserRole(role)
      return newUser
    } catch (error) {
      console.error('Registration error:', error)
      const err = new Error(error.message)
      err.code = error.code
      throw err
    }
  }

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const currentUser = userCredential.user

      // Fetch user role from Firestore
      const userDocRef = doc(db, 'users', currentUser.uid)
      const userDocSnap = await getDoc(userDocRef)
      if (userDocSnap.exists()) {
        setUserRole(userDocSnap.data().role)
      }

      setUser(currentUser)
      return currentUser
    } catch (error) {
      const err = new Error(error.message)
      err.code = error.code
      throw err
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setUser(null)
      setUserRole(null)
    } catch (error) {
      throw new Error(error.message)
    }
  }

  const value = {
    user,
    userRole,
    loading,
    authLoading: loading,
    register,
    login,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
