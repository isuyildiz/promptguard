import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Auth/Login';
import Chat from './pages/Chat/Chat';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/chat" element={<Chat />} />
          
          {/* Kök dizine gelindiğinde otomatik Login'e yönlendir */}
          <Route path="/" element={<Navigate to="/login" />} />
          
          {/* Tanımsız rotalar için güvenli yönlendirme */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;