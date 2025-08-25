<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-content">
      <el-icon class="error-icon" size="64">
        <WarningFilled />
      </el-icon>
      
      <h3 class="error-title">{{ errorTitle }}</h3>
      
      <p class="error-message">{{ errorMessage }}</p>
      
      <div class="error-actions">
        <el-button @click="retry" type="primary">
          <el-icon><Refresh /></el-icon>
          重试
        </el-button>
        
        <el-button @click="goHome" plain>
          <el-icon><HomeFilled /></el-icon>
          返回首页
        </el-button>
        
        <el-button @click="showDetails" link v-if="!showDetailedError">
          查看详情
        </el-button>
        
        <el-button @click="hideDetails" link v-else>
          隐藏详情
        </el-button>
      </div>
      
      <el-collapse v-if="showDetailedError" class="error-details">
        <el-collapse-item title="错误详情" name="1">
          <pre>{{ errorDetails }}</pre>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
  
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { WarningFilled, Refresh, HomeFilled } from '@element-plus/icons-vue'

interface Props {
  fallbackTitle?: string
  fallbackMessage?: string
  showRetry?: boolean
  onRetry?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  fallbackTitle: '页面出现错误',
  fallbackMessage: '抱歉，页面加载时出现了错误，请稍后重试',
  showRetry: true
})

const emit = defineEmits<{
  error: [error: Error, instance: any, info: string]
}>()

const router = useRouter()

const hasError = ref(false)
const errorTitle = ref('')
const errorMessage = ref('')
const errorDetails = ref('')
const showDetailedError = ref(false)

// 捕获子组件错误
onErrorCaptured((error, instance, info) => {
  console.error('ErrorBoundary caught error:', error, info)
  
  hasError.value = true
  errorTitle.value = getErrorTitle(error)
  errorMessage.value = getErrorMessage(error)
  errorDetails.value = formatErrorDetails(error, info)
  
  emit('error', error, instance, info)
  
  return false // 阻止错误继续传播
})

const getErrorTitle = (error: Error): string => {
  if (error.name === 'ChunkLoadError') {
    return '资源加载失败'
  }
  if (error.message?.includes('Network')) {
    return '网络连接错误'
  }
  if (error.message?.includes('timeout')) {
    return '请求超时'
  }
  return props.fallbackTitle
}

const getErrorMessage = (error: Error): string => {
  if (error.name === 'ChunkLoadError') {
    return '页面资源加载失败，可能是网络问题或版本更新，请刷新页面重试'
  }
  if (error.message?.includes('Network')) {
    return '网络连接失败，请检查网络设置后重试'
  }
  if (error.message?.includes('timeout')) {
    return '请求超时，请检查网络连接或稍后重试'
  }
  return props.fallbackMessage
}

const formatErrorDetails = (error: Error, info: string): string => {
  return `
错误类型: ${error.name}
错误信息: ${error.message}
错误堆栈: ${error.stack || '无堆栈信息'}
组件信息: ${info}
时间: ${new Date().toLocaleString()}
用户代理: ${navigator.userAgent}
  `.trim()
}

const retry = async () => {
  if (props.onRetry) {
    try {
      await props.onRetry()
      hasError.value = false
    } catch (error) {
      ElMessage.error('重试失败，请稍后再试')
    }
  } else {
    // 默认重试逻辑：重新加载当前页面
    window.location.reload()
  }
}

const goHome = () => {
  hasError.value = false
  router.push('/dashboard')
}

const showDetails = () => {
  showDetailedError.value = true
}

const hideDetails = () => {
  showDetailedError.value = false
}

// 暴露重置错误状态的方法
const resetError = () => {
  hasError.value = false
  errorTitle.value = ''
  errorMessage.value = ''
  errorDetails.value = ''
  showDetailedError.value = false
}

defineExpose({
  resetError
})
</script>

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px 20px;
}

.error-content {
  text-align: center;
  max-width: 600px;
  width: 100%;
}

.error-icon {
  color: #f56c6c;
  margin-bottom: 24px;
}

.error-title {
  color: #303133;
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 16px 0;
}

.error-message {
  color: #606266;
  font-size: 16px;
  line-height: 1.6;
  margin: 0 0 32px 0;
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.error-details {
  text-align: left;
  margin-top: 24px;
}

.error-details pre {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: #606266;
  white-space: pre-wrap;
  word-break: break-all;
}

@media (max-width: 768px) {
  .error-boundary {
    min-height: 300px;
    padding: 20px 16px;
  }
  
  .error-title {
    font-size: 20px;
  }
  
  .error-message {
    font-size: 14px;
  }
  
  .error-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .error-actions .el-button {
    width: 200px;
  }
}
</style>