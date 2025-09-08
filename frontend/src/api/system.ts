import request from '@/utils/request'

export interface SystemConfig {
  basic: {
    systemName: string
    companyName: string
    version: string
    timezone: string
    language: string
    fiscalYearStart: number
    bonusCycle: string
    currency: string
    decimalPlaces: number
  }
  bonus: {
    profitWeight: number
    positionWeight: number
    performanceWeight: number
    defaultPoolRatio: number
    reserveRatio: number
    specialRatio: number
    minBonusRatio: number
    maxBonusRatio: number
  }
  calculation: {
    defaultAlgorithm: string
    precision: number
    roundingRule: string
    enableConcurrent: boolean
    maxThreads: number
    batchSize: number
    timeout: number
    retryCount: number
    cacheStrategy: string
    cacheExpiry: number
  }
  notification: {
    email: {
      enabled: boolean
      smtpHost: string
      smtpPort: number
      senderEmail: string
      events: string[]
    }
    system: {
      enabled: boolean
      retentionDays: number
      maxCount: number
    }
  }
  security: {
    password: {
      minLength: number
      requirements: string[]
      expireDays: number
    }
    login: {
      maxFailures: number
      lockoutDuration: number
    }
    session: {
      timeout: number
      rememberMe: boolean
      singleSignOn: boolean
    }
    access: {
      enableWhitelist: boolean
      whitelist: string
    }
  }
}

export interface BusinessRule {
  id: number
  name: string
  category: string
  description: string
  conditions: Array<{
    field: string
    operator: string
    value: any
  }>
  actions: Array<{
    type: string
    parameters: any
  }>
  enabled: boolean
  priority: number
  createdAt: string
  updatedAt: string
}

export interface ApprovalWorkflow {
  id: number
  name: string
  description: string
  triggerType: string
  steps: Array<{
    stepId: number
    stepName: string
    approverType: 'user' | 'role' | 'department'
    approverIds: number[]
    isRequired: boolean
    timeoutHours: number
  }>
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface SystemLog {
  id: number
  level: 'info' | 'warn' | 'error' | 'debug'
  module: string
  action: string
  message: string
  userId?: number
  userName?: string
  ip: string
  userAgent: string
  timestamp: string
  details?: any
}

export interface SystemMetrics {
  cpu: {
    usage: number
    cores: number
  }
  memory: {
    used: number
    total: number
    usage: number
  }
  disk: {
    used: number
    total: number
    usage: number
  }
  database: {
    connections: number
    maxConnections: number
    slowQueries: number
  }
  api: {
    totalRequests: number
    avgResponseTime: number
    errorRate: number
  }
}

// 获取系统配置
export function getSystemConfig() {
  return request({
    url: '/api/system/config',
    method: 'get'
  })
}

// 更新系统配置
export function updateSystemConfig(config: Partial<SystemConfig>) {
  return request({
    url: '/api/system/config',
    method: 'put',
    data: config
  })
}

// 重置系统配置
export function resetSystemConfig() {
  return request({
    url: '/api/system/config/reset',
    method: 'post'
  })
}

// 验证系统配置
export function validateSystemConfig(config: Partial<SystemConfig>) {
  return request({
    url: '/api/system/config/validate',
    method: 'post',
    data: config
  })
}

// 导出系统配置
export function exportSystemConfig() {
  return request({
    url: '/api/system/config/export',
    method: 'get',
    responseType: 'blob'
  })
}

// 导入系统配置
export function importSystemConfig(file: File) {
  const formData = new FormData()
  formData.append('config', file)
  
  return request({
    url: '/api/system/config/import',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 获取业务规则列表
export function getBusinessRules(params?: {
  page?: number
  pageSize?: number
  category?: string
  enabled?: boolean
}) {
  return request({
    url: '/api/system/business-rules',
    method: 'get',
    params
  })
}

// 创建业务规则
export function createBusinessRule(data: Omit<BusinessRule, 'id' | 'createdAt' | 'updatedAt'>) {
  return request({
    url: '/api/system/business-rules',
    method: 'post',
    data
  })
}

// 更新业务规则
export function updateBusinessRule(id: number, data: Partial<BusinessRule>) {
  return request({
    url: `/api/system/business-rules/${id}`,
    method: 'put',
    data
  })
}

// 删除业务规则
export function deleteBusinessRule(id: number) {
  return request({
    url: `/api/system/business-rules/${id}`,
    method: 'delete'
  })
}

// 启用/禁用业务规则
export function toggleBusinessRule(id: number, enabled: boolean) {
  return request({
    url: `/api/system/business-rules/${id}/toggle`,
    method: 'post',
    data: { enabled }
  })
}

// 测试业务规则
export function testBusinessRule(id: number, testData: any) {
  return request({
    url: `/api/system/business-rules/${id}/test`,
    method: 'post',
    data: testData
  })
}

// 获取审批工作流列表
export function getApprovalWorkflows(params?: {
  page?: number
  pageSize?: number
  triggerType?: string
  enabled?: boolean
}) {
  return request({
    url: '/api/system/approval-workflows',
    method: 'get',
    params
  })
}

// 创建审批工作流
export function createApprovalWorkflow(data: Omit<ApprovalWorkflow, 'id' | 'createdAt' | 'updatedAt'>) {
  return request({
    url: '/api/system/approval-workflows',
    method: 'post',
    data
  })
}

// 更新审批工作流
export function updateApprovalWorkflow(id: number, data: Partial<ApprovalWorkflow>) {
  return request({
    url: `/api/system/approval-workflows/${id}`,
    method: 'put',
    data
  })
}

// 删除审批工作流
export function deleteApprovalWorkflow(id: number) {
  return request({
    url: `/api/system/approval-workflows/${id}`,
    method: 'delete'
  })
}

// 获取系统日志
export function getSystemLogs(params: {
  page?: number
  pageSize?: number
  level?: string
  module?: string
  startTime?: string
  endTime?: string
  keyword?: string
}) {
  return request({
    url: '/api/system/logs',
    method: 'get',
    params
  })
}

// 清理系统日志
export function clearSystemLogs(params: {
  beforeDate?: string
  level?: string
  module?: string
}) {
  return request({
    url: '/api/system/logs/clear',
    method: 'delete',
    data: params
  })
}

// 导出系统日志
export function exportSystemLogs(params: {
  startTime?: string
  endTime?: string
  level?: string
  module?: string
  format?: 'csv' | 'excel'
}) {
  return request({
    url: '/api/system/logs/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

// 获取系统监控指标
export function getSystemMetrics() {
  return request({
    url: '/api/system/metrics',
    method: 'get'
  })
}

// 获取系统健康状态
export function getSystemHealth() {
  return request({
    url: '/api/system/health',
    method: 'get'
  })
}

// 重启系统服务
export function restartSystemService(serviceName: string) {
  return request({
    url: `/api/system/services/${serviceName}/restart`,
    method: 'post'
  })
}

// 备份系统数据
export function backupSystemData() {
  return request({
    url: '/api/system/backup',
    method: 'post'
  })
}

// 获取备份列表
export function getBackupList() {
  return request({
    url: '/api/system/backups',
    method: 'get'
  })
}