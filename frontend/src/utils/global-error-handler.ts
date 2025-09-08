// 全局错误处理覆盖
import { ElMessage } from 'element-plus'

// 存储原始的ElMessage.error方法
const originalError = ElMessage.error

// 需要过滤的错误消息关键词
const filteredKeywords = [
  '获取', '加载', '处理', '失败', '请求', '数据',
  'fetch', 'load', 'request', 'data', 'api'
]

// 认证相关的错误关键词（这些应该被过滤）
const authKeywords = [
  '401', 'unauthorized', '认证', 'auth', '登录', 'login',
  'token', '令牌', '过期', 'expired', '身份', 'identity'
]

// 重写ElMessage.error方法
ElMessage.error = (message: any, options?: any) => {
  console.log('ElMessage.error called with:', message) // 调试日志
  
  if (typeof message === 'string') {
    // 检查是否包含认证相关错误
    const isAuthError = authKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    )
    
    // 检查是否是数据获取失败的错误
    const isDataFetchError = filteredKeywords.some(keyword => 
      message.includes(keyword)
    )
    
    // 如果是认证错误或数据获取错误，静默处理
    if (isAuthError || isDataFetchError) {
      console.warn('Filtered error message:', message)
      return
    }
  }
  
  // 其他错误正常显示
  return originalError(message, options)
}

export { originalError as showError }