import { computed } from 'vue'
import { useUserStore } from '@/store/modules/user'

interface SalaryPermissionOptions {
  isViewingOwnData?: boolean
}

export function useSalaryPermission(options?: SalaryPermissionOptions) {
  const userStore = useUserStore()
  const { isViewingOwnData = false } = options || {}
  
  // 检查是否有薪酬查看权限
  const canViewSalary = computed(() => {
    const userRole = userStore.user?.roleName?.toUpperCase() || ''
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'HR_ADMIN', 'HR_SPECIALIST', 'FINANCE_ADMIN']
    return allowedRoles.includes(userRole) || userStore.hasPermission('*')
  })
  
  // 检查是否有薪酬编辑权限
  const canEditSalary = computed(() => {
    const userRole = userStore.user?.roleName?.toUpperCase() || ''
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'HR_ADMIN', 'FINANCE_ADMIN']
    return allowedRoles.includes(userRole) || userStore.hasPermission('*')
  })

  // 检查是否可以查看自己的奖金信息
  const canViewOwnSalary = computed(() => {
    // 普通员工可以查看自己的奖金信息
    return true
  })

  // 检查是否可以查看其他人的奖金信息
  const canViewOthersSalary = computed(() => {
    const userRole = userStore.user?.roleName?.toUpperCase() || ''
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'HR_ADMIN', 'HR_SPECIALIST', 'FINANCE_ADMIN']
    return allowedRoles.includes(userRole) || userStore.hasPermission('*')
  })

  // 检查是否可以查看指定员工的奖金信息
  const canViewEmployeeSalary = (targetEmployeeId: string) => {
    const currentUser = userStore.user
    if (!currentUser) return false
    
    // 如果查询的是自己，允许查看
    const isOwnData = targetEmployeeId === currentUser.employeeId || 
                     targetEmployeeId === currentUser.employeeNumber ||
                     targetEmployeeId === currentUser.id?.toString()
    
    if (isOwnData) {
      return canViewOwnSalary.value
    }
    
    // 查看他人数据需要特定权限
    return canViewOthersSalary.value
  }
  
  // 获取薪酬显示文本
  const getSalaryDisplayText = (salary: number | null | undefined) => {
    if (!canViewSalary.value || salary == null) {
      return '***'
    }
    return formatCurrency(salary)
  }
  
  // 格式化货币显示
  const formatCurrency = (amount: number) => {
    if (amount == null) return '***'
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }
  
  // 检查用户角色
  const getUserRole = computed(() => {
    return userStore.user?.roleName || 'EMPLOYEE'
  })
  
  // 是否为管理员角色
  const isAdmin = computed(() => {
    const role = getUserRole.value.toUpperCase()
    return ['SUPER_ADMIN', 'ADMIN'].includes(role)
  })
  
  // 是否为HR角色
  const isHR = computed(() => {
    const role = getUserRole.value.toUpperCase()
    return ['HR_ADMIN', 'HR_SPECIALIST'].includes(role)
  })
  
  // 是否为财务角色
  const isFinance = computed(() => {
    const role = getUserRole.value.toUpperCase()
    return ['FINANCE_ADMIN'].includes(role)
  })
  
  return {
    canViewSalary,
    canEditSalary,
    canViewOwnSalary,
    canViewOthersSalary,
    canViewEmployeeSalary,
    getSalaryDisplayText,
    formatCurrency,
    getUserRole,
    isAdmin,
    isHR,
    isFinance
  }
}
