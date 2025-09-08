/**
 * 项目协作权限中间件
 * 提供项目协作相关的权限验证
 */

const { PermissionValidator } = require('../config/permissions')
const auditService = require('../services/auditService')
const logger = require('../utils/logger')

/**
 * 检查项目发布权限
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
const checkPublishPermission = async (req, res, next) => {
  try {
    const user = req.user
    const { projectId } = req.body

    // 检查基础权限
    if (!PermissionValidator.canAccessResource(user, 'collaboration', 'publish')) {
      return res.status(403).json({
        code: 403,
        message: '您没有权限发布项目协作',
        data: null
      })
    }

    // 如果有项目ID，检查项目级权限
    if (projectId) {
      const project = await global.nedbService.getProjectById(projectId)
      if (project && !PermissionValidator.checkProjectPermission(user, 'manage', project)) {
        return res.status(403).json({
          code: 403,
          message: '您没有权限管理此项目',
          data: null
        })
      }
    }

    // 记录权限检查审计日志
    await auditService.logPermissionAction(
      user,
      'collaboration:publish',
      'project',
      projectId,
      { action: 'publish_collaboration' },
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestId: req.id
      }
    )

    next()
  } catch (error) {
    logger.error('Check publish permission error:', error)
    res.status(500).json({
      code: 500,
      message: '权限检查失败',
      data: null
    })
  }
}

/**
 * 检查团队申请权限
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
const checkTeamApplyPermission = async (req, res, next) => {
  try {
    const user = req.user
    const { projectId } = req.body

    // 检查基础权限
    if (!PermissionValidator.canAccessResource(user, 'collaboration', 'apply')) {
      return res.status(403).json({
        code: 403,
        message: '您没有权限申请加入项目团队',
        data: null
      })
    }

    // 检查项目是否存在且可申请
    if (projectId) {
      const project = await global.nedbService.getProjectById(projectId)
      if (!project) {
        return res.status(404).json({
          code: 404,
          message: '项目不存在',
          data: null
        })
      }

      // 检查项目状态
      if (project.status !== 'active' && project.status !== 'recruiting') {
        return res.status(400).json({
          code: 400,
          message: '项目当前不接受申请',
          data: null
        })
      }

      // 检查是否已经是项目成员
      const existingMember = await global.nedbService.getProjectMember(projectId, user.employeeId)
      if (existingMember) {
        return res.status(400).json({
          code: 400,
          message: '您已经是项目成员',
          data: null
        })
      }
    }

    // 记录权限检查审计日志
    await auditService.logPermissionAction(
      user,
      'collaboration:apply',
      'project',
      projectId,
      { action: 'team_apply' },
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestId: req.id
      }
    )

    next()
  } catch (error) {
    logger.error('Check team apply permission error:', error)
    res.status(500).json({
      code: 500,
      message: '权限检查失败',
      data: null
    })
  }
}

/**
 * 检查项目查看权限
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
const checkProjectViewPermission = async (req, res, next) => {
  try {
    const user = req.user
    const { projectId } = req.params

    // 检查基础权限
    if (!PermissionValidator.canAccessResource(user, 'project', 'view')) {
      return res.status(403).json({
        code: 403,
        message: '您没有权限查看项目',
        data: null
      })
    }

    // 检查项目级权限
    if (projectId) {
      const project = await global.nedbService.getProjectById(projectId)
      if (!project) {
        return res.status(404).json({
          code: 404,
          message: '项目不存在',
          data: null
        })
      }

      if (!PermissionValidator.checkProjectPermission(user, 'view', project)) {
        return res.status(403).json({
          code: 403,
          message: '您没有权限查看此项目',
          data: null
        })
      }
    }

    next()
  } catch (error) {
    logger.error('Check project view permission error:', error)
    res.status(500).json({
      code: 500,
      message: '权限检查失败',
      data: null
    })
  }
}

/**
 * 检查项目管理权限
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
const checkProjectManagePermission = async (req, res, next) => {
  try {
    const user = req.user
    const { projectId } = req.params

    // 检查基础权限
    if (!PermissionValidator.canAccessResource(user, 'project', 'manage')) {
      return res.status(403).json({
        code: 403,
        message: '您没有权限管理项目',
        data: null
      })
    }

    // 检查项目级权限
    if (projectId) {
      const project = await global.nedbService.getProjectById(projectId)
      if (!project) {
        return res.status(404).json({
          code: 404,
          message: '项目不存在',
          data: null
        })
      }

      if (!PermissionValidator.checkProjectPermission(user, 'manage', project)) {
        return res.status(403).json({
          code: 403,
          message: '您没有权限管理此项目',
          data: null
        })
      }
    }

    // 记录权限检查审计日志
    await auditService.logPermissionAction(
      user,
      'project:manage',
      'project',
      projectId,
      { action: 'project_manage' },
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestId: req.id
      }
    )

    next()
  } catch (error) {
    logger.error('Check project manage permission error:', error)
    res.status(500).json({
      code: 500,
      message: '权限检查失败',
      data: null
    })
  }
}

/**
 * 检查团队成员管理权限
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
const checkTeamManagePermission = async (req, res, next) => {
  try {
    const user = req.user
    const { projectId } = req.params

    // 检查基础权限
    if (!PermissionValidator.canAccessResource(user, 'team', 'manage')) {
      return res.status(403).json({
        code: 403,
        message: '您没有权限管理项目团队',
        data: null
      })
    }

    // 检查项目级权限
    if (projectId) {
      const project = await global.nedbService.getProjectById(projectId)
      if (!project) {
        return res.status(404).json({
          code: 404,
          message: '项目不存在',
          data: null
        })
      }

      // 检查是否是项目经理或项目管理员
      if (!PermissionValidator.checkProjectPermission(user, 'manage', project)) {
        return res.status(403).json({
          code: 403,
          message: '您没有权限管理此项目团队',
          data: null
        })
      }
    }

    next()
  } catch (error) {
    logger.error('Check team manage permission error:', error)
    res.status(500).json({
      code: 500,
      message: '权限检查失败',
      data: null
    })
  }
}

/**
 * 检查成员审批权限
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
const checkMemberApprovalPermission = async (req, res, next) => {
  try {
    const user = req.user
    const { projectId } = req.params

    // 检查基础权限
    if (!PermissionValidator.canAccessResource(user, 'member', 'approve')) {
      return res.status(403).json({
        code: 403,
        message: '您没有权限审批成员申请',
        data: null
      })
    }

    // 检查项目级权限
    if (projectId) {
      const project = await global.nedbService.getProjectById(projectId)
      if (!project) {
        return res.status(404).json({
          code: 404,
          message: '项目不存在',
          data: null
        })
      }

      // 检查是否是项目经理或项目管理员
      if (!PermissionValidator.checkProjectPermission(user, 'manage', project)) {
        return res.status(403).json({
          code: 403,
          message: '您没有权限审批此项目的成员申请',
          data: null
        })
      }
    }

    next()
  } catch (error) {
    logger.error('Check member approval permission error:', error)
    res.status(500).json({
      code: 500,
      message: '权限检查失败',
      data: null
    })
  }
}

/**
 * 检查角色分配权限
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
const checkRoleAssignPermission = async (req, res, next) => {
  try {
    const user = req.user
    const { projectId } = req.params

    // 检查基础权限
    if (!PermissionValidator.canAccessResource(user, 'role', 'assign')) {
      return res.status(403).json({
        code: 403,
        message: '您没有权限分配项目角色',
        data: null
      })
    }

    // 检查项目级权限
    if (projectId) {
      const project = await global.nedbService.getProjectById(projectId)
      if (!project) {
        return res.status(404).json({
          code: 404,
          message: '项目不存在',
          data: null
        })
      }

      // 检查是否是项目经理或项目管理员
      if (!PermissionValidator.checkProjectPermission(user, 'manage', project)) {
        return res.status(403).json({
          code: 403,
          message: '您没有权限分配此项目的角色',
          data: null
        })
      }
    }

    next()
  } catch (error) {
    logger.error('Check role assign permission error:', error)
    res.status(500).json({
      code: 500,
      message: '权限检查失败',
      data: null
    })
  }
}

/**
 * 检查通知权限
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
const checkNotificationPermission = async (req, res, next) => {
  try {
    const user = req.user

    // 检查基础权限 - 所有已认证用户都可以访问自己的通知
    if (!PermissionValidator.canAccessResource(user, 'notification', 'view')) {
      return res.status(403).json({
        code: 403,
        message: '您没有权限查看通知',
        data: null
      })
    }

    next()
  } catch (error) {
    logger.error('Check notification permission error:', error)
    res.status(500).json({
      code: 500,
      message: '权限检查失败',
      data: null
    })
  }
}

module.exports = {
  checkPublishPermission,
  checkTeamApplyPermission,
  checkProjectViewPermission,
  checkProjectManagePermission,
  checkTeamManagePermission,
  checkMemberApprovalPermission,
  checkRoleAssignPermission,
  checkNotificationPermission
}