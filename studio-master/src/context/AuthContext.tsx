'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { apiRequest, isTokenExpired, startTokenExpirationCheck, publicApiRequest, SessionExpiredError } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  account_id: string;
  roles: any[]; // Define a proper type for roles later
  permissions: string[]; // Flattened list of permissions
  full_name?: string; // Add full_name to the User interface
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const userData = await apiRequest('/auth/me');
      
      // Extract permissions from roles
      const permissions = userData.roles?.flatMap((role: any) => 
        role.permissions?.map((perm: any) => perm.name) || []
      ) || [];
      
      const newUser: User = {
        id: userData.id,
        email: userData.email,
        account_id: userData.account_id,
        roles: userData.roles || [],
        permissions: permissions,
        full_name: userData.full_name,
      };
      setUser(newUser);
      setIsAuthenticated(true);

      // Check for onboarding status
      if (!userData.full_name) {
        router.push('/onboarding');
      }
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        // Session expiration is already handled by the API utility
        setUser(null);
        setIsAuthenticated(false);
        return;
      }
      
      console.error("Failed to fetch user profile:", error);
      // For other errors, just clear auth state without notification
      localStorage.removeItem('access_token');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const checkTokenAndFetchProfile = async () => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      setIsLoading(false);
      return;
    }
    
    // Check if token is expired before making API call
    if (isTokenExpired(token)) {
      localStorage.removeItem('access_token');
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      });
      
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
      return;
    }
    
    await fetchUserProfile();
  };

  useEffect(() => {
    checkTokenAndFetchProfile();
    
    // Start periodic token expiration check
    const intervalId = startTokenExpirationCheck();
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const login = async (token: string) => {
    localStorage.setItem('access_token', token);
    await fetchUserProfile();
    router.push('/');
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    setIsAuthenticated(false);
    
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
      variant: "default",
    });
    
    router.push('/auth/login');
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions.includes(permission) || false;
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
