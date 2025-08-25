import { computed } from 'vue'
import { useUserStore } from '@/store/modules/user'

/**
 * 项目协作权限组合函数
 */
export function useProjectPermissions() {
  const userStore = useUserStore()

  // 是否可以发布项目
  const canPublishProject = computed(() => {
    return userStore.permissions.includes('*') || userStore.permissions.includes('project:create')
  })

  // 是否可以审批团队申请
  const canApproveTeam = computed(() => {
    return userStore.permissions.includes('*') || userStore.permissions.includes('project:approve')
  })

  // 是否可以查看项目协作
  const canViewProject = computed(() => {
    return userStore.permissions.includes('*') || userStore.permissions.includes('project:view')
  })

  // 是否可以申请团队组建（项目经理或管理员）
  const canApplyTeamBuilding = (project?: any) => {
    // 管理员拥有所有权限
    if (userStore.permissions.includes('*')) {
      return true
    }
    
    // 检查是否是项目经理（这里可以根据实际业务逻辑调整）
    if (project && project.managerId === userStore.user?.id) {
      return true
    }
    
    // 检查是否有项目管理权限
    return userStore.permissions.includes('project_manager')
  }

  // 是否是管理员
  const isAdmin = computed(() => {
    return userStore.permissions.includes('*') || userStore.permissions.includes('admin')
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

  return {
    canPublishProject,
    canApproveTeam,
    canViewProject,
    canApplyTeamBuilding,
    isAdmin,
    canViewNotifications,
    hasPermission,
    hasAnyPermission
  }
}