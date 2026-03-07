/**
 * API Key 模型
 * @module models/apiKey.model
 */

const db = require('./db');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

/**
 * 对 API Key 进行哈希处理
 * @param {string} apiKey - 原始 API Key
 * @returns {string} 哈希后的 API Key
 */
function hashApiKey(apiKey) {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * 生成新的 API Key
 * @param {number} userId - 用户 ID
 * @param {string} name - Key 名称（可选）
 * @returns {Promise<Object>} 创建的 API Key（包含原始 key，仅此一次）
 */
async function create(userId, name = 'Default') {
  const apiKey = uuidv4();
  const hashedKey = hashApiKey(apiKey);
  
  const sql = `
    INSERT INTO api_keys (user_id, api_key, name)
    VALUES (?, ?, ?)
  `;
  
  await db.insert(sql, [userId, hashedKey, name]);
  
  // 只返回原始 key 一次，之后无法再获取
  return {
    apiKey,
    name,
    userId
  };
}

/**
 * 根据 API Key 查找
 * @param {string} apiKey - API Key（原始值）
 * @returns {Promise<Object|null>} API Key 记录
 */
async function findByKey(apiKey) {
  const hashedKey = hashApiKey(apiKey);
  
  const sql = `
    SELECT ak.*, u.username, u.avatar, u.bio, u.style, u.role, u.status
    FROM api_keys ak
    JOIN users u ON ak.user_id = u.user_id
    WHERE ak.api_key = ? AND ak.is_active = 1
  `;
  
  return await db.queryOne(sql, [hashedKey]);
}

/**
 * 验证 API Key 并返回用户信息
 * @param {string} apiKey - API Key（原始值）
 * @returns {Promise<Object|null>} 用户信息
 */
async function validateAndGetUser(apiKey) {
  const record = await findByKey(apiKey);
  
  if (!record) {
    return null;
  }
  
  // 检查用户状态
  if (record.status !== 'active') {
    return null;
  }
  
  // 检查过期时间
  if (record.expires_at && new Date(record.expires_at) < new Date()) {
    return null;
  }
  
  // 更新最后使用时间
  await updateLastUsed(apiKey);
  
  return {
    userId: record.user_id,
    username: record.username,
    avatar: record.avatar,
    bio: record.bio,
    style: record.style,
    role: record.role
  };
}

/**
 * 更新最后使用时间
 * @param {string} apiKey - API Key（原始值）
 */
async function updateLastUsed(apiKey) {
  const hashedKey = hashApiKey(apiKey);
  const sql = 'UPDATE api_keys SET last_used_at = NOW() WHERE api_key = ?';
  await db.update(sql, [hashedKey]);
}

/**
 * 禁用 API Key
 * @param {string} apiKey - API Key（原始值）
 * @returns {Promise<boolean>} 是否成功
 */
async function deactivate(apiKey) {
  const hashedKey = hashApiKey(apiKey);
  const sql = 'UPDATE api_keys SET is_active = 0 WHERE api_key = ?';
  const affected = await db.update(sql, [hashedKey]);
  return affected > 0;
}

/**
 * 获取用户的所有 API Key
 * @param {number} userId - 用户 ID
 * @returns {Promise<Array>} API Key 列表
 */
async function findByUserId(userId) {
  const sql = `
    SELECT id, api_key, name, created_at, expires_at, last_used_at, is_active
    FROM api_keys
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;
  
  return await db.query(sql, [userId]);
}

/**
 * 删除 API Key
 * @param {number} keyId - Key ID
 * @param {number} userId - 用户 ID（验证所有权）
 * @returns {Promise<boolean>} 是否成功
 */
async function deleteKey(keyId, userId) {
  const sql = 'DELETE FROM api_keys WHERE id = ? AND user_id = ?';
  const affected = await db.update(sql, [keyId, userId]);
  return affected > 0;
}

module.exports = {
  create,
  findByKey,
  validateAndGetUser,
  updateLastUsed,
  deactivate,
  findByUserId,
  deleteKey
};