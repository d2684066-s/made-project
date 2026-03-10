import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import api from './api'; // Use our new intersected API

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('gce_token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem('gce_token');
            if (storedToken) {
                try {
                    const response = await api.get(`/api/auth/me/`);
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
        try {
            const response = await api.post(`/api/auth/login/`, credentials);
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
        } catch (error) {
            // Provide specific error messages for login failures
            if (error.response?.status === 401) {
                const errorMsg = error.response?.data?.error || 'Invalid phone/email or password';
                const customError = new Error(errorMsg);
                customError.status = 401;
                throw customError;
            } else if (error.response?.status === 400) {
                const errorMsg = error.response?.data?.error || 'Please fill in all required fields correctly';
                const customError = new Error(errorMsg);
                customError.status = 400;
                throw customError;
            }
            throw error;
        }
    };

    const signup = async (userData) => {
        try {
            const response = await api.post(`/api/auth/signup/`, userData);
            const { access_token, user: newUser } = response.data;

            localStorage.setItem('gce_token', access_token);
            setToken(access_token);
            setUser(newUser);

            return newUser;
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('gce_token');
        setToken(null);
        setUser(null);
        toast.info("Logged out successfully");
    };

    const isAuthenticated = !!token;

    return (
        <AuthContext.Provider value={{ user, token, loading, login, signup, logout, isAuthenticated }}>
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
