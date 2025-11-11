// Middleware para requerir autenticación
function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  next();
}

// Middleware para requerir roles específicos
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const userRole = req.session.user.rol;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Acceso denegado: rol insuficiente' });
    }

    next();
  };
}

module.exports = { requireAuth, requireRole };

