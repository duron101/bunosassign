import request from '@/utils/request'

export interface BonusPool {
  id: number
  period: string
  totalProfit: number
  poolRatio: number
  poolAmount: number
  reserveRatio: number
  specialRatio: number
  distributableAmount: number
  status: 'draft' | 'calculated' | 'allocated'
  createdAt: string
  updatedAt: string
}

export interface CreateBonusPoolParams {
  period: string
  totalProfit: number
  poolRatio: number
  reserveRatio?: number
  specialRatio?: number
  lineWeights?: Array<{
    lineId: number
    weight: number
  }>
}

export interface CalculationParams {
  poolId: number
  mode?: 'full' | 'department' | 'line'
  departments?: number[]
  businessLines?: number[]
  minScoreThreshold?: number
  simulation?: boolean
}

export interface CalculationResult {
  status: 'processing' | 'completed' | 'failed'
  summary: {
    totalEmployees: number
    totalBonus: number
    averageBonus: number
    maxBonus: number
    minBonus: number
  }
  lineStats: Array<{
    lineId: number
    lineName: string
    employees: number
    totalBonus: number
    averageBonus: number
  }>
}

// 获取奖金池列表
export function getBonusPools(params: {
  page?: number
  pageSize?: number
  status?: string
}) {
  return request({
    url: '/calculations/bonus-pools',
    method: 'get',
    params
  })
}

// 创建奖金池
export function createBonusPool(data: CreateBonusPoolParams) {
  return request({
    url: '/calculations/bonus-pools',
    method: 'post',
    data
  })
}

// 更新奖金池
export function updateBonusPool(id: number, data: Partial<CreateBonusPoolParams>) {
  return request({
    url: `/calculations/bonus-pools/${id}`,
    method: 'put',
    data
  })
}

// 删除奖金池
export function deleteBonusPool(id: number) {
  return request({
    url: `/calculations/bonus-pools/${id}`,
    method: 'delete'
  })
}

// 执行奖金计算
export function startCalculation(data: CalculationParams) {
  return request({
    url: '/calculations/bonus-calculations',
    method: 'post',
    data
  })
}

// 获取计算结果
export function getCalculationResult(taskId: string) {
  return request({
    url: `/calculations/bonus-calculations/${taskId}`,
    method: 'get'
  })
}

// 获取奖金池详情
export function getBonusPoolDetail(id: number) {
  return request({
    url: `/calculations/bonus-pools/${id}`,
    method: 'get'
  })
}

// 获取计算统计
export function getCalculationStatistics() {
  return request({
    url: '/calculations/bonus-calculations/statistics',
    method: 'get'
  })
}

// 导出计算结果
export function exportCalculationResult(poolId: number, format = 'excel') {
  return request({
    url: `/calculations/bonus-pools/${poolId}/export`,
    method: 'get',
    params: { format },
    responseType: 'blob'
  })
}

// 模拟计算
export function simulateCalculation(data: CalculationParams) {
  return request({
    url: '/calculations/bonus-calculations/simulate',
    method: 'post',
    data
  })
}

// 获取历史计算记录
export function getCalculationHistory(poolId: number) {
  return request({
    url: `/calculations/bonus-pools/${poolId}/calculations`,
    method: 'get'
  })
}

// 复制奖金池
export function copyBonusPool(id: number, newPeriod: string) {
  return request({
    url: `/calculations/bonus-pools/${id}/copy`,
    method: 'post',
    data: { newPeriod }
  })
}

// 获取可分配员工列表
export function getEligibleEmployees(poolId: number) {
  return request({
    url: `/calculations/bonus-pools/${poolId}/eligible-employees`,
    method: 'get'
  })
}

// 预览计算结果
export function previewCalculation(data: CalculationParams) {
  return request({
    url: '/calculations/bonus-calculations/preview',
    method: 'post',
    data
  })
}