/**
 * 帖子模型
 * @module models/post.model
 */

const db = require('./db');

/**
 * 获取帖子列表（分页、筛选、排序）
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 分页结果
 */
async function findPaginated(options = {}) {
  const {
    page = 1,
    pageSize = 20,
    categoryId = null,
    authorId = null,
    sortBy = 'latest',
    includeDeleted = false
  } = options;
  
  const offset = (page - 1) * pageSize;
  const conditions = [];
  const params = [];
  
  if (!includeDeleted) {
    conditions.push('p.is_deleted = 0');
  }
  
  if (categoryId) {
    conditions.push('p.category_id = ?');
    params.push(categoryId);
  }
  
  if (authorId) {
    conditions.push('p.user_id = ?');
    params.push(authorId);
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  // 验证并转换参数（防止注入）
  const safePageSize = Math.max(1, Math.min(100, parseInt(pageSize) || 20));
  const safeOffset = Math.max(0, parseInt(offset) || 0);
  
  // 排序逻辑
  let orderBy = 'p.created_at DESC';
  if (sortBy === 'hot') {
    orderBy = '(p.like_count + p.comment_count * 2) DESC, p.created_at DESC';
  } else if (sortBy === 'views') {
    orderBy = 'p.view_count DESC, p.created_at DESC';
  }
  
  // 查询总数
  const countSql = `SELECT COUNT(*) as total FROM posts p ${whereClause}`;
  const countResult = await db.queryOne(countSql, params);
  const total = countResult.total;
  
  // 查询数据
  // 注意：mysql2 execute 对复杂SQL的LIMIT/OFFSET参数绑定有兼容性问题
  // 这里使用已验证的整数值直接拼接（安全，因为已经过Math.max/min验证）
  const sql = `
    SELECT 
      p.*,
      u.username as author_name,
      u.avatar as author_avatar,
      c.name as category_name,
      GROUP_CONCAT(t.name) as tags
    FROM posts p
    LEFT JOIN users u ON p.user_id = u.user_id
    LEFT JOIN categories c ON p.category_id = c.category_id
    LEFT JOIN post_tags pt ON p.post_id = pt.post_id
    LEFT JOIN tags t ON pt.tag_id = t.tag_id
    ${whereClause}
    GROUP BY p.post_id
    ORDER BY p.is_sticky DESC, ${orderBy}
    LIMIT ${safePageSize} OFFSET ${safeOffset}
  `;
  
  const items = await db.query(sql, params);
  
  return {
    items: items.map(formatPost),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  };
}

/**
 * 根据 ID 查找帖子
 * @param {number} postId - 帖子 ID
 * @returns {Promise<Object|null>} 帖子对象
 */
async function findById(postId) {
  const sql = `
    SELECT 
      p.*,
      u.username as author_name,
      u.avatar as author_avatar,
      u.bio as author_bio,
      u.style as author_style,
      u.role as author_role,
      c.name as category_name,
      GROUP_CONCAT(t.name) as tags
    FROM posts p
    LEFT JOIN users u ON p.user_id = u.user_id
    LEFT JOIN categories c ON p.category_id = c.category_id
    LEFT JOIN post_tags pt ON p.post_id = pt.post_id
    LEFT JOIN tags t ON pt.tag_id = t.tag_id
    WHERE p.post_id = ?
    GROUP BY p.post_id
  `;
  
  const post = await db.queryOne(sql, [postId]);
  return post ? formatPostDetail(post) : null;
}

/**
 * 创建帖子
 * @param {Object} data - 帖子数据
 * @returns {Promise<Object>} 创建的帖子
 */
async function create(data) {
  const { userId, categoryId, title, content, tags = [] } = data;
  
  // 插入帖子
  const postSql = `
    INSERT INTO posts (user_id, category_id, title, content)
    VALUES (?, ?, ?, ?)
  `;
  
  const postId = await db.insert(postSql, [userId, categoryId, title, content]);
  
  // 处理标签
  if (tags.length > 0) {
    await addTags(postId, tags);
  }
  
  // 更新板块帖子数
  await db.update(
    'UPDATE categories SET post_count = post_count + 1 WHERE category_id = ?',
    [categoryId]
  );
  
  return await findById(postId);
}

/**
 * 更新帖子
 * @param {number} postId - 帖子 ID
 * @param {Object} data - 更新数据
 * @returns {Promise<Object|null>} 更新后的帖子
 */
async function update(postId, data) {
  const { title, content, tags } = data;
  
  const updates = [];
  const params = [];
  
  if (title !== undefined) {
    updates.push('title = ?');
    params.push(title);
  }
  
  if (content !== undefined) {
    updates.push('content = ?');
    params.push(content);
  }
  
  if (updates.length > 0) {
    params.push(postId);
    const sql = `UPDATE posts SET ${updates.join(', ')} WHERE post_id = ?`;
    await db.update(sql, params);
  }
  
  // 更新标签
  if (tags !== undefined) {
    // 删除旧标签
    await db.update('DELETE FROM post_tags WHERE post_id = ?', [postId]);
    // 添加新标签
    if (tags.length > 0) {
      await addTags(postId, tags);
    }
  }
  
  return await findById(postId);
}

/**
 * 软删除帖子
 * @param {number} postId - 帖子 ID
 * @returns {Promise<boolean>} 是否成功
 */
async function softDelete(postId) {
  const sql = 'UPDATE posts SET is_deleted = 1 WHERE post_id = ?';
  const affected = await db.update(sql, [postId]);
  
  if (affected > 0) {
    // 更新板块帖子数
    const post = await db.queryOne('SELECT category_id FROM posts WHERE post_id = ?', [postId]);
    if (post) {
      await db.update(
        'UPDATE categories SET post_count = GREATEST(0, post_count - 1) WHERE category_id = ?',
        [post.category_id]
      );
    }
  }
  
  return affected > 0;
}

/**
 * 增加浏览次数
 * @param {number} postId - 帖子 ID
 */
async function incrementViewCount(postId) {
  await db.update(
    'UPDATE posts SET view_count = view_count + 1 WHERE post_id = ?',
    [postId]
  );
}

/**
 * 增加评论数
 * @param {number} postId - 帖子 ID
 */
async function incrementCommentCount(postId) {
  await db.update(
    'UPDATE posts SET comment_count = comment_count + 1 WHERE post_id = ?',
    [postId]
  );
}

/**
 * 减少评论数
 * @param {number} postId - 帖子 ID
 */
async function decrementCommentCount(postId) {
  await db.update(
    'UPDATE posts SET comment_count = GREATEST(0, comment_count - 1) WHERE post_id = ?',
    [postId]
  );
}

/**
 * 增加点赞数
 * @param {number} postId - 帖子 ID
 */
async function incrementLikeCount(postId) {
  await db.update(
    'UPDATE posts SET like_count = like_count + 1 WHERE post_id = ?',
    [postId]
  );
}

/**
 * 减少点赞数
 * @param {number} postId - 帖子 ID
 */
async function decrementLikeCount(postId) {
  await db.update(
    'UPDATE posts SET like_count = GREATEST(0, like_count - 1) WHERE post_id = ?',
    [postId]
  );
}

/**
 * 检查用户是否是帖子作者
 * @param {number} postId - 帖子 ID
 * @param {number} userId - 用户 ID
 * @returns {Promise<boolean>} 是否是作者
 */
async function isAuthor(postId, userId) {
  const post = await db.queryOne(
    'SELECT user_id FROM posts WHERE post_id = ?',
    [postId]
  );
  return post && post.user_id === userId;
}

/**
 * 添加标签
 * @param {number} postId - 帖子 ID
 * @param {Array<string>} tags - 标签数组
 */
async function addTags(postId, tags) {
  for (const tagName of tags) {
    // 查找或创建标签
    let tag = await db.queryOne('SELECT tag_id FROM tags WHERE name = ?', [tagName]);
    
    if (!tag) {
      const tagId = await db.insert('INSERT INTO tags (name) VALUES (?)', [tagName]);
      tag = { tag_id: tagId };
    }
    
    // 关联帖子
    await db.insert(
      'INSERT IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)',
      [postId, tag.tag_id]
    );
    
    // 更新标签使用次数
    await db.update(
      'UPDATE tags SET post_count = post_count + 1 WHERE tag_id = ?',
      [tag.tag_id]
    );
  }
}

/**
 * 格式化帖子（列表格式）
 * @param {Object} post - 帖子对象
 * @returns {Object} 格式化后的帖子
 */
function formatPost(post) {
  return {
    postId: post.post_id,
    title: post.title,
    excerpt: post.content ? post.content.substring(0, 200) + (post.content.length > 200 ? '...' : '') : '',
    author: {
      userId: post.user_id,
      username: post.author_name,
      avatar: post.author_avatar
    },
    categoryId: post.category_id,
    categoryName: post.category_name,
    tags: post.tags ? post.tags.split(',') : [],
    viewCount: post.view_count,
    commentCount: post.comment_count,
    likeCount: post.like_count,
    isSticky: post.is_sticky === 1,
    isEssence: post.is_essence === 1,
    createdAt: post.created_at,
    updatedAt: post.updated_at
  };
}

/**
 * 格式化帖子（详情格式）
 * @param {Object} post - 帖子对象
 * @returns {Object} 格式化后的帖子
 */
function formatPostDetail(post) {
  return {
    postId: post.post_id,
    title: post.title,
    content: post.content,
    author: {
      userId: post.user_id,
      username: post.author_name,
      avatar: post.author_avatar,
      bio: post.author_bio,
      style: post.author_style,
      role: post.author_role
    },
    categoryId: post.category_id,
    categoryName: post.category_name,
    tags: post.tags ? post.tags.split(',') : [],
    viewCount: post.view_count,
    commentCount: post.comment_count,
    likeCount: post.like_count,
    isSticky: post.is_sticky === 1,
    isEssence: post.is_essence === 1,
    createdAt: post.created_at,
    updatedAt: post.updated_at
  };
}

module.exports = {
  findPaginated,
  findById,
  create,
  update,
  softDelete,
  incrementViewCount,
  incrementCommentCount,
  decrementCommentCount,
  incrementLikeCount,
  decrementLikeCount,
  isAuthor
};