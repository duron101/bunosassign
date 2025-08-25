import request from '@/utils/request'

export interface Employee {
  id: number
  employeeNo: string
  name: string
  departmentId: string
  positionId: string
  annualSalary: number
  entryDate: string
  phone?: string
  email?: string
  idCard?: string
  emergencyContact?: string
  emergencyPhone?: string
  address?: string
  status: number
  resignDate?: string
  resignReason?: string
  handoverStatus?: string
  userId?: number
  Department?: {
    id: number
    name: string
    code: string
  }
  Position?: {
    id: number
    name: string
    level: string
    benchmarkValue: number
  }
  createdAt: string
  updatedAt: string
}

export interface EmployeeQuery {
  page?: number
  pageSize?: number
  search?: string
  departmentId?: string
  positionId?: string
  status?: number
}

export interface EmployeeForm {
  employeeNo: string
  name: string
  departmentId: string
  positionId: string
  annualSalary: number
  entryDate: string
  phone?: string
  email?: string
  idCard?: string
  emergencyContact?: string
  emergencyPhone?: string
  address?: string
}

export interface TransferForm {
  departmentId?: string
  positionId?: string
  annualSalary?: number
  transferReason: string
  effectiveDate: string
}

export interface ResignForm {
  resignDate: string
  resignReason: string
  handoverStatus?: string
}

// 获取员工列表
export function getEmployees(params: EmployeeQuery) {
  return request({
    url: '/employees',
    method: 'get',
    params
  })
}

// 获取员工详情
export function getEmployee(id: number) {
  return request({
    url: `/employees/${id}`,
    method: 'get'
  })
}

// 获取可用员工列表（未关联用户的员工）
export function getAvailableEmployees(params?: {
  search?: string
  departmentId?: string
  positionId?: string
}) {
  return request({
    url: '/employees/available',
    method: 'get',
    params
  })
}

// 创建员工
export function createEmployee(data: EmployeeForm) {
  return request({
    url: '/employees',
    method: 'post',
    data
  })
}

// 更新员工
export function updateEmployee(id: number, data: Partial<EmployeeForm>) {
  return request({
    url: `/employees/${id}`,
    method: 'put',
    data
  })
}

// 删除员工
export function deleteEmployee(id: number) {
  return request({
    url: `/employees/${id}`,
    method: 'delete'
  })
}

// 批量操作员工
export function batchOperateEmployees(action: string, employeeIds: number[]) {
  return request({
    url: '/employees/batch',
    method: 'post',
    data: {
      action,
      employeeIds
    }
  })
}

// 员工转移
export function transferEmployee(id: number, data: TransferForm) {
  return request({
    url: `/employees/${id}/transfer`,
    method: 'post',
    data
  })
}

// 员工离职
export function resignEmployee(id: number, data: ResignForm) {
  return request({
    url: `/employees/${id}/resign`,
    method: 'post',
    data
  })
}

// 获取员工统计信息
export function getEmployeeStatistics() {
  return request({
    url: '/employees/statistics',
    method: 'get'
  })
}

// 导出API对象
export const employeeApi = {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  batchOperateEmployees,
  transferEmployee,
  resignEmployee,
  getEmployeeStatistics
}