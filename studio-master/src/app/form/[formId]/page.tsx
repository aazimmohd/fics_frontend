'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Circle,
  ArrowRight,
  Send
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// --- INTERFACES & API ---

interface FormField {
  id: string;
  label: string;
  fieldType: 'text' | 'email' | 'dropdown' | 'textarea' | 'checkbox' | 'radio' | 'date' | 'number' | 'url' | 'phone' | 'rating';
  options?: string;
  isMandatory: boolean;
}

interface IntakeForm {
  id: string;
  name: string;
  definition: {
    fields: FormField[];
  };
}

interface FormSubmission {
  formId: string;
  formData: Record<string, any>;
}

interface FormStep {
  title: string;
  description: string;
  fields: FormField[];
}

// Use environment variable for API base URL with fallback for development
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const getFormDefinition = async (formId: string): Promise<IntakeForm> => {
  const { data } = await axios.get(`${API_URL}/public/intake-forms/${formId}`);
  return data;
};

const submitFormData = async ({ formId, formData }: FormSubmission) => {
  const { data } = await axios.post(`${API_URL}/intake-forms/${formId}/submissions`, { data: formData });
  return data;
};

// Helper function to group fields into logical steps
const groupFieldsIntoSteps = (fields: FormField[]): FormStep[] => {
  const steps: FormStep[] = [];
  let currentStepFields: FormField[] = [];
  let stepIndex = 0;

  fields.forEach((field, index) => {
    // Start new step based on field content or position
    const shouldStartNewStep = 
      field.label.toLowerCase().includes('contact') ||
      field.label.toLowerCase().includes('project name') ||
      field.label.toLowerCase().includes('business objective') ||
      field.label.toLowerCase().includes('must-have') ||
      field.label.toLowerCase().includes('branding') ||
      field.label.toLowerCase().includes('new or existing') ||
      field.label.toLowerCase().includes('primary point') ||
      currentStepFields.length >= 5; // Max 5 fields per step

    if (shouldStartNewStep && currentStepFields.length > 0) {
      steps.push({
        title: getStepTitle(stepIndex),
        description: getStepDescription(stepIndex),
        fields: currentStepFields
      });
      currentStepFields = [];
      stepIndex++;
    }

    currentStepFields.push(field);
  });

  // Add remaining fields to final step
  if (currentStepFields.length > 0) {
    steps.push({
      title: getStepTitle(stepIndex),
      description: getStepDescription(stepIndex),
      fields: currentStepFields
    });
  }

  return steps;
};

const getStepTitle = (index: number): string => {
  const titles = [
    'Contact Information',
    'Project Overview',
    'Business Goals',
    'Features & Scope',
    'Design & UX',
    'Technical Details',
    'Project Management',
    'Final Details'
  ];
  return titles[index] || `Step ${index + 1}`;
};

const getStepDescription = (index: number): string => {
  const descriptions = [
    'Let\'s start with your contact details',
    'Tell us about your project vision',
    'What are your business objectives?',
    'What features do you need?',
    'Any design preferences or inspiration?',
    'Technical requirements and constraints',
    'Who will be involved in the project?',
    'Any additional information or requirements'
  ];
  return descriptions[index] || 'Please provide the requested information';
};

