import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User } from '@/types/user'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const token = ref<string>('')
  const refreshToken = ref<string>('')
  const permissions = ref<string[]>([])
  const isInitialized = ref<boolean>(false)

  const setUser = (userData: User) => {
    // 避免重复设置相同的用户数据
    if (JSON.stringify(user.value) === JSON.stringify(userData)) {
      return
    }
    user.value = userData
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const setToken = (tokenValue: string) => {
    // 避免重复设置相同的token
    if (token.value === tokenValue) {
      return
    }
    token.value = tokenValue
    localStorage.setItem('token', tokenValue)
  }

  const setRefreshToken = (refreshTokenValue: string) => {
    // 避免重复设置相同的refreshToken
    if (refreshToken.value === refreshTokenValue) {
      return
    }
    refreshToken.value = refreshTokenValue
    localStorage.setItem('refreshToken', refreshTokenValue)
  }

  const setPermissions = (perms: string[]) => {
    // 避免重复设置相同的权限
    if (JSON.stringify(permissions.value) === JSON.stringify(perms)) {
      return
    }
    permissions.value = perms
    localStorage.setItem('permissions', JSON.stringify(perms))
  }

  const setLoginData = (data: {
    user: User
    token: string
    refreshToken: string
    permissions: string[]
  }) => {
    setUser(data.user)
    setToken(data.token)
    setRefreshToken(data.refreshToken)
    setPermissions(data.permissions)
    isInitialized.value = true
  }

  const logout = () => {
    user.value = null
    token.value = ''
    refreshToken.value = ''
    permissions.value = []
    isInitialized.value = false
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    localStorage.removeItem('permissions')
  }

  const hasPermission = (permission: string): boolean => {
    return permissions.value.includes(permission) || permissions.value.includes('*')
  }

  const hasAnyPermission = (requiredPermissions: string[]): boolean => {
    console.log('hasAnyPermission check:', {
      requiredPermissions,
      userPermissions: permissions.value,
      hasWildcard: permissions.value.includes('*'),
      result: permissions.value.includes('*') || requiredPermissions.some(permission => permissions.value.includes(permission))
    })
    
    if (permissions.value.includes('*')) return true
    return requiredPermissions.some(permission => permissions.value.includes(permission))
  }

  const initFromStorage = () => {
    // 避免重复初始化
    if (isInitialized.value) {
      console.log('User store already initialized, skipping...')
      return
    }

    const storedToken = localStorage.getItem('token')
    const storedRefreshToken = localStorage.getItem('refreshToken')
    const storedUser = localStorage.getItem('user')
    const storedPermissions = localStorage.getItem('permissions')
    
    if (storedToken) {
      token.value = storedToken
      
      // 恢复用户信息
      if (storedUser) {
        try {
          user.value = JSON.parse(storedUser)
        } catch (error) {
          console.error('Failed to parse stored user:', error)
          localStorage.removeItem('user')
        }
      }
      
      // 恢复权限信息
      if (storedPermissions) {
        try {
          permissions.value = JSON.parse(storedPermissions)
        } catch (error) {
          console.error('Failed to parse stored permissions:', error)
          localStorage.removeItem('permissions')
        }
      }
      
      // 如果是模拟token，自动设置模拟用户数据
      if (storedToken === 'mock-token' || storedToken.startsWith('mock-')) {
        if (!user.value) {
          setUser({
            id: 1,
            username: 'admin',
            realName: '系统管理员',
            email: 'admin@company.com',
            phone: '13800138000',
            roleId: 1,
            roleName: '超级管理员',
            departmentId: 1,
            departmentName: '技术部',
            status: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        }
        if (permissions.value.length === 0) {
          setPermissions(['*', 'employee:view', 'department:view', 'position:view', 'business-line:view', 'project:view', 'project_manager', 'admin', 'finance', 'hr', 'bonus:calculate', 'simulation:view', 'report:view', 'user:view', 'role:view', 'system:config'])
        }
      }
    }
    
    if (storedRefreshToken) {
      refreshToken.value = storedRefreshToken
    }

    isInitialized.value = true
    console.log('User store initialized from storage:', {
      hasToken: !!token.value,
      hasUser: !!user.value,
      hasPermissions: permissions.value.length > 0,
      isInitialized: isInitialized.value
    })
  }

  // 检查token是否有效
  const validateToken = (): boolean => {
    if (!token.value) return false
    
    try {
      // 对于模拟token，直接返回true
      if (token.value === 'mock-token' || token.value.startsWith('mock-')) {
        return true
      }
      
      // 对于真实token，检查是否过期
      const tokenData = JSON.parse(atob(token.value.split('.')[1]))
      const currentTime = Date.now() / 1000
      return tokenData.exp > currentTime
    } catch (error) {
      console.error('Token validation error:', error)
      return false
    }
  }

  const isLoggedIn = (): boolean => {
    return !!(token.value && user.value)
  }

  return {
    user,
    token,
    refreshToken,
    permissions,
    isInitialized,
    setUser,
    setToken,
    setRefreshToken,
    setPermissions,
    setLoginData,
    logout,
    hasPermission,
    hasAnyPermission,
    initFromStorage,
    isLoggedIn,
    validateToken
  }
})