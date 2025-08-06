'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Sparkles, 
  FileText, 
  Network, 
  ListTodo, 
  ArrowRight,
  Play,
  Target,
  Users,
  Zap
} from 'lucide-react';
import Link from 'next/link';

interface WelcomeBannerProps {
  onboardingData: any;
  onDismiss: () => void;
  onStartTutorial: () => void;
}

const getQuickActions = (features: string[]) => {
  const actions = [
    {
      id: 'intake-forms',
      title: 'Create Your First Form',
      description: 'Start collecting client information',
      icon: FileText,
      href: '/intake-forms',
      priority: features.includes('intake_forms') ? 'high' : 'medium'
    },
    {
      id: 'workflows',
      title: 'Build a Workflow',
      description: 'Automate your processes',
      icon: Network,
      href: '/workflows',
      priority: features.includes('workflow_automation') ? 'high' : 'medium'
    },
    {
      id: 'ai-generator',
      title: 'Try AI Generator',
      description: 'Generate workflows with AI',
      icon: Sparkles,
      href: '/ai-generator',
      priority: features.includes('ai_generator') ? 'high' : 'low'
    },
    {
      id: 'tasks',
      title: 'Set Up Tasks',
      description: 'Manage team assignments',
      icon: ListTodo,
      href: '/tasks',
      priority: features.includes('task_management') ? 'high' : 'medium'
    }
  ];

  // Sort by priority (high first, then medium, then low)
  return actions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
  });
};

const getWelcomeMessage = (goals: string[]) => {
  if (goals.includes('automate_onboarding')) {
    return "Let's automate your client onboarding process!";
  } else if (goals.includes('streamline_workflows')) {
    return "Ready to streamline your workflows?";
  } else if (goals.includes('improve_efficiency')) {
    return "Let's improve your team's efficiency!";
  } else {
    return "Welcome to FiCX! Let's get you started.";
  }
};

export function WelcomeBanner({ onboardingData, onDismiss, onStartTutorial }: WelcomeBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const quickActions = getQuickActions(onboardingData?.features || []);
  const welcomeMessage = getWelcomeMessage(onboardingData?.goals || []);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss();
  };

  return (
    <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-purple-50 dark:from-primary/10 dark:to-purple-950/20">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Target className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Welcome, {onboardingData?.companyName}! 🎉</h2>
                <p className="text-muted-foreground">{welcomeMessage}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
              {quickActions.slice(0, 4).map((action) => (
                <Link key={action.id} href={action.href}>
                  <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-border hover:border-primary/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <action.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{action.title}</h3>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={onStartTutorial} variant="outline" size="sm">
                <Play className="h-4 w-4 mr-2" />
                Take a Tour
              </Button>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Team size: {onboardingData?.teamSize || 'Not specified'}</span>
                <span>•</span>
                <span>Industry: {onboardingData?.industry}</span>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0 ml-4"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 