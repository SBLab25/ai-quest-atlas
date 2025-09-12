import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import ThemeToggleButton from '@/components/ui/theme-toggle-button'
import HeroSection from '@/components/landing/HeroSection'
import HowItWorksSection from '@/components/landing/HowItWorksSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import CommunitySection from '@/components/landing/CommunitySection'
import TestimonialsSection from '@/components/landing/TestimonialsSection'
import CallToActionSection from '@/components/landing/CallToActionSection'

const Index = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleGetStarted = () => {
    if (user) navigate('/home')
    else navigate('/auth')
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