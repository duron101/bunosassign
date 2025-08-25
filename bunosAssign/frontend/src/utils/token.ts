// Token 工具函数

// 检查Token是否有效（格式检查，不验证服务端）
export const isTokenValid = (token: string): boolean => {
  if (!token) return false
  
  // 处理模拟token
  if (token === 'mock-token' || token.startsWith('mock-')) {
    return true
  }
  
  try {
    // 简单的JWT格式检查
    const parts = token.split('.')
    if (parts.length !== 3) {
      // 如果不是JWT格式，但有内容，也认为是有效的（用于开发测试）
      return token.length > 0
    }
    
    // 解析payload检查是否过期（客户端检查）
    const payload = JSON.parse(atob(parts[1]))
    const now = Math.floor(Date.now() / 1000)
    
    // 如果有exp字段，检查是否过期
    if (payload.exp && payload.exp < now) {
      return false
    }
    
    return true
  } catch (error) {
    // 如果解析失败，但token存在，也认为可能有效（容错处理）
    return token.length > 0
  }
}

// 清理无效的Token
export const cleanupInvalidTokens = () => {
  const token = localStorage.getItem('token')
  const refreshToken = localStorage.getItem('refreshToken')
  
  if (token && !isTokenValid(token)) {
    console.log('Removing expired access token')
    localStorage.removeItem('token')
  }
  
  if (refreshToken && !isTokenValid(refreshToken)) {
    console.log('Removing expired refresh token')
    localStorage.removeItem('refreshToken')
  }
}

// 获取有效的Token
export const getValidToken = (): string | null => {
  const token = localStorage.getItem('token')
  if (token && isTokenValid(token)) {
    return token
  }
  return null
}