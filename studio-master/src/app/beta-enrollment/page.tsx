'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Users, Zap } from 'lucide-react';

export default function BetaEnrollmentPage() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [useCase, setUseCase] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Use environment variable for API base URL with fallback for development
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${API_BASE_URL}/beta-enrollment/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          full_name: fullName, 
          company, 
          use_case: useCase 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.detail || 'Registration failed';
        
        // Check if user already has beta access
        if (errorMessage.includes('already registered for beta access')) {
          setError('You already have beta access! Please check your email for the invitation link or contact support.');
          return;
        }
        
        throw new Error(errorMessage);
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md text-center">
          <CardHeader className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-400">
              Beta Access Requested!
            </CardTitle>
            <CardDescription className="text-lg">
              Thank you for your interest in FiCX! We've received your beta enrollment request.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">What happens next?</h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• We'll review your application within 24-48 hours</li>
                <li>• You'll receive an email with your beta access invitation</li>
                <li>• Follow the link in the email to create your account</li>
              </ul>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              We're excited to have you join our beta program and help shape the future of client onboarding automation!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to <span className="text-blue-600 dark:text-blue-400">FiCX</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Streamline your client onboarding and automate workflows with our powerful platform
          </p>
          <Badge variant="secondary" className="mt-4 text-sm">
            <Clock className="w-4 h-4 mr-1" />
            Beta Program
          </Badge>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <Zap className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Automated Workflows</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Create powerful automation workflows to streamline your business processes
            </p>
          </div>
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <Users className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Client Onboarding</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Build custom intake forms and manage client data efficiently
            </p>
          </div>
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <CheckCircle className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Task Management</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Track and manage tasks with intelligent escalation and notifications
            </p>
          </div>
        </div>

        {/* Enrollment Form */}
        <div className="max-w-md mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Request Beta Access</CardTitle>
              <CardDescription>
                Join our exclusive beta program and be among the first to experience FiCX
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full Name *</Label>
                  <Input
                    id="full-name"
                    type="text"
                    placeholder="John Doe"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@company.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company Name</Label>
                  <Input
                    id="company"
                    type="text"
                    placeholder="Your Company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="use-case">How do you plan to use FiCX?</Label>
                  <Textarea
                    id="use-case"
                    placeholder="Tell us about your use case, current challenges, or what you're looking to achieve..."
                    rows={3}
                    value={useCase}
                    onChange={(e) => setUseCase(e.target.value)}
                  />
                </div>
                {error && (
          <div className="space-y-2">
            <p className="text-red-500 text-sm">{error}</p>
            {error.includes('already have beta access') && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  If you have your beta invitation link, you can register directly. 
                  Otherwise, please contact support for assistance.
                </p>
              </div>
            )}
          </div>
        )}
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Request Beta Access'}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                By requesting beta access, you agree to our terms of service and privacy policy.
              </p>
            </CardFooter>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Already have beta access?{' '}
            <a href="/auth/login" className="text-blue-600 dark:text-blue-400 hover:underline">
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 