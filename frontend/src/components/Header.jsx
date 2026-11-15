import React, { useState } from 'react';
import { 
  BookOpen, 
  Database, 
  Sparkles, 
  User, 
  LogOut, 
  Menu, 
  X,
  LayoutDashboard,
  Layers,
  Users,
  ArrowLeftRight,
  BarChart3,
  LogIn
} from 'lucide-react';

export default function Header({ 
  activeTab,
  onSelectTab,
  dbConnected, 
  is3dEnabled, 
  setIs3dEnabled, 
  currentUser,
  onLogout,
  onOpenLoginModal
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'books', label: 'Books', icon: BookOpen },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'loans', label: 'Loans', icon: ArrowLeftRight },
    { id: 'reports', label: 'Reports', icon: BarChart3 }
  ];

  const handleTabClick = (tabId) => {
    onSelectTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="libraree-header">
      {/* Brand / Logo */}
      <div className="brand-group" onClick={() => onSelectTab('dashboard')} role="button" tabIndex={0}>
        <div className="brand-logo-badge">
          <BookOpen size={20} className="brand-logo-icon" />
          <span className="brand-logo-letter">L</span>
        </div>
        <div className="brand-text-block">
          <span className="brand-name">Libraree</span>
          <span className="brand-tag">Library Management</span>
        </div>
      </div>

      {/* Center Nav Links (Desktop) */}
      <nav className="desktop-nav" aria-label="Main Navigation">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-item-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleTabClick(item.id)}
            >
              <span>{item.label}</span>
              {isActive && <span className="nav-active-indicator" />}
            </button>
          );
        })}
      </nav>

      {/* Right Actions */}
      <div className="header-actions">
        {/* Database Status Pill */}
        <div 
          className={`db-indicator-pill ${dbConnected ? 'connected' : 'disconnected'}`}
          title={dbConnected ? 'Connected to TiDB Cloud' : 'TiDB Cloud database unreachable'}
        >
          <span className="db-dot" />
          <Database size={13} />
          <span className="db-text">{dbConnected ? 'TiDB Cloud' : 'Offline'}</span>
        </div>

        {/* 3D Scene Toggle */}
        <button
          type="button"
          className={`toggle-3d-chip ${is3dEnabled ? 'active' : ''}`}
          onClick={() => setIs3dEnabled(!is3dEnabled)}
          title={is3dEnabled ? 'Disable 3D Scene' : 'Enable 3D Scene'}
          aria-label="Toggle 3D visualization"
        >
          <Sparkles size={14} />
          <span className="chip-label">3D {is3dEnabled ? 'ON' : 'OFF'}</span>
        </button>

        {/* User Account / Auth Actions */}
        {currentUser ? (
          <div className="user-profile-group">
            <div className="user-info-pill">
              <span className="user-avatar-dot">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </span>
              <span className="user-display-name">{currentUser.name?.split(' ')[0]}</span>
              <span className="user-role-badge">{currentUser.role === 'admin' ? 'Admin' : 'Patron'}</span>
            </div>
            <button
              type="button"
              className="btn-signout"
              onClick={onLogout}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div className="auth-buttons-group">
            <button
              type="button"
              className="btn-signin-link"
              onClick={() => onOpenLoginModal('signin')}
            >
              Sign in
            </button>
            <button
              type="button"
              className="btn-signup-pill"
              onClick={() => onOpenLoginModal('signup')}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          className="mobile-hamburger-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <div className="mobile-nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleTabClick(item.id)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mobile-nav-footer">
            {currentUser ? (
              <div className="mobile-user-row">
                <span>Signed in as <strong>{currentUser.name}</strong></span>
                <button type="button" className="btn btn-secondary btn-sm" onClick={onLogout}>
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="mobile-auth-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary btn-block" 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenLoginModal('signin');
                  }}
                >
                  Sign In
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary btn-block" 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenLoginModal('signup');
                  }}
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
