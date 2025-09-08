import request from '@/utils/request'

export interface ProjectCost {
  _id?: string
  projectId: string
  costType: '人力成本' | '材料成本' | '其他成本'
  amount: number
  description: string
  date: string
  recordedBy: string
  status: 'pending' | 'confirmed' | 'rejected'
  createdAt?: string
  updatedAt?: string
}

export interface ProjectCostSummary {
  _id?: string
  projectId: string
  totalBudget: number
  totalCost: number
  currentProfit: number
  expectedProfit: number
  bonusRatio: number
  estimatedBonus: number
  lastUpdated: string
}

export interface ProjectCostQuery {
  projectId?: string
  costType?: string
  page?: number
  pageSize?: number
}

export interface ProjectCostResponse {
  costs: ProjectCost[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export const projectCostApi = {
  // 创建项目成本记录
  createCost: (data: Omit<ProjectCost, '_id' | 'createdAt' | 'updatedAt'>) => {
    return request.post<ProjectCost>('/project-costs', data)
  },

  // 获取项目成本列表
  getCosts: (params?: ProjectCostQuery) => {
    return request.get<ProjectCostResponse>('/project-costs', { params })
  },

  // 根据ID获取成本记录
  getCostById: (costId: string) => {
    return request.get<ProjectCost>(`/project-costs/${costId}`)
  },

  // 更新成本记录
  updateCost: (costId: string, data: Partial<ProjectCost>) => {
    return request.put<ProjectCost>(`/project-costs/${costId}`, data)
  },

  // 删除成本记录
  deleteCost: (costId: string) => {
    return request.delete(`/project-costs/${costId}`)
  },

  // 获取项目成本汇总
  getProjectCostSummary: (projectId: string) => {
    return request.get<ProjectCostSummary>(`/project-costs/project/${projectId}/summary`)
  },

  // 获取所有项目的成本汇总
  getAllProjectCostSummaries: () => {
    return request.get<ProjectCostSummary[]>('/project-costs/summary/all')
  }
}
