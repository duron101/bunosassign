import { ref, Ref } from 'vue'
import { ElMessage } from 'element-plus'
import { handleApiError, type ApiError } from '@/utils/error-handler'

export interface AsyncOperationOptions {
  showLoading?: boolean
  showError?: boolean
  showSuccess?: boolean
  successMessage?: string
  errorMessage?: string
  onSuccess?: (result: any) => void
  onError?: (error: ApiError) => void
}

export function useAsyncOperation() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * 执行异步操作的通用函数
   */
  const execute = async <T>(
    operation: () => Promise<T>,
    options: AsyncOperationOptions = {}
  ): Promise<T | null> => {
    const {
      showLoading = true,
      showError = true,
      showSuccess = false,
      successMessage,
      errorMessage,
      onSuccess,
      onError
    } = options

    try {
      if (showLoading) {
        loading.value = true
      }
      error.value = null

      const result = await operation()

      if (showSuccess && successMessage) {
        ElMessage.success(successMessage)
      }

      if (onSuccess) {
        onSuccess(result)
      }

      return result
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.response?.data?.message || apiError.message || '操作失败'

      if (onError) {
        onError(apiError)
      } else if (showError) {
        handleApiError(apiError, errorMessage)
      }

      return null
    } finally {
      if (showLoading) {
        loading.value = false
      }
    }
  }

  /**
   * 专门用于表单提交的函数
   */
  const submitForm = async <T>(
    formRef: Ref<any>,
    submitOperation: () => Promise<T>,
    options: AsyncOperationOptions & { 
      validateFirst?: boolean 
      resetForm?: boolean 
    } = {}
  ): Promise<boolean> => {
    const { validateFirst = true, resetForm = false, ...executeOptions } = options

    try {
      if (validateFirst && formRef.value) {
        await formRef.value.validate()
      }

      const result = await execute(submitOperation, executeOptions)

      if (result && resetForm && formRef.value) {
        formRef.value.resetFields()
      }

      return !!result
    } catch (validationError) {
      ElMessage.error('请检查表单输入')
      return false
    }
  }

  /**
   * 执行需要确认的操作
   */
  const executeWithConfirm = async <T>(
    operation: () => Promise<T>,
    confirmMessage: string,
    options: AsyncOperationOptions = {}
  ): Promise<T | null> => {
    try {
      await ElMessage.confirm(confirmMessage, '确认操作', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      })

      return await execute(operation, options)
    } catch {
      // 用户取消操作
      return null
    }
  }

  return {
    loading,
    error,
    execute,
    submitForm,
    executeWithConfirm
  }
}

/**
 * 专门用于数据加载的组合函数
 */
export function useDataLoader<T>() {
  const { loading, error, execute } = useAsyncOperation()
  const data = ref<T | null>(null)

  const loadData = async (
    loader: () => Promise<T>,
    options: Omit<AsyncOperationOptions, 'onSuccess'> = {}
  ) => {
    const result = await execute(loader, {
      ...options,
      onSuccess: (result) => {
        data.value = result
      }
    })
    return result
  }

  const refreshData = async (
    loader: () => Promise<T>,
    options: Omit<AsyncOperationOptions, 'onSuccess'> = {}
  ) => {
    return await loadData(loader, {
      showLoading: false,
      showError: false,
      ...options
    })
  }

  return {
    loading,
    error,
    data,
    loadData,
    refreshData
  }
}