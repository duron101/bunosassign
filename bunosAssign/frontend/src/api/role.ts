import request from '@/utils/request'

export interface RoleListParams {
  page?: number
  pageSize?: number
  search?: string
  status?: number
}

export interface CreateRoleData {
  name: string
  description?: string
  permissions: string[]
}

export interface UpdateRoleData {
  name?: string
  description?: string
  permissions?: string[]
  status?: number
}

export interface BatchRoleOperationData {
  action: 'enable' | 'disable'
  roleIds: number[]
}

// 获取权限列表
export const getPermissions = () => {
  return request({
    url: '/roles/permissions',
    method: 'get'
  })
}

// 获取角色列表
export const getRoleList = (params: RoleListParams) => {
  return request({
    url: '/roles',
    method: 'get',
    params
  })
}

// 获取角色详情
export const getRoleDetail = (id: number) => {
  return request({
    url: `/roles/${id}`,
    method: 'get'
  })
}

// 创建角色
export const createRole = (data: CreateRoleData) => {
  return request({
    url: '/roles',
    method: 'post',
    data
  })
}

// 更新角色
export const updateRole = (id: number, data: UpdateRoleData) => {
  return request({
    url: `/roles/${id}`,
    method: 'put',
    data
  })
}

// 删除角色
export const deleteRole = (id: number) => {
  return request({
    url: `/roles/${id}`,
    method: 'delete'
  })
}

// 批量操作角色
export const batchOperateRoles = (data: BatchRoleOperationData) => {
  return request({
    url: '/roles/batch',
    method: 'post',
    data
  })
}