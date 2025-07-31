'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
}

export default function PrivateRoute({ children, requiredPermissions }: PrivateRouteProps) {
  const { isAuthenticated, user, hasPermission, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect while still loading
    if (isLoading) return;
    
    if (!isAuthenticated) {
      router.push('/auth/login');
    } else if (requiredPermissions && requiredPermissions.length > 0) {
      const userHasAllPermissions = requiredPermissions.every(permission => hasPermission(permission));
      if (!userHasAllPermissions) {
        // Redirect to an unauthorized page or home page
        router.push('/'); // Or a specific /unauthorized page
      }
    }
  }, [isAuthenticated, isLoading, requiredPermissions, hasPermission, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  if (requiredPermissions && requiredPermissions.length > 0) {
    const userHasAllPermissions = requiredPermissions.every(permission => hasPermission(permission));
    if (!userHasAllPermissions) {
      return null; // Or an unauthorized message
    }
  }

  return <>{children}</>;
}
