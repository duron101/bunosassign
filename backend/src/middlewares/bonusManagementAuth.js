/**
 * 奖金管理权限中间件
 * 提供奖金管理相关的权限验证
 */

const { PermissionValidator } = require('../config/permissions')
const auditService = require('../services/auditService')
const logger = require('../utils/logger')

/**
 * 检查奖金查看权限
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
const checkBonusViewPermission = async (req, res, next) => {
  try {
    const user = req.user
    const { projectId, departmentId, employeeId } = req.query

    // 检查基础权限
    if (!PermissionValidator.canAccessResource(user, 'bonus', 'view')) {
      return res.status(403).json({
        code: 403,
        message: '您没有权限查看奖金信息',
        data: null
      })
    }

    // 记录权限检查审计日志
    await auditService.logPermissionAction(
      user,
      'bonus:view',
      'bonus',
      null,
      { 
        action: 'view_bonus',
        projectId,
        departmentId,
        employeeId
      },
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestId: req.id
      }
    )

    next()
  } catch (error) {
    logger.error('Check bonus view permission error:', error)
    res.status(500).json({
      code: 500,
      message: '权限检查失败',
      data: null
    })
  }
}

/**
 * 检查奖金计算权限
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
const checkBonusCalculatePermission = async (req, res, next) => {
  try {
    const user = req.user
    const { projectId, departmentId } = req.body

    // 检查基础权限
    if (!PermissionValidator.canAccessResource(user, 'bonus', 'calculate')) {
      return res.status(403).json({
        code: 403,
        message: '您没有权限计算奖金',
        data: null
      })
    }

    // 如果有项目ID，检查项目级权限
    if (projectId) {
      const project = await global.nedbService.getProjectById(projectId)
      if (project && !PermissionValidator.checkProjectPermission(user, 'manage', project)) {
        return res.status(403).json({
          code: 403,
          message: '您没有权限计算此项目的奖金',
          data: null
        })
      }
    }

    // 如果有部门ID，检查部门级权限
    if (departmentId) {
      const department = await global.nedbService.getDepartmentById(departmentId)
      if (department && !PermissionValidator.checkDepartmentPermission(user, 'view', department)) {
        return res.status(403).json({
          code: 403,
          message: '您没有权限计算此部门的奖金',
          data: null
        })
      }
    }

    // 记录权限检查审计日志
    await auditService.logPermissionAction(
      user,
      'bonus:calculate',
      'bonus',
      null,
      { 
        action: 'calculate_bonus',
        projectId,
        departmentId
      },
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestId: req.id
      }
    )

    next()
  } catch (error) {
    logger.error('Check bonus calculate permission error:', error)
    res.status(500).json({
      code: 500,
      message: '权限检查失败',
      data: null
    })
  }
}

/**
 * 检查奖金审批权限
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
const checkBonusApprovePermission = async (req, res, next) => {
  try {
    const user = req.user
    const { allocationId, amount } = req.body

    // 检查基础权限
    if (!PermissionValidator.canAccessResource(user, 'bonus', 'approve')) {
      return res.status(403).json({
        code: 403,
        message: '您没有权限审批奖金',
        data: null
      })
    }

    // 检查金额阈值权限
    if (amount && amount > 100000) {
      // 10万以上需要高级审批权限
      if (!PermissionValidator.canAccessResource(user, 'finance', 'approve')) {
        return res.status(403).json({
          code: 403,
          message: '大额奖金审批需要财务审批权限',
          data: null
        })
      }
    }

    // 记录权限检查审计日志
    await auditService.logPermissionAction(
      user,
      'bonus:approve',
      'bonus',
      allocationId,
      { 
        action: 'approve_bonus',
        amount,
        allocationId
      },
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestId: req.id
      }
    )

    next()
  } catch (error) {
    logger.error('Check bonus approve permission error:', error)
    res.status(500).json({
      code: 500,
      message: '权限检查失败',
      data: null
    })
  }
}

/**
 * 检查奖金分配权限
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
const checkBonusDistributePermission = async (req, res, next) => {
  try {
    const user = req.user
    const { projectId, departmentId } = req.body

    // 检查基础权限
    if (!PermissionValidator.canAccessResource(user, 'bonus', 'distribute')) {
      return res.status(403).json({
        code: 403,
        message: '您没有权限分配奖金',
        data: null
      })
    }

    // 如果有项目ID，检查项目级权限
    if (projectId) {
      const project = await global.nedbService.getProjectById(projectId)
      if (project && !PermissionValidator.checkProjectPermission(user, 'manage', project)) {
        return res.status(403).json({
          code: 403,
          message: '您没有权限分配此项目的奖金',
          data: null
        })
      }
    }

    // 如果有部门ID，检查部门级权限
    if (departmentId) {
      const department = await global.nedbService.getDepartmentById(departmentId)
      if (department && !PermissionValidator.checkDepartmentPermission(user, 'manage', department)) {
        return res.status(403).json({
          code: 403,
          message: '您没有权限分配此部门的奖金',
          data: null
        })
      }
    }

    // 记录权限检查审计日志
    await auditService.logPermissionAction(
      user,
      'bonus:distribute',
      'bonus',
      null,
      { 
        action: 'distribute_bonus',
        projectId,
        departmentId
      },
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestId: req.id
      }
    )

    next()
  } catch (error) {
    logger.error('Check bonus distribute permission error:', error)
    res.status(500).json({
      code: 500,
      message: '权限检查失败',
      data: null
    })
  }
}

/**
 * 检查奖金调整权限
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
const checkBonusAdjustPermission = async (req, res, next) => {
  try {
    const user = req.user
    const { allocationId, adjustmentAmount, reason } = req.body

    // 检查基础权限
    if (!PermissionValidator.canAccessResource(user, 'bonus', 'adjust')) {
      return res.status(403).json({
        code: 403,
        message: '您没有权限调整奖金',
        data: null
      })
    }

    // 检查调整金额权限
    if (Math.abs(adjustmentAmount) > 50000) {
      // 5万以上调整需要高级权限
      if (!PermissionValidator.canAccessResource(user, 'finance', 'manage')) {
        return res.status(403).json({
          code: 403,
          message: '大额奖金调整需要财务管理权限',
          data: null
        })
      }
    }

    // 记录权限检查审计日志
    await auditService.logPermissionAction(
      user,
      'bonus:adjust',
      'bonus',
      allocationId,
      { 
        action: 'adjust_bonus',
        adjustmentAmount,
        reason
      },
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestId: req.id
      }
    )

    next()
  } catch (error) {
    logger.error('Check bonus adjust permission error:', error)
    res.status(500).json({
      code: 500,
      message: '权限检查失败',
      data: null
    })
  }
}

/**
 * 检查个人奖金查看权限
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
const checkPersonalBonusPermission = async (req, res, next) => {
  try {
    const user = req.user
    const { employeeId } = req.params

    // 检查基础权限
    if (!PermissionValidator.canAccessResource(user, 'bonus', 'view')) {
      return res.status(403).json({
        code: 403,
        message: '您没有权限查看奖金信息',
        data: null
      })
    }

    // 检查个人奖金查看权限
    if (employeeId && employeeId !== user.employeeId) {
      // 查看他人奖金需要额外权限
      if (!PermissionValidator.canAccessResource(user, 'employee', 'view')) {
        return res.status(403).json({
          code: 403,
          message: '您没有权限查看其他员工的奖金信息',
          data: null
        })
      }
    }

    next()
  } catch (error) {
    logger.error('Check personal bonus permission error:', error)
    res.status(500).json({
      code: 500,
      message: '权限检查失败',
      data: null
    })
  }
}

module.exports = {
  checkBonusViewPermission,
  checkBonusCalculatePermission,
  checkBonusApprovePermission,
  checkBonusDistributePermission,
  checkBonusAdjustPermission,
  checkPersonalBonusPermission
}
