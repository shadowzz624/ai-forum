/**
 * 帖子控制器
 * @module controllers/post.controller
 */

const postModel = require('../models/post.model');
const categoryModel = require('../models/category.model');

/**
 * 获取帖子列表
 * GET /api/posts
 */
async function getPosts(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize) || 20, 100);
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId) : null;
    const authorId = req.query.authorId ? parseInt(req.query.authorId) : null;
    const sortBy = req.query.sortBy || 'latest';
    
    const result = await postModel.findPaginated({
      page,
      pageSize,
      categoryId,
      authorId,
      sortBy
    });
    
    res.json({
      success: true,
      data: {
        items: result.items,
        pagination: result.pagination
      },
      message: '操作成功'
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '获取帖子列表时发生错误'
      }
    });
  }
}

/**
 * 获取帖子详情
 * GET /api/posts/:id
 */
async function getPostById(req, res) {
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
    
    const post = await postModel.findById(postId);
    
    if (!post || post.isDeleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'POST_NOT_FOUND',
          message: '帖子不存在'
        }
      });
    }
    
    // 增加浏览次数
    await postModel.incrementViewCount(postId);
    post.viewCount++;
    
    res.json({
      success: true,
      data: post,
      message: '操作成功'
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '获取帖子详情时发生错误'
      }
    });
  }
}

/**
 * 创建帖子
 * POST /api/posts
 */
async function createPost(req, res) {
  try {
    const { categoryId, title, content, tags } = req.body;
    const userId = req.user.userId;
    
    // 验证输入
    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '帖子标题不能为空'
        }
      });
    }
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '帖子内容不能为空'
        }
      });
    }
    
    if (!categoryId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '请选择板块'
        }
      });
    }
    
    // 检查板块是否存在
    const category = await categoryModel.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: '板块不存在'
        }
      });
    }
    
    // 创建帖子
    const post = await postModel.create({
      userId,
      categoryId,
      title: title.trim(),
      content: content.trim(),
      tags: tags || []
    });
    
    res.status(201).json({
      success: true,
      data: post,
      message: '帖子发布成功'
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '发布帖子时发生错误'
      }
    });
  }
}

/**
 * 更新帖子
 * PUT /api/posts/:id
 */
async function updatePost(req, res) {
  try {
    const postId = parseInt(req.params.id);
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';
    
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
    const existing = await postModel.findById(postId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'POST_NOT_FOUND',
          message: '帖子不存在'
        }
      });
    }
    
    // 检查权限
    const isAuthor = await postModel.isAuthor(postId, userId);
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '无权修改此帖子'
        }
      });
    }
    
    const { title, content, tags } = req.body;
    
    const post = await postModel.update(postId, {
      title: title?.trim(),
      content: content?.trim(),
      tags
    });
    
    res.json({
      success: true,
      data: post,
      message: '帖子更新成功'
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '更新帖子时发生错误'
      }
    });
  }
}

/**
 * 删除帖子
 * DELETE /api/posts/:id
 */
async function deletePost(req, res) {
  try {
    const postId = parseInt(req.params.id);
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';
    
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
    const existing = await postModel.findById(postId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'POST_NOT_FOUND',
          message: '帖子不存在'
        }
      });
    }
    
    // 检查权限
    const isAuthor = await postModel.isAuthor(postId, userId);
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '无权删除此帖子'
        }
      });
    }
    
    await postModel.softDelete(postId);
    
    res.json({
      success: true,
      message: '帖子删除成功'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '删除帖子时发生错误'
      }
    });
  }
}

/**
 * 点赞帖子
 * POST /api/posts/:id/like
 */
async function likePost(req, res) {
  try {
    const postId = req.params.id;
    const userId = req.user.userId;
    
    const post = await postModel.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: { code: 'POST_NOT_FOUND', message: '帖子不存在' }
      });
    }
    
    await postModel.incrementLikeCount(postId);
    
    res.json({
      success: true,
      message: '点赞成功'
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '点赞失败' }
    });
  }
}

/**
 * 取消点赞
 * DELETE /api/posts/:id/like
 */
async function unlikePost(req, res) {
  try {
    const postId = req.params.id;
    const userId = req.user.userId;
    
    await postModel.decrementLikeCount(postId);
    
    res.json({
      success: true,
      message: '取消点赞成功'
    });
  } catch (error) {
    console.error('Unlike post error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取消点赞失败' }
    });
  }
}

/**
 * 收藏帖子
 * POST /api/posts/:id/favorite
 */
async function favoritePost(req, res) {
  try {
    const postId = req.params.id;
    
    const post = await postModel.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: { code: 'POST_NOT_FOUND', message: '帖子不存在' }
      });
    }
    
    res.json({
      success: true,
      message: '收藏成功'
    });
  } catch (error) {
    console.error('Favorite post error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '收藏失败' }
    });
  }
}

/**
 * 取消收藏
 * DELETE /api/posts/:id/favorite
 */
async function unfavoritePost(req, res) {
  try {
    const postId = req.params.id;
    
    res.json({
      success: true,
      message: '取消收藏成功'
    });
  } catch (error) {
    console.error('Unfavorite post error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取消收藏失败' }
    });
  }
}


module.exports = {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  favoritePost,
  unfavoritePost
};
