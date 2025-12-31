/**
 * AUTH STORAGE
 * ============
 * Handles authentication token and user data storage.
 * Uses the unified STORAGE_KEYS from the API layer.
 */

import { STORAGE_KEYS } from '../api/config';

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.authToken);
  } catch {
    return null;
  }
}

export function setAccessToken(token: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.authToken, token);
  } catch (error) {
    console.error('Failed to save auth token:', error);
  }
}

export function removeAccessToken(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.authToken);
  } catch {
    // Ignore errors
  }
}

// ============================================================================
// USER DATA MANAGEMENT
// ============================================================================

export function getStoredUser(): unknown | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.authUser);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: unknown): void {
  try {
    localStorage.setItem(STORAGE_KEYS.authUser, JSON.stringify(user));
  } catch (error) {
    console.error('Failed to save user data:', error);
  }
}

export function removeStoredUser(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.authUser);
  } catch {
    // Ignore errors
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getAuthHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function clearAuthData(): void {
  removeAccessToken();
  removeStoredUser();
}

// ============================================================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================================================

export const authStorage = {
  getToken: getAccessToken,
  setToken: setAccessToken,
  removeToken: removeAccessToken,
  getUser: getStoredUser,
  setUser: setStoredUser,
  removeUser: removeStoredUser,
  getHeaders: getAuthHeaders,
  clear: clearAuthData,
};

// Legacy named export
export const getAuthHeadersFromStorage = getAuthHeaders;
export const getAuthToken = getAccessToken;

export default authStorage;
