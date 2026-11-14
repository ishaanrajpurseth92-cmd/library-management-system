import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  ArrowLeftRight, 
  BarChart3, 
  Database,
  X,
  LogOut,
  User
} from 'lucide-react';

export default function Navigation({ 
  activeTab, 
  onSelectTab, 
  isMobileOpen, 
  setIsMobileOpen,
  currentUser,
  onLogout
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'books', label: 'Books & Inventory', icon: BookOpen },
    { id: 'members', label: 'Patron Directory', icon: Users },
    { id: 'loans', label: 'Circulation Desk', icon: ArrowLeftRight },
    { id: 'reports', label: 'Analytics & Reports', icon: BarChart3 }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setIsMobileOpen(false)} 
          aria-hidden="true" 
        />
      )}

      <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon-wrap">
            <BookOpen size={24} className="brand-icon" />
          </div>
          <div className="brand-text">
            <h1 className="brand-title">Library Management</h1>
            <span className="brand-subtitle">DBMS Project • MySQL 8.0</span>
          </div>
          <button 
            type="button"
            className="mobile-close-btn"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-badge-wrap">
          <span className="system-pill">
            <Database size={12} />
            MySQL 8.0 • InnoDB Engine
          </span>
        </div>

        <nav className="sidebar-nav" aria-label="Main Navigation">
          <ul>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`nav-link ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      onSelectTab(item.id);
                      setIsMobileOpen(false);
                    }}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon size={18} className="nav-icon" />
                    <span>{item.label}</span>
                    {isActive && <span className="nav-active-pip" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile & Logout Section */}
        <div className="sidebar-footer">
          {currentUser && (
            <div className="user-profile-widget">
              <div className="user-avatar-pill">
                {currentUser.avatar || <User size={16} />}
              </div>
              <div className="user-info-text">
                <span className="user-name-label">{currentUser.name}</span>
                <span className="user-role-label">{currentUser.role || 'Administrator'}</span>
              </div>
              {onLogout && (
                <button
                  type="button"
                  className="logout-action-btn"
                  onClick={onLogout}
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
