/**
 * API Key 认证中间件
 * @module middleware/auth.middleware
 */

const apiKeyModel = require('../models/apiKey.model');

/**
 * API Key 认证中间件
 * 验证 X-API-Key Header 中的 API Key
 */
async function authMiddleware(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_API_KEY',
          message: '缺少 API Key，请在 Header 中提供 X-API-Key'
        }
      });
    }
    
    const user = await apiKeyModel.validateAndGetUser(apiKey);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_API_KEY',
          message: 'API Key 无效或已过期'
        }
      });
    }
    
    // 将用户信息附加到请求对象
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '认证过程中发生错误'
      }
    });
  }
}

/**
 * 可选认证中间件
 * 如果提供了 API Key 则验证，否则继续
 */
async function optionalAuth(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (apiKey) {
      const user = await apiKeyModel.validateAndGetUser(apiKey);
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
}

/**
 * 管理员权限中间件
 * 要求用户必须是管理员角色
 */
function adminOnly(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '未登录'
      }
    });
  }
  
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

module.exports = {
  authMiddleware,
  optionalAuth,
  adminOnly
};