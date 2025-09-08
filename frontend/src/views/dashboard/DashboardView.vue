<template>
  <div class="dashboard-container">
    <h1>仪表盘</h1>
    <p>欢迎使用奖金模拟系统</p>
    <el-button @click="handleLogout">退出登录</el-button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const handleLogout = async () => {
  try {
    console.log('Starting logout from dashboard...')
    
    // 先调用后端登出API（如果有的话）
    try {
      const { logout } = await import('@/api/auth')
      await logout()
      console.log('Backend logout successful')
    } catch (error) {
      console.warn('Backend logout failed:', error)
      // 即使后端登出失败，也继续前端登出
    }
    
    // 前端登出 - 清除所有状态
    console.log('Clearing user state...')
    userStore.logout()
    
    // 确保localStorage也被清除
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    localStorage.removeItem('permissions')
    
    console.log('User state cleared, redirecting to login...')
    
    // 使用replace而不是push，避免用户通过后退按钮回到已登出状态
    await router.replace('/login')
    
    ElMessage.success('已退出登录')
  } catch (error) {
    console.error('Logout failed:', error)
    ElMessage.error('退出登录失败，请重试')
  }
}
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}
</style>