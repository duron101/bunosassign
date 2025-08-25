/**
 * 通知服务
 * 提供系统通知的创建、管理、发送等核心功能
 */

const nedbService = require('./nedbService')
const logger = require('../utils/logger')

class NotificationService {
  /**
   * 创建通知
   * @param {Object} notificationData - 通知数据
   * @returns {Object} 创建的通知记录
   */
  async createNotification(notificationData) {
    try {
      const notification = {
        ...notificationData,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = await nedbService.insert('notifications', notification)
      
      logger.info('通知创建成功', {
        notificationId: result._id || result.id,
        userId: notificationData.userId,
        type: notificationData.notificationType,
        title: notificationData.title
      })

      return result
    } catch (error) {
      logger.error('创建通知失败:', error)
      throw error
    }
  }

  /**
   * 批量创建通知
   * @param {Array} notificationsData - 通知数据数组
   * @returns {Array} 创建的通知记录数组
   */
  async createBatchNotifications(notificationsData) {
    try {
      const notifications = notificationsData.map(data => ({
        ...data,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }))

      const result = await nedbService.insert('notifications', notifications)
      
      logger.info('批量通知创建成功', {
        count: notifications.length,
        types: [...new Set(notifications.map(n => n.notificationType))]
      })

      return result
    } catch (error) {
      logger.error('批量创建通知失败:', error)
      throw error
    }
  }

  /**
   * 获取用户通知
   * @param {string} userId - 用户ID
   * @param {Object} options - 查询选项
   * @returns {Object} 通知列表和分页信息
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const {
        page = 1,
        pageSize = 20,
        unreadOnly = false,
        notificationType,
        startDate,
        endDate
      } = options

      // 构建查询条件
      const query = { userId }
      
      if (unreadOnly) {
        query.isRead = false
      }
      
      if (notificationType) {
        query.notificationType = notificationType
      }
      
      if (startDate || endDate) {
        query.createdAt = {}
        if (startDate) query.createdAt.$gte = new Date(startDate)
        if (endDate) query.createdAt.$lte = new Date(endDate)
      }

      // 获取通知列表
      const notifications = await nedbService.find('notifications', query, {
        sort: { createdAt: -1 }
      })

      // 分页处理
      const total = notifications.length
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + pageSize
      const paginatedNotifications = notifications.slice(startIndex, endIndex)

      // 计算未读数量
      const unreadCount = notifications.filter(n => !n.isRead).length

      return {
        notifications: paginatedNotifications,
        pagination: {
          total,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: Math.ceil(total / parseInt(pageSize))
        },
        unreadCount
      }
    } catch (error) {
      logger.error('获取用户通知失败:', error)
      throw error
    }
  }

  /**
   * 标记通知为已读
   * @param {string} notificationId - 通知ID
   * @param {string} userId - 用户ID
   * @returns {Object} 更新后的通知
   */
  async markNotificationRead(notificationId, userId) {
    try {
      // 检查通知是否存在且属于该用户
      const notification = await nedbService.findOne('notifications', { 
        _id: notificationId,
        userId 
      })
      
      if (!notification) {
        throw new Error('通知不存在或无权限操作')
      }

      // 更新通知状态
      await nedbService.update('notifications', 
        { _id: notificationId }, 
        { 
          isRead: true, 
          readAt: new Date(),
          updatedAt: new Date()
        }
      )

      // 获取更新后的通知
      const updatedNotification = await nedbService.findOne('notifications', { 
        _id: notificationId 
      })

      logger.info('通知标记已读成功', {
        notificationId,
        userId,
        readAt: updatedNotification.readAt
      })

      return updatedNotification
    } catch (error) {
      logger.error('标记通知已读失败:', error)
      throw error
    }
  }

  /**
   * 批量标记通知为已读
   * @param {string} userId - 用户ID
   * @param {Object} filter - 过滤条件
   * @returns {number} 更新的通知数量
   */
  async markAllNotificationsRead(userId, filter = {}) {
    try {
      const query = { 
        userId, 
        isRead: false,
        ...filter
      }

      const result = await nedbService.update('notifications', 
        query, 
        { 
          isRead: true, 
          readAt: new Date(),
          updatedAt: new Date()
        }
      )

      logger.info('批量标记通知已读成功', {
        userId,
        count: result,
        filter
      })

      return result
    } catch (error) {
      logger.error('批量标记通知已读失败:', error)
      throw error
    }
  }

  /**
   * 删除通知
   * @param {string} notificationId - 通知ID
   * @param {string} userId - 用户ID
   * @returns {boolean} 删除结果
   */
  async deleteNotification(notificationId, userId) {
    try {
      // 检查通知是否存在且属于该用户
      const notification = await nedbService.findOne('notifications', { 
        _id: notificationId,
        userId 
      })
      
      if (!notification) {
        throw new Error('通知不存在或无权限操作')
      }

      // 删除通知
      const result = await nedbService.remove('notifications', { 
        _id: notificationId 
      })

      logger.info('通知删除成功', {
        notificationId,
        userId,
        result
      })

      return result > 0
    } catch (error) {
      logger.error('删除通知失败:', error)
      throw error
    }
  }

  /**
   * 清理过期通知
   * @param {number} days - 保留天数
   * @returns {number} 清理的通知数量
   */
  async cleanupExpiredNotifications(days = 90) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)

