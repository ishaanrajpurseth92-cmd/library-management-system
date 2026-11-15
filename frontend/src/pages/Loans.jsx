import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftRight, 
  Search, 
  Filter, 
  Plus, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  Calendar,
  BookOpen,
  User,
  X
} from 'lucide-react';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { formatDate, getOverdueText } from '../utils/formatters';
import api from '../services/api';

export default function Loans({ onShowToast }) {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('open'); // 'open' | 'overdue' | 'active' | 'returned' | 'all'
  const [search, setSearch] = useState('');

  // Modals
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);

  // Issue Form Data
  const [availableCopies, setAvailableCopies] = useState([]);
  const [activeMembers, setActiveMembers] = useState([]);
  const [copiesLoading, setCopiesLoading] = useState(false);

  const [issueForm, setIssueForm] = useState({
    copy_id: '',
    member_id: '',
    issued_on: new Date().toISOString().split('T')[0],
    due_on: '',
    notes: ''
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Return Form
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);

  // Load loans
  const loadLoans = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.getLoans(params);
      if (res.success) {
        setLoans(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch circulation records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLoans();
    }, 250);
    return () => clearTimeout(timer);
  }, [statusFilter, search]);

  // Open Issue Modal
  const handleOpenIssue = async () => {
    // Calculate default due date = today + 14 days
    const today = new Date();
    const d = new Date(today);
    d.setDate(d.getDate() + 14);
    const defaultDueDate = d.toISOString().split('T')[0];

    setIssueForm({
      copy_id: '',
      member_id: '',
      issued_on: today.toISOString().split('T')[0],
      due_on: defaultDueDate,
      notes: ''
    });
    setFormError(null);
    setIsIssueModalOpen(true);
    setCopiesLoading(true);

    try {
      const [copiesRes, membersRes] = await Promise.all([
        api.getAvailableCopies(),
        api.getMembers({ status: 'ACTIVE' })
      ]);
      if (copiesRes.success) setAvailableCopies(copiesRes.data);
      if (membersRes.success) setActiveMembers(membersRes.data);
    } catch (err) {
      setFormError('Failed to load available copies or active members.');
    } finally {
      setCopiesLoading(false);
    }
  };

  // Helper to adjust due date
  const setDaysFromToday = (days) => {
    const base = issueForm.issued_on ? new Date(issueForm.issued_on) : new Date();
    base.setDate(base.getDate() + days);
    setIssueForm(prev => ({ ...prev, due_on: base.toISOString().split('T')[0] }));
  };

  // Submit Issue Book
  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!issueForm.copy_id) {
      setFormError('Please select a book copy to issue.');
      return;
    }
    if (!issueForm.member_id) {
      setFormError('Please select an active member.');
      return;
    }
    if (!issueForm.due_on) {
      setFormError('Due date is required.');
      return;
    }

    try {
      setFormSubmitting(true);
      const res = await api.issueLoan(issueForm);
      if (res.success) {
        onShowToast({ type: 'success', message: 'Book copy issued successfully!' });
        setIsIssueModalOpen(false);
        loadLoans();
      }
    } catch (err) {
      setFormError(err.message || 'Error issuing book copy.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Return Modal
  const handleOpenReturn = (loan) => {
    setSelectedLoan(loan);
    setReturnDate(new Date().toISOString().split('T')[0]);
    setIsReturnModalOpen(true);
  };

  // Submit Return Book
  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLoan) return;

    try {
      setFormSubmitting(true);
      const res = await api.returnLoan(selectedLoan.loan_id, { returned_on: returnDate });
      if (res.success) {
        onShowToast({ 
          type: 'success', 
          message: `Book "${selectedLoan.book_title}" marked as returned!` 
        });
        setIsReturnModalOpen(false);
        setSelectedLoan(null);
        loadLoans();
      }
    } catch (err) {
      onShowToast({ type: 'error', message: err.message });
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      {/* Top Controls Toolbar */}
      <div className="toolbar-panel">
        <div className="search-filter-group">
          <div className="search-input-wrap">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              className="search-input"
              placeholder="Search by book title, barcode, patron name, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search loans"
            />
            {search && (
              <button 
                type="button" 
                className="search-clear-btn" 
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="tab-pills-group" role="tablist">
            <button 
              type="button" 
              className={`tab-pill ${statusFilter === 'open' ? 'active' : ''}`}
              onClick={() => setStatusFilter('open')}
              role="tab"
              aria-selected={statusFilter === 'open'}
            >
              Active & Overdue
            </button>
            <button 
              type="button" 
              className={`tab-pill ${statusFilter === 'overdue' ? 'active tab-pill-danger' : ''}`}
              onClick={() => setStatusFilter('overdue')}
              role="tab"
              aria-selected={statusFilter === 'overdue'}
            >
              Overdue Only
            </button>
            <button 
              type="button" 
              className={`tab-pill ${statusFilter === 'returned' ? 'active' : ''}`}
              onClick={() => setStatusFilter('returned')}
              role="tab"
              aria-selected={statusFilter === 'returned'}
            >
              Returned
            </button>
            <button 
              type="button" 
              className={`tab-pill ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
              role="tab"
              aria-selected={statusFilter === 'all'}
            >
              All Records
            </button>
          </div>
        </div>

        <div className="toolbar-actions">
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={handleOpenIssue}
          >
            <Plus size={16} />
            <span>Issue Book Copy</span>
          </button>
          <button 
            type="button" 
            className="btn btn-ghost" 
            onClick={loadLoans}
            title="Refresh database records"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Loans Table */}
      <div className="panel">
        {loading && loans.length === 0 && (
          <div className="panel-loading">
            <RefreshCw size={24} className="spin text-brass" />
            <p>Loading circulation records from the database...</p>
          </div>
        )}

        {error && (
          <div className="panel-error">
            <AlertTriangle size={24} className="text-danger" />
            <p>{error}</p>
            <button className="btn btn-sm btn-secondary" onClick={loadLoans}>Retry</button>
          </div>
        )}

        {!loading && loans.length === 0 && (
          <div className="empty-state">
            <ArrowLeftRight size={40} className="text-muted" />
            <p className="empty-title">No circulation records found</p>
            <p className="empty-desc">Check out a book copy to an active library member.</p>
            <button className="btn btn-sm btn-primary" onClick={handleOpenIssue}>Issue Book Copy</button>
          </div>
        )}

        {loans.length > 0 && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Book Title & Barcode</th>
                  <th>Borrower</th>
                  <th>Issued Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((l) => {
                  const isOverdue = l.loan_status === 'OVERDUE';
                  const isOpen = l.returned_on === null;

                  return (
                    <tr key={l.loan_id} className={isOverdue ? 'row-overdue' : ''}>
                      <td>
                        <div className="book-cell">
                          <BookOpen size={16} className={isOverdue ? 'text-danger' : 'text-brass'} />
                          <div>
                            <div className="book-cell-title">{l.book_title}</div>
                            <span className="barcode-tag">{l.barcode}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="borrower-cell">
                          <div className="borrower-name">{l.member_name}</div>
                          <div className="borrower-email">{l.member_email}</div>
                        </div>
                      </td>
                      <td>{formatDate(l.issued_on)}</td>
                      <td>
                        <div className={`due-date-cell ${isOverdue ? 'text-danger font-semibold' : ''}`}>
                          {formatDate(l.due_on)}
                          {isOverdue && (
                            <span className="overdue-tag">
                              {getOverdueText(l.days_overdue)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <Badge status={l.loan_status} />
                        {l.returned_on && (
                          <div className="returned-subtext">
                            Returned {formatDate(l.returned_on)}
                          </div>
                        )}
                      </td>
                      <td className="text-right">
                        {isOpen ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success"
                            onClick={() => handleOpenReturn(l)}
                            title="Return this book"
                          >
                            <CheckCircle size={14} />
                            <span>Return</span>
                          </button>
                        ) : (
                          <span className="badge-inventory badge-available">Archived</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: ISSUE BOOK COPY */}
      <Modal 
        isOpen={isIssueModalOpen} 
        onClose={() => setIsIssueModalOpen(false)} 
        title="Circulation Desk: Issue Book Copy"
        maxWidth="640px"
      >
        <form onSubmit={handleIssueSubmit} className="library-form">
          {formError && (
            <div className="form-error-banner">
              <AlertTriangle size={16} />
              <span>{formError}</span>
            </div>
          )}

          {copiesLoading ? (
            <div className="panel-loading">
              <RefreshCw size={24} className="spin text-brass" />
              <p>Loading available copies and members...</p>
            </div>
          ) : (
            <>
              {/* Select Copy */}
              <div className="form-group">
                <label className="form-label" htmlFor="copy_id">Available Book Copy *</label>
                {availableCopies.length === 0 ? (
                  <p className="form-warning-note">
                    No physical copies are currently available on shelf. All copies are checked out.
                  </p>
                ) : (
                  <select 
                    id="copy_id"
                    className="form-select"
                    required
                    value={issueForm.copy_id}
                    onChange={(e) => setIssueForm({ ...issueForm, copy_id: e.target.value })}
                  >
                    <option value="">-- Choose an Available Copy ({availableCopies.length} on shelf) --</option>
                    {availableCopies.map((c) => (
                      <option key={c.copy_id} value={c.copy_id}>
                        {c.title} [{c.barcode}] - {c.category_name} ({c.condition_note || 'Good'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Select Member */}
              <div className="form-group">
                <label className="form-label" htmlFor="member_id">Patron (Active Members Only) *</label>
                {activeMembers.length === 0 ? (
                  <p className="form-warning-note">No active members found.</p>
                ) : (
                  <select 
                    id="member_id"
                    className="form-select"
                    required
                    value={issueForm.member_id}
                    onChange={(e) => setIssueForm({ ...issueForm, member_id: e.target.value })}
                  >
                    <option value="">-- Choose Active Patron ({activeMembers.length}) --</option>
                    {activeMembers.map((m) => (
                      <option key={m.member_id} value={m.member_id}>
                        {m.full_name} ({m.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Dates */}
              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label" htmlFor="issued_on">Issue Date *</label>
                  <input 
                    id="issued_on"
                    type="date" 
                    className="form-input" 
                    required
                    value={issueForm.issued_on}
                    onChange={(e) => setIssueForm({ ...issueForm, issued_on: e.target.value })}
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label" htmlFor="due_on">Due Date *</label>
                  <input 
                    id="due_on"
                    type="date" 
                    className="form-input" 
                    required
                    value={issueForm.due_on}
                    onChange={(e) => setIssueForm({ ...issueForm, due_on: e.target.value })}
                  />
                </div>
              </div>

              {/* Quick Due Date Pills */}
              <div className="quick-date-pills">
                <span className="quick-date-label">Quick Due Duration:</span>
                <button type="button" className="btn-pill" onClick={() => setDaysFromToday(7)}>+7 Days (1 Week)</button>
                <button type="button" className="btn-pill active" onClick={() => setDaysFromToday(14)}>+14 Days (Standard)</button>
                <button type="button" className="btn-pill" onClick={() => setDaysFromToday(30)}>+30 Days (Extended)</button>
              </div>

              {/* Notes */}
              <div className="form-group">
                <label className="form-label" htmlFor="notes">Circulation Notes (Optional)</label>
                <input 
                  id="notes"
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Course reserve, thesis research checkout"
                  value={issueForm.notes}
                  onChange={(e) => setIssueForm({ ...issueForm, notes: e.target.value })}
                />
              </div>
            </>
          )}

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-ghost" 
              onClick={() => setIsIssueModalOpen(false)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={formSubmitting || availableCopies.length === 0}
            >
              {formSubmitting ? 'Issuing Copy...' : 'Issue Book Copy'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: RETURN BOOK */}
      <Modal 
        isOpen={isReturnModalOpen} 
        onClose={() => setIsReturnModalOpen(false)} 
        title="Check-In / Return Book"
        maxWidth="480px"
      >
        <form onSubmit={handleReturnSubmit} className="library-form">
          <div className="return-summary-card">
            <div className="summary-title">{selectedLoan?.book_title}</div>
            <div className="summary-barcode">Copy Barcode: <strong>{selectedLoan?.barcode}</strong></div>
            <div className="summary-borrower">Borrower: <strong>{selectedLoan?.member_name}</strong></div>
            <div className="summary-dates">
              Issued: {formatDate(selectedLoan?.issued_on)} • Due: {formatDate(selectedLoan?.due_on)}
            </div>
            {selectedLoan?.loan_status === 'OVERDUE' && (
              <div className="overdue-alert-pill">
                <AlertTriangle size={14} />
                <span>Notice: Book is {getOverdueText(selectedLoan.days_overdue)}</span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="return_date">Return Date *</label>
            <input 
              id="return_date"
              type="date" 
              className="form-input" 
              required
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-ghost" 
              onClick={() => setIsReturnModalOpen(false)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={formSubmitting}
            >
              {formSubmitting ? 'Updating loan...' : 'Confirm Return'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
