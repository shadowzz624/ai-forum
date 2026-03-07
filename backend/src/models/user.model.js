/**
 * 用户模型
 * @module models/user.model
 */

const db = require('./db');

/**
 * 创建用户
 * @param {Object} userData - 用户数据
 * @returns {Promise<Object>} 创建的用户
 */
async function create(userData) {
  const { username, avatar = null, bio = null, style = 'neutral', role = 'agent' } = userData;
  
  const sql = `
    INSERT INTO users (username, avatar, bio, style, role)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  const userId = await db.insert(sql, [username, avatar, bio, style, role]);
  
  return await findById(userId);
}

/**
 * 根据 ID 查找用户
 * @param {number} userId - 用户 ID
 * @returns {Promise<Object|null>} 用户对象
 */
async function findById(userId) {
  const sql = 'SELECT * FROM users WHERE user_id = ? AND status = "active"';
  return await db.queryOne(sql, [userId]);
}

/**
 * 根据用户名查找用户
 * @param {string} username - 用户名
 * @returns {Promise<Object|null>} 用户对象
 */
async function findByUsername(username) {
  const sql = 'SELECT * FROM users WHERE username = ? AND status = "active"';
  return await db.queryOne(sql, [username]);
}

/**
 * 检查用户名是否存在
 * @param {string} username - 用户名
 * @returns {Promise<boolean>} 是否存在
 */
async function existsByUsername(username) {
  const sql = 'SELECT COUNT(*) as count FROM users WHERE username = ?';
  const result = await db.queryOne(sql, [username]);
  return result.count > 0;
}

/**
 * 更新用户信息
 * @param {number} userId - 用户 ID
 * @param {Object} userData - 更新数据
 * @returns {Promise<Object|null>} 更新后的用户
 */
async function update(userId, userData) {
  const fields = [];
  const values = [];
  
  const allowedFields = ['avatar', 'bio', 'style'];
  
  for (const [key, value] of Object.entries(userData)) {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }
  
  if (fields.length === 0) {
    return await findById(userId);
  }
  
  values.push(userId);
  const sql = `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`;
  
  await db.update(sql, values);
  return await findById(userId);
}

/**
 * 获取用户统计信息
 * @param {number} userId - 用户 ID
 * @returns {Promise<Object>} 统计信息
 */
async function getStats(userId) {
  const postCount = await db.queryOne(
    'SELECT COUNT(*) as count FROM posts WHERE user_id = ? AND is_deleted = 0',
    [userId]
  );
  
  const commentCount = await db.queryOne(
    'SELECT COUNT(*) as count FROM comments WHERE user_id = ? AND is_deleted = 0',
    [userId]
  );
  
  const followerCount = await db.queryOne(
    'SELECT COUNT(*) as count FROM follows WHERE followee_id = ?',
    [userId]
  );
  
  const followingCount = await db.queryOne(
    'SELECT COUNT(*) as count FROM follows WHERE follower_id = ?',
    [userId]
  );
  
  return {
    postCount: postCount.count,
    commentCount: commentCount.count,
    followerCount: followerCount.count,
    followingCount: followingCount.count
  };
}

/**
 * 转换为公开格式
 * @param {Object} user - 用户对象
 * @returns {Object} 公开格式的用户
 */
function toPublic(user) {
  if (!user) return null;
  
  return {
    userId: user.user_id,
    username: user.username,
    avatar: user.avatar,
    bio: user.bio,
    style: user.style,
    role: user.role,
    createdAt: user.created_at
  };
}

module.exports = {
  create,
  findById,
  findByUsername,
  existsByUsername,
  update,
  getStats,
  toPublic
};