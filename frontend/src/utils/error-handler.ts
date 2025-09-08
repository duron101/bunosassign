import { ElMessage } from 'element-plus'

// API错误类型
export interface ApiError {
  response?: {
    status: number
    data?: {
      message?: string
      code?: number
    }
  }
  message?: string
}

// 判断是否是认证相关错误
export const isAuthError = (error: ApiError): boolean => {
  if (!error?.response) return false
  
  // HTTP状态码401
  if (error.response.status === 401) return true
  
  // 检查错误消息中的关键词
  const message = error.response.data?.message || ''
  const authKeywords = [
    '过期', 'expired', '令牌', 'token', 
    '登录', 'login', '认证', 'auth', 
    '未授权', 'unauthorized', '身份', 'identity',
    '访问令牌', 'access_token', '刷新令牌', 'refresh_token'
  ]
  
  return authKeywords.some(keyword => 
    message.toLowerCase().includes(keyword.toLowerCase())
  )
}

// 判断是否是权限相关错误  
export const isPermissionError = (error: ApiError): boolean => {
  return error.response?.status === 403
}

// 处理API错误（用于组件中）
export const handleApiError = (error: ApiError, defaultMessage: string = '操作失败', options: {
  showMessage?: boolean
  logError?: boolean
  silent?: boolean
} = {}) => {
  const { showMessage = true, logError = true, silent = false } = options

  if (logError) {
    console.error('API Error:', error)
  }

  // 如果是静默模式，不显示任何错误消息
  if (silent) {
    return false
  }

  // 认证错误由全局拦截器处理，不在这里显示消息
  if (isAuthError(error)) {
    return false // 返回false表示是认证错误，调用者不应显示错误消息
  }

  // 权限错误
  if (isPermissionError(error)) {
    if (showMessage) {
      ElMessage.error('权限不足')
    }
    return true
  }

  // 网络错误
  if (!error.response) {
    if (showMessage) {
      ElMessage.error('网络连接失败，请检查网络设置')
    }
    return true
  }

  // 服务器错误
  if (error.response.status >= 500) {
    if (showMessage) {
      ElMessage.error('服务器内部错误，请稍后重试')
    }
    return true
  }

  // 其他错误
  if (showMessage) {
    const message = error.response?.data?.message || error.message || defaultMessage
    ElMessage.error(message)
  }
  return true
}

// 简单的错误检查函数，只检查是否是认证错误
export const shouldShowError = (error: ApiError): boolean => {
  return !isAuthError(error)
}

// 带加载状态的API调用包装器
export const safeApiCall = async <T>(
  apiCall: () => Promise<T>,
  options: {
    defaultMessage?: string
    showError?: boolean
    logError?: boolean
    loadingRef?: { value: boolean }
    successMessage?: string
    silent?: boolean
  } = {}
): Promise<T | null> => {
  const { 
    defaultMessage = '操作失败', 
    showError = true, 
    logError = true,
    loadingRef,
    successMessage,
    silent = false
  } = options
  
  try {
    if (loadingRef) {
      loadingRef.value = true
    }
    
    const result = await apiCall()
    
    if (successMessage && !silent) {
      ElMessage.success(successMessage)
    }
    
    return result
  } catch (error) {
    handleApiError(error as ApiError, defaultMessage, { 
      showMessage: showError, 
      logError,
      silent
    })
    return null
  } finally {
    if (loadingRef) {
      loadingRef.value = false
    }
  }
}

// 专门用于表单提交的包装器
export const safeFormSubmit = async <T>(
  submitFn: () => Promise<T>,
  options: {
    loadingRef: { value: boolean }
    successMessage?: string
    errorMessage?: string
    onSuccess?: (result: T) => void
    onError?: (error: ApiError) => void
  }
): Promise<boolean> => {
  const { loadingRef, successMessage, errorMessage, onSuccess, onError } = options
  
  try {
    loadingRef.value = true
    const result = await submitFn()
    
    if (successMessage) {
      ElMessage.success(successMessage)
    }
    
    if (onSuccess) {
      onSuccess(result)
    }
    
    return true
  } catch (error) {
    const apiError = error as ApiError
    
    if (onError) {
      onError(apiError)
    } else {
      handleApiError(apiError, errorMessage || '操作失败')
    }
    
    return false
  } finally {
    loadingRef.value = false
  }
}