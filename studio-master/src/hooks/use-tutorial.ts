import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface OnboardingData {
  companyName: string;
  industry: string;
  companySize: string;
  goals: string[];
  teamSize: string;
  features: string[];
  completedAt: string;
  showTutorial: boolean;
}

interface TutorialData {
  completed: boolean;
  completedAt: string;
  stepsCompleted: number;
}

export function useTutorial() {
  const [isTutorialVisible, setIsTutorialVisible] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [tutorialData, setTutorialData] = useState<TutorialData | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if tutorial should be shown
    const shouldShowTutorial = searchParams.get('tutorial') === 'true';
    
    // Load onboarding data
    const storedOnboardingData = localStorage.getItem('ficx_onboarding_data');
    if (storedOnboardingData) {
      const data = JSON.parse(storedOnboardingData);
      setOnboardingData(data);
      
      // Check if tutorial was already completed
      const storedTutorialData = localStorage.getItem('ficx_tutorial_completed');
      if (storedTutorialData) {
        const tutorial = JSON.parse(storedTutorialData);
        setTutorialData(tutorial);
        
        // Show tutorial if explicitly requested via URL parameter, or if it hasn't been completed and should be shown
        if (shouldShowTutorial || (!tutorial.completed && data.showTutorial)) {
          setIsTutorialVisible(true);
        }
      } else if (shouldShowTutorial || data.showTutorial) {
        // No tutorial data found, show tutorial for first-time users
        setIsTutorialVisible(true);
      }
    } else {
      // Even without onboarding data, show tutorial if explicitly requested
      if (shouldShowTutorial) {
        setIsTutorialVisible(true);
      }
    }
  }, [searchParams]);

  const startTutorial = () => {
    setIsTutorialVisible(true);
  };

  const closeTutorial = () => {
    setIsTutorialVisible(false);
  };

  const completeTutorial = () => {
    const tutorialData: TutorialData = {
      completed: true,
      completedAt: new Date().toISOString(),
      stepsCompleted: 0 // Will be updated by tutorial component
    };
    
    localStorage.setItem('ficx_tutorial_completed', JSON.stringify(tutorialData));
    setTutorialData(tutorialData);
    setIsTutorialVisible(false);
    
    // Update onboarding data to not show tutorial again
    if (onboardingData) {
      const updatedData = { ...onboardingData, showTutorial: false };
      localStorage.setItem('ficx_onboarding_data', JSON.stringify(updatedData));
      setOnboardingData(updatedData);
    }
  };

  const resetTutorial = () => {
    localStorage.removeItem('ficx_tutorial_completed');
    setTutorialData(null);
    setIsTutorialVisible(false);
    
    // Reset onboarding data to show tutorial again
    if (onboardingData) {
      const updatedData = { ...onboardingData, showTutorial: true };
      localStorage.setItem('ficx_onboarding_data', JSON.stringify(updatedData));
      setOnboardingData(updatedData);
    }
  };

  const hasCompletedOnboarding = () => {
    return !!onboardingData;
  };

  const hasCompletedTutorial = () => {
    return tutorialData?.completed || false;
  };

  return {
    isTutorialVisible,
    onboardingData,
    tutorialData,
    startTutorial,
    closeTutorial,
    completeTutorial,
    resetTutorial,
    hasCompletedOnboarding,
    hasCompletedTutorial
  };
} 