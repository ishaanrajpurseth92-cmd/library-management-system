import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Layers, 
  Users, 
  ArrowLeftRight, 
  AlertTriangle, 
  Search,
  Plus, 
  ArrowUpRight,
  RefreshCw,
  CheckCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import LibraryScene3D from '../components/LibraryScene3D';
import { formatDate } from '../utils/formatters';
import api from '../services/api';

export default function Dashboard({ 
  onNavigate, 
  onIssueLoan, 
  onAddBook, 
  onSearchBook,
  is3dEnabled 
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDashboardReport();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics from the database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearchBook) {
      onSearchBook(searchQuery.trim());
    } else {
      onNavigate('books');
    }
  };

  const kpi = data?.kpi || {
    total_titles: 0,
    total_copies: 0,
    total_members: 0,
    active_members: 0,
    active_loans: 0,
    overdue_loans: 0
  };

  return (
    <div className="dashboard-view-content">
      {/* Hero Section matching the reference image */}
      <section className="libraree-hero-section">
        {/* Left Column: Heading, description, and search widget */}
        <div className="hero-text-column">
          <div className="hero-badge-pill">
            <span className="badge-glow-dot" />
            <span>DBMS Relational Catalog • TiDB Cloud</span>
          </div>

          <h1 className="hero-main-title">
            Online <span className="hero-title-accent">Library</span>
          </h1>

          <p className="hero-paragraph">
            Discover thousands of books, manage borrowing records, track physical copy availability,
            and explore your digital catalog with ease.
          </p>

          {/* Search bar widget */}
          <form className="hero-search-container" onSubmit={handleSearchSubmit}>
            <div className="hero-search-input-wrap">
              <Search size={20} className="search-lead-icon" />
              <input
                type="text"
                className="hero-search-input"
                placeholder="Find your book here"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button type="submit" className="hero-search-submit-btn">
              Search Book
            </button>
          </form>

          {/* Quick Stats Chips */}
          <div className="hero-stats-chips">
            <div className="hero-chip" onClick={() => onNavigate('books')} role="button" tabIndex={0}>
              <span className="chip-count">{kpi.total_titles}</span>
              <span className="chip-label">Titles</span>
            </div>
            <div className="hero-chip" onClick={() => onNavigate('books')} role="button" tabIndex={0}>
              <span className="chip-count">{kpi.total_copies}</span>
              <span className="chip-label">Physical Copies</span>
            </div>
            <div className="hero-chip" onClick={() => onNavigate('members')} role="button" tabIndex={0}>
              <span className="chip-count">{kpi.total_members}</span>
              <span className="chip-label">Patrons</span>
            </div>
            <div className="hero-chip highlight-chip" onClick={() => onNavigate('loans')} role="button" tabIndex={0}>
              <span className="chip-count">{kpi.active_loans}</span>
              <span className="chip-label">Active Loans</span>
            </div>
          </div>
        </div>

        {/* Right Column: 3D Scene */}
        <div className="hero-scene-column">
          {is3dEnabled ? (
            <LibraryScene3D />
          ) : (
            <div className="hero-3d-disabled-banner">
              <div className="disabled-scene-card">
                <BookOpen size={48} className="disabled-icon" />
                <h3>3D Scene Disabled</h3>
                <p>Click "3D OFF" in the top navigation to re-enable the interactive 3D desk view.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* KPI Cards Row */}
      <section className="kpi-cards-grid">
        <StatCard 
          title="Catalog Titles" 
          value={kpi.total_titles} 
          subtitle="Unique ISBN editions" 
          icon={BookOpen}
          color="navy"
          onClick={() => onNavigate('books')}
        />
        <StatCard 
          title="Physical Copies" 
          value={kpi.total_copies} 
          subtitle="Barcoded items on shelf" 
          icon={Layers}
          color="brass"
          onClick={() => onNavigate('books')}
        />
        <StatCard 
          title="Registered Patrons" 
          value={kpi.total_members} 
          subtitle={`${kpi.active_members || 0} active borrowers`} 
          icon={Users}
          color="green"
          onClick={() => onNavigate('members')}
        />
        <StatCard 
          title="Circulating Loans" 
          value={kpi.active_loans} 
          subtitle="Currently checked out" 
          icon={ArrowLeftRight}
          color="blue"
          onClick={() => onNavigate('loans')}
        />
        <StatCard 
          title="Overdue Notices" 
          value={kpi.overdue_loans} 
          subtitle="Past due date" 
          icon={AlertTriangle}
          color="red"
          highlight={kpi.overdue_loans > 0}
          onClick={() => onNavigate('loans')}
        />
      </section>

      {/* Main Dashboard Content: Recent Activity & Quick Actions */}
      <div className="dashboard-content-split">
        {/* Left Side: Recent Circulation Desk */}
        <div className="content-card recent-loans-card">
          <div className="card-header-bar">
            <div className="card-header-left">
              <h2 className="card-heading">Recent Circulation Activity</h2>
              <p className="card-subheading">Latest loans issued from the library database</p>
            </div>
            <div className="card-header-actions">
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={loadDashboardData}
                title="Refresh from database"
                disabled={loading}
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                <span>Sync</span>
              </button>
              <button 
                type="button" 
                className="btn btn-primary btn-sm"
                onClick={onIssueLoan}
              >
                <Plus size={14} />
                <span>Issue Loan</span>
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title & Copy</th>
                  <th>Patron</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="table-loading-cell">
                      <RefreshCw size={20} className="animate-spin text-muted" />
                      <span>Loading records from the database...</span>
                    </td>
                  </tr>
                ) : data?.recent_loans?.length > 0 ? (
                  data.recent_loans.map((loan) => (
                    <tr key={loan.loan_id}>
                      <td>
                        <div className="table-title-cell">
                          <span className="book-title-text">{loan.title}</span>
                          <span className="barcode-mono-tag">#{loan.barcode}</span>
                        </div>
                      </td>
                      <td>
                        <div className="table-patron-cell">
                          <span className="patron-name-text">{loan.member_name}</span>
                          <span className="patron-email-sub">{loan.member_email}</span>
                        </div>
                      </td>
                      <td>{formatDate(loan.issued_on)}</td>
                      <td>{formatDate(loan.due_on)}</td>
                      <td>
                        {loan.returned_on ? (
                          <Badge variant="success">Returned</Badge>
                        ) : loan.is_overdue ? (
                          <Badge variant="danger">Overdue</Badge>
                        ) : (
                          <Badge variant="warning">Active</Badge>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="table-empty-cell">
                      No recent loans recorded in the database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Category Breakdown & Quick Navigation */}
        <div className="content-side-panel">
          {/* Quick Actions Panel */}
          <div className="content-card quick-actions-panel">
            <h3 className="panel-heading">Desk Quick Actions</h3>
            <div className="quick-actions-list">
              <button 
                type="button" 
                className="quick-action-row-btn"
                onClick={onIssueLoan}
              >
                <div className="action-row-icon orange">
                  <ArrowLeftRight size={18} />
                </div>
                <div className="action-row-info">
                  <span className="action-row-title">Issue Book Copy</span>
                  <span className="action-row-desc">Create loan for registered patron</span>
                </div>
                <ArrowUpRight size={16} className="action-row-arrow" />
              </button>

              <button 
                type="button" 
                className="quick-action-row-btn"
                onClick={onAddBook}
              >
                <div className="action-row-icon yellow">
                  <Plus size={18} />
                </div>
                <div className="action-row-info">
                  <span className="action-row-title">Add New Title</span>
                  <span className="action-row-desc">Catalogue new edition & ISBN</span>
                </div>
                <ArrowUpRight size={16} className="action-row-arrow" />
              </button>

              <button 
                type="button" 
                className="quick-action-row-btn"
                onClick={() => onNavigate('reports')}
              >
                <div className="action-row-icon green">
                  <ExternalLink size={18} />
                </div>
                <div className="action-row-info">
                  <span className="action-row-title">Analytics & Reports</span>
                  <span className="action-row-desc">Inventory stats & borrowing charts</span>
                </div>
                <ArrowUpRight size={16} className="action-row-arrow" />
              </button>
            </div>
          </div>

          {/* Collection Distribution Summary */}
          {data?.categories && data.categories.length > 0 && (
            <div className="content-card category-summary-card">
              <h3 className="panel-heading">Collection Categories</h3>
              <div className="category-pills-wrap">
                {data.categories.map((cat) => (
                  <div 
                    key={cat.category_id} 
                    className="category-pill-item"
                    onClick={() => onNavigate('books')}
                    role="button"
                    tabIndex={0}
                  >
                    <span className="cat-name">{cat.category_name}</span>
                    <span className="cat-count">{cat.book_count} books</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
