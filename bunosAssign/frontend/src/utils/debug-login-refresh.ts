// 调试工具：监控登录页面刷新问题
export const debugLoginRefresh = () => {
  let refreshCount = 0
  let lastRefreshTime = Date.now()
  let isEnabled = false
  
  // 监控页面加载
  const handlePageLoad = () => {
    // 只在登录页面启用调试
    if (window.location.pathname !== '/login') {
      return
    }
    
    const currentTime = Date.now()
    const timeSinceLastRefresh = currentTime - lastRefreshTime
    
    // 只在刷新间隔小于5秒时才记录（避免正常刷新）
    if (timeSinceLastRefresh < 5000) {
      refreshCount++
      console.log(`🔍 Login page refresh detected!`)
      console.log(`   Refresh count: ${refreshCount}`)
      console.log(`   Time since last refresh: ${timeSinceLastRefresh}ms`)
      console.log(`   Current timestamp: ${new Date().toISOString()}`)
      console.log(`   User agent: ${navigator.userAgent}`)
      
      // 检查可能导致刷新的原因
      console.log(`   LocalStorage state:`, {
        token: localStorage.getItem('token'),
        user: localStorage.getItem('user'),
        permissions: localStorage.getItem('permissions')
      })
      
      // 检查网络请求
      if (window.performance && window.performance.getEntriesByType) {
        const navigationEntries = window.performance.getEntriesByType('navigation')
        if (navigationEntries.length > 0) {
          const navEntry = navigationEntries[0] as PerformanceNavigationTiming
          console.log(`   Navigation type: ${navEntry.type}`)
          console.log(`   Navigation cause: ${(navEntry as any).navigationType || 'unknown'}`)
        }
      }
      
      lastRefreshTime = currentTime
    } else {
      // 正常刷新，重置计数器
      refreshCount = 0
      lastRefreshTime = currentTime
    }
  }
  
  // 监控路由变化
  const handleRouteChange = (to: any, from: any) => {
    if (to.path === '/login') {
      console.log(`🔄 Route change to login:`, {
        from: from.path,
        to: to.path,
        timestamp: new Date().toISOString()
      })
    }
  }
  
  // 监控网络请求
  const handleNetworkRequest = (url: string, method: string, status?: number) => {
    if (url.includes('/auth/') || url.includes('/api/auth/')) {
      console.log(`🌐 Auth API request:`, {
        url,
        method,
        status,
        timestamp: new Date().toISOString(),
        pathname: window.location.pathname
      })
    }
  }
  
  // 监控localStorage变化
  const handleStorageChange = (key: string, oldValue: string | null, newValue: string | null) => {
    if (key === 'token' || key === 'user' || key === 'permissions') {
      console.log(`💾 Storage change:`, {
        key,
        oldValue,
        newValue,
        timestamp: new Date().toISOString(),
        pathname: window.location.pathname
      })
    }
  }
  
  // 初始化监控
  const init = () => {
    if (isEnabled) {
      console.log('Debug tool already initialized')
      return
    }
    
    // 页面加载监控
    window.addEventListener('load', handlePageLoad)
    
    // 路由变化监控（如果Vue Router可用）
    if (window.Vue && window.Vue.router) {
      window.Vue.router.beforeEach(handleRouteChange)
    }
    
    // 网络请求监控（通过重写fetch和XMLHttpRequest）
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const [url, options] = args
      try {
        const response = await originalFetch(...args)
        handleNetworkRequest(url.toString(), options?.method || 'GET', response.status)
        return response
      } catch (error) {
        handleNetworkRequest(url.toString(), options?.method || 'GET')
        throw error
      }
    }
    
    // localStorage变化监控
    const originalSetItem = localStorage.setItem
    const originalRemoveItem = localStorage.removeItem
    const originalClear = localStorage.clear
    
    localStorage.setItem = (key: string, value: string) => {
      const oldValue = localStorage.getItem(key)
      originalSetItem.call(localStorage, key, value)
      handleStorageChange(key, oldValue, value)
    }
    
    localStorage.removeItem = (key: string) => {
      const oldValue = localStorage.getItem(key)
      originalRemoveItem.call(localStorage, key)
      handleStorageChange(key, oldValue, null)
    }
    
    localStorage.clear = () => {
      const oldValues = {
        token: localStorage.getItem('token'),
        user: localStorage.getItem('user'),
        permissions: localStorage.getItem('permissions')
      }
      originalClear.call(localStorage)
      Object.entries(oldValues).forEach(([key, value]) => {
        if (value) handleStorageChange(key, value, null)
      })
    }
    
    isEnabled = true
    console.log('🔧 Login refresh debug tool initialized')
  }
  
  // 清理监控
  const cleanup = () => {
    if (!isEnabled) {
      return
    }
    
    window.removeEventListener('load', handlePageLoad)
    console.log('🧹 Login refresh debug tool cleaned up')
    isEnabled = false
  }
  
  // 启用/禁用调试
  const toggle = (enabled: boolean) => {
    if (enabled && !isEnabled) {
      init()
    } else if (!enabled && isEnabled) {
      cleanup()
    }
  }
  
  return {
    init,
    cleanup,
    toggle,
    getStats: () => ({
      refreshCount,
      lastRefreshTime: new Date(lastRefreshTime).toISOString(),
      isEnabled
    })
  }
}

// 自动初始化（如果不在生产环境且URL包含debug参数）
if (process.env.NODE_ENV !== 'production') {
  const urlParams = new URLSearchParams(window.location.search)
  const shouldEnableDebug = urlParams.get('debug') === 'true' || urlParams.get('debug') === '1'
  
  if (shouldEnableDebug) {
    const debugTool = debugLoginRefresh()
    debugTool.init()
    
    // 在控制台暴露调试工具
    ;(window as any).debugLoginRefresh = debugTool
    
    console.log('🔧 Debug mode enabled via URL parameter')
  } else {
    console.log('🔧 Debug mode disabled. Add ?debug=true to URL to enable')
  }
}
