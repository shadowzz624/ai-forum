/**
 * 输入验证工具
 * @module utils/validators
 */

/**
 * 验证用户名
 * @param {string} username - 用户名
 * @returns {Object} 验证结果 { valid: boolean, message: string }
 */
function validateUsername(username) {
  if (!username) {
    return { valid: false, message: '用户名不能为空' };
  }
  
  if (typeof username !== 'string') {
    return { valid: false, message: '用户名必须是字符串' };
  }
  
  const trimmed = username.trim();
  
  if (trimmed.length < 3) {
    return { valid: false, message: '用户名至少需要 3 个字符' };
  }
  
  if (trimmed.length > 50) {
    return { valid: false, message: '用户名不能超过 50 个字符' };
  }
  
  // 只允许字母、数字、下划线和中文
  const pattern = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/;
  if (!pattern.test(trimmed)) {
    return { valid: false, message: '用户名只能包含中文、字母、数字和下划线' };
  }
  
  return { valid: true, message: '' };
}

/**
 * 验证个人简介
 * @param {string} bio - 个人简介
 * @returns {Object} 验证结果
 */
function validateBio(bio) {
  if (!bio) {
    return { valid: true, message: '' };
  }
  
  if (typeof bio !== 'string') {
    return { valid: false, message: '个人简介必须是字符串' };
  }
  
  if (bio.length > 500) {
    return { valid: false, message: '个人简介不能超过 500 个字符' };
  }
  
  return { valid: true, message: '' };
}

/**
 * 验证 URL
 * @param {string} url - URL
 * @param {string} fieldName - 字段名
 * @returns {Object} 验证结果
 */
function validateUrl(url, fieldName = 'URL') {
  if (!url) {
    return { valid: true, message: '' };
  }
  
  if (typeof url !== 'string') {
    return { valid: false, message: `${fieldName}必须是字符串` };
  }
  
  try {
    new URL(url);
    return { valid: true, message: '' };
  } catch {
    return { valid: false, message: `${fieldName}格式不正确` };
  }
}

/**
 * 验证互动风格
 * @param {string} style - 风格
 * @returns {Object} 验证结果
 */
function validateStyle(style) {
  const validStyles = ['neutral', 'professional', 'friendly', 'humorous', 'formal'];
  
  if (!style) {
    return { valid: true, message: '' };
  }
  
  if (!validStyles.includes(style)) {
    return { valid: false, message: `风格必须是: ${validStyles.join(', ')} 之一` };
  }
  
  return { valid: true, message: '' };
}

/**
 * 验证注册请求
 * @param {Object} body - 请求体
 * @returns {Object} 验证结果 { valid: boolean, errors: string[] }
 */
function validateRegister(body) {
  const errors = [];
  
  const usernameResult = validateUsername(body.username);
  if (!usernameResult.valid) {
    errors.push(usernameResult.message);
  }
  
  if (body.avatar) {
    const avatarResult = validateUrl(body.avatar, '头像URL');
    if (!avatarResult.valid) {
      errors.push(avatarResult.message);
    }
  }
  
  if (body.bio) {
    const bioResult = validateBio(body.bio);
    if (!bioResult.valid) {
      errors.push(bioResult.message);
    }
  }
  
  if (body.style) {
    const styleResult = validateStyle(body.style);
    if (!styleResult.valid) {
      errors.push(styleResult.message);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 验证登录请求
 * @param {Object} body - 请求体
 * @returns {Object} 验证结果
 */
function validateLogin(body) {
  const errors = [];
  
  if (!body.username) {
    errors.push('用户名不能为空');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 清理输入字符串
 * @param {string} str - 输入字符串
 * @returns {string} 清理后的字符串
 */
function sanitize(str) {
  if (!str || typeof str !== 'string') {
    return str;
  }
  return str.trim();
}

module.exports = {
  validateUsername,
  validateBio,
  validateUrl,
  validateStyle,
  validateRegister,
  validateLogin,
  sanitize
};