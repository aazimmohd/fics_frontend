'use client';

import { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, X } from 'lucide-react';

interface ContextualTooltipProps {
  children: React.ReactNode;
  content: string;
  elementId: string;
  showForNewUsers?: boolean;
  className?: string;
}

export function ContextualTooltip({ 
  children, 
  content, 
  elementId, 
  showForNewUsers = true,
  className = "" 
}: ContextualTooltipProps) {
  const [hasSeen, setHasSeen] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    // Check if user is new (hasn't completed tutorial)
    const tutorialData = localStorage.getItem('ficx_tutorial_completed');
    const onboardingData = localStorage.getItem('ficx_onboarding_data');
    
    if (showForNewUsers && onboardingData && !tutorialData) {
      setIsNewUser(true);
    }

    // Check if this specific tooltip has been seen
    const seenTooltips = JSON.parse(localStorage.getItem('ficx_seen_tooltips') || '{}');
    setHasSeen(!!seenTooltips[elementId]);
  }, [elementId, showForNewUsers]);

  const handleTooltipOpen = (open: boolean) => {
    if (open && !hasSeen) {
      // Mark this tooltip as seen
      const seenTooltips = JSON.parse(localStorage.getItem('ficx_seen_tooltips') || '{}');
      seenTooltips[elementId] = true;
      localStorage.setItem('ficx_seen_tooltips', JSON.stringify(seenTooltips));
      setHasSeen(true);
    }
  };

  // Don't show tooltip if user has seen it or is not a new user
  if (hasSeen || (!isNewUser && showForNewUsers)) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip onOpenChange={handleTooltipOpen}>
        <TooltipTrigger asChild>
          <div className={`relative ${className}`}>
            {children}
            {isNewUser && (
              <Badge 
                variant="secondary" 
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground text-xs animate-pulse"
              >
                <HelpCircle className="h-3 w-3" />
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="flex items-start gap-2">
            <HelpCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm">{content}</p>
              <p className="text-xs text-muted-foreground mt-1">
                This hint will disappear after you've seen it
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Predefined tooltip content for common elements
export const TOOLTIP_CONTENT = {
  DASHBOARD_METRICS: "These cards show your key performance indicators. Click on any metric to see detailed analytics.",
  QUICK_ACTIONS: "Quick actions help you address urgent items that need attention. Click 'Take Action' to resolve them.",
  NAVIGATION: "Use the sidebar to navigate between different sections of FiCX. Each section has specific features and tools.",
  WORKFLOW_BUILDER: "Drag and drop nodes to create workflows. Connect them with lines to define the flow of your automation.",
  FORM_BUILDER: "Add fields to your form by dragging them from the left panel. Configure each field's properties on the right.",
  TASK_MANAGEMENT: "Create, assign, and track tasks. Set due dates and priorities to keep your team organized.",
  NOTIFICATIONS: "Stay updated with real-time notifications about form submissions, task assignments, and workflow runs.",
  SETTINGS: "Configure your account, manage team members, and customize FiCX to match your workflow preferences.",
  AI_GENERATOR: "Describe your workflow in plain text and let AI generate the structure for you. Perfect for getting started quickly.",
  TEMPLATES: "Use pre-built templates as starting points for common workflows. Customize them to fit your specific needs."
} as const; 