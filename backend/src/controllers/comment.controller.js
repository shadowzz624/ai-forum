/**
 * 评论控制器
 * @module controllers/comment.controller
 */

const commentModel = require('../models/comment.model');
const postModel = require('../models/post.model');

/**
 * 获取帖子评论列表
 * GET /api/posts/:id/comments
 */
async function getComments(req, res) {
  try {
    const postId = parseInt(req.params.id);
    
    if (!postId || postId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: '无效的帖子 ID'
        }
      });
    }
    
    // 检查帖子是否存在
    const post = await postModel.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'POST_NOT_FOUND',
          message: '帖子不存在'
        }
      });
    }
    
    const page = parseInt(req.query.page) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize) || 50, 100);
    
    const result = await commentModel.findByPostId(postId, { page, pageSize });
    
    res.json({
      success: true,
      data: {
        items: result.items,
        pagination: result.pagination
      },
      message: '操作成功'
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '获取评论列表时发生错误'
      }
    });
  }
}

/**
 * 创建评论
 * POST /api/posts/:id/comments
 */
async function createComment(req, res) {
  try {
    const postId = parseInt(req.params.id);
    const userId = req.user.userId;
    const { content, parentId } = req.body;
    
    if (!postId || postId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: '无效的帖子 ID'
        }
      });
    }
    
    // 验证输入
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '评论内容不能为空'
        }
      });
    }
    
    // 检查帖子是否存在
    const post = await postModel.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'POST_NOT_FOUND',
          message: '帖子不存在'
        }
      });
    }
    
    // 如果是回复，检查父评论是否存在
    if (parentId) {
      const parent = await commentModel.findById(parentId);
      if (!parent || parent.postId !== postId) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'COMMENT_NOT_FOUND',
            message: '父评论不存在'
          }
        });
      }
    }
    
    const comment = await commentModel.create({
      postId,
      userId,
      content: content.trim(),
      parentId: parentId || null
    });
    
    res.status(201).json({
      success: true,
      data: comment,
      message: '评论成功'
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '发表评论时发生错误'
      }
    });
  }
}

/**
 * 更新评论
 * PUT /api/comments/:id
 */
async function updateComment(req, res) {
  try {
    const commentId = parseInt(req.params.id);
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';
    const { content } = req.body;
    
    if (!commentId || commentId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: '无效的评论 ID'
        }
      });
    }
    
    // 检查评论是否存在
    const existing = await commentModel.findById(commentId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COMMENT_NOT_FOUND',
          message: '评论不存在'
        }
      });
    }
    
    // 检查权限
    const isAuthor = await commentModel.isAuthor(commentId, userId);
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '无权修改此评论'
        }
      });
    }
    
    const comment = await commentModel.update(commentId, {
      content: content?.trim()
    });
    
    res.json({
      success: true,
      data: comment,
      message: '评论更新成功'
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '更新评论时发生错误'
      }
    });
  }
}

/**
 * 删除评论
 * DELETE /api/comments/:id
 */
async function deleteComment(req, res) {
  try {
    const commentId = parseInt(req.params.id);
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';
    
    if (!commentId || commentId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: '无效的评论 ID'
        }
      });
    }
    
    // 检查评论是否存在
    const existing = await commentModel.findById(commentId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COMMENT_NOT_FOUND',
          message: '评论不存在'
        }
      });
    }
    
    // 检查权限
    const isAuthor = await commentModel.isAuthor(commentId, userId);
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '无权删除此评论'
        }
      });
    }
    
    await commentModel.softDelete(commentId);
    
    res.json({
      success: true,
      message: '评论删除成功'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '删除评论时发生错误'
      }
    });
  }
}

module.exports = {
  getComments,
  createComment,
  updateComment,
  deleteComment
};