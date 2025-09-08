import request from '@/utils/request'

// 获取奖金池列表
export function getBonusPools(params?: {
  projectId?: string
  period?: string
  status?: string
}) {
  return request({
    url: '/project-bonus/pools',
    method: 'get',
    params
  })
}

// 获取单个奖金池详情
export function getBonusPoolDetail(poolId: string) {
  return request({
    url: `/project-bonus/pools/${poolId}`,
    method: 'get'
  })
}

// 创建奖金池
export function createBonusPool(data: {
  projectId: string
  period: string
  totalAmount: number
  profitRatio?: number
}) {
  return request({
    url: '/project-bonus/pools',
    method: 'post',
    data
  })
}

// 编辑奖金池
export function updateBonusPool(poolId: string, data: {
  totalAmount?: number
  profitRatio?: number
  description?: string
}) {
  return request({
    url: `/project-bonus/pools/${poolId}`,
    method: 'put',
    data
  })
}

// 删除奖金池
export function deleteBonusPool(poolId: string) {
  return request({
    url: `/project-bonus/pools/${poolId}`,
    method: 'delete'
  })
}

// 计算奖金分配
export function calculateBonus(poolId: string) {
  return request({
    url: `/project-bonus/pools/${poolId}/calculate`,
    method: 'post'
  })
}

// 审批奖金分配
export function approveBonus(poolId: string) {
  return request({
    url: `/project-bonus/pools/${poolId}/approve`,
    method: 'post'
  })
}

// 获取项目角色权重
export function getRoleWeights(projectId: string) {
  return request({
    url: `/project-bonus/projects/${projectId}/role-weights`,
    method: 'get'
  })
}

// 设置项目角色权重
export function setRoleWeights(projectId: string, weights: Record<string, number>) {
  return request({
    url: `/project-bonus/projects/${projectId}/role-weights`,
    method: 'put',
    data: { weights }
  })
}

// 获取项目奖金分配详情
export function getBonusDetails(projectId: string, period: string) {
  return request({
    url: `/project-bonus/projects/${projectId}/periods/${period}`,
    method: 'get'
  })
}