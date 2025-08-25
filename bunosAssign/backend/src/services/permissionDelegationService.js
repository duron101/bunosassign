/**
 * 权限委派服务
 * 提供权限委派的管理功能
 */

const nedbService = require('./nedbService')
const { PermissionValidator, DELEGATION_CONFIG } = require('../config/permissions')
const PermissionDelegation = require('../models/PermissionDelegation')
const logger = require('../utils/logger')

class PermissionDelegationService {
  /**
   * 创建权限委派
   * @param {Object} delegator - 委派者
   * @param {Object} delegatee - 被委派者
   * @param {Array} permissions - 委派权限列表
   * @param {Object} options - 委派选项
   * @returns {Object} 委派结果
   */
  async createDelegation(delegator, delegatee, permissions, options = {}) {
    try {
      // 验证委派者权限
      if (!PermissionValidator.canAccessResource(delegator, 'permission', 'delegate')) {
        throw new Error('您没有权限委派权限')
      }

      // 验证被委派者
      if (!delegatee || !delegatee.id) {
        throw new Error('被委派者信息无效')
      }

      // 验证委派权限
      const validPermissions = this.validateDelegatablePermissions(permissions)
      if (validPermissions.length === 0) {
        throw new Error('没有可委派的权限')
      }

      // 检查是否需要审批
      const approvalRequired = this.checkApprovalRequired(validPermissions)
      
      // 创建委派实例
      const delegationData = {
        delegatorId: delegator.id,
        delegateeId: delegatee.id,
        permissions: validPermissions,
        resourceType: options.resourceType || null,
        resourceId: options.resourceId || null,
        startTime: options.startTime || new Date(),
        endTime: options.endTime || this.calculateDefaultEndTime(),
        status: approvalRequired ? 'pending' : 'active',
        approvalRequired,
        reason: options.reason || '',
        conditions: options.conditions || {}
      }

      const delegation = PermissionDelegation.create(delegationData)
      
      // 验证委派数据
      const validation = delegation.validate()
      if (!validation.isValid) {
        throw new Error(`委派数据验证失败: ${validation.errors.join(', ')}`)
      }

      // 保存到数据库
      const savedDelegation = await nedbService.createPermissionDelegation(delegation.toObject())
      
      logger.info('权限委派创建成功', {
        delegatorId: delegator.id,
        delegateeId: delegatee.id,
        permissions: validPermissions,
        approvalRequired
      })

      return {
        success: true,
        delegation: savedDelegation,
        approvalRequired
      }

    } catch (error) {
      logger.error('创建权限委派失败:', error)
      throw error
    }
  }

  /**
   * 审批权限委派
   * @param {string} delegationId - 委派ID
   * @param {Object} approver - 审批人
   * @param {boolean} approved - 是否批准
   * @param {string} comments - 审批意见
   * @returns {Object} 审批结果
   */
  async approveDelegation(delegationId, approver, approved, comments = '') {
    try {
      // 获取委派信息
      const delegation = await nedbService.getPermissionDelegationById(delegationId)
      if (!delegation) {
        throw new Error('委派记录不存在')
      }

      // 检查审批人权限
      if (!PermissionValidator.canAccessResource(approver, 'permission', 'approve')) {
        throw new Error('您没有权限审批委派')
      }

      if (approved) {
        // 激活委派
        delegation.activate(approver.id, comments)
        await nedbService.updatePermissionDelegation(delegationId, delegation.toObject())
        
        logger.info('权限委派已批准', {
          delegationId,
          approverId: approver.id,
          comments
        })
      } else {
        // 拒绝委派
        delegation.revoke(`审批被拒绝: ${comments}`)
        await nedbService.updatePermissionDelegation(delegationId, delegation.toObject())
        
        logger.info('权限委派被拒绝', {
          delegationId,
          approverId: approver.id,
          comments
        })
      }

      return {
        success: true,
        delegation: delegation.toObject(),
        approved
      }

    } catch (error) {
      logger.error('审批权限委派失败:', error)
      throw error
    }
  }

