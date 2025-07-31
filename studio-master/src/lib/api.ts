import { jwtDecode } from 'jwt-decode';
import { toast } from '@/hooks/use-toast';

const API_BASE_URL = 'http://localhost:8000/api';

interface JWTPayload {
  exp: number;
  sub: string;
  iat: number;
}

class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

class SessionExpiredError extends Error {
  constructor() {
    super('Session expired');
    this.name = 'SessionExpiredError';
  }
}

// Global flag to prevent multiple session expiration notifications
let isSessionExpiredNotificationShown = false;

// Function to check if JWT token is expired
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  
  try {
    const decoded = jwtDecode<JWTPayload>(token);
    const currentTime = Date.now() / 1000;
    
    // Add 30 second buffer to account for network delays
    return decoded.exp < (currentTime + 30);
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return true;
  }
}

// Function to get valid token or throw if expired
function getValidToken(): string {
  const token = localStorage.getItem('access_token');
  
  if (!token || isTokenExpired(token)) {
    handleSessionExpired();
    throw new SessionExpiredError();
  }
  
  return token;
}

// Function to handle session expiration
function handleSessionExpired() {
  if (isSessionExpiredNotificationShown) {
    return; // Don't show multiple notifications
  }
  
  isSessionExpiredNotificationShown = true;
  
  // Clear the token
  localStorage.removeItem('access_token');
  
  // Show toast notification
  toast({
    title: "Session Expired",
    description: "Your session has expired. Please log in again.",
    variant: "destructive",
  });
  
  // Redirect to login after a short delay
  setTimeout(() => {
    window.location.href = '/auth/login';
  }, 2000);
}

// Function to handle API responses
async function handleResponse(response: Response): Promise<any> {
  if (response.status === 401) {
    handleSessionExpired();
    throw new SessionExpiredError();
  }
  
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch (e) {
      // If we can't parse the error response, use the status text
      errorMessage = response.statusText || errorMessage;
    }
    
    throw new ApiError(errorMessage, response.status);
  }
  
  // Reset the session expiration notification flag on successful requests
  isSessionExpiredNotificationShown = false;
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return response.text();
}

// Authenticated fetch wrapper
export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const token = getValidToken();
  
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    return await handleResponse(response);
  } catch (error) {
    if (error instanceof SessionExpiredError) {
      throw error;
    }
    console.error('API request failed:', error);
    throw error;
  }
}

// Convenience methods for different HTTP methods
export const api = {
  get: (endpoint: string, options?: RequestInit) => 
    apiRequest(endpoint, { ...options, method: 'GET' }),
    
  post: (endpoint: string, data?: any, options?: RequestInit) => 
    apiRequest(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  put: (endpoint: string, data?: any, options?: RequestInit) => 
    apiRequest(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  delete: (endpoint: string, options?: RequestInit) => 
    apiRequest(endpoint, { ...options, method: 'DELETE' }),
    
  patch: (endpoint: string, data?: any, options?: RequestInit) => 
    apiRequest(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),
};

// Function to check token expiration periodically
export function startTokenExpirationCheck(): NodeJS.Timeout {
  const checkInterval = 60000; // Check every minute
  
  const intervalId = setInterval(() => {
    const token = localStorage.getItem('access_token');
    if (token && isTokenExpired(token)) {
      handleSessionExpired();
      clearInterval(intervalId);
    }
  }, checkInterval);
  
  return intervalId;
}

// Public API request (no auth required)
export async function publicApiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    return await handleResponse(response);
  } catch (error) {
    console.error('Public API request failed:', error);
    throw error;
  }
}

export { ApiError, SessionExpiredError }; 