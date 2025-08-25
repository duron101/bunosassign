export interface BusinessLine {
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
  profitTarget?: number
  kpiMetrics?: Array<{
    name: string
    target: number
    weight: number
  }>
  weight: number
  status: number
  departmentCount?: number
  employeeCount?: number
  createdBy?: number
  updatedBy?: number
  createdAt: string
  updatedAt: string
}

export interface BusinessLineCreateData {
  name: string
  code: string
  description?: string
  managerId?: string  // 改为string类型，匹配NeDB的_id格式
  profitTarget?: number
  kpiMetrics?: Array<{
    name: string
    target: number
    weight: number
  }>
}

export interface BusinessLineUpdateData extends Partial<BusinessLineCreateData> {
  status?: number
}

export interface BusinessLineListParams {
  page?: number
  pageSize?: number
  search?: string
  status?: number
}

export interface BusinessLineListResponse {
  businessLines: BusinessLine[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

export interface KpiMetric {
  name: string
  target: number
  weight: number
}

export interface BusinessLineStatistics {
  total: number
  active: number
  inactive: number
  totalDepartments: number
  totalEmployees: number
  avgWeight: number
}

export interface BusinessLinePerformance {
  businessLine: {
    id: number
    name: string
    code: string
    profitTarget: number
  }
  summary: {
    departmentCount: number
    employeeCount: number
    year: number
  }
  kpiMetrics: KpiMetric[]
}