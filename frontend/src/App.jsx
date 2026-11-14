import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Toast from './components/Toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Books from './pages/Books';
import Members from './pages/Members';
import Loans from './pages/Loans';
import Reports from './pages/Reports';
import api from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('library_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [is3dEnabled, setIs3dEnabled] = useState(true);
  const [dbConnected, setDbConnected] = useState(false);
  const [toast, setToast] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [bookSearchQuery, setBookSearchQuery] = useState('');

  // Periodic health check
  const checkDatabaseHealth = async () => {
    try {
      const res = await api.checkHealth();
      setDbConnected(res.database?.ok === true);
    } catch (err) {
      setDbConnected(false);
    }
  };

  useEffect(() => {
    api.init();
    checkDatabaseHealth();

    const interval = setInterval(checkDatabaseHealth, 20000);
    return () => clearInterval(interval);
  }, []);

  const showToast = ({ type = 'info', message }) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const handleLogout = () => {
    localStorage.removeItem('library_user');
    localStorage.removeItem('library_token');
    setCurrentUser(null);
    showToast({ type: 'info', message: 'You have been signed out.' });
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsLoginModalOpen(false);
    showToast({ type: 'success', message: `Welcome, ${user.name}!` });
  };

  const handleSearchBook = (query) => {
    setBookSearchQuery(query);
    setActiveTab('books');
  };

  return (
    <div className="libraree-app-viewport">
      {/* Background Decorative Vector Elements matching the reference design */}
      <div className="bg-decorations-layer" aria-hidden="true">
        {/* Top-Left Polka Dot Grid */}
        <div className="decor-dot-grid" />

        {/* Top-Right Large Ring Arc */}
        <div className="decor-ring ring-top-right" />

        {/* Bottom-Left Concentric Rings */}
        <div className="decor-ring ring-bottom-left" />

        {/* Floating Playful Accent Discs */}
        <div className="decor-circle circle-yellow-left" />
        <div className="decor-circle circle-coral-right" />
        <div className="decor-circle circle-gold-top" />
      </div>

      {/* Main Centered Floating Card */}
      <div className="libraree-main-card">
        {/* Card Header & Navigation */}
        <Header
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          dbConnected={dbConnected}
          is3dEnabled={is3dEnabled}
          setIs3dEnabled={setIs3dEnabled}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenLoginModal={(mode = 'signin') => {
            setAuthMode(mode);
            setIsLoginModalOpen(true);
          }}
        />

        {/* Card Content Area */}
        <main className="libraree-card-body">
          {activeTab === 'dashboard' && (
            <Dashboard
              onNavigate={setActiveTab}
              onIssueLoan={() => setActiveTab('loans')}
              onAddBook={() => setActiveTab('books')}
              onSearchBook={handleSearchBook}
              is3dEnabled={is3dEnabled}
            />
          )}

          {activeTab === 'books' && (
            <Books 
              onShowToast={showToast} 
              initialSearch={bookSearchQuery}
            />
          )}

          {activeTab === 'members' && (
            <Members onShowToast={showToast} />
          )}

          {activeTab === 'loans' && (
            <Loans onShowToast={showToast} />
          )}

          {activeTab === 'reports' && (
            <Reports />
          )}
        </main>
      </div>

      {/* Login & Sign Up Modal */}
      {isLoginModalOpen && (
        <Login
          isModal={true}
          initialMode={authMode}
          onLoginSuccess={handleLoginSuccess}
          onCancel={() => setIsLoginModalOpen(false)}
        />
      )}

      {/* Toast Notification Container */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
