import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import projectCollaborationRoutes from './modules/projectCollaboration'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/LoginView.vue'),
    meta: {
      title: '登录',
      requiresAuth: false
    }
  },
  {
    path: '/',
    component: () => import('@/components/layout/MainLayout.vue'),
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/DashboardOverview.vue'),
        meta: {
          title: '管理驾驶舱',
          requiresAuth: true
        }
      },
      {
        path: '/employee',
        name: 'Employee',
        component: () => import('@/views/employee/EmployeeManagement.vue'),
        meta: {
          title: '员工管理',
          requiresAuth: true,
          permissions: ['employee:view']
        }
      },
      {
        path: '/department',
        name: 'Department',
        component: () => import('@/views/department/DepartmentManagement.vue'),
        meta: {
          title: '部门管理',
          requiresAuth: true,
          permissions: ['department:view', 'admin', 'hr', '*']
        }
      },
      {
        path: '/position',
        name: 'Position',
        component: () => import('@/views/position/PositionManagement.vue'),
        meta: {
          title: '岗位管理',
          requiresAuth: true,
          permissions: ['position:view']
        }
      },
      {
        path: '/position/encyclopedia',
        name: 'PositionEncyclopedia',
        component: () => import('@/views/position/PositionEncyclopedia.vue'),
        meta: {
          title: '岗位大全',
          requiresAuth: true,
          permissions: ['position:view']
        }
      },
      {
        path: '/position/encyclopedia/:id',
        name: 'PositionDetail',
        component: () => import('@/views/position/PositionDetail.vue'),
        meta: {
          title: '岗位详情',
          requiresAuth: true,
          permissions: ['position:view']
        }
      },
      {
        path: '/business-line',
        name: 'BusinessLine',
        component: () => import('@/views/businessLine/BusinessLineManagement.vue'),
        meta: {
          title: '业务线管理',
          requiresAuth: true,
          permissions: ['business_line:view']
        }
      },
      // 项目协作路由模块
      ...projectCollaborationRoutes,
      {
        path: '/project/management',
        name: 'ProjectManagement',
        component: () => import('@/views/project/ProjectManagement.vue'),
        meta: {
          title: '项目管理',
          requiresAuth: true,
          permissions: ['project:view']
        }
      },
      {
        path: '/project/collaboration',
        name: 'ProjectCollaboration',
        component: () => import('@/views/project/ProjectCollaboration.vue'),
        meta: {
          title: '项目协作',
          requiresAuth: true,
          permissions: ['project:view', 'project:create', 'project:approve', 'project_manager', '*']
        }
      },
      {
        path: '/project/publish',
        name: 'ProjectPublish',
        component: () => import('@/views/project/ProjectPublish.vue'),
        meta: {
          title: '发布项目',
          requiresAuth: true,
          permissions: ['project:create', '*']
        }
      },
      {
        path: '/my-projects',
        name: 'MyProjects',
        component: () => import('@/views/project/MyProjects.vue'),
        meta: {
          title: '我的项目',
          requiresAuth: true
        }
      },
      {
        path: '/project-member-approval',
        name: 'ProjectMemberApproval',
        component: () => import('@/views/project/ProjectMemberApproval.vue'),
        meta: {
          title: '项目成员审批',
          requiresAuth: true,
          permissions: ['project:approve', '*']
        }
      },
      {
        path: '/project-role-weights',
        name: 'ProjectRoleWeights',
        component: () => import('@/views/project/ProjectRoleWeights.vue'),
        meta: {
          title: '项目角色权重',
          requiresAuth: true,
          permissions: ['project_manager', 'admin']
        }
      },
      {
        path: '/project-bonus-management',
        name: 'ProjectBonusManagement',
        component: () => import('@/views/project/ProjectBonusManagement.vue'),
        meta: {
          title: '项目奖金管理',
          requiresAuth: true,
          permissions: ['finance', 'hr', 'admin']
        }
      },
      {
        path: '/calculation',
        name: 'BonusCalculation',
        component: () => import('@/views/calculation/BonusCalculation.vue'),
        meta: {
          title: '奖金计算',
          requiresAuth: true,
          permissions: ['bonus:calculate']
        }
      },
      {
        path: '/simulation',
        name: 'SimulationAnalysis',
        component: () => import('@/views/simulation/SimulationAnalysis.vue'),
        meta: {
          title: '模拟分析',
          requiresAuth: true,
          permissions: ['simulation:view']
        }
      },
      {
        path: '/reports/management',
        name: 'ReportManagement',
        component: () => import('@/views/reports/ReportManagement.vue'),
        meta: {
          title: '报表管理',
          requiresAuth: true,
          permissions: ['report:view']
        }
      },
      {
        path: '/reports/personal',
        name: 'PersonalBonus',
        component: () => import('@/views/reports/PersonalBonus.vue'),
        meta: {
          title: '个人奖金查询',
          requiresAuth: true,
          permissions: ['bonus:view', 'bonus:personal']
        }
      },
      {
        path: '/personal/dashboard',
        name: 'PersonalBonusDashboard',
        component: () => import('@/views/personal/PersonalBonusDashboard.vue'),
        meta: {
          title: '我的奖金',
          requiresAuth: true,
          icon: 'money',
          showInMenu: true,
          description: '查看个人奖金详情、历史趋势和改进建议'
        }
      },
      {
        path: '/system/users',
        name: 'UserManagement',
        component: () => import('@/views/system/UserManagement.vue'),
        meta: {
          title: '用户管理',
          requiresAuth: true,
          permissions: ['user:view']
        }
      },
      {
        path: '/system/roles',
        name: 'RoleManagement',
        component: () => import('@/views/system/RoleManagement.vue'),
        meta: {
          title: '角色管理',
          requiresAuth: true,
          permissions: ['role:view']
        }
      },
      {
        path: '/system/config',
        name: 'SystemConfig',
        component: () => import('@/views/system/SystemConfig.vue'),
        meta: {
          title: '系统配置',
          requiresAuth: true,
          permissions: ['system:config']
        }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫状态管理
let isRestoringUser = false

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token')
  const { useUserStore } = await import('@/store/modules/user')
  const userStore = useUserStore()
  
  console.log(`🚀 Route Guard: ${from.path} -> ${to.path}`, {
    hasToken: !!token,
    hasUser: !!userStore.user,
    isRestoringUser,
    isInitialized: userStore.isInitialized
  })
  
  // 如果目标页面是登录页
  if (to.path === '/login') {
    // 如果已经有有效token和用户信息，重定向到dashboard
    if (token && userStore.user && userStore.isLoggedIn()) {
      console.log('✅ User already logged in, redirecting to dashboard')
      next('/dashboard')
      return
    }
    // 允许访问登录页并确保状态清理
    console.log('✅ Allowing access to login page')
    if (!token) {
      userStore.logout() // 确保状态完全清除
    }
    next()
    return
  }
  
  // 如果需要认证但没有token，跳转到登录页
  if (to.meta.requiresAuth && !token) {
    console.log('❌ No token found, redirecting to login')
    userStore.logout() // 确保状态清除
    next('/login')
    return
  }
  
  // 如果有token但用户信息为空（页面刷新等情况），需要恢复用户状态
  if (token && !userStore.user && to.meta.requiresAuth && !isRestoringUser) {
    console.log('🔄 Token exists but no user info, attempting to restore user state')
    
    // 首先验证token格式
    if (!userStore.validateToken()) {
      console.log('❌ Invalid token format, redirecting to login')
      userStore.logout()
      next('/login')
      return
    }
    
    isRestoringUser = true
    try {
      console.log('📡 Fetching user info from API')
      const { getCurrentUserForRouter } = await import('@/api/auth')
      const response = await getCurrentUserForRouter()
      
      console.log('✅ User info API response received')
      userStore.setLoginData({
        user: response.data.user,
        token: token,
        refreshToken: localStorage.getItem('refreshToken') || '',
        permissions: response.data.permissions || []
      })
      
      console.log('✅ User state restored successfully')
      isRestoringUser = false
      next()
      return
    } catch (error) {
      console.error('❌ Failed to restore user state:', error)
      isRestoringUser = false
      userStore.logout()
      next('/login')
      return
    }
  }
  
  // 如果正在恢复用户状态，等待完成
  if (isRestoringUser) {
    console.log('⏳ User restoration in progress, waiting...')
    // 等待恢复完成
    const checkRestoration = () => {
      if (!isRestoringUser) {
        next()
      } else {
        setTimeout(checkRestoration, 100)
      }
    }
    checkRestoration()
    return
  }
  
  // 权限检查
  if (to.meta.requiresAuth && to.meta.permissions && userStore.user) {
    const requiredPermissions = to.meta.permissions as string[]
    const hasPermission = userStore.hasAnyPermission(requiredPermissions)
    
    if (!hasPermission) {
      console.log('❌ Insufficient permissions, redirecting to dashboard')
      next('/dashboard')
      return
    }
  }
  
  // 允许访问
  console.log('✅ Route access granted')
  next()
})

export default router