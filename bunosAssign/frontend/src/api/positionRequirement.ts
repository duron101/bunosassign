import request from '@/utils/request'

export interface PositionRequirement {
  id: string
  positionId: string
  positionCode: string
  positionName: string
  businessLineId: string
  
  // 基础要求
  basicRequirements: {
    education: string
    experience: string
    age: string
    certificates: string[]
    major: string
  }
  
  // 专业技能
  professionalSkills: {
    simulationSkills: string[]
    aiSkills: string[]
    softwareSkills: string[]
    hardwareSkills: string[]
    tools: string[]
    languages: string[]
  }
  
  // 软技能要求
  softSkills: {
    communication: string
    teamwork: string
    problemSolving: string
    innovation: string
    learning: string
  }
  
  // 晋升条件
  promotionRequirements: {
    minExperience: string
    performanceLevel: string
    skillAssessment: string
    projectContribution: string
    trainingCompletion?: string
    businessImpact?: string
  }
  
  // 发展路径
  careerPath: {
    nextLevel: string
    lateralMoves: string[]
    specializations: string[]
    estimatedTime: string
    growthAreas: string[]
  }
  
  // 工作职责
  responsibilities: string[]
  
  // 薪资范围
  salaryRange?: {
    min: string
    max: string
    marketLevel: string
    performanceBonus: string
  }
  
  // 工作环境
  workEnvironment?: {
    workType: string
    location: string
    travel: string
    flexibility: string
  }
  
  // 审核状态
  approvalStatus: 'draft' | 'pending' | 'approved' | 'rejected'
  businessLineApprover?: string
  adminApprover?: string
  approvalComments?: string
  
  // 维护信息
  maintainer: string
  lastUpdated: string
  status: number
  createdAt: string
  updatedAt: string
}

export interface CreatePositionRequirementRequest {
  positionId: string
  positionCode: string
  positionName: string
  businessLineId: string
  basicRequirements: PositionRequirement['basicRequirements']
  professionalSkills: PositionRequirement['professionalSkills']
  softSkills: PositionRequirement['softSkills']
  promotionRequirements: PositionRequirement['promotionRequirements']
  careerPath: PositionRequirement['careerPath']
  responsibilities: string[]
  salaryRange?: PositionRequirement['salaryRange']
  workEnvironment?: PositionRequirement['workEnvironment']
}

export interface UpdatePositionRequirementRequest extends Partial<CreatePositionRequirementRequest> {
  approvalStatus?: PositionRequirement['approvalStatus']
  approvalComments?: string
}

export interface PositionRequirementQuery {
  page?: number
  pageSize?: number
  positionId?: string
  businessLineId?: string
  approvalStatus?: string
  search?: string
}

// 岗位要求API
export const positionRequirementApi = {
  /**
   * 获取岗位要求列表
   */
  getPositionRequirements: (params?: PositionRequirementQuery): Promise<{ data: any }> => {
    return request.get('/position-requirements', { params })
  },

  /**
   * 获取岗位要求详情
   */
  getPositionRequirement: (id: string): Promise<{ data: PositionRequirement }> => {
    return request.get(`/position-requirements/${id}`)
  },

  /**
   * 根据岗位ID获取岗位要求
   */
  getPositionRequirementByPositionId: (positionId: string): Promise<{ data: PositionRequirement }> => {
    return request.get(`/position-requirements/position/${positionId}`)
  },

  /**
   * 创建岗位要求
   */
  createPositionRequirement: (data: CreatePositionRequirementRequest): Promise<{ data: PositionRequirement }> => {
    return request.post('/position-requirements', data)
  },

  /**
   * 更新岗位要求
   */
  updatePositionRequirement: (id: string, data: UpdatePositionRequirementRequest): Promise<{ data: PositionRequirement }> => {
    return request.put(`/position-requirements/${id}`, data)
  },

  /**
   * 删除岗位要求
   */
  deletePositionRequirement: (id: string): Promise<{ data: null }> => {
    return request.delete(`/position-requirements/${id}`)
  },

  /**
   * 提交审核
   */
  submitForApproval: (id: string): Promise<{ data: PositionRequirement }> => {
    return request.post(`/position-requirements/${id}/submit`)
  },

  /**
   * 审核通过
   */
  approve: (id: string, comments?: string): Promise<{ data: PositionRequirement }> => {
    return request.post(`/position-requirements/${id}/approve`, { comments })
  },

  /**
   * 审核拒绝
   */
  reject: (id: string, comments: string): Promise<{ data: PositionRequirement }> => {
    return request.post(`/position-requirements/${id}/reject`, { comments })
  },

  /**
   * 批量操作
   */
  batchOperation: (action: string, ids: string[]): Promise<{ data: { updatedCount: number } }> => {
    return request.post('/position-requirements/batch', { action, ids })
  },

  /**
   * 获取审核状态统计
   */
  getApprovalStats: (): Promise<{ data: any }> => {
    return request.get('/position-requirements/approval-stats')
  },

  /**
   * 导出岗位要求
   */
  exportPositionRequirements: (params?: PositionRequirementQuery): Promise<{ data: any }> => {
    return request.get('/position-requirements/export', { params })
  },

  /**
   * 导入岗位要求
   */
  importPositionRequirements: (file: File): Promise<{ data: { importedCount: number, errors: any[] } }> => {
    const formData = new FormData()
    formData.append('file', file)
    return request.post('/position-requirements/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

export default positionRequirementApi
