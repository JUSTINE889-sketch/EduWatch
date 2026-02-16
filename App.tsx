
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { User, UserRole } from './types';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import IncidentReports from './pages/IncidentReports';
import IncidentForm from './pages/IncidentForm';
import AdminPanel from './pages/AdminPanel';
import SupportResources from './pages/SupportResources';
import Navbar from './components/Navbar';
import AICounselor from './components/AICounselor';
import AlertBanner from './components/AlertBanner';
import { ToastProvider } from './components/Toast';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedSession = localStorage.getItem('eduwatch_session');
    if (savedSession) {
      setUser(JSON.parse(savedSession));
    }
    setLoading(false);
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('eduwatch_session', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('eduwatch_session');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <HashRouter>
        <div className="min-h-screen flex flex-col bg-slate-50 transition-colors duration-200 relative">
          <AlertBanner />
          {user && <Navbar user={user} onLogout={handleLogout} />}
          <main className="flex-1 container mx-auto px-4 py-8">
            <Routes>
              <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage onLogin={handleLogin} />} />
              <Route path="/report-anonymous" element={<IncidentForm isAnonymous={true} />} />
              <Route path="/resources" element={<SupportResources />} />

              <Route path="/" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
              <Route path="/incidents" element={user ? <IncidentReports user={user} /> : <Navigate to="/login" />} />
              <Route path="/report" element={user ? <IncidentForm isAnonymous={false} user={user} /> : <Navigate to="/login" />} />
              <Route path="/admin" element={user?.role === UserRole.ADMIN ? <AdminPanel /> : <Navigate to="/" />} />
              
              <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
            </Routes>
          </main>
          
          <AICounselor />
        </div>
      </HashRouter>
    </ToastProvider>
  );
};

export default App;
