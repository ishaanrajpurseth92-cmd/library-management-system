let cachedCsrfToken = null;

/**
 * Fetch and cache CSRF token from backend
 */
async function fetchCsrfToken() {
  try {
    const res = await fetch('/api/csrf-token');
    if (res.ok) {
      const data = await res.json();
      cachedCsrfToken = data.csrfToken;
      return cachedCsrfToken;
    }
  } catch (err) {
    console.warn('Could not fetch CSRF token:', err.message);
  }
  return null;
}

/**
 * Generic request helper with error handling and CSRF integration
 */
async function request(endpoint, options = {}) {
  const method = options.method || 'GET';
  const headers = {
    'Content-Type': 'application/json',
    'x-client': 'library-frontend',
    'x-requested-with': 'XMLHttpRequest',
    ...(options.headers || {})
  };

  // Attach CSRF token on mutating requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase())) {
    if (!cachedCsrfToken) {
      await fetchCsrfToken();
    }
    if (cachedCsrfToken) {
      headers['x-csrf-token'] = cachedCsrfToken;
    }
  }

  const config = {
    ...options,
    method,
    headers
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const res = await fetch(endpoint, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data.error || `Request failed with status ${res.status}`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    console.error(`API Error [${method} ${endpoint}]:`, err.message);
    throw err;
  }
}

export const api = {
  // Initialize CSRF
  init: fetchCsrfToken,

  // Auth
  login: (credentials) => request('/api/auth/login', { method: 'POST', body: credentials }),
  register: (data) => request('/api/auth/register', { method: 'POST', body: data }),
  getMe: () => request('/api/auth/me'),

  // Health
  checkHealth: () => request('/api/health'),

  // Books
  getBooks: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/books${query ? `?${query}` : ''}`);
  },
  getBook: (id) => request(`/api/books/${id}`),
  createBook: (data) => request('/api/books', { method: 'POST', body: data }),
  updateBook: (id, data) => request(`/api/books/${id}`, { method: 'PUT', body: data }),
  deleteBook: (id) => request(`/api/books/${id}`, { method: 'DELETE' }),
  addCopy: (bookId, data) => request(`/api/books/${bookId}/copies`, { method: 'POST', body: data }),
  deleteCopy: (copyId) => request(`/api/books/copies/${copyId}`, { method: 'DELETE' }),

  // Members
  getMembers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/members${query ? `?${query}` : ''}`);
  },
  getMember: (id) => request(`/api/members/${id}`),
  createMember: (data) => request('/api/members', { method: 'POST', body: data }),
  updateMember: (id, data) => request(`/api/members/${id}`, { method: 'PUT', body: data }),
  deleteMember: (id) => request(`/api/members/${id}`, { method: 'DELETE' }),

  // Loans
  getLoans: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/loans${query ? `?${query}` : ''}`);
  },
  getAvailableCopies: () => request('/api/loans/available-copies'),
  issueLoan: (data) => request('/api/loans', { method: 'POST', body: data }),
  returnLoan: (loanId, data = {}) => request(`/api/loans/${loanId}/return`, { method: 'PUT', body: data }),

  // Reports
  getDashboardReport: () => request('/api/reports/dashboard'),
  getMostBorrowedReport: () => request('/api/reports/most-borrowed'),
  getCategoryReport: () => request('/api/reports/by-category'),
  getCopyStatusReport: () => request('/api/reports/copy-status'),
  getMemberStatsReport: () => request('/api/reports/member-stats'),

  // Metadata
  getCategories: () => request('/api/categories'),
  createCategory: (data) => request('/api/categories', { method: 'POST', body: data }),
  getAuthors: () => request('/api/authors'),
  createAuthor: (data) => request('/api/authors', { method: 'POST', body: data })
};

export default api;
