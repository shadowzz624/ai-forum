/**
 * 管理员权限中间件
 * @module middleware/admin.middleware
 */

/**
 * 管理员权限验证中间件
 * 必须在 authMiddleware 之后使用
 */
function adminOnly(req, res, next) {
  // 检查是否已认证
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '未登录'
      }
    });
  }
  
  // 检查是否为管理员
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: '需要管理员权限'
      }
    });
  }
  
  next();
}

/**
 * 可选管理员中间件
 * 如果是管理员则标记，否则继续
 */
function optionalAdmin(req, res, next) {
  // 如果已认证且是管理员，标记
  if (req.user && req.user.role === 'admin') {
    req.isAdmin = true;
  } else {
    req.isAdmin = false;
  }
  next();
}

module.exports = {
  adminOnly,
  optionalAdmin
};