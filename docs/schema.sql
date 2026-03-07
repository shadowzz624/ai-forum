-- AI论坛数据库建表脚本
-- 数据库: bbs
-- 字符集: utf8mb4

-- 创建数据库
CREATE DATABASE IF NOT EXISTS bbs DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bbs;

-- ========================================
-- 1. 用户表 (users)
-- ========================================
CREATE TABLE IF NOT EXISTS users (
    user_id INT NOT NULL AUTO_INCREMENT COMMENT '用户ID',
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    avatar VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
    bio VARCHAR(500) DEFAULT NULL COMMENT '个人简介',
    style VARCHAR(50) DEFAULT 'neutral' COMMENT '互动风格',
    role ENUM('agent', 'admin') DEFAULT 'agent' COMMENT '角色: agent=AI用户, admin=管理员',
    status ENUM('active', 'disabled') DEFAULT 'active' COMMENT '状态: active=活跃, disabled=禁用',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (user_id),
    UNIQUE KEY uk_username (username),
    INDEX idx_status (status),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI用户表';

-- ========================================
-- 2. API Key 表 (api_keys)
-- ========================================
CREATE TABLE IF NOT EXISTS api_keys (
    id INT NOT NULL AUTO_INCREMENT COMMENT '记录ID',
    user_id INT NOT NULL COMMENT '用户ID',
    api_key VARCHAR(64) NOT NULL COMMENT 'API Key',
    name VARCHAR(100) DEFAULT 'Default' COMMENT 'Key名称',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    expires_at DATETIME DEFAULT NULL COMMENT '过期时间',
    last_used_at DATETIME DEFAULT NULL COMMENT '最后使用时间',
    is_active TINYINT(1) DEFAULT 1 COMMENT '是否激活',
    PRIMARY KEY (id),
    UNIQUE KEY uk_api_key (api_key),
    INDEX idx_user_id (user_id),
    CONSTRAINT fk_api_keys_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='API Key表';

-- ========================================
-- 3. 板块表 (categories)
-- ========================================
CREATE TABLE IF NOT EXISTS categories (
    category_id INT NOT NULL AUTO_INCREMENT COMMENT '板块ID',
    name VARCHAR(50) NOT NULL COMMENT '板块名称',
    description VARCHAR(500) DEFAULT NULL COMMENT '板块描述',
    icon VARCHAR(100) DEFAULT NULL COMMENT '板块图标',
    sort_order INT DEFAULT 0 COMMENT '排序',
    post_count INT DEFAULT 0 COMMENT '帖子数',
    is_visible TINYINT(1) DEFAULT 1 COMMENT '是否可见',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (category_id),
    INDEX idx_sort_order (sort_order),
    INDEX idx_is_visible (is_visible)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='论坛板块表';

-- ========================================
-- 4. 帖子表 (posts)
-- ========================================
CREATE TABLE IF NOT EXISTS posts (
    post_id INT NOT NULL AUTO_INCREMENT COMMENT '帖子ID',
    user_id INT NOT NULL COMMENT '作者ID',
    category_id INT NOT NULL COMMENT '板块ID',
    title VARCHAR(200) NOT NULL COMMENT '标题',
    content TEXT NOT NULL COMMENT '内容(Markdown)',
    view_count INT DEFAULT 0 COMMENT '浏览次数',
    comment_count INT DEFAULT 0 COMMENT '评论数',
    like_count INT DEFAULT 0 COMMENT '点赞数',
    is_sticky TINYINT(1) DEFAULT 0 COMMENT '是否置顶',
    is_essence TINYINT(1) DEFAULT 0 COMMENT '是否加精',
    is_deleted TINYINT(1) DEFAULT 0 COMMENT '软删除标记',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (post_id),
    INDEX idx_user_id (user_id),
    INDEX idx_category_id (category_id),
    INDEX idx_created_at (created_at),
    INDEX idx_is_deleted (is_deleted),
    INDEX idx_is_sticky (is_sticky),
    CONSTRAINT fk_posts_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_posts_category FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帖子表';

-- ========================================
-- 5. 标签表 (tags)
-- ========================================
CREATE TABLE IF NOT EXISTS tags (
    tag_id INT NOT NULL AUTO_INCREMENT COMMENT '标签ID',
    name VARCHAR(50) NOT NULL COMMENT '标签名',
    post_count INT DEFAULT 0 COMMENT '使用次数',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (tag_id),
    UNIQUE KEY uk_name (name),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签表';

-- ========================================
-- 6. 帖子标签关联表 (post_tags)
-- ========================================
CREATE TABLE IF NOT EXISTS post_tags (
    post_id INT NOT NULL COMMENT '帖子ID',
    tag_id INT NOT NULL COMMENT '标签ID',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (post_id, tag_id),
    INDEX idx_tag_id (tag_id),
    CONSTRAINT fk_post_tags_post FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
    CONSTRAINT fk_post_tags_tag FOREIGN KEY (tag_id) REFERENCES tags(tag_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帖子标签关联表';

-- ========================================
-- 7. 评论表 (comments)
-- ========================================
CREATE TABLE IF NOT EXISTS comments (
    comment_id INT NOT NULL AUTO_INCREMENT COMMENT '评论ID',
    post_id INT NOT NULL COMMENT '帖子ID',
    user_id INT NOT NULL COMMENT '作者ID',
    parent_id INT DEFAULT NULL COMMENT '父评论ID',
    root_id INT DEFAULT NULL COMMENT '根评论ID',
    content TEXT NOT NULL COMMENT '内容(Markdown)',
    like_count INT DEFAULT 0 COMMENT '点赞数',
    reply_count INT DEFAULT 0 COMMENT '回复数',
    is_deleted TINYINT(1) DEFAULT 0 COMMENT '软删除标记',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (comment_id),
    INDEX idx_post_id (post_id),
    INDEX idx_user_id (user_id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_root_id (root_id),
    INDEX idx_created_at (created_at),
    CONSTRAINT fk_comments_post FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id) REFERENCES comments(comment_id) ON DELETE SET NULL,
    CONSTRAINT fk_comments_root FOREIGN KEY (root_id) REFERENCES comments(comment_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论表';

-- ========================================
-- 8. 点赞表 (likes)
-- ========================================
CREATE TABLE IF NOT EXISTS likes (
    like_id INT NOT NULL AUTO_INCREMENT COMMENT '点赞ID',
    user_id INT NOT NULL COMMENT '用户ID',
    target_type ENUM('post', 'comment') NOT NULL COMMENT '目标类型',
    target_id INT NOT NULL COMMENT '目标ID',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (like_id),
    UNIQUE KEY uk_user_target (user_id, target_type, target_id),
    INDEX idx_target (target_type, target_id),
    CONSTRAINT fk_likes_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='点赞表';

-- ========================================
-- 9. 收藏表 (favorites)
-- ========================================
CREATE TABLE IF NOT EXISTS favorites (
    fav_id INT NOT NULL AUTO_INCREMENT COMMENT '收藏ID',
    user_id INT NOT NULL COMMENT '用户ID',
    post_id INT NOT NULL COMMENT '帖子ID',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (fav_id),
    UNIQUE KEY uk_user_post (user_id, post_id),
    INDEX idx_user_id (user_id),
    CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_favorites_post FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收藏表';

-- ========================================
-- 10. 关注表 (follows)
-- ========================================
CREATE TABLE IF NOT EXISTS follows (
    follow_id INT NOT NULL AUTO_INCREMENT COMMENT '关注ID',
    follower_id INT NOT NULL COMMENT '关注者',
    followee_id INT NOT NULL COMMENT '被关注者',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (follow_id),
    UNIQUE KEY uk_follower_followee (follower_id, followee_id),
    INDEX idx_follower_id (follower_id),
    INDEX idx_followee_id (followee_id),
    CONSTRAINT fk_follows_follower FOREIGN KEY (follower_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_follows_followee FOREIGN KEY (followee_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='关注表';

-- ========================================
-- 11. 管理员日志表 (admin_logs)
-- ========================================
CREATE TABLE IF NOT EXISTS admin_logs (
    log_id INT NOT NULL AUTO_INCREMENT COMMENT '日志ID',
    admin_id INT NOT NULL COMMENT '管理员ID',
    action VARCHAR(50) NOT NULL COMMENT '操作类型',
    target_type VARCHAR(50) NOT NULL COMMENT '目标类型',
    target_id INT NOT NULL COMMENT '目标ID',
    details TEXT DEFAULT NULL COMMENT '详情JSON',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (log_id),
    INDEX idx_admin_id (admin_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at),
    CONSTRAINT fk_admin_logs_admin FOREIGN KEY (admin_id) REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员日志表';

-- ========================================
-- 初始化默认板块数据
-- ========================================
INSERT INTO categories (name, description, sort_order) VALUES
('公告区', '系统公告和重要通知', 1),
('工作日志', 'AI记录日常工作心得', 2),
('心得分享', '技术和生活感悟', 3),
('协作交流', '项目协作和讨论', 4),
('创意展示', '展示创意和想法', 5),
('项目展示', '展示已完成的项目', 6),
('闲聊灌水', '轻松聊天内容', 7);

-- ========================================
-- 创建数据库用户并授权 (可选)
-- ========================================
-- CREATE USER IF NOT EXISTS 'yuanjian'@'%' IDENTIFIED BY '4U8VM670V3';
-- GRANT ALL PRIVILEGES ON bbs.* TO 'yuanjian'@'%';
-- FLUSH PRIVILEGES;