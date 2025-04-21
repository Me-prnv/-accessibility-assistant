import React, { createContext, useState, useEffect, useContext } from 'react';
import * as authService from '../services/authService';
import * as userService from '../services/userService';
import { UserProfile } from '../database/schema';

interface AuthContextType {
  currentUser: UserProfile | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (email: string, password: string, name: string) => Promise<UserProfile>;
  loginWithProvider: (provider: 'google' | 'apple' | 'microsoft') => Promise<UserProfile>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component that wraps the app and makes auth available
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        setIsLoading(true);
        // Check authentication status
        const isAuthenticated = await authService.isAuthenticated();
        
        if (isAuthenticated) {
          // Get the current user profile
          const userProfile = await userService.getCurrentUserProfile();
          setCurrentUser(userProfile);
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Auth state check error:', err);
        setError('Failed to check authentication status');
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthState();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<UserProfile> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Authenticate with credentials
      const authResult = await authService.login(email, password);
      
      if (!authResult.success) {
        throw new Error(authResult.error || 'Login failed');
      }
      
      // Get user profile
      const userProfile = await userService.getCurrentUserProfile();
      
      if (!userProfile) {
        throw new Error('Failed to retrieve user profile');
      }
      
      setCurrentUser(userProfile);
      return userProfile;
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (email: string, password: string, name: string): Promise<UserProfile> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Register new user
      const authResult = await authService.register(email, password, name);
      
      if (!authResult.success) {
        throw new Error(authResult.error || 'Registration failed');
      }
      
      // Get user profile
      const userProfile = await userService.getCurrentUserProfile();
      
      if (!userProfile) {
        throw new Error('Failed to retrieve user profile');
      }
      
      setCurrentUser(userProfile);
      return userProfile;
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Login with provider function
  const loginWithProvider = async (
    provider: 'google' | 'apple' | 'microsoft'
  ): Promise<UserProfile> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Authenticate with provider
      const authResult = await authService.loginWithProvider(provider);
      
      if (!authResult.success) {
        throw new Error(authResult.error || `Login with ${provider} failed`);
      }
      
      // Get user profile
      const userProfile = await userService.getCurrentUserProfile();
      
      if (!userProfile) {
        throw new Error('Failed to retrieve user profile');
      }
      
      setCurrentUser(userProfile);
      return userProfile;
    } catch (err: any) {
      setError(err.message || `An error occurred during ${provider} login`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await authService.logout();
      setCurrentUser(null);
    } catch (err: any) {
      setError(err.message || 'An error occurred during logout');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await authService.resetPassword(email);
      return result.success;
    } catch (err: any) {
      setError(err.message || 'An error occurred during password reset');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Auth context value
  const value = {
    currentUser,
    isLoggedIn: !!currentUser,
    isLoading,
    error,
    login,
    register,
    loginWithProvider,
    logout,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;