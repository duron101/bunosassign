/**
 * 通知相关API服务
 */

import request from '@/utils/request'
import type {
  Notification,
  NotificationQueryParams,
  NotificationListResponse,
  CreateNotificationRequest,
  UpdateNotificationRequest,
  BatchNotificationRequest,
  NotificationStats
} from '@/types/notification'

// 通知API
export const notificationApi = {
  /**
   * 获取通知列表
   */
  getNotifications: (params?: NotificationQueryParams): Promise<{ data: NotificationListResponse }> => {
    return request.get('/project-collaboration/notifications', { params })
  },

  /**
   * 获取我的通知
   */
  getMyNotifications: (params?: NotificationQueryParams): Promise<{ data: NotificationListResponse }> => {
    return request.get('/project-collaboration/notifications/my', { params })
  },

  /**
   * 获取通知详情
   */
  getNotification: (id: string): Promise<{ data: Notification }> => {
    return request.get(`/project-collaboration/notifications/${id}`)
  },

  /**
   * 创建通知
   */
  createNotification: (data: CreateNotificationRequest): Promise<{ data: Notification }> => {
    return request.post('/project-collaboration/notifications', data)
  },

  /**
   * 更新通知
   */
  updateNotification: (id: string, data: UpdateNotificationRequest): Promise<{ data: Notification }> => {
    return request.put(`/project-collaboration/notifications/${id}`, data)
  },

  /**
   * 删除通知
   */
  deleteNotification: (id: string): Promise<{ data: null }> => {
    return request.delete(`/project-collaboration/notifications/${id}`)
  },

  /**
   * 标记通知为已读
   */
  markNotificationRead: (id: string): Promise<{ data: Notification }> => {
    return request.post(`/project-collaboration/notifications/${id}/read`)
  },

  /**
   * 标记通知为未读
   */
  markNotificationUnread: (id: string): Promise<{ data: Notification }> => {
    return request.post(`/project-collaboration/notifications/${id}/unread`)
  },

  /**
   * 批量标记通知为已读
   */
  markAllNotificationsRead: (): Promise<{ data: { updatedCount: number } }> => {
    return request.post('/project-collaboration/notifications/mark-all-read')
  },

  /**
   * 批量标记通知为未读
   */
  markAllNotificationsUnread: (): Promise<{ data: { updatedCount: number } }> => {
    return request.post('/project-collaboration/notifications/mark-all-unread')
  },

  /**
   * 批量操作通知
   */
  batchOperation: (data: BatchNotificationRequest): Promise<{ data: { updatedCount: number } }> => {
    return request.post('/project-collaboration/notifications/batch', data)
  },

  /**
   * 获取通知统计信息
   */
  getNotificationStats: (): Promise<{ data: NotificationStats }> => {
    return request.get('/project-collaboration/notifications/stats')
  },

  /**
   * 获取我的通知统计信息
   */
  getMyNotificationStats: (): Promise<{ data: NotificationStats }> => {
    return request.get('/project-collaboration/notifications/my/stats')
  },

  /**
   * 发送系统通知
   */
  sendSystemNotification: (data: {
    title: string
    content: string
    userIds: string[]
    priority?: string
  }): Promise<{ data: { sentCount: number } }> => {
    return request.post('/project-collaboration/notifications/system', data)
  },

  /**
   * 发送项目通知
   */
  sendProjectNotification: (data: {
    projectId: string
    title: string
    content: string
    userIds: string[]
    priority?: string
    metadata?: Record<string, any>
  }): Promise<{ data: { sentCount: number } }> => {
    return request.post('/project-collaboration/notifications/project', data)
  },

  /**
   * 获取通知模板列表
   */
  getNotificationTemplates: (): Promise<{ data: any[] }> => {
    return request.get('/project-collaboration/notifications/templates')
  },

  /**
   * 创建通知模板
   */
  createNotificationTemplate: (data: any): Promise<{ data: any }> => {
    return request.post('/project-collaboration/notifications/templates', data)
  },

  /**
   * 更新通知模板
   */
  updateNotificationTemplate: (id: string, data: any): Promise<{ data: any }> => {
    return request.put(`/project-collaboration/notifications/templates/${id}`, data)
  },

  /**
   * 删除通知模板
   */
  deleteNotificationTemplate: (id: string): Promise<{ data: null }> => {
    return request.delete(`/project-collaboration/notifications/templates/${id}`)
  },

  /**
   * 获取通知设置
   */
  getNotificationSettings: (): Promise<{ data: any }> => {
    return request.get('/project-collaboration/notifications/settings')
  },

  /**
   * 更新通知设置
   */
  updateNotificationSettings: (data: any): Promise<{ data: any }> => {
    return request.put('/project-collaboration/notifications/settings', data)
  },

  /**
   * 测试通知发送
   */
  testNotification: (data: {
    type: string
    userId: string
    template?: string
  }): Promise<{ data: { success: boolean; message: string } }> => {
    return request.post('/project-collaboration/notifications/test', data)
  }
}

export default notificationApi
