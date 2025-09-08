import request from '@/utils/request'

export interface SimulationParams {
  bonusPoolId: number
  totalProfit: number
  poolRatio: number
  lineWeights: Record<number, number>
  minBonusRatio: number
  maxBonusRatio: number
}

export interface SimulationResult {
  totalBonusChange: number
  avgBonusChange: number
  affectedEmployees: number
  lineComparison: Array<{
    lineName: string
    currentBonus: number
    simulatedBonus: number
    change: number
    changAmount: number
  }>
}

export interface SimulationScenario {
  id: number
  name: string
  description: string
  basePoolId?: number
  parameters?: any
  isPublic: boolean
  totalBonus: number
  avgBonus: number
  utilizationRate: number
  createdAt: string
  createdBy?: number
}

export interface SensitivityParams {
  bonusPoolId: number
  parameter: string
  range: string
  step: string
}

export interface SensitivityResult {
  parameter: string
  range: number
  step: number
  data: Array<{
    changeRatio: number
    parameter: number
    impact: number
  }>
  mostSensitive: {
    metric: string
    coefficient: number
  }
  recommendedRange: string
  riskLevel: string
}

export interface HistoryAnalysisData {
  metric: string
  periods: string[]
  values: number[]
  avgGrowthRate: number
  maxVolatility: number
  trendPrediction: number
}

// 运行参数模拟
export function runParameterSimulation(data: SimulationParams) {
  return request({
    url: '/simulations/parameter-simulation',
    method: 'post',
    data
  })
}

// 保存模拟场景
export function saveSimulationScenario(data: {
  name: string
  description: string
  basePoolId?: number
  parameters?: any
  isPublic?: boolean
}) {
  return request({
    url: '/simulations/scenarios',
    method: 'post',
    data
  })
}

// 获取模拟场景列表
export function getSimulationScenarios(params: {
  page?: number
  pageSize?: number
  isPublic?: boolean
}) {
  return request({
    url: '/simulations/scenarios',
    method: 'get',
    params
  })
}

// 删除模拟场景
export function deleteSimulationScenario(id: number) {
  return request({
    url: `/simulations/scenarios/${id}`,
    method: 'delete'
  })
}

// 运行敏感性分析
export function runSensitivityAnalysis(data: SensitivityParams) {
  return request({
    url: '/simulations/sensitivity-analysis',
    method: 'post',
    data
  })
}

// 获取历史分析数据
export function getHistoryAnalysis(params: {
  dateRange: string[]
  metric?: string
}) {
  return request({
    url: '/simulations/history-analysis',
    method: 'get',
    params: {
      dateRange: params.dateRange.join(','),
      metric: params.metric
    }
  })
}

// 导出模拟结果
export function exportSimulationResult(scenarioId: number, format = 'excel') {
  return request({
    url: `/simulations/scenarios/${scenarioId}/export`,
    method: 'get',
    params: { format },
    responseType: 'blob'
  })
}

// 复制模拟场景
export function copySimulationScenario(id: number, newName: string) {
  return request({
    url: `/simulations/scenarios/${id}/copy`,
    method: 'post',
    data: { newName }
  })
}