export default function PublicFormPage() {
  const params = useParams();
  const formId = params.formId as string;
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [formSteps, setFormSteps] = useState<FormStep[]>([]);

  const { data: form, isLoading, isError } = useQuery<IntakeForm, Error>({
    queryKey: ['publicForm', formId],
    queryFn: () => getFormDefinition(formId),
    enabled: !!formId,
  });

  const { control, handleSubmit, watch, formState: { errors } } = useForm();

  const mutation = useMutation<any, Error, FormSubmission>({
    mutationFn: submitFormData,
    onSuccess: () => {
      toast({ title: "Success!", description: "Your form has been submitted." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Could not submit your form." });
    },
  });

  // Group fields into steps when form loads
  useEffect(() => {
    if (form?.definition.fields) {
      const steps = groupFieldsIntoSteps(form.definition.fields);
      setFormSteps(steps);
    }
  }, [form]);

  const onSubmit = (data: Record<string, any>) => {
    mutation.mutate({ formId, formData: data });
  };

  const nextStep = () => {
    if (currentStep < formSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isLastStep = currentStep === formSteps.length - 1;
  const progress = ((currentStep + 1) / formSteps.length) * 100;

  if (isLoading) return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Loading your form...</p>
      </div>
    </div>
  );

  if (isError || !form) return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <p className="text-red-600">Form not found or an error occurred.</p>
        </CardContent>
      </Card>
    </div>
  );

  if (mutation.isSuccess) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="pt-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
            <p className="text-gray-600 mb-4">Your submission for "{form.name}" has been received.</p>
            <Badge variant="outline" className="text-green-600 border-green-200">
              Successfully Submitted
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (formSteps.length === 0) return null;

  const currentStepData = formSteps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{form.name}</h1>
            <p className="text-gray-600">Please complete all steps to submit your form</p>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-500">{currentStep + 1} of {formSteps.length}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center space-x-2">
            {formSteps.map((_, index) => (
              <div
                key={index}
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all duration-200 ${
                  index <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl text-gray-900">{currentStepData.title}</CardTitle>
            <CardDescription className="text-lg text-gray-600">{currentStepData.description}</CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {currentStepData.fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.id} className="text-base font-medium">
                    {field.label} 
                    {field.isMandatory && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  
                  <Controller
                    name={field.id}
                    control={control}
                    rules={{ required: field.isMandatory }}
                    render={({ field: controllerField }) => {
                      switch (field.fieldType) {
                        case 'textarea':
                          return (
                            <Textarea 
                              id={field.id} 
                              {...controllerField} 
                              value={controllerField.value ?? ''} 
                              className="min-h-[100px] resize-none"
                              placeholder={`Enter your ${field.label.toLowerCase()}`}
                            />
                          );
                        
                        case 'dropdown':
                          return (
                            <Select onValueChange={controllerField.onChange} defaultValue={controllerField.value}>
                              <SelectTrigger>
                                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options?.split(',').map(opt => (
                                  <SelectItem key={opt.trim()} value={opt.trim()}>
                                    {opt.trim()}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          );
                        
                        case 'radio':
                          return (
                            <RadioGroup onValueChange={controllerField.onChange} value={controllerField.value}>
                              {field.options?.split(',').map(opt => (
                                <div key={opt.trim()} className="flex items-center space-x-2">
                                  <RadioGroupItem value={opt.trim()} id={`${field.id}-${opt.trim()}`} />
                                  <Label htmlFor={`${field.id}-${opt.trim()}`}>{opt.trim()}</Label>
                                </div>
                              ))}
                            </RadioGroup>
                          );
                        
                        case 'checkbox':
                          return (
                            <div className="space-y-2">
                              {field.options?.split(',').map(opt => (
                                <div key={opt.trim()} className="flex items-center space-x-2">
                                  <Checkbox id={`${field.id}-${opt.trim()}`} />
                                  <Label htmlFor={`${field.id}-${opt.trim()}`}>{opt.trim()}</Label>
                                </div>
                              ))}
                            </div>
                          );
                        
                        case 'email':
                          return (
                            <Input 
                              id={field.id} 
                              type="email" 
                              {...controllerField} 
                              value={controllerField.value ?? ''} 
                              placeholder="Enter your email address"
                            />
                          );
                        
                        case 'date':
                          return (
                            <Input 
                              id={field.id} 
                              type="date" 
                              {...controllerField} 
                              value={controllerField.value ?? ''} 
                            />
                          );
                        
                        case 'number':
                          return (
                            <Input 
                              id={field.id} 
                              type="number" 
                              {...controllerField} 
                              value={controllerField.value ?? ''} 
                              placeholder="Enter a number"
                            />
                          );
                        
                        case 'url':
                          return (
                            <Input 
                              id={field.id} 
                              type="url" 
                              {...controllerField} 
                              value={controllerField.value ?? ''} 
                              placeholder="https://example.com"
                            />
                          );
                        
                        case 'phone':
                          return (
                            <Input 
                              id={field.id} 
                              type="tel" 
                              {...controllerField} 
                              value={controllerField.value ?? ''} 
                              placeholder="Enter phone number"
                            />
                          );
                        
                        default:
                          return (
                            <Input 
                              id={field.id} 
                              type="text" 
                              {...controllerField} 
                              value={controllerField.value ?? ''} 
                              placeholder={`Enter ${field.label.toLowerCase()}`}
                            />
                          );
                      }
                    }}
                  />
                  
                  {errors[field.id] && (
                    <p className="text-sm text-red-500">{errors[field.id]?.message as string}</p>
                  )}
                </div>
              ))}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="flex items-center"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                {isLastStep ? (
                  <Button 
                    type="submit" 
                    disabled={mutation.isPending}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8"
                  >
                    {mutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Form
                      </>
                    )}
                  </Button>
                ) : (
                  <Button 
                    type="button"
                    onClick={nextStep}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 