      const result = await nedbService.remove('notifications', {
        createdAt: { $lt: cutoffDate },
        isRead: true
      })

      logger.info('过期通知清理完成', {
        days,
        count: result,
        cutoffDate
      })

      return result
    } catch (error) {
      logger.error('清理过期通知失败:', error)
      throw error
    }
  }

  /**
   * 获取通知统计信息
   * @param {string} userId - 用户ID
   * @returns {Object} 统计信息
   */
  async getNotificationStats(userId) {
    try {
      const allNotifications = await nedbService.find('notifications', { userId })
      
      const stats = {
        total: allNotifications.length,
        unread: allNotifications.filter(n => !n.isRead).length,
        read: allNotifications.filter(n => n.isRead).length,
        byType: {},
        byDate: {}
      }

      // 按类型统计
      allNotifications.forEach(notification => {
        const type = notification.notificationType
        stats.byType[type] = (stats.byType[type] || 0) + 1
      })

      // 按日期统计（最近7天）
      const now = new Date()
      for (let i = 0; i < 7; i++) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        stats.byDate[dateStr] = allNotifications.filter(n => 
          n.createdAt.toISOString().split('T')[0] === dateStr
        ).length
      }

      return stats
    } catch (error) {
      logger.error('获取通知统计信息失败:', error)
      throw error
    }
  }

  /**
   * 发送项目相关通知
   * @param {string} projectId - 项目ID
   * @param {string} notificationType - 通知类型
   * @param {string} title - 通知标题
   * @param {string} content - 通知内容
   * @param {Array} userIds - 接收用户ID数组
   * @param {Object} metadata - 附加元数据
   * @returns {Array} 创建的通知记录
   */
  async sendProjectNotification(projectId, notificationType, title, content, userIds, metadata = {}) {
    try {
      const notifications = userIds.map(userId => ({
        userId,
        projectId,
        notificationType,
        title,
        content,
        relatedId: projectId,
        metadata
      }))

      const result = await this.createBatchNotifications(notifications)
      
      logger.info('项目通知发送成功', {
        projectId,
        notificationType,
        title,
        userIds: userIds.length,
        result
      })

      return result
    } catch (error) {
      logger.error('发送项目通知失败:', error)
      throw error
    }
  }

  /**
   * 发送团队申请通知
   * @param {string} applicationId - 申请ID
   * @param {string} projectId - 项目ID
   * @param {string} applicantId - 申请人ID
   * @param {string} action - 操作类型 (applied, approved, rejected)
   * @param {Array} approverIds - 审批人ID数组
   * @returns {Array} 创建的通知记录
   */
  async sendTeamApplicationNotification(applicationId, projectId, applicantId, action, approverIds) {
    try {
      const notificationConfigs = {
        applied: {
          type: 'team_applied',
          title: '新的团队申请',
          content: '有新的团队申请需要您审批',
          recipients: approverIds
        },
        approved: {
          type: 'approved',
          title: '团队申请已批准',
          content: '您的团队申请已获得批准',
          recipients: [applicantId]
        },
        rejected: {
          type: 'rejected',
          title: '团队申请被拒绝',
          content: '您的团队申请被拒绝',
          recipients: [applicantId]
        }
      }

      const config = notificationConfigs[action]
      if (!config) {
        throw new Error(`不支持的操作类型: ${action}`)
      }

      const notifications = config.recipients.map(userId => ({
        userId,
        projectId,
        notificationType: config.type,
        title: config.title,
        content: config.content,
        relatedId: applicationId,
        metadata: {
          applicationId,
          applicantId,
          action
        }
      }))

      const result = await this.createBatchNotifications(notifications)
      
      logger.info('团队申请通知发送成功', {
        applicationId,
        projectId,
        action,
        recipients: config.recipients.length,
        result
      })

      return result
    } catch (error) {
      logger.error('发送团队申请通知失败:', error)
      throw error
    }
  }

  /**
   * 发送系统通知
   * @param {string} notificationType - 通知类型
   * @param {string} title - 通知标题
   * @param {string} content - 通知内容
   * @param {Array} userIds - 接收用户ID数组
   * @param {Object} metadata - 附加元数据
   * @returns {Array} 创建的通知记录
   */
  async sendSystemNotification(notificationType, title, content, userIds, metadata = {}) {
    try {
      const notifications = userIds.map(userId => ({
        userId,
        notificationType,
        title,
        content,
        metadata
      }))

      const result = await this.createBatchNotifications(notifications)
      
      logger.info('系统通知发送成功', {
        notificationType,
        title,
        recipients: userIds.length,
        result
      })

      return result
    } catch (error) {
      logger.error('发送系统通知失败:', error)
      throw error
    }
  }
}

module.exports = new NotificationService()
