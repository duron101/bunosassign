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
    console.log('🔐 权限检查详情:', {
      requiredPermissions,
      userPermissions: permissions.value,
      hasWildcard: permissions.value.includes('*'),
      userInfo: user.value,
      token: token.value
    })
    
    if (permissions.value.includes('*')) {
      console.log('✅ 用户拥有通配符权限 *')
      return true
    }
    
    const hasRequiredPermission = requiredPermissions.some(permission => permissions.value.includes(permission))
    console.log('🔍 权限检查结果:', {
      hasRequiredPermission,
      matchedPermissions: requiredPermissions.filter(permission => permissions.value.includes(permission))
    })
    
    return hasRequiredPermission
  }

  const initFromStorage = () => {
    // 避免重复初始化
    if (isInitialized.value) {
      console.log('🔄 User store already initialized, skipping...')
      return
    }

    console.log('🔄 Initializing user store from localStorage...')
    
    const storedToken = localStorage.getItem('token')
    const storedRefreshToken = localStorage.getItem('refreshToken')
    const storedUser = localStorage.getItem('user')
    const storedPermissions = localStorage.getItem('permissions')
    
    // 检查token有效性
    if (storedToken && validateStoredToken(storedToken)) {
      token.value = storedToken
      
      // 恢复用户信息
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          user.value = parsedUser
          console.log('✅ User data restored from storage')
        } catch (error) {
          console.error('❌ Failed to parse stored user:', error)
          localStorage.removeItem('user')
        }
      }
      
      // 恢复权限信息
      if (storedPermissions) {
        try {
          const parsedPermissions = JSON.parse(storedPermissions)
          if (Array.isArray(parsedPermissions)) {
            permissions.value = parsedPermissions
            console.log('✅ Permissions restored from storage')
          }
        } catch (error) {
          console.error('❌ Failed to parse stored permissions:', error)
          localStorage.removeItem('permissions')
        }
      }
    } else if (storedToken) {
      // Token无效，清理所有相关数据
      console.log('❌ Invalid token found, cleaning up storage')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('permissions')
    }
    
    if (storedRefreshToken && validateStoredToken(storedRefreshToken)) {
      refreshToken.value = storedRefreshToken
    } else if (storedRefreshToken) {
      localStorage.removeItem('refreshToken')
    }

    isInitialized.value = true
    console.log('🔄 User store initialization complete:', {
      hasToken: !!token.value,
      hasUser: !!user.value,
      hasPermissions: permissions.value.length > 0,
      isInitialized: isInitialized.value
    })
  }
  
  // 验证存储的token格式
  const validateStoredToken = (tokenStr: string): boolean => {
    if (!tokenStr) return false
    
    try {
      const parts = tokenStr.split('.')
      if (parts.length !== 3) return false
      
      const payload = JSON.parse(atob(parts[1]))
      const now = Math.floor(Date.now() / 1000)
      
      // 检查是否过期（允许5分钟缓冲）
      if (payload.exp && payload.exp < (now - 300)) {
        console.log('❌ Token expired:', { exp: payload.exp, now })
        return false
      }
      
      return true
    } catch (error) {
      console.error('❌ Token validation failed:', error)
      return false
    }
  }

  // 检查token是否有效
  const validateToken = (): boolean => {
    return validateStoredToken(token.value)
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
    validateToken,
    validateStoredToken
  }
})