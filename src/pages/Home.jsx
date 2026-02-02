import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoginModal } from '../components/LoginModal'
import { SignupModal } from '../components/SignupModal'
import '../css/Home.css'

export function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)

  const handleGetStarted = () => {
    if (user) {
      navigate('/shop')
    } else {
      setShowLoginModal(true)
    }
  }

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <div className="hero-text">
            <h1>GreenNest</h1>
            <p className="hero-subtitle">
              Rooted in Strenth, Designed for Growth
            </p>
            <button className="hero-btn" onClick={handleGetStarted}>
              {user ? 'Shop Now' : 'Get Started'}
            </button>
          </div>
        </div>
      </section>

      {/* Why Choose GreenNest */}
      <section className="cta-section">
        <h2>Why Choose GreenNest?</h2>
        <div className="cta-grid">
          <div className="cta-card">
            <div className="cta-icon">🌱</div>
            <h3>Eco-Friendly</h3>
            <p>Renewable bamboo materials that reduce environmental impact.</p>
          </div>
          <div className="cta-card">
            <div className="cta-icon">🛠️</div>
            <h3>Local Craftsmanship</h3>
            <p>Handcrafted by skilled Filipino artisans.</p>
          </div>
          <div className="cta-card">
            <div className="cta-icon">💪</div>
            <h3>Durable Quality</h3>
            <p>Stronger than many hardwoods and built to last.</p>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="landing-features">
        <h2>How It Works</h2>
        <div className="features-container">
          <div className="feature-card">
            <div className="feature-image">
              <img
                src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500"
                alt="Sustainable sourcing"
              />
              <span className="feature-badge">1</span>
            </div>
            <h3>Sustainable Sourcing</h3>
            <p>Responsibly harvested bamboo from trusted local farms.</p>
          </div>

          <div className="feature-card">
            <div className="feature-image">
              <img
                src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500"
                alt="Craftsmanship"
              />
              <span className="feature-badge">2</span>
            </div>
            <h3>Expert Crafting</h3>
            <p>Traditional and modern techniques combined.</p>
          </div>

          <div className="feature-card">
            <div className="feature-image">
              <img
                src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500"
                alt="Delivery"
              />
              <span className="feature-badge">3</span>
            </div>
            <h3>Delivered to You</h3>
            <p>Eco-friendly furniture straight to your home.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      {/* <section className="final-cta">
        <h2>Choose Sustainable Living</h2>
        <p>Support local artisans while protecting the planet.</p>
        <button className="cta-btn" onClick={handleGetStarted}>
          {user ? 'Explore Collection' : 'Get Started Today'}
        </button>
      </section> */}

      {/* Login Modal */}
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
    </div>
  )
}
