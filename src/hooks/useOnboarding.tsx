import { useState, useEffect } from 'react';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for highlighting
  action?: string; // Button text
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '🌍 Welcome to Discovery Atlas!',
    description: 'Explore the world through exciting quests, earn badges, and connect with a community of adventurers.',
    action: 'Get Started'
  },
  {
    id: 'quests',
    title: '🗺️ Find Your Quest',
    description: 'Browse available quests on the map or in the quest list. Each quest is a unique adventure waiting for you!',
    target: '[data-tour="quest-map"]',
    action: 'Next'
  },
  {
    id: 'submit',
    title: '📸 Complete Quests',
    description: 'Submit photos and descriptions to complete quests. Our AI verifies your submissions automatically!',
    target: '[data-tour="submit-button"]',
    action: 'Next'
  },
  {
    id: 'badges',
    title: '🏆 Earn Rewards',
    description: 'Complete quests to earn XP, badges, and NFTs. Level up and unlock new achievements!',
    target: '[data-tour="badges"]',
    action: 'Next'
  },
  {
    id: 'community',
    title: '👥 Join the Community',
    description: 'Connect with other adventurers, join teams, and share your discoveries!',
    target: '[data-tour="community"]',
    action: 'Finish'
  }
];

export const useOnboarding = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding
    const completed = localStorage.getItem('onboarding_completed');
    setHasCompletedOnboarding(completed === 'true');
  }, []);

  const startOnboarding = () => {
    setIsActive(true);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const skipOnboarding = () => {
    completeOnboarding();
  };

  const completeOnboarding = () => {
    setIsActive(false);
    setCurrentStep(0);
    setHasCompletedOnboarding(true);
    localStorage.setItem('onboarding_completed', 'true');
  };

  const resetOnboarding = () => {
    localStorage.removeItem('onboarding_completed');
    setHasCompletedOnboarding(false);
    setCurrentStep(0);
  };

  return {
    isActive,
    currentStep,
    steps: onboardingSteps,
    hasCompletedOnboarding,
    startOnboarding,
    nextStep,
    skipOnboarding,
    completeOnboarding,
    resetOnboarding,
    currentStepData: onboardingSteps[currentStep]
  };
};
