'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { GoogleSignInWrapper } from '@/components/shared/google-signin-wrapper';
import { storeGoogleCredential } from '@/lib/google-auth';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `username=${email}&password=${password}`,
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.detail || 'Login failed';
        
        // Check if the error is about missing beta access
        if (errorMessage.includes('Beta access required')) {
          setError('Beta access required. Please request beta access first.');
          // Redirect to beta enrollment after a short delay
          setTimeout(() => {
            router.push('/beta-enrollment');
          }, 2000);
          return;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      // Use AuthContext login function instead of direct localStorage and router
      await login(data.access_token);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>Enter your email and password to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full">Login</Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Don't have an account?{' '}
            <Link href="/auth/register" className="font-medium text-blue-600 hover:underline">
              Sign up
            </Link>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Need beta access?{' '}
            <Link href="/beta-enrollment" className="font-medium text-blue-600 hover:underline">
              Request access
            </Link>
          </div>
          {/* Google Sign-In Button Placeholder */}
          <div className="w-full mt-4">
            <GoogleSignInWrapper
              onSuccess={async (credentialResponse) => {
                try {
                  const response = await fetch('http://localhost:8000/api/auth/google-login', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ id_token: credentialResponse.credential }),
                  });

                  if (!response.ok) {
                    const errorData = await response.json();
                    const errorMessage = errorData.detail || 'Google login failed';
                    
                    // Check if the error is about missing beta access
                    if (errorMessage.includes('Beta access required')) {
                      setError('Beta access required. Please request beta access first.');
                      // Redirect to beta enrollment after a short delay
                      setTimeout(() => {
                        router.push('/beta-enrollment');
                      }, 2000);
                      return;
                    }
                    
                    throw new Error(errorMessage);
                  }

                  const data = await response.json();
                  // Store Google credential for proper logout
                  if (credentialResponse.credential) {
                    storeGoogleCredential(credentialResponse.credential);
                  }
                  // Use AuthContext login function instead of direct localStorage and router
                  await login(data.access_token);
                } catch (err: any) {
                  setError(err.message);
                }
              }}
              onError={() => {
                setError('Google login failed');
              }}
            />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
