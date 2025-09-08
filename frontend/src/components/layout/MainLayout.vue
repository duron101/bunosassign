<template>
  <div class="main-layout">
    <el-container>
      <!-- 顶部导航 -->
      <el-header class="header">
        <div class="header-left">
          <h1 class="system-title">🎯 奖金模拟系统</h1>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleUserAction">
            <span class="user-info">
              <el-icon><User /></el-icon>
              {{ userStore.user?.realName || userStore.user?.username || '管理员' }}
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人设置</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-container>
        <!-- 侧边导航菜单 -->
        <el-aside width="250px" class="sidebar">
          <el-menu
            :default-active="currentRoute"
            class="sidebar-menu"
            @select="handleMenuSelect"
            router
          >
            <!-- 管理驾驶舱 -->
            <el-menu-item index="/dashboard">
              <el-icon><Monitor /></el-icon>
              <span>管理驾驶舱</span>
            </el-menu-item>

            <!-- 我的奖金 - 所有员工都可见 -->
            <el-menu-item index="/personal/dashboard">
              <el-icon><Money /></el-icon>
              <span>我的奖金</span>
            </el-menu-item>

            <!-- 基础管理 -->
            <el-sub-menu index="basic">
              <template #title>
                <el-icon><Management /></el-icon>
                <span>基础管理</span>
              </template>
              <el-menu-item index="/employee">
                <el-icon><User /></el-icon>
                <span>员工管理</span>
              </el-menu-item>
              <el-menu-item index="/department">
                <el-icon><OfficeBuilding /></el-icon>
                <span>部门管理</span>
              </el-menu-item>
              <el-menu-item index="/position">
                <el-icon><Suitcase /></el-icon>
                <span>岗位管理</span>
              </el-menu-item>
              <el-menu-item index="/position/encyclopedia">
                <el-icon><Document /></el-icon>
                <span>岗位大全</span>
              </el-menu-item>
              <el-menu-item index="/business-line">
                <el-icon><TrendCharts /></el-icon>
                <span>业务线管理</span>
              </el-menu-item>
              <el-menu-item index="/project/management">
                <el-icon><Folder /></el-icon>
                <span>项目管理</span>
              </el-menu-item>
            </el-sub-menu>

            <!-- 项目协作 - 整合现有项目协作功能 -->
            <el-sub-menu index="project-collaboration">
              <template #title>
                <el-icon><FolderOpened /></el-icon>
                <span>项目协作</span>
              </template>
              <el-menu-item index="/project/collaboration">
                <el-icon><UserFilled /></el-icon>
                <span>协作中心</span>
              </el-menu-item>
              <el-menu-item 
                v-if="userStore.hasAnyPermission(['finance', 'hr', 'admin'])"
                index="/project/cost-management"
              >
                <el-icon><Wallet /></el-icon>
                <span>成本管理</span>
              </el-menu-item>
              <el-menu-item index="/my-projects">
                <el-icon><User /></el-icon>
                <span>我的项目</span>
              </el-menu-item>
              <el-menu-item 
                v-if="userStore.hasAnyPermission(['project_manager', 'admin'])"
                index="/project-member-approval"
              >
                <el-icon><UserFilled /></el-icon>
                <span>成员审批</span>
              </el-menu-item>
              <el-menu-item 
                v-if="userStore.hasAnyPermission(['project_manager', 'admin'])"
                index="/project-role-weights"
              >
                <el-icon><Operation /></el-icon>
                <span>角色权重</span>
              </el-menu-item>
              <el-menu-item 
                v-if="userStore.hasAnyPermission(['finance', 'hr', 'admin'])"
                index="/project-bonus-management"
              >
                <el-icon><Money /></el-icon>
                <span>项目奖金</span>
              </el-menu-item>
            </el-sub-menu>

            <!-- 奖金计算 -->
            <el-sub-menu index="bonus">
              <template #title>
                <el-icon><Money /></el-icon>
                <span>奖金计算</span>
              </template>
              <el-menu-item index="/calculation">
                <el-icon><Operation /></el-icon>
                <span>奖金计算</span>
              </el-menu-item>
              <el-menu-item index="/simulation">
                <el-icon><DataAnalysis /></el-icon>
                <span>模拟分析</span>
              </el-menu-item>
            </el-sub-menu>

            <!-- 报表管理 -->
            <el-sub-menu index="reports">
              <template #title>
                <el-icon><Document /></el-icon>
                <span>报表管理</span>
              </template>
              <el-menu-item index="/reports/management">
                <el-icon><DataLine /></el-icon>
                <span>报表管理</span>
              </el-menu-item>
              <el-menu-item index="/reports/personal">
                <el-icon><UserFilled /></el-icon>
                <span>个人奖金查询</span>
              </el-menu-item>
            </el-sub-menu>

            <!-- 系统管理 -->
            <el-sub-menu index="system">
              <template #title>
                <el-icon><Setting /></el-icon>
                <span>系统管理</span>
              </template>
              <el-menu-item index="/system/users">
                <el-icon><User /></el-icon>
                <span>用户管理</span>
              </el-menu-item>
              <el-menu-item index="/system/roles">
                <el-icon><Key /></el-icon>
                <span>角色管理</span>
              </el-menu-item>
              <el-menu-item index="/system/config">
                <el-icon><Tools /></el-icon>
                <span>系统配置</span>
              </el-menu-item>
            </el-sub-menu>
          </el-menu>
        </el-aside>

        <!-- 主要内容区域 -->
        <el-main class="main-content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User, ArrowDown, Monitor, Management, OfficeBuilding,
  Suitcase, TrendCharts, Folder, Money, Operation, DataAnalysis,
  Document, DataLine, UserFilled, Setting, Key, Tools, FolderOpened, Wallet
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 当前激活的路由
const currentRoute = computed(() => route.path)

// 处理菜单选择
const handleMenuSelect = (index: string) => {
  router.push(index)
}

// 处理用户操作
const handleUserAction = async (command: string) => {
  switch (command) {
    case 'profile':
      ElMessage.info('个人设置功能开发中...')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm('确认退出登录吗？', '提示', {
          type: 'warning',
          confirmButtonText: '确定',
          cancelButtonText: '取消'
        })
        
        console.log('Starting logout process...')
        
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
        // 用户取消或其他错误
        console.log('Logout cancelled or failed:', error)
      }
      break
  }
}
</script>

<style scoped>
.main-layout {
  width: 100%;
  height: 100vh;
}

.header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left .system-title {
  margin: 0;
  color: #409eff;
  font-size: 24px;
  font-weight: bold;
}

.header-right .user-info {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
  font-size: 14px;
}

.user-info:hover {
  color: #409eff;
}

.sidebar {
  background: #f5f5f5;
  border-right: 1px solid #e4e7ed;
}

.sidebar-menu {
  border-right: none;
  background: transparent;
}

.sidebar-menu .el-menu-item {
  height: 50px;
  line-height: 50px;
}

.sidebar-menu .el-sub-menu .el-menu-item {
  height: 45px;
  line-height: 45px;
  padding-left: 40px !important;
}

.main-content {
  background: #f0f2f5;
  padding: 20px;
}

.el-container {
  height: 100%;
}
</style>