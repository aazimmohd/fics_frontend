'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Play, 
  SkipForward,
  HelpCircle,
  FileText,
  Network,
  ListTodo,
  Settings,
  Users,
  Sparkles,
  Target,
  Zap,
  FileSpreadsheet,
  ListChecks,
  LayoutList,
  Shield,
  LogOut
} from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  icon?: React.ComponentType<any>;
}

interface TutorialOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  onComplete: () => void;
  onboardingData?: any;
}

const getTutorialSteps = (onboardingData: any): TutorialStep[] => {
  // If no onboarding data, provide default steps
  if (!onboardingData) {
    return [
      {
        id: 'welcome',
        title: 'Welcome to FiCX! 🎉',
        description: 'Let\'s take a comprehensive tour of your new workflow automation platform. We\'ll explore every feature to help you get started quickly.',
        target: 'body',
        position: 'top',
        icon: Target
      },
      {
        id: 'dashboard-overview',
        title: 'Your Dashboard',
        description: 'This is your command center. Here you can see real-time metrics, recent activity, and quick actions. Monitor your workflows, form submissions, and system performance at a glance.',
        target: '.dashboard-header',
        position: 'bottom',
        icon: Target
      },
      {
        id: 'navigation-intro',
        title: 'Main Navigation',
        description: 'This sidebar is your gateway to all FiCX features. Let\'s explore each section to understand what you can do.',
        target: '[data-sidebar="menu"]',
        position: 'right',
        icon: HelpCircle
      },
      {
        id: 'intake-forms-nav',
        title: 'Intake Forms',
        description: 'Create custom forms to collect information from your clients. Perfect for client onboarding, surveys, lead generation, and data collection. Build forms with various field types and validation rules.',
        target: '[href="/intake-forms"]',
        position: 'right',
        action: {
          label: 'Create Your First Form',
          href: '/intake-forms'
        },
        icon: FileText
      },
      {
        id: 'submissions-nav',
        title: 'Form Submissions',
        description: 'View and manage all form submissions in one place. Track responses, export data, and see submission analytics. This is where all your collected data lives.',
        target: '[href="/submissions"]',
        position: 'right',
        action: {
          label: 'View Submissions',
          href: '/submissions'
        },
        icon: FileSpreadsheet
      },
      {
        id: 'workflows-nav',
        title: 'Workflow Automation',
        description: 'Build powerful automated workflows that trigger when forms are submitted. Connect actions like sending emails, creating tasks, updating records, and more. This is where the magic happens!',
        target: '[href="/workflows"]',
        position: 'right',
        action: {
          label: 'Build a Workflow',
          href: '/workflows'
        },
        icon: Network
      },
      {
        id: 'trigger-runs-nav',
        title: 'Trigger Runs',
        description: 'Monitor the execution of your workflows in real-time. See which workflows are running, their status, logs, and performance metrics. Debug and optimize your automation.',
        target: '[href="/trigger-runs"]',
        position: 'right',
        action: {
          label: 'View Runs',
          href: '/trigger-runs'
        },
        icon: ListChecks
      },
      {
        id: 'tasks-nav',
        title: 'Task Management',
        description: 'Assign and track tasks across your team. Get notified when tasks are due or completed. Manage workflows, follow-ups, and team collaboration all in one place.',
        target: '[href="/tasks"]',
        position: 'right',
        action: {
          label: 'View Tasks',
          href: '/tasks'
        },
        icon: ListTodo
      },
      {
        id: 'templates-nav',
        title: 'Workflow Templates',
        description: 'Access pre-built workflow templates to get started quickly. Save time by using proven automation patterns for common business processes. (Coming Soon)',
        target: '[href="/templates"]',
        position: 'right',
        icon: LayoutList
      },
      {
        id: 'ai-generator-nav',
        title: 'AI Workflow Generator',
        description: 'Describe your workflow in plain text and let AI generate it for you. Perfect for getting started quickly or exploring new automation ideas. (Coming Soon)',
        target: '[href="/ai-generator"]',
        position: 'right',
        icon: Sparkles
      },
      {
        id: 'settings-nav',
        title: 'Settings & Configuration',
        description: 'Manage your account settings, integrations, email configurations, and system preferences. Customize FiCX to work exactly how you need it.',
        target: '[href="/settings"]',
        position: 'right',
        icon: Settings
      },
      {
        id: 'user-management-nav',
        title: 'User Management',
        description: 'Invite team members, assign roles, and manage permissions. Control who can access what features and ensure proper security for your organization.',
        target: '[href="/settings/users"]',
        position: 'right',
        icon: Users
      },
      {
        id: 'beta-management-nav',
        title: 'Beta Management',
        description: 'Access and manage beta features. Try out new functionality before it\'s released to everyone. Help shape the future of FiCX.',
        target: '[href="/settings/beta-management"]',
        position: 'right',
        icon: Shield
      },
      {
        id: 'help-support-nav',
        title: 'Help & Support',
        description: 'Access comprehensive help resources, tutorials, and support options. Get help when you need it and learn new features.',
        target: '[href="/help"]',
        position: 'right',
        icon: HelpCircle
      },
      {
        id: 'logout-nav',
        title: 'Logout',
        description: 'When you\'re done, you can safely log out of your account. Your data will be saved and you can log back in anytime.',
        target: '[data-sidebar="menu"] button:last-child',
        position: 'right',
        icon: LogOut
      },
      {
        id: 'complete',
        title: 'You\'re All Set! 🚀',
        description: 'You now have a comprehensive understanding of FiCX. Start by creating your first intake form or workflow, or explore the features that interest you most. Remember, you can always access Help & Support for more guidance.',
        target: 'body',
        position: 'top',
        action: {
          label: 'Start Building',
          onClick: () => {}
        },
        icon: Zap
      }
    ];
  }
  const baseSteps: TutorialStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to FiCX! 🎉',
      description: 'Let\'s take a comprehensive tour of your new workflow automation platform. We\'ll explore every feature to help you get started quickly.',
      target: 'body',
      position: 'top',
      icon: Target
    },
    {
      id: 'dashboard-overview',
      title: 'Your Dashboard',
      description: 'This is your command center. Here you can see real-time metrics, recent activity, and quick actions. Monitor your workflows, form submissions, and system performance at a glance.',
      target: '.dashboard-header',
      position: 'bottom',
      icon: Target
    },
    {
      id: 'navigation-intro',
      title: 'Main Navigation',
      description: 'This sidebar is your gateway to all FiCX features. Let\'s explore each section to understand what you can do.',
      target: '[data-sidebar="menu"]',
      position: 'right',
      icon: HelpCircle
    },
    {
      id: 'intake-forms-nav',
      title: 'Intake Forms',
      description: 'Create custom forms to collect information from your clients. Perfect for client onboarding, surveys, lead generation, and data collection. Build forms with various field types and validation rules.',
      target: '[href="/intake-forms"]',
      position: 'right',
      action: {
        label: 'Create Your First Form',
        href: '/intake-forms'
      },
      icon: FileText
    },
    {
      id: 'submissions-nav',
      title: 'Form Submissions',
      description: 'View and manage all form submissions in one place. Track responses, export data, and see submission analytics. This is where all your collected data lives.',
      target: '[href="/submissions"]',
      position: 'right',
      action: {
        label: 'View Submissions',
        href: '/submissions'
      },
      icon: FileSpreadsheet
    },
    {
      id: 'workflows-nav',
      title: 'Workflow Automation',
      description: 'Build powerful automated workflows that trigger when forms are submitted. Connect actions like sending emails, creating tasks, updating records, and more. This is where the magic happens!',
      target: '[href="/workflows"]',
      position: 'right',
      action: {
        label: 'Build a Workflow',
        href: '/workflows'
      },
      icon: Network
    },
    {
      id: 'trigger-runs-nav',
      title: 'Trigger Runs',
      description: 'Monitor the execution of your workflows in real-time. See which workflows are running, their status, logs, and performance metrics. Debug and optimize your automation.',
      target: '[href="/trigger-runs"]',
      position: 'right',
      action: {
        label: 'View Runs',
        href: '/trigger-runs'
      },
      icon: ListChecks
    },
    {
      id: 'tasks-nav',
      title: 'Task Management',
      description: 'Assign and track tasks across your team. Get notified when tasks are due or completed. Manage workflows, follow-ups, and team collaboration all in one place.',
      target: '[href="/tasks"]',
      position: 'right',
      action: {
        label: 'View Tasks',
        href: '/tasks'
      },
      icon: ListTodo
    },
    {
      id: 'templates-nav',
      title: 'Workflow Templates',
      description: 'Access pre-built workflow templates to get started quickly. Save time by using proven automation patterns for common business processes. (Coming Soon)',
      target: '[href="/templates"]',
      position: 'right',
      icon: LayoutList
    },
    {
      id: 'ai-generator-nav',
      title: 'AI Workflow Generator',
      description: 'Describe your workflow in plain text and let AI generate it for you. Perfect for getting started quickly or exploring new automation ideas. (Coming Soon)',
      target: '[href="/ai-generator"]',
      position: 'right',
      icon: Sparkles
    },
    {
      id: 'settings-nav',
      title: 'Settings & Configuration',
      description: 'Manage your account settings, integrations, email configurations, and system preferences. Customize FiCX to work exactly how you need it.',
      target: '[href="/settings"]',
      position: 'right',
      icon: Settings
    },
    {
      id: 'user-management-nav',
      title: 'User Management',
      description: 'Invite team members, assign roles, and manage permissions. Control who can access what features and ensure proper security for your organization.',
      target: '[href="/settings/users"]',
      position: 'right',
      icon: Users
    },
    {
      id: 'beta-management-nav',
      title: 'Beta Management',
      description: 'Access and manage beta features. Try out new functionality before it\'s released to everyone. Help shape the future of FiCX.',
      target: '[href="/settings/beta-management"]',
      position: 'right',
      icon: Shield
    },
    {
      id: 'help-support-nav',
      title: 'Help & Support',
      description: 'Access comprehensive help resources, tutorials, and support options. Get help when you need it and learn new features.',
      target: '[href="/help"]',
      position: 'right',
      icon: HelpCircle
    },
    {
      id: 'logout-nav',
      title: 'Logout',
      description: 'When you\'re done, you can safely log out of your account. Your data will be saved and you can log back in anytime.',
      target: '[data-sidebar="menu"] button:last-child',
      position: 'right',
      icon: LogOut
    }
  ];

  // Add final step
  const finalStep: TutorialStep = {
    id: 'complete',
    title: 'You\'re All Set! 🚀',
    description: 'You now have a comprehensive understanding of FiCX. Start by creating your first intake form or workflow, or explore the features that interest you most. Remember, you can always access Help & Support for more guidance.',
    target: 'body',
    position: 'top',
    action: {
      label: 'Start Building',
      onClick: () => {}
    },
    icon: Zap
  };

  return [...baseSteps, finalStep];
};

