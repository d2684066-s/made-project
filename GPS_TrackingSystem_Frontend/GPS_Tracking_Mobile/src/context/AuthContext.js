import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// IMPORTANT: Set your backend URL here
const API_URL = 'http://localhost:8000'; // backend URL (change if needed)

// const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('gce_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('gce_token');
      if (storedToken) {
        try {
          const response = await axios.get(`${API_URL}/api/auth/me/`, {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          setUser(response.data);
          setToken(storedToken);
        } catch (error) {
          console.error('Auth init error:', error);
          localStorage.removeItem('gce_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials, type = 'admin') => {
    const response = await axios.post(`${API_URL}/api/auth/login/`, credentials);
    
    const { access_token, user: userData } = response.data;
    
    if (type === 'admin' && userData.role !== 'admin') {
      throw new Error('Access denied. Admin only.');
    }
    
    if (type === 'driver' && userData.role !== 'driver') {
      throw new Error('Access denied. Driver only.');
    }
    
    localStorage.setItem('gce_token', access_token);
    setToken(access_token);
    setUser(userData);
    
    return userData;
  };

  const signup = async (userData) => {
    const response = await axios.post(`${API_URL}/api/auth/signup/`, userData);
    
    const { access_token, user: newUser } = response.data;
    
    localStorage.setItem('gce_token', access_token);
    setToken(access_token);
    setUser(newUser);
    
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('gce_token');
    setToken(null);
    setUser(null);
  };

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`
  });

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, getAuthHeaders }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
