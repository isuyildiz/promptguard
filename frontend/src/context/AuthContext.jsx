import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

function parseJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('token');
    if (!stored) return null;
    const decoded = parseJwt(stored);
    return decoded
      ? { email: null, mode: decoded.user_mode, userId: decoded.sub, role: decoded.role }
      : null;
  });

  const login = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    const decoded = parseJwt(newToken);
    setUser({
      email: userData.email,
      mode: decoded?.user_mode ?? userData.mode,
      userId: decoded?.sub,
      role: decoded?.role,
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);