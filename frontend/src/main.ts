import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 导入VXE Table
import VXETable from 'vxe-table'
import 'vxe-table/lib/style.css'

import App from './App.vue'
import router from './router'
import { useUserStore } from '@/store/modules/user'

// 全局样式
import '@/assets/styles/main.css'

// 全局错误处理覆盖
import '@/utils/global-error-handler'

// 开发环境调试工具
if (process.env.NODE_ENV !== 'production') {
  import('@/utils/debug-login-refresh')
}

const app = createApp(App)

// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(ElementPlus)
app.use(VXETable)

// 初始化用户状态
const userStore = useUserStore()
userStore.initFromStorage()

// 添加调试信息
console.log('App startup - User store initialized:', {
  hasToken: !!userStore.token,
  hasUser: !!userStore.user,
  hasPermissions: userStore.permissions.length > 0,
  token: userStore.token ? (userStore.token.startsWith('mock-') ? 'mock-token' : 'real-token') : 'none'
})

app.mount('#app')