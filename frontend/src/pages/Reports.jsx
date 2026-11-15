import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Layers, 
  Users, 
  BookOpen, 
  RefreshCw, 
  PieChart, 
  CheckCircle2, 
  AlertCircle,
  FileText
} from 'lucide-react';
import Badge from '../components/Badge';
import { formatIsbn, formatDate } from '../utils/formatters';
import api from '../services/api';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'most-borrowed' | 'categories' | 'members'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data sets
  const [copyStatus, setCopyStatus] = useState(null);
  const [mostBorrowed, setMostBorrowed] = useState([]);
  const [categories, setCategories] = useState([]);
  const [memberStats, setMemberStats] = useState([]);

  const loadAllReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const [copyRes, borrowedRes, catRes, memRes] = await Promise.all([
        api.getCopyStatusReport(),
        api.getMostBorrowedReport(),
        api.getCategoryReport(),
        api.getMemberStatsReport()
      ]);

      if (copyRes.success) setCopyStatus(copyRes.data);
      if (borrowedRes.success) setMostBorrowed(borrowedRes.data);
      if (catRes.success) setCategories(catRes.data);
      if (memRes.success) setMemberStats(memRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load library reports from the database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllReports();
  }, []);

  return (
    <div className="page-container reports-page">
      {/* Top Controls Toolbar */}
      <div className="toolbar-panel">
        <div className="tab-pills-group" role="tablist">
          <button 
            type="button" 
            className={`tab-pill ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
            role="tab"
          >
            <PieChart size={15} />
            <span>Copy Availability</span>
          </button>
          <button 
            type="button" 
            className={`tab-pill ${activeTab === 'most-borrowed' ? 'active' : ''}`}
            onClick={() => setActiveTab('most-borrowed')}
            role="tab"
          >
            <TrendingUp size={15} />
            <span>Most Borrowed</span>
          </button>
          <button 
            type="button" 
            className={`tab-pill ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
            role="tab"
          >
            <BookOpen size={15} />
            <span>Holdings by Category</span>
          </button>
          <button 
            type="button" 
            className={`tab-pill ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
            role="tab"
          >
            <Users size={15} />
            <span>Member Activity</span>
          </button>
        </div>

        <div className="toolbar-actions">
          <button 
            type="button" 
            className="btn btn-ghost" 
            onClick={loadAllReports}
            title="Refresh database aggregations"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Refresh Analytics</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="panel panel-loading">
          <RefreshCw size={28} className="spin text-brass" />
          <p>Preparing library reports from the database...</p>
        </div>
      )}

      {error && (
        <div className="panel panel-error">
          <AlertCircle size={28} className="text-danger" />
          <p>{error}</p>
          <button className="btn btn-sm btn-secondary" onClick={loadAllReports}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* TAB 1: INVENTORY & COPY STATUS */}
          {activeTab === 'inventory' && (
            <div className="reports-section">
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-header-text">
                    <h3 className="panel-title">Physical Inventory: Available vs Borrowed</h3>
                    <p className="panel-subtitle">Total copies registered vs copies currently in patron circulation</p>
                  </div>
                </div>

                <div className="inventory-ratio-card">
                  <div className="ratio-stat-boxes">
                    <div className="ratio-box available-box">
                      <span className="ratio-label">Available on Shelf</span>
                      <span className="ratio-number">{copyStatus?.available_copies ?? 0}</span>
                      <span className="ratio-pct">{copyStatus?.available_percentage ?? 0}%</span>
                    </div>

                    <div className="ratio-divider">of {copyStatus?.total_copies ?? 0} Total Copies</div>

                    <div className="ratio-box borrowed-box">
                      <span className="ratio-label">Currently Borrowed</span>
                      <span className="ratio-number">{copyStatus?.borrowed_copies ?? 0}</span>
                      <span className="ratio-pct">{copyStatus?.borrowed_percentage ?? 0}%</span>
                    </div>
                  </div>

                  {/* Visual ratio bar */}
                  <div className="stacked-ratio-bar">
                    <div 
                      className="ratio-bar-available" 
                      style={{ width: `${copyStatus?.available_percentage ?? 50}%` }}
                      title={`Available: ${copyStatus?.available_percentage}%`}
                    />
                    <div 
                      className="ratio-bar-borrowed" 
                      style={{ width: `${copyStatus?.borrowed_percentage ?? 50}%` }}
                      title={`Borrowed: ${copyStatus?.borrowed_percentage}%`}
                    />
                  </div>
                  <div className="ratio-legend">
                    <span className="legend-item"><span className="legend-dot dot-available" /> Available on Shelf ({copyStatus?.available_percentage}%)</span>
                    <span className="legend-item"><span className="legend-dot dot-borrowed" /> Checked Out on Loan ({copyStatus?.borrowed_percentage}%)</span>
                  </div>
                </div>

                {/* SQL Query explanation for project defense */}
                <div className="query-showcase">
                  <h4 className="query-showcase-title">
                    <FileText size={15} />
                    <span>Underlying SQL Aggregation</span>
                  </h4>
                  <pre className="sql-code-block">
{`SELECT 
  COUNT(cpy.copy_id) AS total_copies,
  COUNT(CASE WHEN l.loan_id IS NULL THEN cpy.copy_id END) AS available_copies,
  COUNT(CASE WHEN l.loan_id IS NOT NULL THEN cpy.copy_id END) AS borrowed_copies
FROM book_copies cpy
LEFT JOIN loans l ON l.copy_id = cpy.copy_id AND l.returned_on IS NULL;`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MOST BORROWED BOOKS */}
          {activeTab === 'most-borrowed' && (
            <div className="reports-section">
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-header-text">
                    <h3 className="panel-title">Circulation Ranking: Most Borrowed Books</h3>
                    <p className="panel-subtitle">Titles ranked by historical checkout volume</p>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Book Title</th>
                        <th>Authors</th>
                        <th>Category</th>
                        <th>Physical Copies</th>
                        <th>Active Checkouts</th>
                        <th>Total Times Borrowed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mostBorrowed.map((b, idx) => (
                        <tr key={b.book_id}>
                          <td>
                            <span className={`rank-badge ${idx < 3 ? `rank-top-${idx + 1}` : ''}`}>
                              #{idx + 1}
                            </span>
                          </td>
                          <td>
                            <div className="book-cell-title">{b.title}</div>
                            <span className="isbn-badge">{formatIsbn(b.isbn)}</span>
                          </td>
                          <td>{b.authors}</td>
                          <td><span className="category-pill">{b.category_name}</span></td>
                          <td>{b.total_physical_copies} copies</td>
                          <td>
                            {b.current_active_loans > 0 ? (
                              <Badge status="ON LOAN">{b.current_active_loans} out</Badge>
                            ) : (
                              <Badge status="AVAILABLE">All in</Badge>
                            )}
                          </td>
                          <td>
                            <span className="borrow-count-badge">
                              {b.times_borrowed} {b.times_borrowed === 1 ? 'checkout' : 'checkouts'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="reports-section">
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-header-text">
                    <h3 className="panel-title">Collection Distribution by Category</h3>
                    <p className="panel-subtitle">Titles, copies, and active circulation per discipline</p>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Distinct Titles</th>
                        <th>Physical Copies</th>
                        <th>Current Open Loans</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((c) => (
                        <tr key={c.category_id}>
                          <td>
                            <div className="category-cell-name">{c.category_name}</div>
                          </td>
                          <td>
                            <span className="text-muted">{c.description || '—'}</span>
                          </td>
                          <td>
                            <span className="stat-pill total-stat">{c.title_count} titles</span>
                          </td>
                          <td>
                            <span className="stat-pill active-stat">{c.copy_count} copies</span>
                          </td>
                          <td>
                            {c.active_loans_count > 0 ? (
                              <Badge status="ON LOAN">{c.active_loans_count} active</Badge>
                            ) : (
                              <span className="text-muted">0 active</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MEMBER BORROWING TOTALS */}
          {activeTab === 'members' && (
            <div className="reports-section">
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-header-text">
                    <h3 className="panel-title">Patron Circulation Activity</h3>
                    <p className="panel-subtitle">Borrowing totals, returned records, and active loans per member</p>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Patron Name</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Total Lifetime Loans</th>
                        <th>Returned Books</th>
                        <th>Current Open Loans</th>
                        <th>Overdue Books</th>
                      </tr>
                    </thead>
                    <tbody>
                      {memberStats.map((m) => (
                        <tr key={m.member_id}>
                          <td className="borrower-name">{m.member_name}</td>
                          <td>{m.email}</td>
                          <td><Badge status={m.member_status} /></td>
                          <td>
                            <span className="borrow-count-badge">
                              {m.total_loans} {m.total_loans === 1 ? 'loan' : 'loans'}
                            </span>
                          </td>
                          <td>
                            <span className="stat-pill active-stat">{m.returned_loans}</span>
                          </td>
                          <td>
                            {m.active_loans > 0 ? (
                              <Badge status="ON LOAN">{m.active_loans} open</Badge>
                            ) : (
                              <span className="text-muted">None</span>
                            )}
                          </td>
                          <td>
                            {m.overdue_loans > 0 ? (
                              <Badge status="OVERDUE">{m.overdue_loans} overdue</Badge>
                            ) : (
                              <span className="text-muted">0</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
