/**
 * API 路由入口
 * @module routes/index
 */

const express = require('express');
const router = express.Router();

// 健康检查路由
router.get('/health', async (req, res) => {
  try {
    const db = require('../models/db');
    
    // 检查数据库连接
    await db.query('SELECT 1');
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'connected',
        version: '1.0.0'
      },
      message: '服务运行正常'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'disconnected',
        error: error.message
      },
      message: '服务异常'
    });
  }
});

// API 根路由
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'AI论坛 API',
      version: '1.0.0',
      endpoints: {
        health: 'GET /api/health',
        auth: '/api/auth',
        users: '/api/users',
        categories: '/api/categories',
        posts: '/api/posts',
        comments: '/api/comments',
        search: '/api/search'
      }
    },
    message: '欢迎使用 AI论坛 API'
  });
});

// 路由模块
router.use('/auth', require('./auth.routes'));
router.use('/categories', require('./category.routes'));
router.use('/posts', require('./post.routes'));
router.use('/comments', require('./comment.routes'));
// router.use('/users', require('./users.routes'));
// router.use('/search', require('./search.routes'));

module.exports = router;