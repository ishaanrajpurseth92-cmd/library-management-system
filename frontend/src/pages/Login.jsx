import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Lock, 
  Mail, 
  Phone,
  User,
  Eye, 
  EyeOff, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  X
} from 'lucide-react';
import api from '../services/api';

export default function Login({ 
  onLoginSuccess, 
  onCancel, 
  isModal = false,
  initialMode = 'signin'
}) {
  const [mode, setMode] = useState(initialMode); // 'signin' or 'signup'
  
  // Sign In state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  
  // Sign Up state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setSuccessMsg(null);
  }, [initialMode]);

  const switchMode = (newMode) => {
    setMode(newMode);
    setError(null);
    setSuccessMsg(null);
  };

  // Handle Sign In submission
  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!signInEmail.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!signInPassword) {
      setError('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.login({ email: signInEmail.trim(), password: signInPassword });
      if (res.success && res.user) {
        localStorage.setItem('library_user', JSON.stringify(res.user));
        if (res.token) {
          localStorage.setItem('library_token', res.token);
        }
        onLoginSuccess(res.user);
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign Up submission
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter both your first and last name.');
      return;
    }
    if (!signUpEmail.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!signUpPassword || signUpPassword.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }
    if (signUpPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: signUpEmail.trim(),
        phone: phone.trim() || null,
        password: signUpPassword
      });

      if (res.success && res.user) {
        setSuccessMsg('Account created successfully! Logging you in...');
        localStorage.setItem('library_user', JSON.stringify(res.user));
        if (res.token) {
          localStorage.setItem('library_token', res.token);
        }
        setTimeout(() => {
          onLoginSuccess(res.user);
        }, 800);
      }
    } catch (err) {
      setError(err.message || 'Failed to create patron account in the database.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Login
  const handleQuickDemoLogin = async (demoEmail, demoPassword) => {
    setError(null);
    setSignInEmail(demoEmail);
    setSignInPassword(demoPassword);
    try {
      setLoading(true);
      const res = await api.login({ email: demoEmail, password: demoPassword });
      if (res.success && res.user) {
        localStorage.setItem('library_user', JSON.stringify(res.user));
        if (res.token) {
          localStorage.setItem('library_token', res.token);
        }
        onLoginSuccess(res.user);
      }
    } catch (err) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={isModal ? 'login-modal-backdrop' : 'login-page-wrapper'}>
      <div className="login-card-container">
        {isModal && onCancel && (
          <button 
            type="button" 
            className="login-modal-close-btn" 
            onClick={onCancel}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        )}

        {/* Brand Header */}
        <div className="login-card-header">
          <div className="login-brand-badge">
            <span className="login-badge-l">L</span>
          </div>
          <h2 className="login-title">
            {mode === 'signin' ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p className="login-subtitle">
            {mode === 'signin' 
              ? 'Sign in to access circulation, loans, and library records' 
              : 'Register as a library patron using TiDB Cloud'}
          </p>
        </div>

        {/* Mode Toggle Tabs (Sign In / Sign Up) */}
        <div className="auth-tab-pills" role="tablist">
          <button
            type="button"
            className={`auth-tab-pill ${mode === 'signin' ? 'active' : ''}`}
            onClick={() => switchMode('signin')}
            role="tab"
            aria-selected={mode === 'signin'}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-pill ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => switchMode('signup')}
            role="tab"
            aria-selected={mode === 'signup'}
          >
            Sign Up
          </button>
        </div>

        {/* Alert Banners */}
        {error && (
          <div className="login-alert-banner" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="login-alert-banner success" role="alert">
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. SIGN IN FORM */}
        {mode === 'signin' && (
          <form onSubmit={handleSignInSubmit} className="login-form-body">
            <div className="login-field-wrap">
              <label className="login-field-label" htmlFor="signin-email">Email Address</label>
              <div className="login-input-row">
                <Mail size={18} className="login-input-icon" />
                <input
                  id="signin-email"
                  type="email"
                  className="login-text-input"
                  required
                  placeholder="admin@library.edu"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="login-field-wrap">
              <label className="login-field-label" htmlFor="signin-password">Password</label>
              <div className="login-input-row">
                <Lock size={18} className="login-input-icon" />
                <input
                  id="signin-password"
                  type={showPassword ? 'text' : 'password'}
                  className="login-text-input"
                  required
                  placeholder="••••••••"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-primary-submit-btn"
              disabled={loading}
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* 2. SIGN UP FORM */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUpSubmit} className="login-form-body">
            <div className="login-fields-row">
              <div className="login-field-wrap flex-1">
                <label className="login-field-label" htmlFor="signup-first-name">First Name *</label>
                <div className="login-input-row">
                  <User size={18} className="login-input-icon" />
                  <input
                    id="signup-first-name"
                    type="text"
                    className="login-text-input"
                    required
                    placeholder="e.g. Maya"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                  />
                </div>
              </div>

              <div className="login-field-wrap flex-1">
                <label className="login-field-label" htmlFor="signup-last-name">Last Name *</label>
                <div className="login-input-row">
                  <User size={18} className="login-input-icon" />
                  <input
                    id="signup-last-name"
                    type="text"
                    className="login-text-input"
                    required
                    placeholder="e.g. Singh"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                  />
                </div>
              </div>
            </div>

            <div className="login-field-wrap">
              <label className="login-field-label" htmlFor="signup-email">Email Address *</label>
              <div className="login-input-row">
                <Mail size={18} className="login-input-icon" />
                <input
                  id="signup-email"
                  type="email"
                  className="login-text-input"
                  required
                  placeholder="maya.singh@example.edu"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="login-field-wrap">
              <label className="login-field-label" htmlFor="signup-phone">Phone Number (Optional)</label>
              <div className="login-input-row">
                <Phone size={18} className="login-input-icon" />
                <input
                  id="signup-phone"
                  type="tel"
                  className="login-text-input"
                  placeholder="+1 (555) 019-2834"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="login-fields-row">
              <div className="login-field-wrap flex-1">
                <label className="login-field-label" htmlFor="signup-password">Password *</label>
                <div className="login-input-row">
                  <Lock size={18} className="login-input-icon" />
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    className="login-text-input"
                    required
                    placeholder="At least 4 chars"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="login-field-wrap flex-1">
                <label className="login-field-label" htmlFor="signup-confirm-password">Confirm *</label>
                <div className="login-input-row">
                  <Lock size={18} className="login-input-icon" />
                  <input
                    id="signup-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    className="login-text-input"
                    required
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="login-primary-submit-btn"
              disabled={loading}
            >
              <span>{loading ? 'Creating Member Record...' : 'Create Patron Account'}</span>
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* Mode Switcher Link */}
        <div className="auth-mode-switch-row">
          {mode === 'signin' ? (
            <span>
              Don't have an account?{' '}
              <button 
                type="button" 
                className="auth-link-button"
                onClick={() => switchMode('signup')}
              >
                Sign up as Patron
              </button>
            </span>
          ) : (
            <span>
              Already registered?{' '}
              <button 
                type="button" 
                className="auth-link-button"
                onClick={() => switchMode('signin')}
              >
                Sign in to your account
              </button>
            </span>
          )}
        </div>

        {/* Quick Demo Access Bar (Always visible in Sign In mode) */}
        {mode === 'signin' && (
          <div className="login-demo-section">
            <div className="demo-divider-text">
              <span>Instant Demo Accounts</span>
            </div>

            <div className="demo-buttons-row">
              <button
                type="button"
                className="demo-account-pill-btn admin-demo"
                onClick={() => handleQuickDemoLogin('admin@library.edu', 'admin123')}
                disabled={loading}
              >
                <ShieldCheck size={16} />
                <span>Sign In as Administrator</span>
              </button>

              <button
                type="button"
                className="demo-account-pill-btn patron-demo"
                onClick={() => handleQuickDemoLogin('maya.singh@example.edu', 'password123')}
                disabled={loading}
              >
                <User size={16} />
                <span>Sign In as Patron</span>
              </button>
            </div>
          </div>
        )}

        {/* Guest Browse Option */}
        {onCancel && (
          <div className="login-guest-action">
            <button 
              type="button" 
              className="guest-browse-link"
              onClick={onCancel}
            >
              Continue browsing catalog as Guest →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
