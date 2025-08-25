/**
 * 通知相关类型定义
 */

// 通知类型枚举
export enum NotificationType {
  PROJECT_PUBLISHED = 'project_published',
  TEAM_APPLIED = 'team_applied',
  APPROVAL_NEEDED = 'approval_needed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  MODIFICATION_REQUIRED = 'modification_required',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  PROJECT_UPDATE = 'project_update',
  TEAM_CHANGE = 'team_change',
  DEADLINE_REMINDER = 'deadline_reminder'
}

// 通知状态枚举
export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read'
}

// 通知优先级枚举
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

// 基础通知接口
export interface BaseNotification {
  id: string
  userId: string
  notificationType: NotificationType
  title: string
  content: string
  isRead: boolean
  priority: NotificationPriority
  createdAt: Date
  updatedAt: Date
  readAt?: Date
}

// 项目相关通知
export interface ProjectNotification extends BaseNotification {
  projectId: string
  relatedId?: string
  metadata?: {
    projectName?: string
    projectCode?: string
    businessLineName?: string
    departmentName?: string
    [key: string]: any
  }
}

// 团队申请通知
export interface TeamApplicationNotification extends BaseNotification {
  projectId: string
  relatedId: string // 申请ID
  metadata?: {
    applicationId: string
    applicantId: string
    applicantName?: string
    action: 'applied' | 'approved' | 'rejected'
    [key: string]: any
  }
}

// 系统通知
export interface SystemNotification extends BaseNotification {
  metadata?: {
    [key: string]: any
  }
}

// 通知联合类型
export type Notification = ProjectNotification | TeamApplicationNotification | SystemNotification

// 通知查询参数
export interface NotificationQueryParams {
  page?: number
  pageSize?: number
  unreadOnly?: boolean
  notificationType?: NotificationType
  startDate?: string
  endDate?: string
  priority?: NotificationPriority
}

// 通知分页响应
export interface NotificationPagination {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 通知列表响应
export interface NotificationListResponse {
  notifications: Notification[]
  pagination: NotificationPagination
  unreadCount: number
}

// 通知统计信息
export interface NotificationStats {
  total: number
  unread: number
  read: number
  byType: Record<NotificationType, number>
  byDate: Record<string, number>
}

// 通知创建请求
export interface CreateNotificationRequest {
  userId: string
  notificationType: NotificationType
  title: string
  content: string
  priority?: NotificationPriority
  projectId?: string
  relatedId?: string
  metadata?: Record<string, any>
}

// 通知更新请求
export interface UpdateNotificationRequest {
  isRead?: boolean
  priority?: NotificationPriority
  metadata?: Record<string, any>
}

// 通知批量操作请求
export interface BatchNotificationRequest {
  notificationIds: string[]
  action: 'mark_read' | 'mark_unread' | 'delete'
}

// 通知模板
export interface NotificationTemplate {
  id: string
  name: string
  type: NotificationType
  title: string
  content: string
  variables: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// 通知设置
export interface NotificationSettings {
  userId: string
  emailNotifications: boolean
  pushNotifications: boolean
  notificationTypes: {
    [key in NotificationType]: boolean
  }
  quietHours: {
    enabled: boolean
    startTime: string
    endTime: string
  }
  updatedAt: Date
}
