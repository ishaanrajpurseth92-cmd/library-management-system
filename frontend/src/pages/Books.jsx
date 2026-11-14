import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  Layers, 
  RefreshCw, 
  Check, 
  AlertCircle,
  Barcode,
  Calendar,
  X
} from 'lucide-react';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { formatIsbn, formatDate } from '../utils/formatters';
import api from '../services/api';

export default function Books({ onShowToast, initialSearch = '' }) {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);

  useEffect(() => {
    if (initialSearch) {
      setSearch(initialSearch);
    }
  }, [initialSearch]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCopiesModalOpen, setIsCopiesModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Target book for actions
  const [currentBook, setCurrentBook] = useState(null);
  const [bookDetails, setBookDetails] = useState(null);
  const [copiesLoading, setCopiesLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    isbn: '',
    title: '',
    category_id: '',
    publication_year: '',
    publisher: '',
    author_ids: [],
    cover_color: '#1B3B2B',
    initial_barcode: '',
    condition_note: 'Good'
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // New Copy form state (within Manage Copies modal)
  const [newCopyBarcode, setNewCopyBarcode] = useState('');
  const [newCopyAcquiredOn, setNewCopyAcquiredOn] = useState(new Date().toISOString().split('T')[0]);
  const [newCopyCondition, setNewCopyCondition] = useState('Good');
  const [copySubmitting, setCopySubmitting] = useState(false);

  // Quick Add Author / Category inside Add Book modal
  const [showQuickAuthor, setShowQuickAuthor] = useState(false);
  const [quickAuthorFirst, setQuickAuthorFirst] = useState('');
  const [quickAuthorLast, setQuickAuthorLast] = useState('');
  const [quickAuthorBio, setQuickAuthorBio] = useState('');

  // Load books
  const loadBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedCategory) params.category_id = selectedCategory;
      if (availableOnly) params.available_only = 'true';

      const res = await api.getBooks(params);
      if (res.success) {
        setBooks(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch book catalog.');
    } finally {
      setLoading(false);
    }
  };

  // Load metadata (categories & authors)
  const loadMetadata = async () => {
    try {
      const [catsRes, authorsRes] = await Promise.all([
        api.getCategories(),
        api.getAuthors()
      ]);
      if (catsRes.success) setCategories(catsRes.data);
      if (authorsRes.success) setAuthors(authorsRes.data);
    } catch (err) {
      console.warn('Metadata load error:', err.message);
    }
  };

  useEffect(() => {
    loadMetadata();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBooks();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, availableOnly]);

  // Open Manage Copies modal
  const handleOpenCopies = async (book) => {
    setCurrentBook(book);
    setIsCopiesModalOpen(true);
    setCopiesLoading(true);
    setNewCopyBarcode(`LIB-${book.isbn.slice(-4)}-${Math.floor(100 + Math.random() * 900)}`);
    try {
      const res = await api.getBook(book.book_id);
      if (res.success) {
        setBookDetails(res.data);
      }
    } catch (err) {
      onShowToast({ type: 'error', message: err.message });
    } finally {
      setCopiesLoading(false);
    }
  };

  // Add Copy handler
  const handleAddCopy = async (e) => {
    e.preventDefault();
    if (!newCopyBarcode.trim()) {
      onShowToast({ type: 'error', message: 'Barcode is required.' });
      return;
    }
    try {
      setCopySubmitting(true);
      const res = await api.addCopy(currentBook.book_id, {
        barcode: newCopyBarcode.trim(),
        acquired_on: newCopyAcquiredOn,
        condition_note: newCopyCondition
      });
      if (res.success) {
        onShowToast({ type: 'success', message: 'Physical copy registered successfully.' });
        // Refresh copies list
        const updated = await api.getBook(currentBook.book_id);
        setBookDetails(updated.data);
        setNewCopyBarcode(`LIB-${currentBook.isbn.slice(-4)}-${Math.floor(100 + Math.random() * 900)}`);
        loadBooks(); // refresh main table counts
      }
    } catch (err) {
      onShowToast({ type: 'error', message: err.message });
    } finally {
      setCopySubmitting(false);
    }
  };

  // Delete Copy handler
  const handleDeleteCopy = async (copyId) => {
    if (!window.confirm('Delete this physical copy? This cannot be undone.')) return;
    try {
      const res = await api.deleteCopy(copyId);
      if (res.success) {
        onShowToast({ type: 'success', message: 'Copy deleted successfully.' });
        const updated = await api.getBook(currentBook.book_id);
        setBookDetails(updated.data);
        loadBooks();
      }
    } catch (err) {
      onShowToast({ type: 'error', message: err.message });
    }
  };

  // Open Add Book modal
  const handleOpenAdd = () => {
    setFormData({
      isbn: '',
      title: '',
      category_id: categories[0]?.category_id || '',
      publication_year: new Date().getFullYear().toString(),
      publisher: '',
      author_ids: [],
      cover_color: '#1B3B2B',
      initial_barcode: '',
      condition_note: 'Good'
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Book modal
  const handleOpenEdit = async (book) => {
    setCurrentBook(book);
    setFormError(null);
    try {
      const res = await api.getBook(book.book_id);
      if (res.success) {
        const b = res.data;
        setFormData({
          isbn: b.isbn,
          title: b.title,
          category_id: b.category_id,
          publication_year: b.publication_year ? b.publication_year.toString() : '',
          publisher: b.publisher || '',
          author_ids: b.authors.map(a => a.author_id),
          cover_color: b.cover_color || '#1B3B2B'
        });
        setIsEditModalOpen(true);
      }
    } catch (err) {
      onShowToast({ type: 'error', message: err.message });
    }
  };

  // Submit Add Book
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    const cleanIsbn = formData.isbn.replace(/[-\s]/g, '');
    if (cleanIsbn.length !== 13) {
      setFormError('ISBN must be exactly 13 digits (excluding hyphens).');
      return;
    }
    if (!formData.title.trim()) {
      setFormError('Book title is required.');
      return;
    }
    if (!formData.category_id) {
      setFormError('Please select a category.');
      return;
    }

    try {
      setFormSubmitting(true);
      const res = await api.createBook({
        ...formData,
        isbn: cleanIsbn,
        publication_year: formData.publication_year ? parseInt(formData.publication_year, 10) : null
      });

      if (res.success) {
        onShowToast({ type: 'success', message: 'New book created successfully in MySQL!' });
        setIsAddModalOpen(false);
        loadBooks();
      }
    } catch (err) {
      setFormError(err.message || 'Error creating book.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Submit Edit Book
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const cleanIsbn = formData.isbn.replace(/[-\s]/g, '');
    if (cleanIsbn.length !== 13) {
      setFormError('ISBN must be exactly 13 digits.');
      return;
    }

    try {
      setFormSubmitting(true);
      const res = await api.updateBook(currentBook.book_id, {
        ...formData,
        isbn: cleanIsbn,
        publication_year: formData.publication_year ? parseInt(formData.publication_year, 10) : null
      });

      if (res.success) {
        onShowToast({ type: 'success', message: 'Book updated successfully!' });
        setIsEditModalOpen(false);
        loadBooks();
      }
    } catch (err) {
      setFormError(err.message || 'Error updating book.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Submit Quick Add Author
  const handleCreateQuickAuthor = async (e) => {
    e.preventDefault();
    if (!quickAuthorFirst.trim() || !quickAuthorLast.trim()) {
      onShowToast({ type: 'error', message: 'First and last name are required.' });
      return;
    }
    try {
      const res = await api.createAuthor({
        first_name: quickAuthorFirst.trim(),
        last_name: quickAuthorLast.trim(),
        bio: quickAuthorBio.trim()
      });
      if (res.success) {
        onShowToast({ type: 'success', message: `Author ${res.data.full_name} added!` });
        const newAuthor = res.data;
        setAuthors(prev => [...prev, newAuthor]);
        // Auto-select this new author in form
        setFormData(prev => ({
          ...prev,
          author_ids: [...prev.author_ids, newAuthor.author_id]
        }));
        setQuickAuthorFirst('');
        setQuickAuthorLast('');
        setQuickAuthorBio('');
        setShowQuickAuthor(false);
      }
    } catch (err) {
      onShowToast({ type: 'error', message: err.message });
    }
  };

  // Delete Book
  const handleDeleteBook = async () => {
    if (!currentBook) return;
    try {
      setFormSubmitting(true);
      const res = await api.deleteBook(currentBook.book_id);
      if (res.success) {
        onShowToast({ type: 'success', message: 'Book removed from catalogue.' });
        setIsDeleteModalOpen(false);
        setCurrentBook(null);
        loadBooks();
      }
    } catch (err) {
      onShowToast({ type: 'error', message: err.message });
    } finally {
      setFormSubmitting(false);
    }
  };

  const toggleAuthorSelection = (authorId) => {
    setFormData(prev => {
      const exists = prev.author_ids.includes(authorId);
      return {
        ...prev,
        author_ids: exists 
          ? prev.author_ids.filter(id => id !== authorId)
          : [...prev.author_ids, authorId]
      };
    });
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
              placeholder="Search by title, ISBN, author, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search catalog"
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
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.category_name} ({c.book_count || 0})
                </option>
              ))}
            </select>
          </div>

          <label className="checkbox-pill">
            <input 
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
            />
            <span>Available Only</span>
          </label>
        </div>

        <div className="toolbar-actions">
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={handleOpenAdd}
          >
            <Plus size={16} />
            <span>Add Book</span>
          </button>
          <button 
            type="button" 
            className="btn btn-ghost" 
            onClick={loadBooks}
            title="Refresh database records"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Books Table */}
      <div className="panel">
        {loading && books.length === 0 && (
          <div className="panel-loading">
            <RefreshCw size={24} className="spin text-brass" />
            <p>Querying catalogue records from MySQL...</p>
          </div>
        )}

        {error && (
          <div className="panel-error">
            <AlertCircle size={24} className="text-danger" />
            <p>{error}</p>
            <button className="btn btn-sm btn-secondary" onClick={loadBooks}>Retry</button>
          </div>
        )}

        {!loading && books.length === 0 && (
          <div className="empty-state">
            <BookOpen size={40} className="text-muted" />
            <p className="empty-title">No books match your criteria</p>
            <p className="empty-desc">Try clearing your search query or add a new title to the database.</p>
            <button className="btn btn-sm btn-primary" onClick={handleOpenAdd}>Add New Title</button>
          </div>
        )}

        {books.length > 0 && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title & Authors</th>
                  <th>ISBN</th>
                  <th>Category</th>
                  <th>Publication</th>
                  <th>Physical Inventory</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((b) => (
                  <tr key={b.book_id}>
                    <td>
                      <div className="book-cell">
                        <span 
                          className="book-dot" 
                          style={{ backgroundColor: b.cover_color || '#1B3B2B' }} 
                        />
                        <div>
                          <div className="book-cell-title">{b.title}</div>
                          <div className="book-cell-authors">{b.authors}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="isbn-badge">{formatIsbn(b.isbn)}</span>
                    </td>
                    <td>
                      <span className="category-pill">{b.category_name}</span>
                    </td>
                    <td>
                      <div className="publication-info">
                        <span>{b.publisher || 'Unknown'}</span>
                        <span className="text-muted">{b.publication_year ? `(${b.publication_year})` : ''}</span>
                      </div>
                    </td>
                    <td>
                      <div className="inventory-status-wrap">
                        {b.total_copies === 0 ? (
                          <span className="badge-inventory badge-zero">0 copies</span>
                        ) : b.available_copies > 0 ? (
                          <span className="badge-inventory badge-available">
                            {b.available_copies} of {b.total_copies} available
                          </span>
                        ) : (
                          <span className="badge-inventory badge-all-loaned">
                            0 of {b.total_copies} available (All on loan)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="action-button-group">
                        <button 
                          type="button" 
                          className="btn-action-icon" 
                          title="Manage Physical Copies"
                          onClick={() => handleOpenCopies(b)}
                          aria-label={`Manage copies for ${b.title}`}
                        >
                          <Layers size={16} />
                        </button>
                        <button 
                          type="button" 
                          className="btn-action-icon" 
                          title="Edit Book Details"
                          onClick={() => handleOpenEdit(b)}
                          aria-label={`Edit ${b.title}`}
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          type="button" 
                          className="btn-action-icon btn-action-danger" 
                          title="Delete Book"
                          onClick={() => {
                            setCurrentBook(b);
                            setIsDeleteModalOpen(true);
                          }}
                          aria-label={`Delete ${b.title}`}
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

      {/* MODAL 1: ADD BOOK */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Add New Book to Catalogue"
        maxWidth="680px"
      >
        <form onSubmit={handleAddSubmit} className="library-form">
          {formError && (
            <div className="form-error-banner">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-row">
            <div className="form-group flex-2">
              <label className="form-label" htmlFor="title">Book Title *</label>
              <input 
                id="title"
                type="text" 
                className="form-input" 
                required 
                placeholder="e.g. Database System Concepts"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="form-group flex-1">
              <label className="form-label" htmlFor="isbn">13-digit ISBN *</label>
              <input 
                id="isbn"
                type="text" 
                className="form-input" 
                required 
                maxLength={17}
                placeholder="9780070137873"
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label" htmlFor="category_id">Category *</label>
              <select 
                id="category_id"
                className="form-select"
                required
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.category_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group flex-1">
              <label className="form-label" htmlFor="publication_year">Publication Year</label>
              <input 
                id="publication_year"
                type="number" 
                className="form-input" 
                min="1000" 
                max="2100"
                placeholder="2024"
                value={formData.publication_year}
                onChange={(e) => setFormData({ ...formData, publication_year: e.target.value })}
              />
            </div>
            <div className="form-group flex-1">
              <label className="form-label" htmlFor="publisher">Publisher</label>
              <input 
                id="publisher"
                type="text" 
                className="form-input" 
                placeholder="e.g. McGraw-Hill"
                value={formData.publisher}
                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
              />
            </div>
          </div>

          {/* Authors Selection Section */}
          <div className="form-group">
            <div className="label-with-action">
              <label className="form-label">Authors</label>
              <button 
                type="button" 
                className="btn-text-action"
                onClick={() => setShowQuickAuthor(!showQuickAuthor)}
              >
                {showQuickAuthor ? 'Cancel' : '+ Quick Add Author'}
              </button>
            </div>

            {showQuickAuthor && (
              <div className="quick-add-subpanel">
                <div className="quick-add-fields">
                  <input 
                    type="text" 
                    placeholder="First Name *" 
                    className="form-input" 
                    value={quickAuthorFirst} 
                    onChange={e => setQuickAuthorFirst(e.target.value)} 
                  />
                  <input 
                    type="text" 
                    placeholder="Last Name *" 
                    className="form-input" 
                    value={quickAuthorLast} 
                    onChange={e => setQuickAuthorLast(e.target.value)} 
                  />
                  <button 
                    type="button" 
                    className="btn btn-sm btn-secondary"
                    onClick={handleCreateQuickAuthor}
                  >
                    Save Author
                  </button>
                </div>
              </div>
            )}

            <div className="authors-chip-container">
              {authors.map((a) => {
                const selected = formData.author_ids.includes(a.author_id);
                return (
                  <button
                    type="button"
                    key={a.author_id}
                    className={`author-chip ${selected ? 'selected' : ''}`}
                    onClick={() => toggleAuthorSelection(a.author_id)}
                  >
                    {selected && <Check size={14} />}
                    <span>{a.first_name} {a.last_name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Initial Physical Copy (Optional) */}
          <div className="form-section-separator">
            <span>Initial Physical Inventory (Optional)</span>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label" htmlFor="barcode">Initial Copy Barcode</label>
              <input 
                id="barcode"
                type="text" 
                className="form-input" 
                placeholder="e.g. LIB-CAT-001"
                value={formData.initial_barcode}
                onChange={(e) => setFormData({ ...formData, initial_barcode: e.target.value })}
              />
            </div>
            <div className="form-group flex-1">
              <label className="form-label" htmlFor="condition">Condition Note</label>
              <select 
                id="condition"
                className="form-select"
                value={formData.condition_note}
                onChange={(e) => setFormData({ ...formData, condition_note: e.target.value })}
              >
                <option value="Good">Good (Circulating)</option>
                <option value="New / Like New">New / Like New</option>
                <option value="Reference Only">Reference / Reserve</option>
                <option value="Minor Shelf Wear">Minor Shelf Wear</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="cover_color">Cover Color</label>
              <input 
                id="cover_color"
                type="color" 
                className="form-color-picker"
                value={formData.cover_color}
                onChange={(e) => setFormData({ ...formData, cover_color: e.target.value })}
              />
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
              disabled={formSubmitting}
            >
              {formSubmitting ? 'Writing to MySQL...' : 'Create Book'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: EDIT BOOK */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Edit Book Details"
        maxWidth="680px"
      >
        <form onSubmit={handleEditSubmit} className="library-form">
          {formError && (
            <div className="form-error-banner">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-row">
            <div className="form-group flex-2">
              <label className="form-label">Book Title *</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="form-group flex-1">
              <label className="form-label">13-digit ISBN *</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                maxLength={17}
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label">Category *</label>
              <select 
                className="form-select"
                required
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.category_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group flex-1">
              <label className="form-label">Publication Year</label>
              <input 
                type="number" 
                className="form-input" 
                min="1000" 
                max="2100"
                value={formData.publication_year}
                onChange={(e) => setFormData({ ...formData, publication_year: e.target.value })}
              />
            </div>
            <div className="form-group flex-1">
              <label className="form-label">Publisher</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.publisher}
                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
              />
            </div>
          </div>

          {/* Authors */}
          <div className="form-group">
            <label className="form-label">Associated Authors</label>
            <div className="authors-chip-container">
              {authors.map((a) => {
                const selected = formData.author_ids.includes(a.author_id);
                return (
                  <button
                    type="button"
                    key={a.author_id}
                    className={`author-chip ${selected ? 'selected' : ''}`}
                    onClick={() => toggleAuthorSelection(a.author_id)}
                  >
                    {selected && <Check size={14} />}
                    <span>{a.first_name} {a.last_name}</span>
                  </button>
                );
              })}
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
              disabled={formSubmitting}
            >
              {formSubmitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: MANAGE PHYSICAL COPIES */}
      <Modal 
        isOpen={isCopiesModalOpen} 
        onClose={() => setIsCopiesModalOpen(false)} 
        title={`Physical Inventory: ${currentBook?.title || 'Book'}`}
        maxWidth="750px"
      >
        <div className="copies-manager-modal">
          {copiesLoading ? (
            <div className="panel-loading">
              <RefreshCw size={24} className="spin text-brass" />
              <p>Loading inventory copies from database...</p>
            </div>
          ) : (
            <>
              {/* Existing Copies Table */}
              <div className="existing-copies-subpanel">
                <h4 className="subpanel-title">Registered Physical Copies ({bookDetails?.copies?.length || 0})</h4>
                
                {bookDetails?.copies?.length === 0 ? (
                  <p className="text-muted">No physical copies currently registered for this title.</p>
                ) : (
                  <table className="data-table copies-table">
                    <thead>
                      <tr>
                        <th>Barcode</th>
                        <th>Acquired On</th>
                        <th>Condition</th>
                        <th>Status</th>
                        <th>Current Borrower</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookDetails?.copies?.map((copy) => (
                        <tr key={copy.copy_id}>
                          <td><span className="barcode-tag">{copy.barcode}</span></td>
                          <td>{formatDate(copy.acquired_on)}</td>
                          <td>{copy.condition_note || 'Good'}</td>
                          <td>
                            <Badge status={copy.status} />
                          </td>
                          <td>
                            {copy.status === 'ON LOAN' ? (
                              <span className="borrower-pill">
                                {copy.borrower_name} (Due {formatDate(copy.due_on)})
                              </span>
                            ) : (
                              <span className="text-muted">Available on shelf</span>
                            )}
                          </td>
                          <td className="text-right">
                            <button
                              type="button"
                              className="btn-action-icon btn-action-danger"
                              title="Delete copy"
                              disabled={copy.status === 'ON LOAN'}
                              onClick={() => handleDeleteCopy(copy.copy_id)}
                              aria-label={`Delete copy ${copy.barcode}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Add New Copy Sub-Form */}
              <form onSubmit={handleAddCopy} className="add-copy-subform">
                <h4 className="subpanel-title">+ Add New Physical Copy</h4>
                <div className="form-row">
                  <div className="form-group flex-1">
                    <label className="form-label" htmlFor="new_barcode">Barcode *</label>
                    <input 
                      id="new_barcode"
                      type="text" 
                      className="form-input" 
                      required 
                      placeholder="LIB-XXX-001"
                      value={newCopyBarcode}
                      onChange={(e) => setNewCopyBarcode(e.target.value)}
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label className="form-label" htmlFor="new_acquired">Acquired Date</label>
                    <input 
                      id="new_acquired"
                      type="date" 
                      className="form-input" 
                      required
                      value={newCopyAcquiredOn}
                      onChange={(e) => setNewCopyAcquiredOn(e.target.value)}
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label className="form-label" htmlFor="new_condition">Condition</label>
                    <select 
                      id="new_condition"
                      className="form-select"
                      value={newCopyCondition}
                      onChange={(e) => setNewCopyCondition(e.target.value)}
                    >
                      <option value="Pristine">Pristine</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Reference Only">Reference Only</option>
                    </select>
                  </div>
                </div>
                <div className="text-right">
                  <button 
                    type="submit" 
                    className="btn btn-sm btn-primary"
                    disabled={copySubmitting}
                  >
                    {copySubmitting ? 'Registering...' : 'Register Physical Copy'}
                  </button>
                </div>
              </form>
            </>
          )}

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setIsCopiesModalOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL 4: DELETE CONFIRMATION */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        title="Confirm Book Deletion"
        maxWidth="480px"
      >
        <div className="confirmation-content">
          <AlertCircle size={40} className="text-danger" />
          <h3 className="confirm-title">Are you sure?</h3>
          <p className="confirm-text">
            You are about to delete <strong>{currentBook?.title}</strong> (ISBN: {currentBook?.isbn}) from the database.
          </p>
          <p className="confirm-subtext">
            Note: MySQL foreign key rules will prevent deletion if this book has any active or historical loan records.
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
              disabled={formSubmitting}
              onClick={handleDeleteBook}
            >
              {formSubmitting ? 'Deleting...' : 'Delete Book'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
