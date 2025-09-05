import { computed } from 'vue'
import { useUserStore } from '@/store/modules/user'

export interface ProjectPermissionOptions {
  projectId?: string
  employeeId?: string
}

/**
 * 项目协作权限组合函数
 */
export function useProjectPermissions(options: ProjectPermissionOptions = {}) {
  const userStore = useUserStore()
  const { projectId, employeeId } = options

  // 是否可以发布项目
  const canPublishProject = computed(() => {
    return userStore.permissions.includes('*') || 
           userStore.permissions.includes('project:create') ||
           userStore.permissions.includes('project:publish')
  })

  // 是否可以审批团队申请
  const canApproveTeam = computed(() => {
    return userStore.permissions.includes('*') || 
           userStore.permissions.includes('project:approve') ||
           userStore.permissions.includes('team:approve')
  })

  // 是否可以查看项目协作
  const canViewProject = computed(() => {
    return userStore.permissions.includes('*') || 
           userStore.permissions.includes('project:view') ||
           userStore.permissions.includes('collaboration:view')
  })

  /**
   * 检查是否可以查看项目奖金信息
   * @param targetProjectId 项目ID（可选）
   * @param targetEmployeeId 员工ID（可选）
   */
  const canViewProjectBonus = computed(() => {
    const userRole = userStore.user?.roleName?.toUpperCase() || ''
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'HR_ADMIN', 'FINANCE_ADMIN', 'PROJECT_MANAGER', 'TECH_DIRECTOR']
    
    return allowedRoles.includes(userRole) ||
           userStore.permissions.includes('*') ||
           userStore.permissions.includes('bonus:view') ||
           userStore.permissions.includes('project:cost:view') ||
           userStore.permissions.includes('project:weights:view_all')
  })

  /**
   * 检查是否可以查看自己参与项目的奖金
   * 员工可以查看自己参与项目的奖金分配情况
   */
  const canViewOwnProjectBonus = computed(() => {
    return !!userStore.user // 任何已认证用户都可以查看自己参与项目的奖金
  })

  /**
   * 检查是否可以申请项目参与
   * 所有员工都可以申请参与项目
   */
  const canApplyProject = computed(() => {
    return !!userStore.user && (
      userStore.permissions.includes('*') ||
      userStore.permissions.includes('collaboration:apply') ||
      userStore.permissions.includes('project:apply')
    )
  })

  /**
   * 检查是否可以查看岗位晋升信息
   * 全员可以查看岗位晋升信息
   */
  const canViewPositionPromotion = computed(() => {
    return !!userStore.user // 所有员工都可以查看岗位晋升信息
  })

  /**
   * 检查是否可以维护岗位晋升信息
   * 需要特定角色权限
   */
  const canManagePositionPromotion = computed(() => {
    const userRole = userStore.user?.roleName?.toUpperCase() || ''
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'HR_ADMIN', 'HR_SPECIALIST', 'BUSINESS_LINE_MANAGER', 'TECH_DIRECTOR']
    
    return allowedRoles.includes(userRole) ||
           userStore.permissions.includes('*') ||
           userStore.permissions.includes('position:update') ||
           userStore.permissions.includes('position_encyclopedia:manage') ||
           userStore.permissions.includes('position_encyclopedia:update_career_path')
  })

  // 是否可以申请团队组建（项目经理或管理员）
  const canApplyTeamBuilding = (project?: any) => {
    // 管理员拥有所有权限
    if (userStore.permissions.includes('*')) {
      return true
    }
    
    // 检查是否是项目经理
    if (project && project.managerId === userStore.user?.id) {
      return true
    }
    
    // 检查是否有项目管理权限
    return userStore.permissions.includes('project_manager') ||
           userStore.permissions.includes('project:manage') ||
           userStore.permissions.includes('team:build')
  }

  /**
   * 检查是否可以查看指定员工的项目奖金
   * @param targetEmployeeId 目标员工ID
   */
  const canViewEmployeeProjectBonus = (targetEmployeeId: string) => {
    // 查看自己的项目奖金
    if (targetEmployeeId === userStore.user?.employeeId) {
      return canViewOwnProjectBonus.value
    }
    
    // 查看他人项目奖金需要权限
    return canViewProjectBonus.value
  }

  /**
   * 检查是否可以管理指定项目
   * @param project 项目对象
   */
  const canManageProject = (project?: any) => {
    if (userStore.permissions.includes('*')) {
      return true
    }
    
    // 项目经理可以管理自己的项目
    if (project && project.managerId === userStore.user?.id) {
      return true
    }
    
    // 检查项目管理权限
    const userRole = userStore.user?.roleName?.toUpperCase() || ''
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'TECH_DIRECTOR']
    
    return allowedRoles.includes(userRole) ||
           userStore.permissions.includes('project:manage') ||
           userStore.permissions.includes('project:update')
  }

  // 是否是管理员
  const isAdmin = computed(() => {
    return userStore.permissions.includes('*') || 
           userStore.permissions.includes('admin') ||
           ['SUPER_ADMIN', 'ADMIN'].includes(userStore.user?.roleName?.toUpperCase() || '')
  })

  // 是否可以查看通知
  const canViewNotifications = computed(() => {
    // 所有已认证用户都可以查看自己的通知
    return !!userStore.user
  })

  // 检查是否有特定权限
  const hasPermission = (permission: string) => {
    return userStore.permissions.includes('*') || userStore.permissions.includes(permission)
  }

  // 检查是否有任一权限
  const hasAnyPermission = (permissions: string[]) => {
    if (userStore.permissions.includes('*')) {
      return true
    }
    return permissions.some(permission => userStore.permissions.includes(permission))
  }

  /**
   * 获取项目权限提示信息
   * @param action 操作类型
   * @param targetId 目标ID（项目或员工）
   */
  const getProjectPermissionMessage = (action: string, targetId?: string) => {
    if (!userStore.user) {
      return '请先登录'
    }
    
    switch (action) {
      case 'viewProjectBonus':
        return canViewProjectBonus.value 
          ? '您有权限查看项目奖金信息' 
          : '您没有权限查看项目奖金信息'
      
      case 'viewOwnProjectBonus':
        return canViewOwnProjectBonus.value
          ? '您可以查看自己参与项目的奖金信息'
          : '您没有权限查看项目奖金信息'
      
      case 'applyProject':
        return canApplyProject.value
          ? '您可以申请参与项目'
          : '您没有权限申请项目'
      
      case 'viewPositionPromotion':
        return canViewPositionPromotion.value
          ? '您可以查看岗位晋升信息'
          : '您没有权限查看岗位晋升信息'
      
      case 'managePositionPromotion':
        return canManagePositionPromotion.value
          ? '您有权限维护岗位晋升信息'
          : '您没有权限维护岗位晋升信息'
      
      default:
        return '权限检查失败'
    }
  }

  return {
    canPublishProject,
    canApproveTeam,
    canViewProject,
    canViewProjectBonus,
    canViewOwnProjectBonus,
    canApplyProject,
    canViewPositionPromotion,
    canManagePositionPromotion,
    canApplyTeamBuilding,
    canViewEmployeeProjectBonus,
    canManageProject,
    isAdmin,
    canViewNotifications,
    hasPermission,
    hasAnyPermission,
    getProjectPermissionMessage
  }
}