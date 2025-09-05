// 项目状态枚举
export enum ProjectStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold'
}

// 项目优先级枚举
export enum ProjectPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// 项目状态标签映射
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  [ProjectStatus.PLANNING]: '规划中',
  [ProjectStatus.ACTIVE]: '进行中',
  [ProjectStatus.COMPLETED]: '已完成',
  [ProjectStatus.CANCELLED]: '已取消',
  [ProjectStatus.ON_HOLD]: '暂停'
}

// 项目优先级标签映射
export const PROJECT_PRIORITY_LABELS: Record<ProjectPriority, string> = {
  [ProjectPriority.LOW]: '低',
  [ProjectPriority.MEDIUM]: '中',
  [ProjectPriority.HIGH]: '高',
  [ProjectPriority.CRITICAL]: '紧急'
}

// 项目状态颜色映射
export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  [ProjectStatus.PLANNING]: 'info',
  [ProjectStatus.ACTIVE]: 'success',
  [ProjectStatus.COMPLETED]: 'primary',
  [ProjectStatus.CANCELLED]: 'danger',
  [ProjectStatus.ON_HOLD]: 'warning'
}

// 项目优先级颜色映射
export const PROJECT_PRIORITY_COLORS: Record<ProjectPriority, string> = {
  [ProjectPriority.LOW]: 'info',
  [ProjectPriority.MEDIUM]: 'warning',
  [ProjectPriority.HIGH]: 'danger',
  [ProjectPriority.CRITICAL]: 'danger'
}

// 项目接口定义
export interface Project {
  id: string  // 改为string类型，匹配NeDB的_id格式
  name: string
  code: string
  description?: string
  managerId?: string  // 改为string类型，匹配NeDB的_id格式
  Manager?: {
    id: string  // 改为string类型，匹配NeDB的_id格式
    name: string
    employeeNo: string
  }
  startDate?: string
  endDate?: string
  budget?: number
  profitTarget?: number
  status: ProjectStatus
  priority: ProjectPriority
  createdBy: number
  updatedBy?: number
  createdAt: string
  updatedAt: string
}

// 项目创建数据接口
export interface ProjectCreateData {
  name: string
  code: string
  description?: string
  managerId?: string  // 改为string类型，匹配NeDB的_id格式
  startDate?: string
  endDate?: string
  budget?: number
  profitTarget?: number
  priority?: ProjectPriority
}

// 项目更新数据接口
export interface ProjectUpdateData extends Partial<ProjectCreateData> {
  status?: ProjectStatus
}

// 项目列表查询参数
export interface ProjectListParams {
  page?: number
  pageSize?: number
  search?: string
  status?: ProjectStatus
  priority?: ProjectPriority
}

// 项目列表响应接口
export interface ProjectListResponse {
  projects: Project[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

// 权重配置接口
export interface WeightConfig {
  businessLineId: string
  businessLineName: string
  businessLineCode: string
  defaultWeight: number
  customWeight?: number
  isCustom: boolean
  effectiveWeight: number
  reason?: string
  effectiveDate?: string
  configId?: number
}

// 项目权重响应接口
export interface ProjectWeightsResponse {
  project: {
    id: string
    name: string
    code: string
  }
  weightConfig: WeightConfig[]
}

// 更新权重数据接口
export interface UpdateWeightsData {
  weights: Array<{
    businessLineId: string
    weight: number
  }>
  reason?: string
}

// 权重统计响应接口
export interface WeightStatisticsResponse {
  projectStats: Array<{
    status: ProjectStatus
    count: number
  }>
  customWeightCount: number
  lineWeightStats: Array<{
    businessLineId: string
    projectCount: number
    avgWeight: number
    BusinessLine: {
      name: string
      code: string
      weight: number
    }
  }>
}

// 项目表单接口
export interface ProjectForm {
  name: string
  code: string
  description?: string
  managerId?: string  // 改为string类型，匹配NeDB的_id格式
  startDate?: string
  endDate?: string
  budget?: number
  profitTarget?: number
  priority: ProjectPriority
}

// 项目统计接口
export interface ProjectStatistics {
  total: number
  planning: number
  active: number
  completed: number
  cancelled: number
  onHold: number
  totalBudget: number
  totalProfitTarget: number
}

// 项目协作相关接口扩展

// 项目申请状态枚举
export enum ProjectApplicationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn'
}

// 项目申请状态标签映射
export const PROJECT_APPLICATION_STATUS_LABELS: Record<ProjectApplicationStatus, string> = {
  [ProjectApplicationStatus.PENDING]: '待审批',
  [ProjectApplicationStatus.APPROVED]: '已批准',
  [ProjectApplicationStatus.REJECTED]: '已拒绝',
  [ProjectApplicationStatus.WITHDRAWN]: '已撤回'
}

// 项目申请状态颜色映射
export const PROJECT_APPLICATION_STATUS_COLORS: Record<ProjectApplicationStatus, string> = {
  [ProjectApplicationStatus.PENDING]: 'warning',
  [ProjectApplicationStatus.APPROVED]: 'success',
  [ProjectApplicationStatus.REJECTED]: 'danger',
  [ProjectApplicationStatus.WITHDRAWN]: 'info'
}

// 技能要求接口
export interface SkillRequirement {
  id?: string
  skill: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  required: boolean
  description?: string
}

// 团队成员角色接口
export interface TeamMemberRole {
  id: string
  employeeId: string
  employeeName: string
  employeeNo: string
  roleName: string
  contributionWeight?: number
  estimatedWorkload?: number
  allocationPercentage?: number
  reason?: string
}

// 项目需求接口
export interface ProjectRequirement {
  id?: string
  type: 'technical' | 'business' | 'quality'
  title: string
  description: string
  priority: ProjectPriority
  isMandatory: boolean
  acceptanceCriteria?: string[]
}

// 扩展的项目接口，包含协作字段
export interface ProjectWithCollaboration extends Project {
  workContent?: string
  bonusScale?: number
  skillRequirements?: SkillRequirement[]
  requirements?: ProjectRequirement[]
  teamSize?: {
    min: number
    max: number
  }
  applicationCount?: number
  approvedApplicationCount?: number
  isPublished?: boolean
  publishedAt?: string
}

// 项目发布数据接口
export interface ProjectPublishData extends ProjectCreateData {
  workContent?: string
  bonusScale?: number
  skillRequirements?: SkillRequirement[]
  requirements?: ProjectRequirement[]
  teamSize?: {
    min: number
    max: number
  }
}

// 团队申请接口
export interface TeamApplication {
  id: string
  projectId: string
  projectName?: string
  projectCode?: string
  applicantId: string
  applicantName?: string
  teamName: string
  teamDescription: string
  applicationReason: string
  estimatedCost?: number
  members: TeamMemberRole[]
  status: ProjectApplicationStatus
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  reviewComments?: string
  withdrawnAt?: string
  withdrawReason?: string
}

// 项目扩展表单接口
export interface ProjectCollaborationForm extends ProjectForm {
  workContent?: string
  bonusScale?: number
  skillRequirements?: SkillRequirement[]
  requirements?: ProjectRequirement[]
  teamSize?: {
    min: number
    max: number
  }
  isPublished?: boolean
}

// 申请历史查询参数
export interface ApplicationListParams {
  page?: number
  pageSize?: number
  projectName?: string
  status?: ProjectApplicationStatus
  applicantName?: string
}

// 申请历史响应接口
export interface ApplicationListResponse {
  applications: TeamApplication[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}