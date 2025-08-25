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

const handleLogout = () => {
  userStore.logout()
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}
</style>