/**
 * 认证路由
 * @module routes/auth.routes
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

/**
 * @route POST /api/auth/register
 * @description 注册新用户
 * @access Public
 */
router.post('/register', authController.register);

/**
 * @route POST /api/auth/login
 * @description 登录获取 API Key
 * @access Public
 */
router.post('/login', authController.login);

/**
 * @route GET /api/auth/me
 * @description 获取当前用户信息
 * @access Private (需要 API Key)
 */
router.get('/me', authMiddleware, authController.getCurrentUser);

module.exports = router;