/**
 * 板块控制器
 * @module controllers/category.controller
 */

const categoryModel = require('../models/category.model');
const validators = require('../utils/validators');

/**
 * 获取板块列表
 * GET /api/categories
 */
async function getCategories(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize) || 20, 100);
    
    const result = await categoryModel.findPaginated({ page, pageSize });
    
    const categories = result.items.map(categoryModel.toPublic);
    
    res.json({
      success: true,
      data: {
        items: categories,
        pagination: result.pagination
      },
      message: '操作成功'
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '获取板块列表时发生错误'
      }
    });
  }
}

/**
 * 获取板块详情
 * GET /api/categories/:id
 */
async function getCategoryById(req, res) {
  try {
    const categoryId = parseInt(req.params.id);
    
    if (!categoryId || categoryId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: '无效的板块 ID'
        }
      });
    }
    
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
    
    res.json({
      success: true,
      data: categoryModel.toPublic(category),
      message: '操作成功'
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '获取板块详情时发生错误'
      }
    });
  }
}

/**
 * 创建板块
 * POST /api/categories
 * 需要管理员权限
 */
async function createCategory(req, res) {
  try {
    const { name, description, icon, sortOrder } = req.body;
    
    // 验证输入
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '板块名称不能为空'
        }
      });
    }
    
    if (name.length > 50) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '板块名称不能超过 50 个字符'
        }
      });
    }
    
    // 检查名称是否已存在
    const exists = await categoryModel.existsByName(name.trim());
    if (exists) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_NAME',
          message: '板块名称已存在'
        }
      });
    }
    
    // 创建板块
    const category = await categoryModel.create({
      name: name.trim(),
      description: description?.trim() || null,
      icon: icon?.trim() || null,
      sortOrder: sortOrder || 0
    });
    
    res.status(201).json({
      success: true,
      data: categoryModel.toPublic(category),
      message: '板块创建成功'
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '创建板块时发生错误'
      }
    });
  }
}

/**
 * 更新板块
 * PUT /api/categories/:id
 * 需要管理员权限
 */
async function updateCategory(req, res) {
  try {
    const categoryId = parseInt(req.params.id);
    
    if (!categoryId || categoryId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: '无效的板块 ID'
        }
      });
    }
    
    // 检查板块是否存在
    const existing = await categoryModel.findById(categoryId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: '板块不存在'
        }
      });
    }
    
    const { name, description, icon, sortOrder, isVisible } = req.body;
    
    // 如果更新名称，检查是否重复
    if (name && name.trim() !== existing.name) {
      if (name.length > 50) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '板块名称不能超过 50 个字符'
          }
        });
      }
      
      const exists = await categoryModel.existsByName(name.trim(), categoryId);
      if (exists) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_NAME',
            message: '板块名称已存在'
          }
        });
      }
    }
    
    // 更新板块
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (icon !== undefined) updateData.icon = icon?.trim() || null;
    if (sortOrder !== undefined) updateData.sort_order = sortOrder;
    if (isVisible !== undefined) updateData.is_visible = isVisible ? 1 : 0;
    
    const category = await categoryModel.update(categoryId, updateData);
    
    res.json({
      success: true,
      data: categoryModel.toPublic(category),
      message: '板块更新成功'
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '更新板块时发生错误'
      }
    });
  }
}

/**
 * 删除板块
 * DELETE /api/categories/:id
 * 需要管理员权限
 */
async function deleteCategory(req, res) {
  try {
    const categoryId = parseInt(req.params.id);
    
    if (!categoryId || categoryId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: '无效的板块 ID'
        }
      });
    }
    
    // 检查板块是否存在
    const existing = await categoryModel.findById(categoryId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: '板块不存在'
        }
      });
    }
    
    // 检查板块是否有帖子
    const hasPosts = await categoryModel.hasPosts(categoryId);
    if (hasPosts) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CATEGORY_HAS_POSTS',
          message: '板块下存在帖子，无法删除'
        }
      });
    }
    
    // 删除板块
    await categoryModel.remove(categoryId);
    
    res.json({
      success: true,
      message: '板块删除成功'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '删除板块时发生错误'
      }
    });
  }
}

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};