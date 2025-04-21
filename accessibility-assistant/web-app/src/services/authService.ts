import { Buffer } from 'buffer';
import jwt from 'jsonwebtoken';
import * as db from './databaseService';

// Make Buffer globally available for jsonwebtoken
// This is necessary because JWT was designed for Node.js
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
}

// Secret key for JWT - in a real app, this would be an environment variable
const JWT_SECRET = 'accessibility-assistant-secret-key';
const TOKEN_EXPIRY = '7d'; // Token expires after 7 days

// LocalStorage key for storing the JWT token
const AUTH_TOKEN_KEY = 'auth_token';

// Types
interface JwtPayload {
  sub: string; // User ID
  email: string;
  iat: number; // Issued at timestamp
  exp: number; // Expiry timestamp
}

interface ProviderAuthResult {
  userId: string;
  isNewUser: boolean;
  userData?: {
    email: string;
    name?: string;
    profilePicture?: string;
  };
}

/**
 * Generate a JWT token for a user
 */
const generateToken = (userId: string, email: string): string => {
  return jwt.sign({ sub: userId, email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};

/**
 * Verify and decode a JWT token
 */
const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    console.error('Invalid token:', error);
    return null;
  }
};

/**
 * Save auth token to localStorage
 */
const saveAuthToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

/**
 * Get auth token from localStorage
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

/**
 * Remove auth token from localStorage
 */
const removeAuthToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

/**
 * Get the currently authenticated user's ID from the token
 */
export const getCurrentAuthUserId = (): string | null => {
  const token = getAuthToken();
  if (!token) return null;
  
  const decoded = verifyToken(token);
  return decoded ? decoded.sub : null;
};

/**
 * Login with email and password
 * Returns the user ID on success
 */
export const loginWithEmail = async (email: string, password: string): Promise<string> => {
  // For demo purposes, we'll implement a simplified version since we don't have a real backend
  // In a real app, this would send the credentials to a backend for verification
  
  // Check if user exists
  const user = await db.getUserByEmail(email);
  
  // If no user found or password doesn't match (in a real app, we'd use bcrypt to compare)
  if (!user || password !== 'demo123') { // Using hardcoded password just for demo
    throw new Error('Invalid email or password');
  }
  
  // Generate and save JWT token
  const token = generateToken(user.id, user.email);
  saveAuthToken(token);
  
  return user.id;
};

/**
 * Register with email and password
 * Returns the new user ID on success
 */
export const registerWithEmail = async (email: string, password: string): Promise<string> => {
  // For demo purposes, we'll implement a simplified version
  // In a real app, this would send the registration request to a backend
  
  // Check if email is already registered
  const existingUser = await db.getUserByEmail(email);
  if (existingUser) {
    throw new Error('Email is already registered');
  }
  
  // Generate a unique user ID
  const userId = `user-${Date.now()}`;
  
  // In a real app, we would hash the password before storing it
  // But since we're using IndexedDB for demo, we'll skip this step
  
  // Generate and save JWT token
  const token = generateToken(userId, email);
  saveAuthToken(token);
  
  return userId;
};

/**
 * Login with a third-party provider (OAuth)
 * Returns the user ID and whether the user is new
 */
export const loginWithProvider = async (provider: string): Promise<ProviderAuthResult> => {
  // In a real app, this would redirect to the provider's OAuth flow
  // For demo, we'll simulate a successful OAuth login
  
  // Generate a mock user
  const mockEmail = `user-${Date.now()}@${provider}.example.com`;
  const userId = `${provider}-user-${Date.now()}`;
  
  // For demo purposes, simulate a 50% chance of this being an existing user
  const isNewUser = Math.random() > 0.5;
  
  // Generate mock provider data
  const userData = {
    email: mockEmail,
    name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
    profilePicture: undefined // In a real app, this would come from the provider
  };
  
  // Generate and save JWT token
  const token = generateToken(userId, mockEmail);
  saveAuthToken(token);
  
  return { userId, isNewUser, userData };
};

/**
 * Logout the current user
 */
export const logout = async (): Promise<void> => {
  removeAuthToken();
};

/**
 * Check if the current session token is valid
 */
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  if (!token) return false;
  
  const decoded = verifyToken(token);
  return !!decoded;
};

/**
 * Refresh the current token (extends expiry)
 */
export const refreshToken = async (): Promise<boolean> => {
  const token = getAuthToken();
  if (!token) return false;
  
  const decoded = verifyToken(token);
  if (!decoded) return false;
  
  // Generate a new token with the same user info but extended expiry
  const newToken = generateToken(decoded.sub, decoded.email);
  saveAuthToken(newToken);
  
  return true;
};