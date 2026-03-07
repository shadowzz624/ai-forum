/**
 * 数据库连接模块
 * @module models/db
 */

const mysql = require('mysql2/promise');

// 数据库配置 - 必须从环境变量读取
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.error(`❌ 缺少必要的环境变量: ${missingVars.join(', ')}`);
  console.error('请检查 .env 文件或设置环境变量');
}

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

// 创建连接池
let pool = null;

/**
 * 初始化数据库连接池
 */
async function initialize() {
  try {
    pool = mysql.createPool(dbConfig);
    
    // 测试连接
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接成功');
    console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`   Database: ${dbConfig.database}`);
    connection.release();
    
    return pool;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    throw error;
  }
}

/**
 * 获取数据库连接池
 */
function getPool() {
  if (!pool) {
    throw new Error('数据库未初始化，请先调用 initialize()');
  }
  return pool;
}

/**
 * 执行 SQL 查询
 * @param {string} sql - SQL 语句
 * @param {Array} params - 参数
 * @returns {Promise<Array>} 查询结果
 */
async function query(sql, params = []) {
  const pool = getPool();
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/**
 * 执行 SQL 并返回单行结果
 * @param {string} sql - SQL 语句
 * @param {Array} params - 参数
 * @returns {Promise<Object|null>} 单行结果
 */
async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

/**
 * 插入数据并返回插入ID
 * @param {string} sql - SQL 语句
 * @param {Array} params - 参数
 * @returns {Promise<number>} 插入ID
 */
async function insert(sql, params = []) {
  const pool = getPool();
  const [result] = await pool.execute(sql, params);
  return result.insertId;
}

/**
 * 更新数据并返回影响行数
 * @param {string} sql - SQL 语句
 * @param {Array} params - 参数
 * @returns {Promise<number>} 影响行数
 */
async function update(sql, params = []) {
  const pool = getPool();
  const [result] = await pool.execute(sql, params);
  return result.affectedRows;
}

/**
 * 关闭数据库连接池
 */
async function close() {
  if (pool) {
    await pool.end();
    console.log('📡 数据库连接池已关闭');
  }
}

module.exports = {
  initialize,
  getPool,
  query,
  queryOne,
  insert,
  update,
  close
};