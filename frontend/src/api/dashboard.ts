import request from '../utils/request'

/**
 * 驾驶舱API
 */

// 获取驾驶舱概览数据
export const getDashboardOverview = (params?: {
  startDate?: string
  endDate?: string
}) => {
  return request({
    url: '/dashboard/overview',
    method: 'GET',
    params
  })
}

// 获取趋势数据
export const getTrendData = (params?: {
  type?: 'total' | 'avg' | 'count'
  months?: number
}) => {
  return request({
    url: '/dashboard/trend',
    method: 'GET',
    params
  })
}

// 获取分布数据
export const getDistributionData = (params?: {
  type?: 'amount' | 'people'
}) => {
  return request({
    url: '/dashboard/distribution',
    method: 'GET',
    params
  })
}

// 驾驶舱数据类型定义
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

export interface DepartmentRanking {
  id: string
  name: string
  totalBonus: number
  employeeCount?: number
}

export interface BonusDistribution {
  ranges: Array<{
    min: number
    max: number
    count: number
  }>
  median: number
  giniCoefficient: number
  standardDeviation: number
}

export interface SystemActivity {
  id: number
  title: string
  description: string
  user: string
  timestamp: string
  type: 'success' | 'primary' | 'info' | 'warning' | 'danger'
}

export interface DashboardOverviewData {
  metrics: DashboardMetrics
  departmentRanking: DepartmentRanking[]
  bonusDistribution: BonusDistribution
  recentActivities: SystemActivity[]
}

export interface TrendDataPoint {
  period: string
  totalBonus: number
  avgBonus: number
  employeeCount: number
}

export interface DistributionDataPoint {
  name: string
  value: number
}