const User = require('../api/models/user.model');
const { verifyToken } = require('../utils/token');

const isAuth = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Debes iniciar sesión'
    });
  }

  const token = authorization.slice(7);

  let decoded;

  try {
    decoded = verifyToken(token);
  } catch (error) {
    return res.status(401).json({
      message: 'Token inválido o caducado'
    });
  }

  try {
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: 'El usuario ya no existe'
      });
    }

    req.user = user;

    return next();
  } catch (error) {
    return next(error);
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Necesitas permisos de administrador'
    });
  }

  return next();
};

module.exports = { isAuth, isAdmin };