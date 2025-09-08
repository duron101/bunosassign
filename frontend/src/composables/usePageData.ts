import { ref, onMounted } from 'vue'
import { safeApiCall } from '@/utils/error-handler'

// 通用页面数据加载组合式函数
export function usePageData() {
  const loading = ref(false)

  // 安全的数据加载函数
  const loadData = async <T>(
    apiCall: () => Promise<T>,
    options: {
      setLoading?: boolean
      errorMessage?: string
      showError?: boolean
    } = {}
  ): Promise<T | null> => {
    const { setLoading = true, errorMessage = '数据加载失败', showError = true } = options
    
    if (setLoading) loading.value = true
    
    try {
      const result = await safeApiCall(() => apiCall(), {
        defaultMessage: errorMessage,
        showError,
        logError: true
      })
      return result
    } finally {
      if (setLoading) loading.value = false
    }
  }

  // 批量加载数据（并行）
  const loadMultipleData = async (
    apiCalls: Array<{
      api: () => Promise<any>
      onSuccess?: (data: any) => void
      errorMessage?: string
      showError?: boolean
    }>
  ) => {
    loading.value = true
    
    try {
      const promises = apiCalls.map(async ({ api, onSuccess, errorMessage, showError = false }) => {
        const result = await safeApiCall(() => api(), {
          defaultMessage: errorMessage || '数据加载失败',
          showError,
          logError: true
        })
        
        if (result && onSuccess) {
          onSuccess(result)
        }
        
        return result
      })
      
      await Promise.allSettled(promises)
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    loadData,
    loadMultipleData
  }
}

// 管理页面通用数据加载
export function useManagementPageData(config: {
  mainApi: () => Promise<any>
  mainDataSetter: (data: any) => void
  auxiliaryApis?: Array<{
    api: () => Promise<any>
    onSuccess: (data: any) => void
    errorMessage?: string
  }>
  mainErrorMessage?: string
}) {
  const { loading, loadMultipleData } = usePageData()

  const loadPageData = async () => {
    const apiCalls = [
      {
        api: config.mainApi,
        onSuccess: config.mainDataSetter,
        errorMessage: config.mainErrorMessage || '主要数据加载失败',
        showError: true
      }
    ]

    if (config.auxiliaryApis) {
      apiCalls.push(...config.auxiliaryApis.map(aux => ({
        api: aux.api,
        onSuccess: aux.onSuccess,
        errorMessage: aux.errorMessage || '辅助数据加载失败',
        showError: false  // 辅助数据失败不显示错误提示
      })))
    }

    await loadMultipleData(apiCalls)
  }

  // 页面挂载时自动加载数据
  onMounted(loadPageData)

  return {
    loading,
    loadPageData
  }
}