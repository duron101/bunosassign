import request from '@/utils/request'
import type {
  BusinessLine,
  BusinessLineCreateData,
  BusinessLineUpdateData,
  BusinessLineListParams,
  BusinessLineListResponse
} from '@/types/businessLine'

export interface BusinessLineQuery {
  page?: number
  pageSize?: number
  search?: string
  status?: number
}

export interface BusinessLineForm {
  name: string
  code: string
  weight: number
  description?: string
}

export const businessLineApi = {
  // 获取业务线列表
  getBusinessLines(params: BusinessLineListParams = {}) {
    return request.get<BusinessLineListResponse>('/business-lines', { params })
  },

  // 获取业务线详情
  getBusinessLine(id: string) {
    return request.get<BusinessLine>(`/business-lines/${id}`)
  },

  // 获取业务线绩效统计
  getPerformanceStats(id: string, year?: number) {
    return request.get(`/business-lines/${id}/performance`, {
      params: { year }
    })
  },

  // 创建业务线
  createBusinessLine(data: BusinessLineCreateData) {
    return request.post<BusinessLine>('/business-lines', data)
  },

  // 更新业务线
  updateBusinessLine(id: string, data: BusinessLineUpdateData) {
    return request.put<BusinessLine>(`/business-lines/${id}`, data)
  },

  // 删除业务线
  deleteBusinessLine(id: string) {
    return request.delete(`/business-lines/${id}`)
  },

  // 批量操作业务线
  batchBusinessLines(action: 'enable' | 'disable', businessLineIds: number[]) {
    return request.post('/business-lines/batch', {
      action,
      businessLineIds
    })
  },

  // 获取业务线权重配置
  getWeightConfigs(projectId?: number) {
    return request.get('/business-lines/weight-configs', {
      params: { projectId }
    })
  },

  // 更新业务线权重配置
  updateWeightConfigs(projectId: string, weights: Array<{ businessLineId: string; weight: number }>, reason?: string) {
    return request.put('/business-lines/weight-configs', {
      projectId,
      weights,
      reason
    })
  },

  // 获取项目权重配置
  getProjectWeights(projectId: string) {
    return request.get(`/projects/${projectId}/weights`)
  },

  // 更新项目权重配置
  updateProjectWeights(projectId: string, weights: Array<{ businessLineId: string; weight: number }>, reason?: string) {
    return request.put(`/projects/${projectId}/weights`, {
      weights,
      reason
    })
  }
}


// 兼容旧版本API
export function getBusinessLines(params?: BusinessLineQuery) {
  return businessLineApi.getBusinessLines(params)
}

export function getBusinessLine(id: string) {
  return businessLineApi.getBusinessLine(id)
}

export function createBusinessLine(data: BusinessLineForm) {
  return businessLineApi.createBusinessLine(data)
}

export function updateBusinessLine(id: string, data: Partial<BusinessLineForm>) {
  return businessLineApi.updateBusinessLine(id, data)
}

export function deleteBusinessLine(id: string) {
  return businessLineApi.deleteBusinessLine(id)
}

export function batchOperateBusinessLines(action: string, businessLineIds: number[]) {
  return businessLineApi.batchBusinessLines(action as 'enable' | 'disable', businessLineIds)
}

export function updateBusinessLineWeights(data: Array<{ id: string; weight: number }>) {
  // 兼容旧版本权重更新API
  return request({
    url: '/business-lines/weights',
    method: 'put',
    data: {
      businessLines: data
    }
  })
}

export function getBusinessLineStatistics() {
  return request({
    url: '/business-lines/statistics',
    method: 'get'
  })
}