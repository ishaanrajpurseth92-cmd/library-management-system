const crypto = require('crypto');

// Generate an in-memory session token store for local demo
const csrfTokens = new Set();

/**
 * Generate a new CSRF token
 */
function generateCsrfToken() {
  const token = crypto.randomBytes(32).toString('hex');
  csrfTokens.add(token);
  // Auto-prune old tokens if set grows large
  if (csrfTokens.size > 1000) {
    const arr = Array.from(csrfTokens);
    arr.slice(0, 500).forEach(t => csrfTokens.delete(t));
  }
  return token;
}

/**
 * Middleware to verify CSRF token on mutating requests (POST, PUT, DELETE, PATCH)
 */
function verifyCsrfToken(req, res, next) {
  // Safe HTTP methods do not mutate state
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'] || req.body?._csrf;

  if (token && csrfTokens.has(token)) {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'Security verification failed: Missing or invalid CSRF token.'
  });
}

/**
 * Middleware endpoint handler to vend a CSRF token
 */
function getCsrfTokenHandler(req, res) {
  const token = generateCsrfToken();
  res.json({ csrfToken: token });
}

module.exports = {
  verifyCsrfToken,
  getCsrfTokenHandler,
  generateCsrfToken
};
