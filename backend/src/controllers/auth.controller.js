/**
 * 认证控制器
 * @module controllers/auth.controller
 */

const userModel = require('../models/user.model');
const apiKeyModel = require('../models/apiKey.model');
const validators = require('../utils/validators');
const db = require('../models/db');

/**
 * 用户注册
 * POST /api/auth/register
 */
async function register(req, res) {
  try {
    // 验证输入
    const validation = validators.validateRegister(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.errors.join('; ')
        }
      });
    }
    
    const username = validators.sanitize(req.body.username);
    const avatar = validators.sanitize(req.body.avatar);
    const bio = validators.sanitize(req.body.bio);
    const style = req.body.style || 'neutral';
    
    // 检查用户名是否已存在
    const exists = await userModel.existsByUsername(username);
    if (exists) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_USERNAME',
          message: '用户名已被使用'
        }
      });
    }
    
    // 检查是否是第一个用户（自动设为管理员）
    const userCount = await db.queryOne('SELECT COUNT(*) as count FROM users');
    const role = userCount.count === 0 ? 'admin' : 'agent';
    
    // 创建用户
    const user = await userModel.create({
      username,
      avatar,
      bio,
      style,
      role
    });
    
    // 生成 API Key
    const apiKeyData = await apiKeyModel.create(user.user_id);
    
    // 返回结果
    res.status(201).json({
      success: true,
      data: {
        userId: user.user_id,
        apiKey: apiKeyData.apiKey,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        style: user.style,
        role: user.role
      },
      message: '注册成功，请妥善保管您的 API Key'
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '注册过程中发生错误'
      }
    });
  }
}

/**
 * 用户登录（获取 API Key）
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    // 验证输入
    const validation = validators.validateLogin(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.errors.join('; ')
        }
      });
    }
    
    const username = validators.sanitize(req.body.username);
    
    // 查找用户
    const user = await userModel.findByUsername(username);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: '用户不存在'
        }
      });
    }
    
    // 检查用户状态
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'USER_DISABLED',
          message: '用户已被禁用'
        }
      });
    }
    
    // 获取或创建 API Key
    let apiKeys = await apiKeyModel.findByUserId(user.user_id);
    let apiKey;
    
    if (apiKeys.length > 0 && apiKeys[0].is_active) {
      // 使用现有的有效 Key
      apiKey = apiKeys[0].api_key;
    } else {
      // 创建新的 Key
      const newKey = await apiKeyModel.create(user.user_id);
      apiKey = newKey.apiKey;
    }
    
    res.json({
      success: true,
      data: {
        apiKey
      },
      message: '登录成功'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '登录过程中发生错误'
      }
    });
  }
}

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
async function getCurrentUser(req, res) {
  try {
    // 用户信息已通过中间件附加
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未登录'
        }
      });
    }
    
    // 获取完整用户信息
    const fullUser = await userModel.findById(user.userId);
    if (!fullUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: '用户不存在'
        }
      });
    }
    
    // 获取统计信息
    const stats = await userModel.getStats(user.userId);
    
    res.json({
      success: true,
      data: {
        userId: fullUser.user_id,
        username: fullUser.username,
        avatar: fullUser.avatar,
        bio: fullUser.bio,
        style: fullUser.style,
        role: fullUser.role,
        status: fullUser.status,
        createdAt: fullUser.created_at,
        stats
      },
      message: '操作成功'
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '获取用户信息时发生错误'
      }
    });
  }
}

module.exports = {
  register,
  login,
  getCurrentUser
};