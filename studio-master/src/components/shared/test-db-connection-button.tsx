import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface TestDbConnectionButtonProps {
  configId: string;
}

export function TestDbConnectionButton({ configId }: TestDbConnectionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleTestConnection = async () => {
    console.log('🔍 Testing database connection for configId:', configId);
    setIsLoading(true);
    
    // Use environment variable for API base URL with fallback for development
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    
    const promise = fetch(`${API_BASE_URL}/database-configs/${configId}/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    toast.promise(promise, {
      loading: 'Testing connection...',
      success: async (response) => {
        console.log('📋 Response status:', response.status);
        console.log('📋 Response ok:', response.ok);
        
        if (response.ok) {
          const successData = await response.json();
          console.log('✅ Success response:', successData);
          setIsLoading(false);
          return successData.message || 'Connection to your database was successful!';
        } else {
          // Extract error message from response body
          let errorMessage = 'Database connection test failed';
          try {
            const errorData = await response.json();
            console.log('❌ Error response:', errorData);
            errorMessage = errorData.message || errorData.detail || errorMessage;
          } catch (parseError) {
            console.log('❌ Failed to parse error response:', parseError);
            errorMessage = `Database connection test failed (${response.status})`;
          }
          console.log('❌ Final error message:', errorMessage);
          setIsLoading(false);
          throw new Error(errorMessage);
        }
      },
      error: (err) => {
        console.log('🚨 Network error:', err);
        setIsLoading(false);
        return err.message || 'Connection failed.';
      },
    });
  };

  return (
    <Button
      onClick={handleTestConnection}
      disabled={isLoading}
      variant="outline"
      size="sm"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Testing...
        </>
      ) : (
        'Test'
      )}
    </Button>
  );
} 