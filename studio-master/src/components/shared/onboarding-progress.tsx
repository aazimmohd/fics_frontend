'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  Target,
  FileText,
  Network,
  Users,
  Settings,
  Play
} from 'lucide-react';
import Link from 'next/link';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  completed: boolean;
  required: boolean;
}

interface OnboardingProgressProps {
  onboardingData: any;
  onStartTutorial: () => void;
}

const getOnboardingSteps = (onboardingData: any): OnboardingStep[] => {
  const steps: OnboardingStep[] = [
    {
      id: 'profile-setup',
      title: 'Profile Setup',
      description: 'Complete your company information',
      icon: Target,
      href: '/onboarding',
      completed: !!onboardingData?.companyName,
      required: true
    },
    {
      id: 'create-form',
      title: 'Create First Form',
      description: 'Build your first intake form',
      icon: FileText,
      href: '/intake-forms',
      completed: false, // This would be checked against actual data
      required: false
    },
    {
      id: 'build-workflow',
      title: 'Build First Workflow',
      description: 'Create an automated workflow',
      icon: Network,
      href: '/workflows',
      completed: false, // This would be checked against actual data
      required: false
    },
    {
      id: 'invite-team',
      title: 'Invite Team Members',
      description: 'Add your team to FiCX',
      icon: Users,
      href: '/settings/users',
      completed: false, // This would be checked against actual data
      required: false
    },
    {
      id: 'configure-settings',
      title: 'Configure Settings',
      description: 'Set up your preferences',
      icon: Settings,
      href: '/settings',
      completed: false, // This would be checked against actual data
      required: false
    }
  ];

  return steps;
};

export function OnboardingProgress({ onboardingData, onStartTutorial }: OnboardingProgressProps) {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onboardingSteps = getOnboardingSteps(onboardingData);
    setSteps(onboardingSteps);
    
    const completedSteps = onboardingSteps.filter(step => step.completed).length;
    const totalSteps = onboardingSteps.length;
    setProgress((completedSteps / totalSteps) * 100);
  }, [onboardingData]);

  const nextIncompleteStep = steps.find(step => !step.completed);

  if (progress === 100) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 dark:text-green-100">
                Onboarding Complete! 🎉
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                You've successfully set up FiCX. Ready to explore advanced features?
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onStartTutorial}>
              <Play className="h-4 w-4 mr-2" />
              Take Tour
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-purple-50 dark:from-primary/10 dark:to-purple-950/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Target className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">Getting Started</CardTitle>
              <p className="text-sm text-muted-foreground">
                Complete these steps to get the most out of FiCX
              </p>
            </div>
          </div>
          <Badge variant="secondary">
            {Math.round(progress)}% Complete
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                step.completed
                  ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                  : 'bg-background border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-center w-6 h-6">
                {step.completed ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <step.icon className="h-4 w-4 text-primary" />
                  <h4 className={`font-medium text-sm ${
                    step.completed ? 'text-green-900 dark:text-green-100' : ''
                  }`}>
                    {step.title}
                  </h4>
                  {step.required && (
                    <Badge variant="outline" className="text-xs">
                      Required
                    </Badge>
                  )}
                </div>
                <p className={`text-xs ${
                  step.completed ? 'text-green-700 dark:text-green-300' : 'text-muted-foreground'
                }`}>
                  {step.description}
                </p>
              </div>
              
              {!step.completed && (
                <Link href={step.href}>
                  <Button variant="outline" size="sm">
                    {step.required ? 'Complete' : 'Start'}
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>
        
        {nextIncompleteStep && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="text-sm font-medium">Next Step</p>
              <p className="text-xs text-muted-foreground">
                {nextIncompleteStep.title}
              </p>
            </div>
            <Link href={nextIncompleteStep.href}>
              <Button size="sm">
                Continue
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 