'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Building2, 
  Target, 
  Users, 
  FileText, 
  Workflow, 
  Zap,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    title: "Company Information",
    description: "Tell us about your organization",
    icon: Building2
  },
  {
    id: 2,
    title: "Goals & Objectives",
    description: "What do you want to achieve?",
    icon: Target
  },
  {
    id: 3,
    title: "Team Setup",
    description: "Configure your team structure",
    icon: Users
  },
  {
    id: 4,
    title: "Feature Preferences",
    description: "Choose what matters most to you",
    icon: Sparkles
  }
];

const industryOptions = [
  "Software Development",
  "Consulting",
  "Legal Services",
  "Healthcare",
  "Financial Services",
  "Education",
  "Real Estate",
  "Marketing & Advertising",
  "Manufacturing",
  "Retail",
  "Other"
];

const goalOptions = [
  { id: "automate_onboarding", label: "Automate client onboarding", icon: FileText },
  { id: "streamline_workflows", label: "Streamline internal workflows", icon: Workflow },
  { id: "improve_efficiency", label: "Improve team efficiency", icon: Zap },
  { id: "reduce_manual_tasks", label: "Reduce manual data entry", icon: CheckCircle },
  { id: "better_tracking", label: "Better project tracking", icon: Target },
  { id: "client_communication", label: "Improve client communication", icon: Users }
];

const featurePreferences = [
  { id: "intake_forms", label: "Intake Forms", description: "Create custom forms for client information" },
  { id: "workflow_automation", label: "Workflow Automation", description: "Automate repetitive tasks and processes" },
  { id: "task_management", label: "Task Management", description: "Assign and track tasks across your team" },
  { id: "ai_generator", label: "AI Workflow Generator", description: "Generate workflows using AI prompts" },
  { id: "templates", label: "Template Library", description: "Use pre-built templates for common workflows" },
  { id: "notifications", label: "Smart Notifications", description: "Get notified about important events" }
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [teamSize, setTeamSize] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const progress = (currentStep / onboardingSteps.length) * 100;

  const handleNext = () => {
    if (currentStep < onboardingSteps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleFeatureToggle = (featureId: string) => {
    setSelectedFeatures(prev => 
      prev.includes(featureId) 
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!user) {
      setError('User not authenticated.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Store onboarding data in localStorage for the tutorial system
      const onboardingData = {
        companyName,
        industry,
        companySize,
        goals: selectedGoals,
        teamSize,
        features: selectedFeatures,
        completedAt: new Date().toISOString(),
        showTutorial: true
      };
      
      localStorage.setItem('ficx_onboarding_data', JSON.stringify(onboardingData));

      // Update user profile
      const response = await fetch(`http://localhost:8000/api/users/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          full_name: `${companyName} (${industry})`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Onboarding failed');
      }

      // Redirect to dashboard with tutorial flag
      router.push('/dashboard?tutorial=true');
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="company-name">Company Name *</Label>
                <Input
                  id="company-name"
                  type="text"
                  placeholder="Acme Corporation"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="industry">Industry *</Label>
                <select
                  id="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="">Select your industry</option>
                  {industryOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="company-size">Company Size</Label>
                <select
                  id="company-size"
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select company size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-1000">201-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">What are your main goals with FiCX?</Label>
              <p className="text-sm text-muted-foreground mt-1">Select all that apply</p>
            </div>
            <div className="grid gap-3">
              {goalOptions.map((goal) => (
                <div
                  key={goal.id}
                  className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedGoals.includes(goal.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleGoalToggle(goal.id)}
                >
                  <Checkbox
                    checked={selectedGoals.includes(goal.id)}
                    onChange={() => handleGoalToggle(goal.id)}
                  />
                  <goal.icon className="h-5 w-5 text-primary" />
                  <Label className="flex-1 cursor-pointer">{goal.label}</Label>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="team-size">How many people will be using FiCX?</Label>
              <select
                id="team-size"
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select team size</option>
                <option value="1-5">1-5 users</option>
                <option value="6-15">6-15 users</option>
                <option value="16-50">16-50 users</option>
                <option value="50+">50+ users</option>
              </select>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Tip:</strong> You can always add more team members later in the Settings section.
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">Which features are most important to you?</Label>
              <p className="text-sm text-muted-foreground mt-1">We'll prioritize these in your tutorial</p>
            </div>
            <div className="grid gap-3">
              {featurePreferences.map((feature) => (
                <div
                  key={feature.id}
                  className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedFeatures.includes(feature.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleFeatureToggle(feature.id)}
                >
                  <Checkbox
                    checked={selectedFeatures.includes(feature.id)}
                    onChange={() => handleFeatureToggle(feature.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label className="font-medium cursor-pointer">{feature.label}</Label>
                    <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return companyName.trim() && industry;
      case 2:
        return selectedGoals.length > 0;
      case 3:
        return true; // Optional step
      case 4:
        return selectedFeatures.length > 0;
      default:
        return false;
    }
  };

  const isLastStep = currentStep === onboardingSteps.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Welcome to FiCX!</CardTitle>
          <CardDescription className="text-lg">
            Let's get you set up in just a few minutes
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {currentStep} of {onboardingSteps.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Indicator */}
          <div className="flex justify-center space-x-2">
            {onboardingSteps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                  step.id === currentStep
                    ? 'bg-primary text-primary-foreground'
                    : step.id < currentStep
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                {step.id < currentStep ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <step.icon className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{step.title}</span>
              </div>
            ))}
          </div>

          {/* Current Step Content */}
          <div className="min-h-[300px]">
            {renderStepContent()}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>

          {isLastStep ? (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className="flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span>Setting up...</span>
                </>
              ) : (
                <>
                  <span>Complete Setup</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center space-x-2"
            >
              <span>Next</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
