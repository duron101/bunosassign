import request from '@/utils/request'

// 岗位需求接口
export interface PositionRequirement {
  _id: string
  positionCode: string
  positionName: string
  basicRequirements: string[]
  skills: string[]
  experience: string[]
  careerPath: {
    nextLevel: string
    estimatedTime: string
    lateralMoves: string[]
    specializations: string[]
    growthAreas: string[]
  }
  salaryRange: {
    junior: string
    middle: string
    senior: string
    factors: string[]
  }
  createdAt: string
  updatedAt: string
}

// 获取所有岗位需求
export const getAllPositionRequirements = (): Promise<{
  code: number
  message: string
  data: PositionRequirement[]
}> => {
  return request.get('/position-requirements')
}

// 根据岗位代码获取岗位需求
export const getPositionRequirementsByCode = (positionCode: string): Promise<{
  code: number
  message: string
  data: PositionRequirement
}> => {
  return request.get(`/position-requirements/${positionCode}`)
}

// 根据岗位名称获取岗位需求
export const getPositionRequirementsByName = (positionName: string): Promise<{
  code: number
  message: string
  data: PositionRequirement
}> => {
  return request.get(`/position-requirements/name/${positionName}`)
}

// 岗位需求响应类型
export interface PositionRequirementsResponse {
  code: number
  message: string
  data: PositionRequirement | PositionRequirement[]
}
