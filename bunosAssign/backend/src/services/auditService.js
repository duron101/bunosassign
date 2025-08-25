/**
 * 权限审计服务
 * 用于记录和监控权限相关的操作
 */

const nedbService = require('./nedbService')
const { AUDIT_CONFIG } = require('../config/permissions')
const logger = require('../utils/logger')

class AuditService {
  /**
   * 记录权限操作审计日志
   * @param {Object} user - 操作用户
   * @param {string} action - 操作类型
   * @param {string} resourceType - 资源类型
   * @param {string} resourceId - 资源ID
   * @param {Object} details - 操作详情
   * @param {Object} context - 上下文信息
   */
  async logPermissionAction(user, action, resourceType, resourceId, details = {}, context = {}) {
    try {
      // 检查是否需要记录审计日志
      if (!AUDIT_CONFIG.AUDITED_ACTIONS.includes(action)) {
        return
      }

      const auditLog = {
        userId: user.id,
        username: user.username,
        userRole: user.roleName || user.Role?.name,
        action,
        resourceType,
        resourceId,
        details,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        timestamp: new Date(),
        riskLevel: this.assessRiskLevel(action, details),
        metadata: {
          sessionId: context.sessionId,
          requestId: context.requestId,
          referrer: context.referrer
        }
      }

      await nedbService.createAuditLog(auditLog)

      // 检查是否是敏感操作
      if (this.isSensitiveOperation(action, details)) {
        await this.handleSensitiveOperation(auditLog)
      }

      logger.info('权限审计日志已记录', {
        userId: user.id,
        action,
        resourceType,
        resourceId,
        riskLevel: auditLog.riskLevel
      })

    } catch (error) {
      logger.error('记录权限审计日志失败:', error)
    }
  }

  /**
   * 评估操作风险等级
   * @param {string} action - 操作类型
   * @param {Object} details - 操作详情
   * @returns {string} 风险等级
   */
  assessRiskLevel(action, details) {
    // 高风险操作
    if (['user:delete', 'project:delete', 'system:config'].includes(action)) {
      return 'high'
    }

    // 中风险操作
    if (['user:create', 'user:update', 'project:create', 'bonus:approve'].includes(action)) {
      return 'medium'
    }

    // 检查金额阈值
    if (action === 'bonus:approve' && details.amount) {
      const threshold = AUDIT_CONFIG.SENSITIVE_THRESHOLDS['bonus:approve']
      if (details.amount > threshold) {
        return 'high'
      }
    }

    if (action === 'finance:manage' && details.amount) {
      const threshold = AUDIT_CONFIG.SENSITIVE_THRESHOLDS['finance:manage']
      if (details.amount > threshold) {
        return 'high'
      }
    }

    return 'low'
  }

  /**
   * 检查是否是敏感操作
   * @param {string} action - 操作类型
   * @param {Object} details - 操作详情
   * @returns {boolean}
   */
  isSensitiveOperation(action, details) {
    // 检查操作类型
    if (AUDIT_CONFIG.AUDITED_ACTIONS.includes(action)) {
      return true
    }

    // 检查金额阈值
    if (details.amount) {
      const thresholds = Object.values(AUDIT_CONFIG.SENSITIVE_THRESHOLDS)
      return thresholds.some(threshold => details.amount > threshold)
    }

    return false
  }

  /**
   * 处理敏感操作
   * @param {Object} auditLog - 审计日志
   */
  async handleSensitiveOperation(auditLog) {
    try {
      // 记录高风险操作到特殊日志
      logger.warn('检测到高风险权限操作', {
        userId: auditLog.userId,
        username: auditLog.username,
        action: auditLog.action,
        resourceType: auditLog.resourceType,
        resourceId: auditLog.resourceId,
        riskLevel: auditLog.riskLevel,
        timestamp: auditLog.timestamp
      })

      // TODO: 可以在这里添加告警机制
      // 例如：发送邮件通知、Slack消息等

    } catch (error) {
      logger.error('处理敏感操作失败:', error)
    }
  }

