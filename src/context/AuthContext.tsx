import React, { createContext, useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

interface User {
  id: string;
  username: string;
  email: string;
  credits: number;
  role: string;
  permissions: string[];
  company_id: string | null; // Add company_id
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  hasPermission: (permission: string) => boolean;
  // Add a way to trigger logout from outside, e.g., from api.ts
  triggerLogout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate(); // Initialize useNavigate

  // Ref to store the logout function to be accessible from outside
  const logoutRef = useRef<() => void>();

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUserState(null);
    setTokenState(null);
    setIsAuthenticated(false);
    navigate('/signin', { replace: true }); // Redirect to sign-in page
  }, [navigate]);

  // Assign logout to the ref
  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  // Expose a function to trigger logout from outside
  const triggerLogout = useCallback(() => {
    logoutRef.current?.();
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        setUserState(parsedUser);
        setTokenState(storedToken);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
        logout(); // Logout if stored user data is corrupted
      }
    }
    setIsLoading(false);
  }, [logout]);

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setUserState(newUser);
    setTokenState(newToken);
    setIsAuthenticated(true);
  }, []);

  const setUser = useCallback((updatedUser: User) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUserState(updatedUser);
  }, []);

  const hasPermission = useCallback((permission: string): boolean => {
    return user?.permissions?.includes(permission) || false;
  }, [user]);

  const authState: AuthState = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    setUser,
    hasPermission,
    triggerLogout, // Expose triggerLogout
  };

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
