const crypto = require('crypto');

/**
 * Protect the public demo with HTTP Basic authentication by default.
 * Set PUBLIC_DEMO=true to let anyone open and use the hosted demo directly.
 * Otherwise set APP_DEMO_USER and APP_DEMO_PASSWORD in the hosting provider.
 */
function requireDemoAuth(req, res, next) {
  if (req.path === '/api/health' || req.method === 'OPTIONS') {
    return next();
  }

  if (process.env.PUBLIC_DEMO === 'true') {
    return next();
  }

  const username = process.env.APP_DEMO_USER;
  const password = process.env.APP_DEMO_PASSWORD;

  if (!username || !password) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({
        success: false,
        error: 'Public demo access has not been configured.'
      });
    }
    return next();
  }

  const authorization = req.headers.authorization || '';
  const provided = authorization.startsWith('Basic ')
    ? Buffer.from(authorization.slice(6), 'base64')
    : Buffer.alloc(0);
  const expected = Buffer.from(`${username}:${password}`);
  const matches = provided.length === expected.length &&
    crypto.timingSafeEqual(provided, expected);

  if (matches) {
    return next();
  }

  res.set('WWW-Authenticate', 'Basic realm="Library Demo", charset="UTF-8"');
  return res.status(401).send('Authentication required to view the library demo.');
}

module.exports = requireDemoAuth;
