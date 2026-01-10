// Manages authentication state and logic.
import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Clears authentication state.
  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  useEffect(() => {
    // Initializes authentication state on load.
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          try {
            // Checks token expiration.
            const decoded = jwtDecode(token);
            const currentTime = Date.now() / 1000;
            
            if (decoded.exp < currentTime) {
              // Logs out if token is expired.
              logout();
            } else {
              // Fetches user details.
              const response = await authAPI.getMe();
              setUser(response.data);
            }
          } catch (error) {
            console.error('Auth initialization failed:', error);
            logout();
          }
        }
      } catch (e) {
        console.error('Critical auth error:', e);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Authenticates user.
  const login = async (username, password) => {
    try {
      const response = await authAPI.login({ username, password });
      const { access, refresh } = response.data;
      
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      
      // Fetches user details.
      const userResponse = await authAPI.getMe();
      setUser(userResponse.data);
      return userResponse.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (userData) => {
    await authAPI.register(userData);
    // Automatically logs in after registration.
    return login(userData.username, userData.password);
  };


  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, updateUser: setUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
