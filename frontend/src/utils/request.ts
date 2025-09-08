import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
import { refreshToken } from '@/api/auth'

// API响应接口
export interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
}

// 创建axios实例
const service: AxiosInstance = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
})

// 是否正在刷新token
let isRefreshing = false
// 重试队列
let requestQueue: Array<(token: string) => void> = []
// 是否正在登出
let isLoggingOut = false
// 最后一次显示登录过期提示的时间
let lastLoginExpiredTime = 0
// 当前是否已经在处理登录过期（防抖）
let isHandlingExpiredLogin = false

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const responseData = response.data
    
    // 处理不同的响应格式
    if (responseData && typeof responseData === 'object') {
      // 如果有code字段，按照统一格式处理
      if ('code' in responseData) {
        const { code, data, message } = responseData
        if (code === 200 || code === 201) {
          return responseData
        } else {
          const errorMessage = message || '请求失败'
          ElMessage.error(errorMessage)
          return Promise.reject(new Error(errorMessage))
        }
      }
      // 如果没有code字段，直接返回data（兼容旧格式）
      return { code: 200, data: responseData, message: 'success' }
    }
    
    // 其他情况，直接返回
    return { code: 200, data: responseData, message: 'success' }
  },
  async (error) => {
    console.error('Response error:', error)
    
    const originalRequest = error.config
    const { response } = error
    
    // token过期处理
    if (response?.status === 401 && !originalRequest._retry) {
      // 标记请求已重试，避免无限循环
      originalRequest._retry = true
      if (!isRefreshing) {
        isRefreshing = true
        
        const refreshTokenValue = localStorage.getItem('refreshToken')
        if (!refreshTokenValue) {
          // 没有刷新token，直接登出
          if (!isLoggingOut) {
            const isSilent = originalRequest.headers?.['X-Silent-Auth'] === 'true'
            handleLogout(isSilent)
          }
          return Promise.reject(error)
        }
        
        try {
          const res = await refreshToken({ refreshToken: refreshTokenValue })
          
          // 检查刷新token响应格式
          let newToken: string, newRefreshToken: string
          if (res.data && typeof res.data === 'object') {
            if ('token' in res.data) {
              newToken = res.data.token
              newRefreshToken = res.data.refreshToken || refreshTokenValue
            } else {
              newToken = res.data.accessToken || res.data.access_token
              newRefreshToken = res.data.refreshToken || res.data.refresh_token || refreshTokenValue
            }
          } else {
            throw new Error('Invalid refresh token response format')
          }
          
          // 更新token
          localStorage.setItem('token', newToken)
          localStorage.setItem('refreshToken', newRefreshToken)
          
          // 更新请求头
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          
          // 处理重试队列
          requestQueue.forEach(callback => callback(newToken))
          requestQueue = []
          
          isRefreshing = false
          
          // 重试原请求
          return service(originalRequest)
        } catch (refreshError) {
          // 刷新token失败，登出
          isRefreshing = false
          requestQueue = []
          if (!isLoggingOut) {
            const isSilent = originalRequest.headers?.['X-Silent-Auth'] === 'true'
            handleLogout(isSilent)
          }
          return Promise.reject(refreshError)
        }
      } else {
        // 正在刷新token，将请求加入队列
        return new Promise(resolve => {
          requestQueue.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(service(originalRequest))
          })
        })
      }
    } else if (response?.status === 401) {
      // 其他401错误，直接登出
      if (!isLoggingOut) {
        const isSilent = error.config?.headers?.['X-Silent-Auth'] === 'true'
        handleLogout(isSilent)
      }
    } else if (response?.status === 403) {
      ElMessage.error('权限不足')
    } else if (response?.status >= 500) {
      ElMessage.error('服务器错误，请稍后重试')
    } else if (response?.status === 404) {
      ElMessage.error('请求的资源不存在')
    } else if (response?.status === 400) {
      ElMessage.error(response?.data?.message || '请求参数错误')
    } else {
      ElMessage.error(response?.data?.message || error.message || '网络错误')
    }
    
    return Promise.reject(error)
  }
)

// 处理登出
const handleLogout = (isSilent = false) => {
  if (isLoggingOut || isHandlingExpiredLogin) return  // 防止重复执行
 
  isHandlingExpiredLogin = true
  isLoggingOut = true
  
  const userStore = useUserStore()
  
  // 避免重复提示（5秒内只显示一次，并且只在非静默模式下显示）
  const now = Date.now()
  const shouldShowMessage = !isSilent && (now - lastLoginExpiredTime > 5000)
  
  // 清除用户状态
  console.log('handleLogout called: Clearing user state...')
  userStore.logout()
  
  if (shouldShowMessage) {
    ElMessage.warning('登录已过期，请重新登录')
    lastLoginExpiredTime = now
  }
  
  // 检查当前是否已经在登录页面
  const currentPath = window.location.pathname
  const isOnLoginPage = currentPath === '/login' || currentPath.includes('/login')
  
  if (!isOnLoginPage) {
    console.log('handleLogout called: Redirecting to login...')
    
    // 直接跳转到登录页面
    try {
      import('@/router').then(({ default: router }) => {
        router.replace('/login')
      }).catch(() => {
        window.location.href = '/login'
      })
    } catch (error) {
      console.error('Router navigation failed:', error)
      window.location.href = '/login'
    }
  }
  
  // 重置状态
  isLoggingOut = false
  isHandlingExpiredLogin = false
}

export default service