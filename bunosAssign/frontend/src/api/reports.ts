import request from '@/utils/request'

export interface Report {
  id: number
  name: string
  category: 'bonus' | 'statistics' | 'custom'
  status: 'generating' | 'completed' | 'failed'
  size?: number
  createdBy: string
  createdAt: string
  updatedAt?: string
  description?: string
  downloadUrl?: string
}

export interface CreateReportParams {
  name: string
  category: string
  description?: string
  dateRange: string[]
  fields: string[]
  filters: {
    department?: string[]
    businessLine?: string[]
    minBonus?: number
    maxBonus?: number
  }
  format: 'excel' | 'pdf' | 'csv'
}

export interface ReportTemplate {
  id: number
  name: string
  description: string
  type: string
  category: string
  fields: string[]
  defaultFilters?: any
}

export interface PersonalBonusQuery {
  period: string
  employeeId?: string
  employeeName?: string
}

export interface PersonalBonusInfo {
  employeeId: string
  employeeName: string
  department: string
  position: string
  businessLine: string
  totalBonus: number
  baseBonus: number
  performanceBonus: number
  totalScore: number
  bonusRatio: number
  baseAmount: number
  calculationDetails: Array<{
    dimension: string
    score: number
    weight: number
    weightedScore: number
    amount: number
    description: string
  }>
  compared: {
    monthlyGrowth: number
    yearlyGrowth: number
    departmentRanking: number
    companyRanking: number
  }
  insights: Array<{
    id: number
    type: 'success' | 'info' | 'warning'
    text: string
  }>
}

export interface DashboardMetrics {
  totalBonus: number
  avgBonus: number
  utilizationRate: number
  totalEmployees: number
  bonusGrowth: number
  avgGrowth: number
  utilizationChange: number
  employeeGrowth: number
}

// 获取报表列表
export function getReports(params: {
  page?: number
  pageSize?: number
  category?: string
  status?: string
  search?: string
}) {
  return request({
    url: '/api/reports',
    method: 'get',
    params
  })
}

// 创建报表
export function createReport(data: CreateReportParams) {
  return request({
    url: '/api/reports',
    method: 'post',
    data
  })
}

// 删除报表
export function deleteReport(id: number) {
  return request({
    url: `/api/reports/${id}`,
    method: 'delete'
  })
}

// 下载报表
export function downloadReport(id: number) {
  return request({
    url: `/api/reports/${id}/download`,
    method: 'get',
    responseType: 'blob'
  })
}

// 预览报表
export function previewReport(id: number) {
  return request({
    url: `/api/reports/${id}/preview`,
    method: 'get'
  })
}

// 重新生成报表
export function regenerateReport(id: number) {
  return request({
    url: `/api/reports/${id}/regenerate`,
    method: 'post'
  })
}

// 获取报表模板
export function getReportTemplates() {
  return request({
    url: '/api/reports/templates',
    method: 'get'
  })
}

// 使用模板创建报表
export function createReportFromTemplate(templateId: number, params: any) {
  return request({
    url: `/api/reports/templates/${templateId}/generate`,
    method: 'post',
    data: params
  })
}

// 查询个人奖金信息
export function queryPersonalBonus(params: PersonalBonusQuery) {
  return request({
    url: '/api/reports/personal-bonus',
    method: 'get',
    params
  })
}

// 导出个人奖金报告
export function exportPersonalBonusReport(params: PersonalBonusQuery & {
  format: 'pdf' | 'excel'
  content: string[]
}) {
  return request({
    url: '/api/reports/personal-bonus/export',
    method: 'post',
    data: params,
    responseType: 'blob'
  })
}

// 获取仪表盘数据
export function getDashboardMetrics(params?: {
  dateRange?: string[]
}) {
  return request({
    url: '/api/dashboard/metrics',
    method: 'get',
    params
  })
}

// 获取趋势数据
export function getTrendData(params: {
  type: 'total' | 'avg' | 'count'
  period: string
}) {
  return request({
    url: '/api/dashboard/trend',
    method: 'get',
    params
  })
}

// 获取分布数据
export function getDistributionData(params: {
  type: 'amount' | 'people'
  period: string
}) {
  return request({
    url: '/api/dashboard/distribution',
    method: 'get',
    params
  })
}

// 获取部门排行
export function getDepartmentRanking(params?: {
  period?: string
  limit?: number
}) {
  return request({
    url: '/api/dashboard/department-ranking',
    method: 'get',
    params
  })
}

// 获取奖金分布统计
export function getBonusDistribution(params?: {
  period?: string
}) {
  return request({
    url: '/api/dashboard/bonus-distribution',
    method: 'get',
    params
  })
}

// 获取系统动态
export function getSystemActivities(params?: {
  limit?: number
}) {
  return request({
    url: '/api/dashboard/activities',
    method: 'get',
    params
  })
}

// 获取员工历史奖金数据
export function getEmployeeBonusHistory(employeeId: string, params?: {
  months?: number
}) {
  return request({
    url: `/api/reports/employees/${employeeId}/bonus-history`,
    method: 'get',
    params
  })
}

// 获取员工绩效雷达图数据
export function getEmployeePerformanceRadar(employeeId: string, period: string) {
  return request({
    url: `/api/reports/employees/${employeeId}/performance-radar`,
    method: 'get',
    params: { period }
  })
}