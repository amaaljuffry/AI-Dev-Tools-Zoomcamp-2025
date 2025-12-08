import React, { createContext, useState, useContext, useEffect } from 'react';
import { API_BASE_URL } from '../config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in (from localStorage)
    const validateStoredAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      
      if (storedUser && storedToken) {
        try {
          // Validate the token by making a request to the backend
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });
          
          if (response.ok) {
            setUser(JSON.parse(storedUser));
            setToken(storedToken);
          } else {
            // Token is invalid, clear storage
            console.log('Stored token is invalid, clearing auth');
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Error validating stored auth:', error);
          // Keep the stored auth if we can't reach the server
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        }
      }
      setLoading(false);
    };
    
    validateStoredAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          return { success: false, error: 'Invalid username or password. Please check your credentials or sign up if you don\'t have an account.' };
        }
        return { success: false, error: data.detail || 'Login failed' };
      }

      const userData = data.user;
      const accessToken = data.access_token;

      setUser(userData);
      setToken(accessToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', accessToken);
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Unable to connect to server. Please try again later.' };
    }
  };

  const signup = async (username, email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      
      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 400) {
          return { success: false, error: data.detail || 'Username or email already exists' };
        }
        return { success: false, error: data.detail || 'Signup failed' };
      }

      const userData = data.user;
      const accessToken = data.access_token;

      setUser(userData);
      setToken(accessToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', accessToken);
      return { success: true, user: userData };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Unable to connect to server. Please try again later.' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const getAuthHeaders = () => {
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const value = {
    user,
    token,
    loading,
    login,
    signup,
    logout,
    getAuthHeaders
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