  /**
   * 撤销权限委派
   * @param {string} delegationId - 委派ID
   * @param {Object} revoker - 撤销人
   * @param {string} reason - 撤销原因
   * @returns {Object} 撤销结果
   */
  async revokeDelegation(delegationId, revoker, reason = '') {
    try {
      // 获取委派信息
      const delegation = await nedbService.getPermissionDelegationById(delegationId)
      if (!delegation) {
        throw new Error('委派记录不存在')
      }

      // 检查撤销权限
      if (delegation.delegatorId !== revoker.id && 
          !PermissionValidator.canAccessResource(revoker, 'permission', 'revoke')) {
        throw new Error('您没有权限撤销此委派')
      }

      // 撤销委派
      delegation.revoke(reason)
      await nedbService.updatePermissionDelegation(delegationId, delegation.toObject())
      
      logger.info('权限委派已撤销', {
        delegationId,
        revokerId: revoker.id,
        reason
      })

      return {
        success: true,
        delegation: delegation.toObject()
      }

    } catch (error) {
      logger.error('撤销权限委派失败:', error)
      throw error
    }
  }

  /**
   * 获取用户的有效委派权限
   * @param {string} userId - 用户ID
   * @returns {Array} 委派权限列表
   */
  async getUserDelegatedPermissions(userId) {
    try {
      const delegations = await nedbService.getPermissionDelegations({
        delegateeId: userId,
        status: 'active'
      })

      const now = new Date()
      const validPermissions = []

      delegations.forEach(delegation => {
        // 检查委派是否有效
        if (delegation.startTime <= now && 
            (!delegation.endTime || delegation.endTime > now)) {
          validPermissions.push(...delegation.permissions)
        }
      })

      // 去重
      return [...new Set(validPermissions)]

    } catch (error) {
      logger.error('获取用户委派权限失败:', error)
      return []
    }
  }

  /**
   * 验证可委派的权限
   * @param {Array} permissions - 权限列表
   * @returns {Array} 有效的可委派权限
   */
  validateDelegatablePermissions(permissions) {
    if (!Array.isArray(permissions)) return []
    
    return permissions.filter(permission => 
      DELEGATION_CONFIG.DELEGATABLE_PERMISSIONS.includes(permission)
    )
  }

  /**
   * 检查是否需要审批
   * @param {Array} permissions - 权限列表
   * @returns {boolean}
   */
  checkApprovalRequired(permissions) {
    return permissions.some(permission => 
      DELEGATION_CONFIG.APPROVAL_REQUIRED.includes(permission)
    )
  }

  /**
   * 计算默认结束时间
   * @returns {Date}
   */
  calculateDefaultEndTime() {
    return new Date(Date.now() + DELEGATION_CONFIG.MAX_DURATION)
  }

  /**
   * 获取待审批的委派列表
   * @param {Object} approver - 审批人
   * @returns {Array} 待审批委派列表
   */
  async getPendingDelegations(approver) {
    try {
      if (!PermissionValidator.canAccessResource(approver, 'permission', 'approve')) {
        return []
      }

      const delegations = await nedbService.getPermissionDelegations({
        status: 'pending'
      })

      return delegations

    } catch (error) {
      logger.error('获取待审批委派列表失败:', error)
      return []
    }
  }

  /**
   * 清理过期的委派
   * @returns {number} 清理的委派数量
   */
  async cleanupExpiredDelegations() {
    try {
      const expiredDelegations = await nedbService.getPermissionDelegations({
        status: 'active'
      })

      let cleanedCount = 0
      const now = new Date()

      for (const delegation of expiredDelegations) {
        if (delegation.endTime && delegation.endTime < now) {
          delegation.updateStatus()
          await nedbService.updatePermissionDelegation(delegation._id, delegation.toObject())
          cleanedCount++
        }
      }

      if (cleanedCount > 0) {
        logger.info(`清理了 ${cleanedCount} 个过期的权限委派`)
      }

      return cleanedCount

    } catch (error) {
      logger.error('清理过期委派失败:', error)
      return 0
    }
  }
}

module.exports = new PermissionDelegationService()
