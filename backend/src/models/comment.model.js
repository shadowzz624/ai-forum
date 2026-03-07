/**
 * 评论模型
 * @module models/comment.model
 */

const db = require('./db');

/**
 * 获取帖子评论列表（优化版 - 避免 N+1 查询）
 * @param {number} postId - 帖子 ID
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 评论列表
 */
async function findByPostId(postId, options = {}) {
  const { page = 1, pageSize = 50 } = options;
  const offset = (page - 1) * pageSize;
  
  // 查询总数
  const countResult = await db.queryOne(
    'SELECT COUNT(*) as total FROM comments WHERE post_id = ? AND is_deleted = 0',
    [postId]
  );
  const total = countResult.total;
  
  // 一次性获取所有评论（优化 N+1 问题）
  const allCommentsSql = `
    SELECT 
      c.*,
      u.username as author_name,
      u.avatar as author_avatar
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.user_id
    WHERE c.post_id = ? AND c.is_deleted = 0
    ORDER BY c.created_at ASC
  `;
  
  const allComments = await db.query(allCommentsSql, [postId]);
  
  // 在内存中构建树形结构
  const rootComments = allComments.filter(c => c.parent_id === null);
  
  function buildTree(comment) {
    const replies = allComments.filter(c => c.parent_id === comment.comment_id);
    const formatted = formatComment(comment);
    formatted.replies = replies.map(buildTree);
    return formatted;
  }
  
  // 分页处理根评论
  const paginatedRoots = rootComments.slice(offset, offset + pageSize);
  const formattedComments = paginatedRoots.map(buildTree);
  
  return {
    items: formattedComments,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  };
}

/**
 * 获取评论的回复
 * @param {number} parentId - 父评论 ID
 * @param {number} depth - 递归深度
 * @returns {Promise<Array>} 回复列表
 */
async function getReplies(parentId, depth = 0) {
  if (depth >= 3) return []; // 限制嵌套深度
  
  const sql = `
    SELECT 
      c.*,
      u.username as author_name,
      u.avatar as author_avatar
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.user_id
    WHERE c.parent_id = ? AND c.is_deleted = 0
    ORDER BY c.created_at ASC
  `;
  
  const replies = await db.query(sql, [parentId]);
  
  const formattedReplies = [];
  for (const reply of replies) {
    const formatted = formatComment(reply);
    formatted.replies = await getReplies(reply.comment_id, depth + 1);
    formattedReplies.push(formatted);
  }
  
  return formattedReplies;
}

/**
 * 根据 ID 查找评论
 * @param {number} commentId - 评论 ID
 * @returns {Promise<Object|null>} 评论对象
 */
async function findById(commentId) {
  const sql = `
    SELECT 
      c.*,
      u.username as author_name,
      u.avatar as author_avatar
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.user_id
    WHERE c.comment_id = ?
  `;
  
  const comment = await db.queryOne(sql, [commentId]);
  return comment ? formatComment(comment) : null;
}

/**
 * 创建评论
 * @param {Object} data - 评论数据
 * @returns {Promise<Object>} 创建的评论
 */
async function create(data) {
  const { postId, userId, content, parentId = null } = data;
  
  // 确定根评论 ID
  let rootId = null;
  if (parentId) {
    const parent = await db.queryOne(
      'SELECT root_id, parent_id FROM comments WHERE comment_id = ?',
      [parentId]
    );
    if (parent) {
      rootId = parent.root_id || parentId;
    }
  }
  
  const sql = `
    INSERT INTO comments (post_id, user_id, parent_id, root_id, content)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  const commentId = await db.insert(sql, [postId, userId, parentId, rootId, content]);
  
  // 更新父评论的回复数
  if (parentId) {
    await db.update(
      'UPDATE comments SET reply_count = reply_count + 1 WHERE comment_id = ?',
      [parentId]
    );
  }
  
  // 更新帖子评论数
  const postModel = require('./post.model');
  await postModel.incrementCommentCount(postId);
  
  return await findById(commentId);
}

/**
 * 更新评论
 * @param {number} commentId - 评论 ID
 * @param {Object} data - 更新数据
 * @returns {Promise<Object|null>} 更新后的评论
 */
async function update(commentId, data) {
  const { content } = data;
  
  if (content !== undefined) {
    await db.update(
      'UPDATE comments SET content = ? WHERE comment_id = ?',
      [content, commentId]
    );
  }
  
  return await findById(commentId);
}

/**
 * 软删除评论
 * @param {number} commentId - 评论 ID
 * @returns {Promise<boolean>} 是否成功
 */
async function softDelete(commentId) {
  // 获取评论信息
  const comment = await db.queryOne(
    'SELECT post_id, parent_id FROM comments WHERE comment_id = ?',
    [commentId]
  );
  
  if (!comment) return false;
  
  // 软删除
  const affected = await db.update(
    'UPDATE comments SET is_deleted = 1 WHERE comment_id = ?',
    [commentId]
  );
  
  if (affected > 0) {
    // 更新父评论的回复数
    if (comment.parent_id) {
      await db.update(
        'UPDATE comments SET reply_count = GREATEST(0, reply_count - 1) WHERE comment_id = ?',
        [comment.parent_id]
      );
    }
    
    // 更新帖子评论数
    const postModel = require('./post.model');
    await postModel.decrementCommentCount(comment.post_id);
  }
  
  return affected > 0;
}

/**
 * 增加点赞数
 * @param {number} commentId - 评论 ID
 */
async function incrementLikeCount(commentId) {
  await db.update(
    'UPDATE comments SET like_count = like_count + 1 WHERE comment_id = ?',
    [commentId]
  );
}

/**
 * 减少点赞数
 * @param {number} commentId - 评论 ID
 */
async function decrementLikeCount(commentId) {
  await db.update(
    'UPDATE comments SET like_count = GREATEST(0, like_count - 1) WHERE comment_id = ?',
    [commentId]
  );
}

/**
 * 检查用户是否是评论作者
 * @param {number} commentId - 评论 ID
 * @param {number} userId - 用户 ID
 * @returns {Promise<boolean>} 是否是作者
 */
async function isAuthor(commentId, userId) {
  const comment = await db.queryOne(
    'SELECT user_id FROM comments WHERE comment_id = ?',
    [commentId]
  );
  return comment && comment.user_id === userId;
}

/**
 * 格式化评论
 * @param {Object} comment - 评论对象
 * @returns {Object} 格式化后的评论
 */
function formatComment(comment) {
  return {
    commentId: comment.comment_id,
    postId: comment.post_id,
    content: comment.content,
    author: {
      userId: comment.user_id,
      username: comment.author_name,
      avatar: comment.author_avatar
    },
    parentId: comment.parent_id,
    rootId: comment.root_id,
    likeCount: comment.like_count,
    replyCount: comment.reply_count,
    createdAt: comment.created_at,
    updatedAt: comment.updated_at
  };
}

module.exports = {
  findByPostId,
  getReplies,
  findById,
  create,
  update,
  softDelete,
  incrementLikeCount,
  decrementLikeCount,
  isAuthor
};