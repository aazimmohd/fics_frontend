'use client';

import { useEffect, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { storeGoogleCredential } from '@/lib/google-auth';

interface GoogleSignInWrapperProps {
  onSuccess: (credentialResponse: any) => Promise<void>;
  onError?: () => void;
  useOneTap?: boolean;
  className?: string;
}

export function GoogleSignInWrapper({
  onSuccess,
  onError,
  useOneTap = true,
  className = ''
}: GoogleSignInWrapperProps) {
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if Google OAuth is loaded
    const checkGoogleLoaded = () => {
      if ((window as any).google && (window as any).google.accounts) {
        setIsGoogleLoaded(true);
      } else {
        // Retry after a short delay
        setTimeout(checkGoogleLoaded, 100);
      }
    };
    
    checkGoogleLoaded();
  }, []);

  const handleSuccess = async (credentialResponse: any) => {
    try {
      setError(null);
      await onSuccess(credentialResponse);
    } catch (err: any) {
      setError(err.message);
      onError?.();
    }
  };

  const handleError = () => {
    setError('Google login failed');
    onError?.();
  };

  // Suppress FedCM errors in console
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      const message = args[0];
      if (typeof message === 'string' && message.includes('FedCM')) {
        // Suppress FedCM errors
        return;
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  if (!isGoogleLoaded) {
    return (
      <div className={`w-full mt-4 ${className}`}>
        <div className="flex items-center justify-center p-4 border border-gray-300 rounded-md bg-gray-50">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
          <span className="ml-2 text-sm text-gray-600">Loading Google Sign-In...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full mt-4 ${className}`}>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        useOneTap={useOneTap}
      />
      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}
    </div>
  );
} 