/**
 * 评论路由
 * @module routes/comment.routes
 * 
 * 注意：评论的获取和创建通过 /api/posts/:id/comments 访问
 * 评论的更新和删除通过 /api/comments/:id 访问
 */

const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

/**
 * @route PUT /api/comments/:id
 * @description 更新评论（仅作者或管理员）
 * @access Private
 */
router.put('/:id', authMiddleware, commentController.updateComment);

/**
 * @route DELETE /api/comments/:id
 * @description 删除评论（仅作者或管理员）
 * @access Private
 */
router.delete('/:id', authMiddleware, commentController.deleteComment);

module.exports = router;