export function TutorialOverlay({ isVisible, onClose, onComplete, onboardingData }: TutorialOverlayProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPositioned, setIsPositioned] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const retryCountRef = useRef(0);

  const steps = getTutorialSteps(onboardingData);
  const currentStep = steps[currentStepIndex];

  useEffect(() => {
    if (isVisible && currentStep) {
      positionOverlay();
    }
  }, [isVisible, currentStepIndex, currentStep]);

  const positionOverlay = () => {
    if (!currentStep || currentStep.target === 'body') {
      setIsPositioned(true);
      return;
    }

    const targetElement = document.querySelector(currentStep.target);
    if (!targetElement) {
      // If target not found, wait a bit and try again
      retryCountRef.current += 1;
      
      // Give up after 50 retries (5 seconds)
      if (retryCountRef.current > 50) {
        setIsPositioned(true);
        return;
      }
      
      setTimeout(positionOverlay, 100);
      return;
    }
    
    // Reset retry count when element is found
    retryCountRef.current = 0;

    const targetRect = targetElement.getBoundingClientRect();
    const overlay = overlayRef.current;
    
    if (!overlay) return;

    const overlayRect = overlay.getBoundingClientRect();
    const padding = 20;

    let top = 0;
    let left = 0;

    switch (currentStep.position) {
      case 'top':
        top = targetRect.top - overlayRect.height - padding;
        left = targetRect.left + (targetRect.width / 2) - (overlayRect.width / 2);
        break;
      case 'bottom':
        top = targetRect.bottom + padding;
        left = targetRect.left + (targetRect.width / 2) - (overlayRect.width / 2);
        break;
      case 'left':
        top = targetRect.top + (targetRect.height / 2) - (overlayRect.height / 2);
        left = targetRect.left - overlayRect.width - padding;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height / 2) - (overlayRect.height / 2);
        left = targetRect.right + padding;
        break;
    }

    // Ensure overlay stays within viewport
    top = Math.max(padding, Math.min(top, window.innerHeight - overlayRect.height - padding));
    left = Math.max(padding, Math.min(left, window.innerWidth - overlayRect.width - padding));

    overlay.style.top = `${top}px`;
    overlay.style.left = `${left}px`;
    setIsPositioned(true);
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setIsPositioned(false);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setIsPositioned(false);
    }
  };

  const handleComplete = () => {
    // Mark tutorial as completed
    const tutorialData = {
      completed: true,
      completedAt: new Date().toISOString(),
      stepsCompleted: steps.length
    };
    localStorage.setItem('ficx_tutorial_completed', JSON.stringify(tutorialData));
    
    // Update onboarding data to not show tutorial again
    const existingOnboardingData = localStorage.getItem('ficx_onboarding_data');
    if (existingOnboardingData) {
      const data = JSON.parse(existingOnboardingData);
      data.showTutorial = false;
      localStorage.setItem('ficx_onboarding_data', JSON.stringify(data));
    }
    
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleAction = () => {
    if (currentStep.action?.href) {
      router.push(currentStep.action.href);
    }
    if (currentStep.action?.onClick) {
      currentStep.action.onClick();
    }
    handleNext();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      {/* Highlight overlay */}
      {currentStep.target !== 'body' && (
        <div className="absolute inset-0">
          <div className="relative w-full h-full">
            {(() => {
              const targetElement = document.querySelector(currentStep.target);
              if (!targetElement) return null;
              
              const rect = targetElement.getBoundingClientRect();
              return (
                <div
                  className="absolute border-2 border-primary rounded-lg shadow-lg"
                  style={{
                    top: rect.top - 4,
                    left: rect.left - 4,
                    width: rect.width + 8,
                    height: rect.height + 8,
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                  }}
                />
              );
            })()}
          </div>
        </div>
      )}

      {/* Tutorial card */}
      <div
        ref={overlayRef}
        className={`absolute transition-all duration-300 ${
          isPositioned ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        style={{ 
          maxWidth: '400px',
          // Fallback positioning if target element not found
          top: retryCountRef.current > 50 ? '50%' : undefined,
          left: retryCountRef.current > 50 ? '50%' : undefined,
          transform: retryCountRef.current > 50 ? 'translate(-50%, -50%)' : undefined
        }}
      >
        <Card className="shadow-2xl border-primary/20">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                {currentStep.icon && <currentStep.icon className="h-6 w-6 text-primary" />}
                <div>
                  <CardTitle className="text-lg">{currentStep.title}</CardTitle>
                  <Badge variant="secondary" className="mt-1">
                    {currentStepIndex + 1} of {steps.length}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              {currentStep.description}
            </p>
            
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentStepIndex === 0}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                >
                  <SkipForward className="h-4 w-4 mr-1" />
                  Skip Tour
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                {currentStep.action && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAction}
                  >
                    {currentStep.action.label}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
                
                <Button
                  onClick={handleNext}
                  size="sm"
                >
                  {currentStepIndex === steps.length - 1 ? (
                    <>
                      <Play className="h-4 w-4 mr-1" />
                      Get Started
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 