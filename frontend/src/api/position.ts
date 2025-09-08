import request from '@/utils/request'

export interface Position {
  id?: number
  _id?: string
  name: string
  code: string
  level: string
  benchmarkValue: number
  lineId: number | null
  businessLineId?: string | number
  description?: string
  status: number
  businessLine?: {
    id: string | number
    name: string
    code: string
  }
  // 新增字段
  coreSkills?: string[]
  careerPath?: {
    nextLevel: string
    lateralMoves: string[]
    specializations: string[]
    estimatedTime: string
    growthAreas: string[]
  }
  isComprehensive?: boolean
  isMarket?: boolean
  workEnvironment?: {
    travel?: string
    workType?: string
  }
  createdAt: string
  updatedAt: string
}

export interface PositionQuery {
  page?: number
  pageSize?: number
  search?: string
  level?: string
  lineId?: number
  status?: number
}

export interface PositionForm {
  name: string
  code: string
  level: string
  benchmarkValue: number
  lineId?: number
  businessLineId?: string | number
  description?: string
  coreSkills?: string[]
  careerPath?: {
    nextLevel: string
    estimatedTime: string
  }
}

// 获取岗位列表
export function getPositions(params?: PositionQuery) {
  return request({
    url: '/positions',
    method: 'get',
    params
  })
}

// 获取岗位详情
export function getPosition(id: string | number) {
  return request({
    url: `/positions/${id}`,
    method: 'get'
  })
}

// 创建岗位
export function createPosition(data: PositionForm) {
  return request({
    url: '/positions',
    method: 'post',
    data
  })
}

// 更新岗位
export function updatePosition(id: string | number, data: Partial<PositionForm>) {
  return request({
    url: `/positions/${id}`,
    method: 'put',
    data
  })
}

// 删除岗位
export function deletePosition(id: string | number) {
  return request({
    url: `/positions/${id}`,
    method: 'delete'
  })
}

// 批量操作岗位
export function batchOperatePositions(action: string, positionIds: (string | number)[]) {
  return request({
    url: '/positions/batch',
    method: 'post',
    data: {
      action,
      positionIds
    }
  })
}

// 批量更新基准值
export function batchUpdateBenchmarkValues(data: Array<{ id: string | number; benchmarkValue: number }>) {
  console.log('🔍 发送的基准值更新数据:', data)
  return request({
    url: '/positions/benchmark-values',
    method: 'put',
    data: {
      positions: data
    }
  })
}

// 基准值影响说明
export interface BenchmarkValueImpact {
  value: number
  description: string
  bonusMultiplier: number
  examples: string[]
}

// 获取基准值影响说明
export function getBenchmarkValueImpact(benchmarkValue: number): BenchmarkValueImpact {
  if (benchmarkValue >= 1.8) {
    return {
      value: benchmarkValue,
      description: '高价值岗位',
      bonusMultiplier: 1.8,
      examples: ['技术专家', '高级管理', '核心业务负责人']
    }
  } else if (benchmarkValue >= 1.4) {
    return {
      value: benchmarkValue,
      description: '中高价值岗位',
      bonusMultiplier: 1.4,
      examples: ['技术骨干', '中级管理', '业务专家']
    }
  } else if (benchmarkValue >= 1.0) {
    return {
      value: benchmarkValue,
      description: '标准价值岗位',
      bonusMultiplier: 1.0,
      examples: ['普通技术', '初级管理', '业务专员']
    }
  } else {
    return {
      value: benchmarkValue,
      description: '基础价值岗位',
      bonusMultiplier: 0.8,
      examples: ['助理岗位', '实习生', '基础支持']
    }
  }
}

// 获取岗位统计信息
export function getPositionStatistics() {
  return request({
    url: '/positions/statistics',
    method: 'get'
  })
}

// 批量更新岗位
export function batchUpdatePositions(data: {
  positionIds: (string | number)[]
  updateType: 'requirements' | 'skills' | 'careerPath'
  updateData: any
}) {
  return request({
    url: '/positions/batch-update',
    method: 'put',
    data
  })
}

// 导出API对象
export const positionApi = {
  getPositions,
  getPosition,
  createPosition,
  updatePosition,
  deletePosition,
  batchOperatePositions,
  batchUpdateBenchmarkValues,
  getPositionStatistics,
  batchUpdatePositions
}