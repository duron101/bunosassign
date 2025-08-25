<template>
  <div class="login-container">
    <div class="login-form">
      <div class="login-header">
        <h2>奖金模拟系统</h2>
        <p>利润贡献度+岗位价值+绩效表现</p>
      </div>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            style="width: 100%"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <p>如有问题，请联系人力资源部</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
import type { LoginRequest } from '@/types/user'

const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive<LoginRequest>({
  username: '',
  password: ''
})

const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

// 添加调试信息
onMounted(() => {
  console.log('LoginView mounted - Debug info:')
  console.log('Current pathname:', window.location.pathname)
  console.log('User store state:', {
    hasToken: !!userStore.token,
    hasUser: !!userStore.user,
    hasPermissions: userStore.permissions.length > 0
  })
  console.log('LocalStorage state:', {
    token: localStorage.getItem('token'),
    user: localStorage.getItem('user'),
    permissions: localStorage.getItem('permissions')
  })
})

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    await loginFormRef.value.validate()
    loading.value = true
    
    // 调用真实登录API
    const { login } = await import('@/api/auth')
    const response = await login(loginForm)
    
    // 处理不同的响应格式
    let loginData
    if (response.data && typeof response.data === 'object') {
      loginData = response.data
    } else {
      loginData = response
    }
    
    // 确保有必要的字段
    if (!loginData.token || !loginData.user) {
      throw new Error('登录响应格式错误')
    }
    
    // 设置登录信息
    userStore.setLoginData({
      user: loginData.user,
      token: loginData.token,
      refreshToken: loginData.refreshToken || '',
      permissions: loginData.permissions || []
    })
    
    ElMessage.success('登录成功')
    
    // 跳转到Dashboard
    await router.push('/dashboard')
    
  } catch (error: any) {
    console.error('Login error:', error)
    
    // 处理不同类型的错误
    if (error.response?.status === 401) {
      ElMessage.error('用户名或密码错误')
    } else if (error.response?.status === 429) {
      ElMessage.error('登录尝试过于频繁，请稍后再试')
    } else if (error.response?.status >= 500) {
      ElMessage.error('服务器错误，请稍后重试')
    } else if (error.message?.includes('网络')) {
      ElMessage.error('网络连接失败，请检查网络设置')
    } else {
      ElMessage.error(error.response?.data?.message || error.message || '登录失败，请重试')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-form {
  width: 400px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  color: var(--text-primary);
  margin-bottom: 10px;
  font-weight: 600;
}

.login-header p {
  color: var(--text-secondary);
  font-size: 14px;
}

.login-footer {
  text-align: center;
  margin-top: 20px;
}

.login-footer p {
  color: var(--text-secondary);
  font-size: 12px;
}

:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--primary-color) inset;
}

:deep(.el-input.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--primary-color) inset;
}
</style>