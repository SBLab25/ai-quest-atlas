import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate, useLocation } from 'react-router-dom'
import ThemeToggleButton from '@/components/ui/theme-toggle-button'
import HeroSection from '@/components/landing/HeroSection'
import HowItWorksSection from '@/components/landing/HowItWorksSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import CommunitySection from '@/components/landing/CommunitySection'
import TestimonialsSection from '@/components/landing/TestimonialsSection'
import CallToActionSection from '@/components/landing/CallToActionSection'
import { LottieLoading } from '@/components/ui/LottieLoading'

const Index = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isNavigating, setIsNavigating] = useState(false)

  // Reset navigation state if we're still on the index page
  useEffect(() => {
    if (location.pathname === '/') {
      setIsNavigating(false)
    }
  }, [location.pathname])

  const handleGetStarted = () => {
    setIsNavigating(true)
    // Longer delay to show loading animation properly (800ms)
    setTimeout(() => {
      if (user) {
        navigate('/home', { replace: true })
      } else {
        navigate('/auth', { replace: true })
      }
    }, 800)
  }

  // Show loading when navigating
  if (isNavigating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LottieLoading size="lg" message="Loading..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggleButton start="top-right" />
      </div>

      {/* Hero Section */}
      <HeroSection onGetStarted={handleGetStarted} />
      
      {/* How It Works Section */}
      <HowItWorksSection />
      
      {/* Features Section */}
      <FeaturesSection />
      
      {/* Community Section */}
      <CommunitySection />
      
      {/* Testimonials Section */}
      <TestimonialsSection />
      
      {/* Call to Action Section */}
      <CallToActionSection onJoinAdventure={handleGetStarted} />
    </div>
  )
}


export default Index