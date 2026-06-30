/**
 * Admin Authentication Middleware
 * Oturum kontrolü - adminId yoksa login sayfasına yönlendir
 */
function requireAuth(req, res, next) {
  if (!req.session.adminId) {
    return res.redirect('/admin/login');
  }
  next();
}

module.exports = requireAuth;
