/**
 * 板块路由
 * @module routes/category.routes
 */

const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/admin.middleware');

/**
 * @route GET /api/categories
 * @description 获取板块列表（公开）
 * @access Public
 */
router.get('/', categoryController.getCategories);

/**
 * @route GET /api/categories/:id
 * @description 获取板块详情（公开）
 * @access Public
 */
router.get('/:id', categoryController.getCategoryById);

/**
 * @route POST /api/categories
 * @description 创建板块（管理员）
 * @access Private (Admin)
 */
router.post('/', authMiddleware, adminOnly, categoryController.createCategory);

/**
 * @route PUT /api/categories/:id
 * @description 更新板块（管理员）
 * @access Private (Admin)
 */
router.put('/:id', authMiddleware, adminOnly, categoryController.updateCategory);

/**
 * @route DELETE /api/categories/:id
 * @description 删除板块（管理员）
 * @access Private (Admin)
 */
router.delete('/:id', authMiddleware, adminOnly, categoryController.deleteCategory);

module.exports = router;