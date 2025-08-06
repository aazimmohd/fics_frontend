/**
 * Google OAuth utility functions for handling login and logout
 */

export interface GoogleCredentialResponse {
  credential?: string;
  select_by?: string;
}

/**
 * Store Google credential for logout purposes
 */
export const storeGoogleCredential = (credential: string): void => {
  localStorage.setItem('google_token', credential);
};

/**
 * Clear Google credential from storage
 */
export const clearGoogleCredential = (): void => {
  localStorage.removeItem('google_token');
};

/**
 * Get stored Google credential
 */
export const getGoogleCredential = (): string | null => {
  return localStorage.getItem('google_token');
};

/**
 * Check if user is logged in via Google
 */
export const isGoogleUser = (): boolean => {
  return !!getGoogleCredential();
};

/**
 * Revoke Google OAuth token
 */
export const revokeGoogleToken = async (token: string): Promise<void> => {
  try {
    const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      console.warn('Failed to revoke Google token:', response.statusText);
    }
  } catch (error) {
    console.warn('Failed to revoke Google token:', error);
    // Don't throw error as this is not critical for logout
  }
};

/**
 * Complete Google Sign-In logout process
 */
export const performGoogleLogout = async (): Promise<void> => {
  const googleToken = getGoogleCredential();
  
  if (googleToken) {
    await revokeGoogleToken(googleToken);
    clearGoogleCredential();
  }
  
  // Clear any Google Sign-In state by refreshing the page
  // This ensures all Google Sign-In components are properly reset
  window.location.href = '/auth/login';
};

/**
 * Handle Google Sign-In logout with fallback
 */
export const handleGoogleLogout = async (): Promise<void> => {
  try {
    await performGoogleLogout();
  } catch (error) {
    console.warn('Error during Google logout:', error);
    // Fallback to page refresh if Google logout fails
    window.location.href = '/auth/login';
  }
};

/**
 * Clean logout without page refresh (for cases where you want to stay on the same page)
 */
export const cleanGoogleLogout = async (): Promise<void> => {
  const googleToken = getGoogleCredential();
  
  if (googleToken) {
    await revokeGoogleToken(googleToken);
    clearGoogleCredential();
  }
}; 