  /**
   * 获取审计日志
   * @param {Object} query - 查询条件
   * @param {Object} options - 查询选项
   * @returns {Array} 审计日志列表
   */
  async getAuditLogs(query = {}, options = {}) {
    try {
      const logs = await nedbService.getAuditLogs(query)
      
      // 应用分页和排序
      if (options.sort) {
        logs.sort((a, b) => {
          const { field, order } = options.sort
          const aVal = a[field]
          const bVal = b[field]
          
          if (order === 'desc') {
            return bVal > aVal ? 1 : -1
          }
          return aVal > bVal ? 1 : -1
        })
      }

      if (options.limit) {
        return logs.slice(0, options.limit)
      }

      return logs

    } catch (error) {
      logger.error('获取审计日志失败:', error)
      return []
    }
  }

  /**
   * 获取权限操作统计
   * @param {Object} timeRange - 时间范围
   * @returns {Object} 统计信息
   */
  async getPermissionActionStats(timeRange = {}) {
    try {
      const query = {}
      
      if (timeRange.startDate || timeRange.endDate) {
        query.timestamp = {}
        if (timeRange.startDate) query.timestamp.$gte = new Date(timeRange.startDate)
        if (timeRange.endDate) query.timestamp.$lte = new Date(timeRange.endDate)
      }

      const logs = await nedbService.getAuditLogs(query)

      // 统计操作类型
      const actionStats = logs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1
        return acc
      }, {})

      // 统计风险等级
      const riskStats = logs.reduce((acc, log) => {
        acc[log.riskLevel] = (acc[log.riskLevel] || 0) + 1
        return acc
      }, {})

      // 统计用户操作
      const userStats = logs.reduce((acc, log) => {
        if (!acc[log.userId]) {
          acc[log.userId] = {
            username: log.username,
            actionCount: 0,
            highRiskActions: 0
          }
        }
        acc[log.userId].actionCount++
        if (log.riskLevel === 'high') {
          acc[log.userId].highRiskActions++
        }
        return acc
      }, {})

      return {
        totalActions: logs.length,
        actionStats,
        riskStats,
        userStats,
        timeRange
      }

    } catch (error) {
      logger.error('获取权限操作统计失败:', error)
      return {}
    }
  }

  /**
   * 清理过期的审计日志
   * @returns {number} 清理的日志数量
   */
  async cleanupExpiredLogs() {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - AUDIT_CONFIG.RETENTION_DAYS)

      const expiredLogs = await nedbService.getAuditLogs({
        timestamp: { $lt: cutoffDate }
      })

      let cleanedCount = 0
      for (const log of expiredLogs) {
        await nedbService.remove('auditLogs', { _id: log._id })
        cleanedCount++
      }

      if (cleanedCount > 0) {
        logger.info(`清理了 ${cleanedCount} 条过期的审计日志`)
      }

      return cleanedCount

    } catch (error) {
      logger.error('清理过期审计日志失败:', error)
      return 0
    }
  }

  /**
   * 导出审计日志
   * @param {Object} query - 查询条件
   * @param {string} format - 导出格式 (csv, json)
   * @returns {string} 导出的数据
   */
  async exportAuditLogs(query = {}, format = 'csv') {
    try {
      const logs = await this.getAuditLogs(query)

      if (format === 'csv') {
        return this.convertToCSV(logs)
      }

      return JSON.stringify(logs, null, 2)

    } catch (error) {
      logger.error('导出审计日志失败:', error)
      throw error
    }
  }

  /**
   * 转换为CSV格式
   * @param {Array} logs - 日志数据
   * @returns {string} CSV字符串
   */
  convertToCSV(logs) {
    if (logs.length === 0) return ''

    const headers = ['时间', '用户ID', '用户名', '操作', '资源类型', '资源ID', '风险等级', '详情']
    const rows = logs.map(log => [
      log.timestamp,
      log.userId,
      log.username,
      log.action,
      log.resourceType,
      log.resourceId,
      log.riskLevel,
      JSON.stringify(log.details)
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    return csvContent
  }
}

module.exports = new AuditService()
