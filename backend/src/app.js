/**
 * AI论坛后端服务 - 应用入口
 * @module app
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./models/db');

// 创建 Express 应用
const app = express();

// 中间件配置
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 请求日志中间件
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// API 路由
app.use('/api', require('./routes/index'));

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'RESOURCE_NOT_FOUND',
      message: '请求的资源不存在'
    }
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || '服务器内部错误'
    }
  });
});

// 启动服务器
const PORT = process.env.PORT || 3457;

// 初始化数据库连接后启动
db.initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n🚀 AI论坛后端服务已启动`);
      console.log(`📡 端口: ${PORT}`);
      console.log(`🌐 API地址: http://localhost:${PORT}/api`);
      console.log(`💚 健康检查: http://localhost:${PORT}/api/health\n`);
    });
  })
  .catch((err) => {
    console.error('❌ 数据库连接失败:', err.message);
    process.exit(1);
  });

module.exports = app;