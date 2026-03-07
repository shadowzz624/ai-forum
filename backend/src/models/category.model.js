/**
 * 板块模型
 * @module models/category.model
 */

const db = require('./db');

/**
 * 获取所有板块
 * @param {Object} options - 查询选项
 * @returns {Promise<Array>} 板块列表
 */
async function findAll(options = {}) {
  const { includeHidden = false } = options;
  
  let sql = `
    SELECT c.*, 
           COALESCE(p.post_count, 0) as post_count
    FROM categories c
    LEFT JOIN (
      SELECT category_id, COUNT(*) as post_count 
      FROM posts 
      WHERE is_deleted = 0 
      GROUP BY category_id
    ) p ON c.category_id = p.category_id
  `;
  
  if (!includeHidden) {
    sql += ' WHERE c.is_visible = 1';
  }
  
  sql += ' ORDER BY c.sort_order ASC, c.category_id ASC';
  
  return await db.query(sql);
}

/**
 * 获取板块列表（分页）
 * @param {Object} options - 分页选项
 * @returns {Promise<Object>} 分页结果
 */
async function findPaginated(options = {}) {
  const { page = 1, pageSize = 20, includeHidden = false } = options;
  const offset = (page - 1) * pageSize;
  
  // 验证并转换参数（防止注入）
  const safePageSize = Math.max(1, Math.min(100, parseInt(pageSize) || 20));
  const safeOffset = Math.max(0, parseInt(offset) || 0);
  
  // 查询总数
  let countSql = 'SELECT COUNT(*) as total FROM categories';
  if (!includeHidden) {
    countSql += ' WHERE is_visible = 1';
  }
  const countResult = await db.queryOne(countSql, []);
  const total = countResult.total;
  
  // 查询数据
  // 注意：mysql2 execute 对复杂SQL的LIMIT/OFFSET参数绑定有兼容性问题
  // 这里使用已验证的整数值直接拼接（安全，因为已经过Math.max/min验证）
  let sql = `
    SELECT c.*, 
           COALESCE(p.post_count, 0) as post_count
    FROM categories c
    LEFT JOIN (
      SELECT category_id, COUNT(*) as post_count 
      FROM posts 
      WHERE is_deleted = 0 
      GROUP BY category_id
    ) p ON c.category_id = p.category_id
  `;
  
  if (!includeHidden) {
    sql += ' WHERE c.is_visible = 1';
  }
  
  sql += ` ORDER BY c.sort_order ASC, c.category_id ASC LIMIT ${safePageSize} OFFSET ${safeOffset}`;
  
  const items = await db.query(sql);
  
  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  };
}

/**
 * 根据 ID 查找板块
 * @param {number} categoryId - 板块 ID
 * @returns {Promise<Object|null>} 板块对象
 */
async function findById(categoryId) {
  const sql = `
    SELECT c.*, 
           COALESCE(p.post_count, 0) as post_count
    FROM categories c
    LEFT JOIN (
      SELECT category_id, COUNT(*) as post_count 
      FROM posts 
      WHERE is_deleted = 0 
      GROUP BY category_id
    ) p ON c.category_id = p.category_id
    WHERE c.category_id = ?
  `;
  
  return await db.queryOne(sql, [categoryId]);
}

/**
 * 根据名称查找板块
 * @param {string} name - 板块名称
 * @returns {Promise<Object|null>} 板块对象
 */
async function findByName(name) {
  const sql = 'SELECT * FROM categories WHERE name = ?';
  return await db.queryOne(sql, [name]);
}

/**
 * 检查板块名称是否存在
 * @param {string} name - 板块名称
 * @param {number} excludeId - 排除的 ID（用于更新时）
 * @returns {Promise<boolean>} 是否存在
 */
async function existsByName(name, excludeId = null) {
  let sql = 'SELECT COUNT(*) as count FROM categories WHERE name = ?';
  const params = [name];
  
  if (excludeId) {
    sql += ' AND category_id != ?';
    params.push(excludeId);
  }
  
  const result = await db.queryOne(sql, params);
  return result.count > 0;
}

/**
 * 创建板块
 * @param {Object} data - 板块数据
 * @returns {Promise<Object>} 创建的板块
 */
async function create(data) {
  const { name, description, icon = null, sortOrder = 0 } = data;
  
  // 如果没有指定 sortOrder，获取最大值 + 1
  let order = sortOrder;
  if (order === 0) {
    const maxOrder = await db.queryOne(
      'SELECT COALESCE(MAX(sort_order), 0) as max_order FROM categories'
    );
    order = maxOrder.max_order + 1;
  }
  
  const sql = `
    INSERT INTO categories (name, description, icon, sort_order)
    VALUES (?, ?, ?, ?)
  `;
  
  const categoryId = await db.insert(sql, [name, description, icon, order]);
  
  return await findById(categoryId);
}

/**
 * 更新板块
 * @param {number} categoryId - 板块 ID
 * @param {Object} data - 更新数据
 * @returns {Promise<Object|null>} 更新后的板块
 */
async function update(categoryId, data) {
  const fields = [];
  const values = [];
  
  const allowedFields = ['name', 'description', 'icon', 'sort_order', 'is_visible'];
  
  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }
  
  if (fields.length === 0) {
    return await findById(categoryId);
  }
  
  values.push(categoryId);
  const sql = `UPDATE categories SET ${fields.join(', ')} WHERE category_id = ?`;
  
  await db.update(sql, values);
  return await findById(categoryId);
}

/**
 * 删除板块
 * @param {number} categoryId - 板块 ID
 * @returns {Promise<boolean>} 是否成功
 */
async function remove(categoryId) {
  const sql = 'DELETE FROM categories WHERE category_id = ?';
  const affected = await db.update(sql, [categoryId]);
  return affected > 0;
}

/**
 * 检查板块是否有帖子
 * @param {number} categoryId - 板块 ID
 * @returns {Promise<boolean>} 是否有帖子
 */
async function hasPosts(categoryId) {
  const sql = 'SELECT COUNT(*) as count FROM posts WHERE category_id = ? AND is_deleted = 0';
  const result = await db.queryOne(sql, [categoryId]);
  return result.count > 0;
}

/**
 * 转换为公开格式
 * @param {Object} category - 板块对象
 * @returns {Object} 公开格式
 */
function toPublic(category) {
  if (!category) return null;
  
  return {
    categoryId: category.category_id,
    name: category.name,
    description: category.description,
    icon: category.icon,
    sortOrder: category.sort_order,
    postCount: category.post_count || 0,
    isVisible: category.is_visible === 1,
    createdAt: category.created_at
  };
}

module.exports = {
  findAll,
  findPaginated,
  findById,
  findByName,
  existsByName,
  create,
  update,
  remove,
  hasPosts,
  toPublic
};