import request from '@/utils/request'

export interface UserListParams {
  page?: number
  pageSize?: number
  search?: string
  roleId?: string // 改为字符串类型，与NeDB的_id字段一致
  departmentId?: string
  status?: number
}

export interface CreateUserData {
  username: string
  password: string
  realName: string
  email?: string | null
  phone?: string | null
  roleId: string // 改为字符串类型，与NeDB的_id字段一致
  departmentId?: string
}

export interface UpdateUserData {
  realName?: string
  email?: string
  phone?: string
  roleId?: string // 改为字符串类型，与NeDB的_id字段一致
  departmentId?: string
  status?: number
}

export interface ResetPasswordData {
  newPassword: string
}

export interface BatchOperationData {
  action: 'enable' | 'disable'
  userIds: string[]
}

// 获取用户列表
export const getUserList = (params: UserListParams) => {
  return request({
    url: '/users',
    method: 'get',
    params
  })
}

// 获取用户详情
export const getUserDetail = (id: string) => {
  return request({
    url: `/users/${id}`,
    method: 'get'
  })
}

// 创建用户
export const createUser = (data: CreateUserData) => {
  return request({
    url: '/users',
    method: 'post',
    data
  })
}

// 更新用户
export const updateUser = (id: string, data: UpdateUserData) => {
  return request({
    url: `/users/${id}`,
    method: 'put',
    data
  })
}

// 重置用户密码
export const resetUserPassword = (id: string, data: ResetPasswordData) => {
  return request({
    url: `/users/${id}/reset-password`,
    method: 'post',
    data
  })
}

// 删除用户
export const deleteUser = (id: string) => {
  return request({
    url: `/users/${id}`,
    method: 'delete'
  })
}

// 批量操作用户
export const batchOperateUsers = (data: BatchOperationData) => {
  return request({
    url: '/users/batch',
    method: 'post',
    data
  })
}