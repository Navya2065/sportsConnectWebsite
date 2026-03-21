import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/Shared/ProtectedRoute';

import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './pages/Dashboard';
import Explore from './pages/Explore';
import Messages from './pages/Messages';
import Sponsorships from './pages/Sponsorships';
import Profile from './pages/Profile';
import Feed from './pages/Feed';
 import Search from './pages/Search';



// inside Routes


const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#16161f',
                color: '#f0f0f5',
                border: '1px solid rgba(255,255,255,0.1)',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#c8f03d', secondary: '#0a0a0f' } },
              error: { iconTheme: { primary: '#ff4d6d', secondary: '#fff' } },
            }}
          />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/explore" element={
              <ProtectedRoute><Explore /></ProtectedRoute>
            } />
            <Route path="/messages" element={
              <ProtectedRoute><Messages /></ProtectedRoute>
            } />
            <Route path="/sponsorships" element={
              <ProtectedRoute><Sponsorships /></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />
           
           <Route path="/feed" element={
            <ProtectedRoute><Feed /></ProtectedRoute>
            } />
           <Route path="/search" element={
            <ProtectedRoute><Search /></ProtectedRoute>
            } />
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
