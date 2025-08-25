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
          permissions: ['department:view']
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
          permissions: ['business-line:view']
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

// 是否正在获取用户信息
let isGettingUserInfo = false

// 路由守卫
router.beforeEach(async (to, from, next) => {

  const token = localStorage.getItem('token')
  const { useUserStore } = await import('@/store/modules/user')
  const userStore = useUserStore()
  
  // 简化的调试日志
  console.log(`Route: ${from.path} -> ${to.path}, Token: ${!!token}, User: ${!!userStore.user}`)
  
  // 如果目标页面是登录页
  if (to.path === '/login') {
    // 如果已经有有效token和用户信息，重定向到dashboard
    if (token && userStore.user) {
      next('/dashboard')
      return
    }
    // 如果是模拟token，设置模拟用户数据并重定向
    if (token && (token === 'mock-token' || token.startsWith('mock-'))) {
      userStore.setUser({
        id: 1,
        username: 'admin',
        realName: '系统管理员',
        email: 'admin@company.com',
        phone: '13800138000',
        roleId: 1,
        roleName: '超级管理员',
        departmentId: 1,
        departmentName: '技术部',
        status: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      userStore.setToken(token)
      userStore.setPermissions(['*', 'employee:view', 'department:view', 'position:view', 'business-line:view', 'project:view', 'project:create', 'project:approve', 'project_manager', 'admin', 'finance', 'hr', 'bonus:calculate', 'simulation:view', 'report:view', 'user:view', 'role:view', 'system:config'])
      next('/dashboard')
      return
    }
    // 允许访问登录页
    next()
    return
  }
  
  // 如果需要认证但没有token，跳转到登录页
  if (to.meta.requiresAuth && !token) {
    next('/login')
    return
  }
  
  // 如果有token但用户信息为空（页面刷新等情况），需要恢复用户状态
  if (token && !userStore.user && to.meta.requiresAuth) {
    // 对于模拟token，设置模拟用户信息并允许通过
    if (token === 'mock-token' || token.startsWith('mock-')) {
      userStore.setUser({
        id: 1,
        username: 'admin',
        realName: '系统管理员',
        email: 'admin@company.com',
        phone: '13800138000',
        roleId: 1,
        roleName: '超级管理员',
        departmentId: 1,
        departmentName: '技术部',
        status: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      userStore.setToken(token)
      userStore.setPermissions(['*', 'employee:view', 'department:view', 'position:view', 'business-line:view', 'project:view', 'project:create', 'project:approve', 'project_manager', 'admin', 'finance', 'hr', 'bonus:calculate', 'simulation:view', 'report:view', 'user:view', 'role:view', 'system:config'])
      next()
      return
    }
    
    // 对于真实token，尝试获取用户信息
    if (!isGettingUserInfo) {
      isGettingUserInfo = true
      try {
        const { getCurrentUserForRouter } = await import('@/api/auth')
        const response = await getCurrentUserForRouter()
        userStore.setUser(response.data.user)
        userStore.setToken(token)
        userStore.setPermissions(response.data.permissions)
        isGettingUserInfo = false
        next()
        return
      } catch (error) {
        isGettingUserInfo = false
        console.warn('Failed to get user info, using default user')
        // 设置默认用户信息继续
        userStore.setUser({
          id: 1,
          username: 'user',
          realName: '用户',
          email: '',
          phone: '',
          roleId: 1,
          roleName: '用户',
          departmentId: 1,
          departmentName: '',
          status: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        userStore.setPermissions(['*'])
        next()
        return
      }
    } else {
      // 如果正在获取用户信息，直接通过
      next()
      return
    }
  }
  
  // 简化的权限检查
  if (to.meta.requiresAuth && to.meta.permissions && userStore.user) {
    const requiredPermissions = to.meta.permissions as string[]
    const hasPermission = userStore.hasAnyPermission(requiredPermissions)
    
    if (!hasPermission) {
      next('/dashboard')
      return
    }
  }
  
  // 允许访问
  next()
})

export default router