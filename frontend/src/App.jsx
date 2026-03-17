import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Auth/Login';
import Chat from './pages/Chat/Chat';
import Admin from './pages/Admin/Admin';

/* ─── Korumalı Route: giriş yapılmamışsa /login'e yönlendir ─── */
const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
};

/* ─── Admin Route: sadece admin/lecturer rolü erişebilir ─────── */
const AdminRoute = ({ children }) => {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  // Backend hazır olduğunda JWT'den gelen rol burada kontrol edilecek:
  // if (user?.role !== 'corporate_admin') return <Navigate to="/chat" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/chat" element={
          <PrivateRoute><Chat /></PrivateRoute>
        } />

        <Route path="/admin" element={
          <AdminRoute><Admin /></AdminRoute>
        } />

        <Route path="/"  element={<Navigate to="/login" replace />} />
        <Route path="*"  element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;