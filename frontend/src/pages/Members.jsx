import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  History, 
  RefreshCw, 
  AlertCircle,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  X
} from 'lucide-react';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { formatDate, getOverdueText } from '../utils/formatters';
import api from '../services/api';

export default function Members({ onShowToast }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Current selected member
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberDetails, setMemberDetails] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Forms
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    joined_on: new Date().toISOString().split('T')[0],
    member_status: 'ACTIVE'
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;

      const res = await api.getMembers(params);
      if (res.success) {
        setMembers(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMembers();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  // Open History modal
  const handleOpenHistory = async (member) => {
    setSelectedMember(member);
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const res = await api.getMember(member.member_id);
      if (res.success) {
        setMemberDetails(res.data);
      }
    } catch (err) {
      onShowToast({ type: 'error', message: err.message });
    } finally {
      setHistoryLoading(false);
    }
  };

  // Open Add modal
  const handleOpenAdd = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      joined_on: new Date().toISOString().split('T')[0],
      member_status: 'ACTIVE'
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (member) => {
    setSelectedMember(member);
    setFormData({
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      phone: member.phone || '',
      joined_on: member.joined_on,
      member_status: member.member_status
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  // Submit Add Member
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setFormError('First and last name are required.');
      return;
    }
    if (!formData.email.trim()) {
      setFormError('Email address is required.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.createMember(formData);
      if (res.success) {
        onShowToast({ type: 'success', message: 'Patron registered successfully!' });
        setIsAddModalOpen(false);
        loadMembers();
      }
    } catch (err) {
      setFormError(err.message || 'Error registering member.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit Member
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    try {
      setSubmitting(true);
      const res = await api.updateMember(selectedMember.member_id, formData);
      if (res.success) {
        onShowToast({ type: 'success', message: 'Member profile updated successfully!' });
        setIsEditModalOpen(false);
        loadMembers();
      }
    } catch (err) {
      setFormError(err.message || 'Error updating member.');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick toggle status
  const handleToggleStatus = async (member) => {
    const newStatus = member.member_status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await api.updateMember(member.member_id, {
        first_name: member.first_name,
        last_name: member.last_name,
        email: member.email,
        phone: member.phone,
        member_status: newStatus
      });
      if (res.success) {
        onShowToast({ 
          type: 'success', 
          message: `Member status updated to ${newStatus}.` 
        });
        loadMembers();
      }
    } catch (err) {
      onShowToast({ type: 'error', message: err.message });
    }
  };

  // Delete Member
  const handleDeleteMember = async () => {
    if (!selectedMember) return;
    try {
      setSubmitting(true);
      const res = await api.deleteMember(selectedMember.member_id);
      if (res.success) {
        onShowToast({ type: 'success', message: 'Member deleted from database.' });
        setIsDeleteModalOpen(false);
        setSelectedMember(null);
        loadMembers();
      }
    } catch (err) {
      onShowToast({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      {/* Toolbar */}
      <div className="toolbar-panel">
        <div className="search-filter-group">
          <div className="search-input-wrap">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              className="search-input"
              placeholder="Search by patron name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search patrons"
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

          <div className="filter-select-wrap">
            <Filter size={16} className="filter-icon" />
            <select 
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by membership status"
            >
              <option value="">All Patron Statuses</option>
              <option value="ACTIVE">Active Patrons Only</option>
              <option value="SUSPENDED">Suspended Only</option>
            </select>
          </div>
        </div>

        <div className="toolbar-actions">
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={handleOpenAdd}
          >
            <Plus size={16} />
            <span>Register Member</span>
          </button>
          <button 
            type="button" 
            className="btn btn-ghost" 
            onClick={loadMembers}
            title="Refresh database records"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Members Table */}
      <div className="panel">
        {loading && members.length === 0 && (
          <div className="panel-loading">
            <RefreshCw size={24} className="spin text-brass" />
            <p>Loading the library member list...</p>
          </div>
        )}

        {error && (
          <div className="panel-error">
            <AlertCircle size={24} className="text-danger" />
            <p>{error}</p>
            <button className="btn btn-sm btn-secondary" onClick={loadMembers}>Retry</button>
          </div>
        )}

        {!loading && members.length === 0 && (
          <div className="empty-state">
            <Users size={40} className="text-muted" />
            <p className="empty-title">No members found</p>
            <p className="empty-desc">Register your first library patron to start issuing books.</p>
            <button className="btn btn-sm btn-primary" onClick={handleOpenAdd}>Register Member</button>
          </div>
        )}

        {members.length > 0 && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patron Name</th>
                  <th>Contact Info</th>
                  <th>Joined Date</th>
                  <th>Status</th>
                  <th>Borrowing Stats</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.member_id}>
                    <td>
                      <div className="member-name-cell">
                        <div className="avatar-circle">
                          {m.first_name[0]}{m.last_name[0]}
                        </div>
                        <div>
                          <div className="member-full-name">{m.full_name}</div>
                          <div className="member-id-tag">ID: #{m.member_id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-info-cell">
                        <div className="contact-item">
                          <Mail size={13} className="text-muted" />
                          <span>{m.email}</span>
                        </div>
                        {m.phone && (
                          <div className="contact-item">
                            <Phone size={13} className="text-muted" />
                            <span>{m.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{formatDate(m.joined_on)}</td>
                    <td>
                      <Badge status={m.member_status} />
                    </td>
                    <td>
                      <div className="member-loan-stats">
                        <span className="stat-pill total-stat" title="Total lifetime loans">
                          {m.total_loans} total
                        </span>
                        {m.active_loans > 0 && (
                          <span className="stat-pill active-stat" title="Currently open loans">
                            {m.active_loans} open
                          </span>
                        )}
                        {m.overdue_loans > 0 && (
                          <span className="stat-pill overdue-stat" title="Overdue loans">
                            {m.overdue_loans} overdue
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="action-button-group">
                        <button 
                          type="button" 
                          className="btn-action-icon" 
                          title="Borrowing History"
                          onClick={() => handleOpenHistory(m)}
                          aria-label={`View history for ${m.full_name}`}
                        >
                          <History size={16} />
                        </button>
                        <button 
                          type="button" 
                          className="btn-action-icon" 
                          title="Edit Member Profile"
                          onClick={() => handleOpenEdit(m)}
                          aria-label={`Edit ${m.full_name}`}
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          type="button" 
                          className="btn-action-icon" 
                          title={m.member_status === 'ACTIVE' ? 'Suspend Member' : 'Activate Member'}
                          onClick={() => handleToggleStatus(m)}
                          aria-label={`Toggle status for ${m.full_name}`}
                        >
                          {m.member_status === 'ACTIVE' ? <XCircle size={16} className="text-danger" /> : <CheckCircle size={16} className="text-success" />}
                        </button>
                        <button 
                          type="button" 
                          className="btn-action-icon btn-action-danger" 
                          title="Delete Member"
                          onClick={() => {
                            setSelectedMember(m);
                            setIsDeleteModalOpen(true);
                          }}
                          aria-label={`Delete ${m.full_name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD MEMBER */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Register New Patron"
        maxWidth="540px"
      >
        <form onSubmit={handleAddSubmit} className="library-form">
          {formError && (
            <div className="form-error-banner">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label" htmlFor="first_name">First Name *</label>
              <input 
                id="first_name"
                type="text" 
                className="form-input" 
                required 
                placeholder="e.g. Maya"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>
            <div className="form-group flex-1">
              <label className="form-label" htmlFor="last_name">Last Name *</label>
              <input 
                id="last_name"
                type="text" 
                className="form-input" 
                required 
                placeholder="e.g. Singh"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address *</label>
            <input 
              id="email"
              type="email" 
              className="form-input" 
              required 
              placeholder="maya.singh@university.edu"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label" htmlFor="phone">Phone Number</label>
              <input 
                id="phone"
                type="text" 
                className="form-input" 
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="form-group flex-1">
              <label className="form-label" htmlFor="status">Membership Status</label>
              <select 
                id="status"
                className="form-select"
                value={formData.member_status}
                onChange={(e) => setFormData({ ...formData, member_status: e.target.value })}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-ghost" 
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Registering...' : 'Register Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: EDIT MEMBER */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Edit Patron Profile"
        maxWidth="540px"
      >
        <form onSubmit={handleEditSubmit} className="library-form">
          {formError && (
            <div className="form-error-banner">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label">First Name *</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>
            <div className="form-group flex-1">
              <label className="form-label">Last Name *</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input 
              type="email" 
              className="form-input" 
              required 
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label">Phone Number</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="form-group flex-1">
              <label className="form-label">Membership Status</label>
              <select 
                className="form-select"
                value={formData.member_status}
                onChange={(e) => setFormData({ ...formData, member_status: e.target.value })}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-ghost" 
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Update Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: BORROWING HISTORY */}
      <Modal 
        isOpen={isHistoryModalOpen} 
        onClose={() => setIsHistoryModalOpen(false)} 
        title={`Borrowing History: ${selectedMember?.full_name || 'Member'}`}
        maxWidth="750px"
      >
        <div className="member-history-modal">
          {historyLoading ? (
            <div className="panel-loading">
              <RefreshCw size={24} className="spin text-brass" />
            <p>Loading borrowing records from the database...</p>
            </div>
          ) : (
            <>
              <div className="patron-profile-card">
                <div>
                  <h4 className="patron-profile-name">{memberDetails?.full_name}</h4>
                  <p className="patron-profile-email">{memberDetails?.email} • {memberDetails?.phone || 'No phone'}</p>
                </div>
                <div>
                  <Badge status={memberDetails?.member_status} />
                </div>
              </div>

              <div className="history-records-subpanel">
                <h4 className="subpanel-title">Circulation Record ({memberDetails?.loans?.length || 0})</h4>

                {memberDetails?.loans?.length === 0 ? (
                  <p className="text-muted">This patron has not checked out any books yet.</p>
                ) : (
                  <table className="data-table history-table">
                    <thead>
                      <tr>
                        <th>Book Title & Barcode</th>
                        <th>Issued On</th>
                        <th>Due On</th>
                        <th>Returned On</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {memberDetails?.loans?.map((loan) => (
                        <tr key={loan.loan_id}>
                          <td>
                            <div className="book-cell-title">{loan.book_title}</div>
                            <span className="barcode-tag">{loan.barcode}</span>
                          </td>
                          <td>{formatDate(loan.issued_on)}</td>
                          <td>{formatDate(loan.due_on)}</td>
                          <td>{loan.returned_on ? formatDate(loan.returned_on) : '—'}</td>
                          <td>
                            <Badge status={loan.loan_status} />
                            {loan.loan_status === 'OVERDUE' && (
                              <div className="text-danger overdue-subtext">
                                {getOverdueText(loan.days_overdue)}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setIsHistoryModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL 4: DELETE MEMBER CONFIRMATION */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        title="Confirm Member Deletion"
        maxWidth="480px"
      >
        <div className="confirmation-content">
          <AlertCircle size={40} className="text-danger" />
          <h3 className="confirm-title">Delete Patron Record?</h3>
          <p className="confirm-text">
            Are you sure you want to delete <strong>{selectedMember?.full_name}</strong>?
          </p>
          <p className="confirm-subtext">
            If this member has active or past loan records, database relationship rules will prevent deletion.
          </p>
          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-ghost" 
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-danger"
              disabled={submitting}
              onClick={handleDeleteMember}
            >
              {submitting ? 'Deleting...' : 'Delete Member'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
