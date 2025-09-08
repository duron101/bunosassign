/**
 * 权限委派控制器
 * 提供权限委派的API接口
 */

const permissionDelegationService = require('../services/permissionDelegationService')
const { PermissionValidator } = require('../config/permissions')
const logger = require('../utils/logger')

class PermissionDelegationController {
  /**
   * 创建权限委派
   */
  async createDelegation(req, res, next) {
    try {
      const { delegateeId, permissions, resourceType, resourceId, startTime, endTime, reason, conditions } = req.body
      const delegator = req.user

      if (!delegateeId || !permissions || !Array.isArray(permissions)) {
        return res.status(400).json({
          code: 400,
          message: '缺少必要参数',
          data: null
        })
      }

      // 获取被委派者信息
      const delegatee = await global.nedbService.getUserById(delegateeId)
      if (!delegatee) {
        return res.status(400).json({
          code: 400,
          message: '被委派者不存在',
          data: null
        })
      }

      const options = {
        resourceType,
        resourceId,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        reason,
        conditions
      }

      const result = await permissionDelegationService.createDelegation(
        delegator,
        delegatee,
        permissions,
        options
      )

      res.json({
        code: 200,
        message: result.approvalRequired ? '委派创建成功，等待审批' : '委派创建成功',
        data: result.delegation
      })

    } catch (error) {
      logger.error('Create permission delegation error:', error)
      next(error)
    }
  }

  /**
   * 审批权限委派
   */
  async approveDelegation(req, res, next) {
    try {
      const { delegationId } = req.params
      const { approved, comments } = req.body
      const approver = req.user

      if (typeof approved !== 'boolean') {
        return res.status(400).json({
          code: 400,
          message: '缺少审批结果',
          data: null
        })
      }

      const result = await permissionDelegationService.approveDelegation(
        delegationId,
        approver,
        approved,
        comments || ''
      )

      res.json({
        code: 200,
        message: approved ? '委派已批准' : '委派已拒绝',
        data: result.delegation
      })

    } catch (error) {
      logger.error('Approve permission delegation error:', error)
      next(error)
    }
  }

  /**
   * 撤销权限委派
   */
  async revokeDelegation(req, res, next) {
    try {
      const { delegationId } = req.params
      const { reason } = req.body
      const revoker = req.user

      const result = await permissionDelegationService.revokeDelegation(
        delegationId,
        revoker,
        reason || ''
      )

      res.json({
        code: 200,
        message: '委派已撤销',
        data: result.delegation
      })

    } catch (error) {
      logger.error('Revoke permission delegation error:', error)
      next(error)
    }
  }

  /**
   * 获取用户的委派权限
   */
  async getUserDelegatedPermissions(req, res, next) {
    try {
      const { userId } = req.params
      const currentUser = req.user

      // 检查权限：只能查看自己的委派权限，或者有管理权限
      if (userId !== currentUser.id && 
          !PermissionValidator.canAccessResource(currentUser, 'permission', 'view')) {
        return res.status(403).json({
          code: 403,
          message: '无权查看此用户的委派权限',
          data: null
        })
      }

      const permissions = await permissionDelegationService.getUserDelegatedPermissions(userId)

      res.json({
        code: 200,
        message: '获取成功',
        data: permissions
      })

    } catch (error) {
      logger.error('Get user delegated permissions error:', error)
      next(error)
    }
  }

  /**
   * 获取待审批的委派列表
   */
  async getPendingDelegations(req, res, next) {
    try {
      const approver = req.user

      const delegations = await permissionDelegationService.getPendingDelegations(approver)

      res.json({
        code: 200,
        message: '获取成功',
        data: delegations
      })

    } catch (error) {
      logger.error('Get pending delegations error:', error)
      next(error)
    }
  }

  /**
   * 获取委派历史
   */
  async getDelegationHistory(req, res, next) {
    try {
      const { status, resourceType, startDate, endDate } = req.query
      const currentUser = req.user

      // 构建查询条件
      const query = {}
      
      if (status) query.status = status
      if (resourceType) query.resourceType = resourceType
      
      // 时间范围查询
      if (startDate || endDate) {
        query.createdAt = {}
        if (startDate) query.createdAt.$gte = new Date(startDate)
        if (endDate) query.createdAt.$lte = new Date(endDate)
      }

      // 普通用户只能查看自己的委派历史
      if (!PermissionValidator.canAccessResource(currentUser, 'permission', 'view')) {
        query.$or = [
          { delegatorId: currentUser.id },
          { delegateeId: currentUser.id }
        ]
      }

      const delegations = await global.nedbService.getPermissionDelegations(query)

      res.json({
        code: 200,
        message: '获取成功',
        data: delegations
      })

    } catch (error) {
      logger.error('Get delegation history error:', error)
      next(error)
    }
  }

  /**
   * 清理过期的委派
   */
  async cleanupExpiredDelegations(req, res, next) {
    try {
      const currentUser = req.user

      // 检查权限
      if (!PermissionValidator.canAccessResource(currentUser, 'permission', 'manage')) {
        return res.status(403).json({
          code: 403,
          message: '无权执行此操作',
          data: null
        })
      }

      const cleanedCount = await permissionDelegationService.cleanupExpiredDelegations()

      res.json({
        code: 200,
        message: `清理完成，共清理 ${cleanedCount} 个过期委派`,
        data: { cleanedCount }
      })

    } catch (error) {
      logger.error('Cleanup expired delegations error:', error)
      next(error)
    }
  }
}

module.exports = new PermissionDelegationController()
