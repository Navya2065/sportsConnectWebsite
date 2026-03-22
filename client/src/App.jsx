import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/Shared/ProtectedRoute';
import AppLayout from './components/Shared/AppLayout';

import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './pages/Dashboard';
import Explore from './pages/Explore';
import Messages from './pages/Messages';
import Sponsorships from './pages/Sponsorships';
import Profile from './pages/Profile';
import Feed from './pages/Feed';
import Search from './pages/Search';

const App = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-strong)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                },
                success: { iconTheme: { primary: 'var(--accent)', secondary: 'var(--bg-primary)' } },
                error: { iconTheme: { primary: 'var(--red)', secondary: '#fff' } },
              }}
            />
            <Routes>
              {/* Public routes — no layout */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected routes — wrapped in AppLayout */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <AppLayout title="Dashboard">
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/feed" element={
                <ProtectedRoute>
                  <AppLayout title="Feed">
                    <Feed />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/explore" element={
                <ProtectedRoute>
                  <AppLayout title="Explore">
                    <Explore />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/search" element={
                <ProtectedRoute>
                  <AppLayout title="Search">
                    <Search />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/messages" element={
                <ProtectedRoute>
                  <AppLayout title="Messages" hideChat>
                    <Messages />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/sponsorships" element={
                <ProtectedRoute>
                  <AppLayout title="Sponsorships">
                    <Sponsorships />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <AppLayout title="Profile">
                    <Profile />
                  </AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;