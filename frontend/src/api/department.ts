import request from '@/utils/request'

export interface Department {
  id: number
  name: string
  code: string
  parentId: string | null
  businessLineId: string | null
  managerId: string | null
  status: number
  description?: string
  sort?: number
  employeeCount?: number
  BusinessLine?: {
    id: number
    name: string
  }
  businessLine?: {
    id: number
    name: string
  }
  Manager?: {
    id: number
    name: string
  }
  Parent?: {
    id: number
    name: string
  }
  createdAt: string
  updatedAt: string
}

export interface DepartmentQuery {
  page?: number
  pageSize?: number
  search?: string
  parentId?: string
  businessLineId?: string
  status?: number
}

export interface DepartmentForm {
  name: string
  code: string
  parentId?: string
  businessLineId?: string
  managerId?: string
  description?: string
}

// 获取部门列表
export function getDepartments(params?: DepartmentQuery) {
  return request({
    url: '/departments',
    method: 'get',
    params
  })
}

// 获取部门选项（用于下拉列表）
export function getDepartmentOptions(params?: { status?: number }) {
  return request({
    url: '/departments/options',
    method: 'get',
    params
  })
}

// 获取部门详情
export function getDepartment(id: number) {
  return request({
    url: `/departments/${id}`,
    method: 'get'
  })
}

// 创建部门
export function createDepartment(data: DepartmentForm) {
  return request({
    url: '/departments',
    method: 'post',
    data
  })
}

// 更新部门
export function updateDepartment(id: number, data: Partial<DepartmentForm>) {
  return request({
    url: `/departments/${id}`,
    method: 'put',
    data
  })
}

// 删除部门
export function deleteDepartment(id: number) {
  return request({
    url: `/departments/${id}`,
    method: 'delete'
  })
}

// 获取部门树形结构
export function getDepartmentTree() {
  return request({
    url: '/departments/tree',
    method: 'get'
  })
}

// 批量操作部门
export function batchOperateDepartments(action: string, departmentIds: number[]) {
  return request({
    url: '/departments/batch',
    method: 'post',
    data: {
      action,
      departmentIds
    }
  })
}

// 获取部门统计信息
export function getDepartmentStatistics() {
  return request({
    url: '/departments/statistics',
    method: 'get'
  })
}

// 导出API对象
export const departmentApi = {
  getDepartments,
  getDepartmentOptions,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentTree,
  batchOperateDepartments,
  getDepartmentStatistics
}