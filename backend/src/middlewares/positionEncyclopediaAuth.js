const { PermissionValidator } = require('../config/permissions')
const nedbService = require('../services/nedbService')
const logger = require('../utils/logger')

/**
 * 岗位大全权限验证中间件
 * 支持基于业务线的数据访问控制
 */

// 基础权限检查
const checkPositionEncyclopediaPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          code: 401,
          message: '用户未认证',
          data: null
        })
      }

      // 获取用户权限
      const userPermissions = PermissionValidator.getUserPermissions(req.user)
      
      if (!PermissionValidator.isValidPermissionArray(userPermissions)) {
        return res.status(403).json({
          code: 403,
          message: '用户权限信息不完整',
          data: {
            reason: 'INVALID_PERMISSIONS',
            message: '用户权限数据格式错误或缺失'
          }
        })
      }

      // 检查是否有岗位大全相关权限
      const hasPermission = PermissionValidator.hasPermission(userPermissions, [
        requiredPermission,
        'position_encyclopedia:*',
        '*'
      ])

      if (!hasPermission) {
        logger.warn(`岗位大全权限被拒绝 - 用户: ${req.user.id}, 所需权限: ${requiredPermission}`)
        return res.status(403).json({
          code: 403,
          message: `无权限执行${requiredPermission}操作`,
          data: {
            required: requiredPermission,
            resource: 'position_encyclopedia'
          }
        })
      }

      next()
    } catch (error) {
      logger.error('岗位大全权限检查失败:', error)
      res.status(500).json({
        code: 500,
        message: '权限验证失败',
        data: null
      })
    }
  }
}

// 业务线数据访问控制
const businessLineDataAccess = (operation) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          code: 401,
          message: '用户未认证',
          data: null
        })
      }

      // 获取用户权限
      const userPermissions = PermissionValidator.getUserPermissions(req.user)
      
      // 超级管理员、系统管理员、HR管理员拥有所有数据访问权限
      if (PermissionValidator.hasPermission(userPermissions, ['*', 'position_encyclopedia:*'])) {
        return next()
      }

      // 业务线负责人只能操作本业务线的数据
      if (PermissionValidator.hasPermission(userPermissions, ['position_encyclopedia:update_requirements'])) {
        const { businessLineId, positionId } = req.body
        
        if (businessLineId) {
          // 检查用户是否有权限操作该业务线的数据
          const hasBusinessLineAccess = await checkBusinessLineAccess(req.user, businessLineId)
          if (!hasBusinessLineAccess) {
            return res.status(403).json({
              code: 403,
              message: '无权限操作该业务线的岗位数据',
              data: {
                reason: 'BUSINESS_LINE_ACCESS_DENIED',
                businessLineId
              }
            })
          }
        } else if (positionId) {
          // 通过岗位ID检查业务线权限
          const position = await nedbService.findOne('positions', { _id: positionId })
          if (position && position.businessLineId) {
            const hasBusinessLineAccess = await checkBusinessLineAccess(req.user, position.businessLineId)
            if (!hasBusinessLineAccess) {
              return res.status(403).json({
                code: 403,
                message: '无权限操作该岗位数据',
                data: {
                  reason: 'POSITION_ACCESS_DENIED',
                  positionId
                }
              })
            }
          }
        }
      }

      next()
    } catch (error) {
      logger.error('业务线数据访问控制失败:', error)
      res.status(500).json({
        code: 500,
        message: '数据访问控制失败',
        data: null
      })
    }
  }
}

// 检查用户是否有业务线访问权限
const checkBusinessLineAccess = async (user, businessLineId) => {
  try {
    // 如果用户是业务线负责人，检查是否匹配
    if (user.businessLineId && user.businessLineId === businessLineId) {
      return true
    }

    // 检查用户角色是否为业务线负责人
    const userRole = user.Role?.name
    if (userRole === 'BUSINESS_LINE_MANAGER') {
      // 业务线负责人只能访问本业务线数据
      return user.businessLineId === businessLineId
    }

    // 其他角色根据权限配置判断
    return false
  } catch (error) {
    logger.error('检查业务线访问权限失败:', error)
    return false
  }
}

// 岗位大全查看权限
const canViewPositionEncyclopedia = checkPositionEncyclopediaPermission('position_encyclopedia:view')

// 岗位大全管理权限
const canManagePositionEncyclopedia = checkPositionEncyclopediaPermission('position_encyclopedia:manage')

// 更新岗位要求权限
const canUpdateRequirements = checkPositionEncyclopediaPermission('position_encyclopedia:update_requirements')

// 更新职业路径权限
const canUpdateCareerPath = checkPositionEncyclopediaPermission('position_encyclopedia:update_career_path')

// 更新技能权限
const canUpdateSkills = checkPositionEncyclopediaPermission('position_encyclopedia:update_skills')

// 批量更新权限
const canBulkUpdate = checkPositionEncyclopediaPermission('position_encyclopedia:bulk_update')

// 导出权限
const canExport = checkPositionEncyclopediaPermission('position_encyclopedia:export')

module.exports = {
  canViewPositionEncyclopedia,
  canManagePositionEncyclopedia,
  canUpdateRequirements,
  canUpdateCareerPath,
  canUpdateSkills,
  canBulkUpdate,
  canExport,
  businessLineDataAccess,
  checkBusinessLineAccess
}
