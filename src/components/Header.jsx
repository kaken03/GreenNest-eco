import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { LoginModal } from './LoginModal'
import { SignupModal } from './SignupModal'
import { ProductModal } from './ProductModal'
import greennestLogo from '../images/greennestlogo1-Photoroom.png'
import '../css/Header.css'

export function Header() {
  const { user, userRole } = useAuth()
  const { getCartItemCount } = useCart()
  const navigate = useNavigate()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [modalCategory, setModalCategory] = useState('chair')

  return (
    <header className="header">
      <div className="header-container">
        <Link to={userRole === 'admin' ? '/dashboard' : '/home'} className="header-logo">
          <img 
                src={greennestLogo}
                alt="GreenNest Logo" 
                className="header-logo-img"
              />
        </Link>
        <nav className="header-nav">
          <Link to="/shop" title="View Shop" className="nav-link">
            Shop
          </Link>
          {user && userRole === 'admin' && (
            <button
              onClick={() => {
                setModalCategory('chair')
                setShowProductModal(true)
              }}
              className="nav-link add-product-btn"
              title="Add Product"
            >
              + Add Product
            </button>
          )}
          {user && userRole !== 'admin' && (
            <>
              
              <Link to="/cart" title="View Cart" className="nav-link">
                Cart <span className="cart-count-header">{getCartItemCount()}</span>
              </Link>
              <Link to="/orders" title="View Orders" className="nav-link">
                Orders
              </Link>
            </>
          )}
          {user && (
            <Link to="/profile" title="View Profile" className="nav-link">
              Profile
            </Link>
          )}
          {!user && (
            <button
              onClick={() => setShowLoginModal(true)}
              className="nav-link login-btn"
              title="Login"
            >
              Login
            </button>
          )}
        </nav>
        {!user && (
          <>
            <LoginModal
              isOpen={showLoginModal}
              onClose={() => setShowLoginModal(false)}
              onSwitchToSignup={() => {
                setShowLoginModal(false)
                setShowSignupModal(true)
              }}
            />
            <SignupModal
              isOpen={showSignupModal}
              onClose={() => setShowSignupModal(false)}
              onSwitchToLogin={() => {
                setShowSignupModal(false)
                setShowLoginModal(true)
              }}
            />
          </>
        )}
        {user && userRole === 'admin' && (
          <ProductModal
            isOpen={showProductModal}
            category={modalCategory}
            editingProduct={null}
            onClose={() => {
              setShowProductModal(false)
              setModalCategory('chair')
            }}
            onProductAdded={() => {
              setShowProductModal(false)
              setModalCategory('chair')
            }}
          />
        )}
      </div>
    </header>
  )
}
