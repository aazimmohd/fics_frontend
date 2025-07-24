import React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function TestSonner() {
  const handleTestToast = () => {
    toast.success('Sonner is working correctly!');
  };

  const handleTestPromise = () => {
    const promise = new Promise((resolve) => {
      setTimeout(() => resolve('Promise resolved!'), 2000);
    });

    toast.promise(promise, {
      loading: 'Testing promise...',
      success: (data) => `${data}`,
      error: 'Promise failed',
    });
  };

  return (
    <div className="flex gap-2">
      <Button onClick={handleTestToast} variant="outline" size="sm">
        Test Simple Toast
      </Button>
      <Button onClick={handleTestPromise} variant="outline" size="sm">
        Test Promise Toast
      </Button>
    </div>
  );
} 