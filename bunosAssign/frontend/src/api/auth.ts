import request from '@/utils/request'

export interface LoginData {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  password: string
  realName: string
  email?: string
  phone?: string
  departmentId?: number
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

export interface RefreshTokenData {
  refreshToken: string
}

// 用户登录
export const login = (data: LoginData) => {
  return request({
    url: '/auth/login',
    method: 'post',
    data
  })
}

// 用户注册
export const register = (data: RegisterData) => {
  return request({
    url: '/auth/register',
    method: 'post',
    data
  })
}

// 获取当前用户信息
export const getCurrentUser = () => {
  return request({
    url: '/auth/me',
    method: 'get'
  })
}

// 获取当前用户信息（用于路由守卫）
export const getCurrentUserForRouter = () => {
  return request({
    url: '/auth/me',
    method: 'get'
  })
}

// 刷新令牌
export const refreshToken = (data: RefreshTokenData) => {
  return request({
    url: '/auth/refresh',
    method: 'post',
    data
  })
}

// 修改密码
export const changePassword = (data: ChangePasswordData) => {
  return request({
    url: '/auth/change-password',
    method: 'post',
    data
  })
}

// 用户登出
export const logout = () => {
  return request({
    url: '/auth/logout',
    method: 'post'
  })
}