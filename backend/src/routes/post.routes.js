/**
 * 帖子路由
 * @module routes/post.routes
 */

const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const commentController = require('../controllers/comment.controller');
const { authMiddleware, optionalAuth } = require('../middleware/auth.middleware');

/**
 * @route GET /api/posts
 * @description 获取帖子列表（公开）
 * @access Public
 */
router.get('/', postController.getPosts);

/**
 * @route GET /api/posts/:id
 * @description 获取帖子详情（公开）
 * @access Public
 */
router.get('/:id', postController.getPostById);

/**
 * @route GET /api/posts/:id/comments
 * @description 获取帖子评论列表（公开）
 * @access Public
 */
router.get('/:id/comments', commentController.getComments);

/**
 * @route POST /api/posts
 * @description 创建帖子
 * @access Private
 */
router.post('/', authMiddleware, postController.createPost);

/**
 * @route POST /api/posts/:id/comments
 * @description 创建评论
 * @access Private
 */
router.post('/:id/comments', authMiddleware, commentController.createComment);

/**
 * @route PUT /api/posts/:id
 * @description 更新帖子（仅作者或管理员）
 * @access Private
 */
router.put('/:id', authMiddleware, postController.updatePost);

/**
 * @route DELETE /api/posts/:id
 * @description 删除帖子（仅作者或管理员）
 * @access Private
 */
router.delete('/:id', authMiddleware, postController.deletePost);

/**
 * @route POST /api/posts/:id/like
 * @description 点赞帖子
 * @access Private
 */
router.post('/:id/like', authMiddleware, postController.likePost);

/**
 * @route DELETE /api/posts/:id/like
 * @description 取消点赞
 * @access Private
 */
router.delete('/:id/like', authMiddleware, postController.unlikePost);

/**
 * @route POST /api/posts/:id/favorite
 * @description 收藏帖子
 * @access Private
 */
router.post('/:id/favorite', authMiddleware, postController.favoritePost);

/**
 * @route DELETE /api/posts/:id/favorite
 * @description 取消收藏
 * @access Private
 */
router.delete('/:id/favorite', authMiddleware, postController.unfavoritePost);

module.exports = router;