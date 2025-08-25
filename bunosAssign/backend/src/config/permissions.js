/**
 * 权限配置和验证模块
 * 定义系统中所有可用权限和角色配置
 */

// 系统权限定义
const PERMISSIONS = {
  // 超级管理员权限
  SUPER_ADMIN: '*',
  
  // 用户管理权限
  USER: {
    VIEW: 'user:view',
    CREATE: 'user:create',
    UPDATE: 'user:update',
    DELETE: 'user:delete',
    RESET_PASSWORD: 'user:reset-password',
    ALL: 'user:*'
  },
  
  // 员工管理权限
  EMPLOYEE: {
    VIEW: 'employee:view',
    CREATE: 'employee:create',
    UPDATE: 'employee:update',
    DELETE: 'employee:delete',
    TRANSFER: 'employee:transfer',
    ALL: 'employee:*'
  },
  
  // 部门管理权限
  DEPARTMENT: {
    VIEW: 'department:view',
    CREATE: 'department:create',
    UPDATE: 'department:update',
    DELETE: 'department:delete',
    ALL: 'department:*'
  },
  
  // 岗位管理权限
  POSITION: {
    VIEW: 'position:view',
    CREATE: 'position:create',
    UPDATE: 'position:update',
    DELETE: 'position:delete',
    APPROVE: 'position:approve',
    ALL: 'position:*'
  },
  
  // 岗位大全管理权限
  POSITION_ENCYCLOPEDIA: {
    VIEW: 'position_encyclopedia:view',
    MANAGE: 'position_encyclopedia:manage',
    UPDATE_REQUIREMENTS: 'position_encyclopedia:update_requirements',
    UPDATE_CAREER_PATH: 'position_encyclopedia:update_career_path',
    UPDATE_SKILLS: 'position_encyclopedia:update_skills',
    BULK_UPDATE: 'position_encyclopedia:bulk_update',
    EXPORT: 'position_encyclopedia:export',
    ALL: 'position_encyclopedia:*'
  },
  
  // 奖金计算权限
  CALCULATION: {
    READ: 'calculation:read',
    CREATE: 'calculation:create',
    UPDATE: 'calculation:update',
    DELETE: 'calculation:delete',
    EXECUTE: 'calculation:execute',
    SIMULATE: 'calculation:simulate',
    EXPORT: 'calculation:export',
    ALL: 'calculation:*'
  },
  
  // 模拟分析权限
  SIMULATION: {
    VIEW: 'simulation:view',
    RUN: 'simulation:run',
    CREATE: 'simulation:create',
    DELETE: 'simulation:delete',
    ANALYZE: 'simulation:analyze',
    ALL: 'simulation:*'
  },
  
  // 项目管理权限
  PROJECT: {
    VIEW: 'project:view',
    CREATE: 'project:create',
    UPDATE: 'project:update',
    DELETE: 'project:delete',
    APPROVE: 'project:approve',
    APPLY: 'project:apply',
    PUBLISH: 'project:publish',
    START: 'project:start',
    PAUSE: 'project:pause',
    CLOSE: 'project:close',
    MANAGE: 'project:manage',
    COST_VIEW: 'project:cost:view',
    COST_CREATE: 'project:cost:create',
    COST_UPDATE: 'project:cost:update',
    COST_DELETE: 'project:cost:delete',
    COST_VIEW_ALL: 'project:cost:view:all',
    COST_MANAGE: 'project:cost:manage',
    // 项目权重管理权限
    WEIGHTS_VIEW: 'project:weights:view',
    WEIGHTS_VIEW_OWN: 'project:weights:view_own', // 查看自己管理的项目权重
    WEIGHTS_VIEW_ALL: 'project:weights:view_all', // 查看所有项目权重
    WEIGHTS_UPDATE: 'project:weights:update',
    WEIGHTS_UPDATE_OWN: 'project:weights:update_own', // 修改自己管理的项目权重
    WEIGHTS_UPDATE_ALL: 'project:weights:update_all', // 修改所有项目权重
    WEIGHTS_APPROVE: 'project:weights:approve', // 审批权重配置
    ALL: 'project:*'
  },
  
  // 项目协作权限
  COLLABORATION: {
    VIEW: 'collaboration:view',
    PUBLISH: 'collaboration:publish',
    APPLY: 'collaboration:apply',
    APPROVE: 'collaboration:approve',
    ALL: 'collaboration:*'
  },
  
  // 团队管理权限
  TEAM: {
    VIEW: 'team:view',
    BUILD: 'team:build',
    MANAGE: 'team:manage',
    APPROVE: 'team:approve',
    ALL: 'team:*'
  },
  
  // 成员管理权限
  MEMBER: {
    VIEW: 'member:view',
    RECRUIT: 'member:recruit',
    APPROVE: 'member:approve',
    ASSIGN: 'member:assign',
    REMOVE: 'member:remove',
    ALL: 'member:*'
  },
  
  // 角色分配权限
  ROLE: {
    VIEW: 'role:view',
    ASSIGN: 'role:assign',
    UPDATE: 'role:update',
    ALL: 'role:*'
  },
  
  // 奖金管理权限
  BONUS: {
    VIEW: 'bonus:view',
    CREATE: 'bonus:create',
    CALCULATE: 'bonus:calculate',
    APPROVE: 'bonus:approve',
    DISTRIBUTE: 'bonus:distribute',
    ADJUST: 'bonus:adjust',
    ALL: 'bonus:*'
  },
  
  // 奖金池管理权限
  BONUS_POOL: {
    VIEW: 'bonus_pool:view',
    CREATE: 'bonus_pool:create',
    UPDATE: 'bonus_pool:update',
    DELETE: 'bonus_pool:delete',
    CALCULATE: 'bonus_pool:calculate',
    APPROVE: 'bonus_pool:approve',
    EXPORT: 'bonus_pool:export',
    MANAGE_OWN: 'bonus_pool:manage_own', // 管理自己创建的奖金池
    MANAGE_ALL: 'bonus_pool:manage_all', // 管理所有奖金池
    ALL: 'bonus_pool:*'
  },
  
  // 财务权限
  FINANCE: {
    VIEW: 'finance:view',
    MANAGE: 'finance:manage',
    APPROVE: 'finance:approve',
    ALL: 'finance:*'
  },
  
  // 业务线管理权限
  BUSINESS_LINE: {
    VIEW: 'business_line:view',
    CREATE: 'business_line:create',
    UPDATE: 'business_line:update',
    DELETE: 'business_line:delete',
    ALL: 'business_line:*'
  },
  
  // 报表权限
  REPORT: {
    VIEW: 'report:view',
    EXPORT: 'report:export',
    PERSONAL: 'report:personal',
    ALL: 'report:*'
  },
  
  // 系统设置权限
  SYSTEM: {
    CONFIG: 'system:config',
    AUDIT: 'system:audit',
    BACKUP: 'system:backup',
    MAINTENANCE: 'system:maintenance',
    ALL: 'system:*'
  },
  
  // 通知管理权限
  NOTIFICATION: {
    VIEW: 'notification:view',
    CREATE: 'notification:create',
    UPDATE: 'notification:update',
    DELETE: 'notification:delete',
    MANAGE: 'notification:manage',
    ALL: 'notification:*'
  }
}

// 预定义角色权限配置
const ROLE_PERMISSIONS = {
  // 超级管理员 - 拥有所有权限
  SUPER_ADMIN: [PERMISSIONS.SUPER_ADMIN],
  
  // 系统管理员 - 拥有大部分管理权限
  ADMIN: [
    PERMISSIONS.USER.ALL,
    PERMISSIONS.EMPLOYEE.ALL,
    PERMISSIONS.DEPARTMENT.ALL,
    PERMISSIONS.POSITION.ALL,
    PERMISSIONS.POSITION_ENCYCLOPEDIA.VIEW,
    PERMISSIONS.POSITION_ENCYCLOPEDIA.MANAGE,
    PERMISSIONS.POSITION_ENCYCLOPEDIA.UPDATE_REQUIREMENTS,
    PERMISSIONS.POSITION_ENCYCLOPEDIA.UPDATE_CAREER_PATH,
    PERMISSIONS.POSITION_ENCYCLOPEDIA.UPDATE_SKILLS,
    PERMISSIONS.POSITION_ENCYCLOPEDIA.BULK_UPDATE,
    PERMISSIONS.POSITION_ENCYCLOPEDIA.EXPORT,
    PERMISSIONS.BUSINESS_LINE.ALL,
    PERMISSIONS.PROJECT.ALL,
    PERMISSIONS.COLLABORATION.ALL,
    PERMISSIONS.TEAM.ALL,
    PERMISSIONS.MEMBER.ALL,
    PERMISSIONS.ROLE.ALL,
    PERMISSIONS.BONUS.VIEW,
    PERMISSIONS.BONUS.CREATE,
    PERMISSIONS.BONUS.CALCULATE,
    PERMISSIONS.FINANCE.VIEW,
    PERMISSIONS.SYSTEM.CONFIG,
    PERMISSIONS.SYSTEM.AUDIT,
    PERMISSIONS.NOTIFICATION.ALL,
    PERMISSIONS.REPORT.ALL
  ],
  
  // HR管理员 - 人力资源相关权限
  HR_ADMIN: [
    PERMISSIONS.USER.VIEW,
    PERMISSIONS.USER.CREATE,
    PERMISSIONS.USER.UPDATE,
    PERMISSIONS.EMPLOYEE.ALL,
    PERMISSIONS.DEPARTMENT.VIEW,
    PERMISSIONS.POSITION.VIEW,
    PERMISSIONS.POSITION_ENCYCLOPEDIA.VIEW,
    PERMISSIONS.POSITION_ENCYCLOPEDIA.MANAGE,
    PERMISSIONS.POSITION_ENCYCLOPEDIA.UPDATE_REQUIREMENTS,
    PERMISSIONS.POSITION_ENCYCLOPEDIA.UPDATE_CAREER_PATH,
    PERMISSIONS.POSITION_ENCYCLOPEDIA.UPDATE_SKILLS,
    PERMISSIONS.POSITION_ENCYCLOPEDIA.BULK_UPDATE,
    PERMISSIONS.POSITION_ENCYCLOPEDIA.EXPORT,
    PERMISSIONS.PROJECT.VIEW,
    PERMISSIONS.PROJECT.WEIGHTS_VIEW_ALL, // HR可以查看所有项目权重
    PERMISSIONS.PROJECT.WEIGHTS_UPDATE_ALL, // HR可以修改所有项目权重
    PERMISSIONS.COLLABORATION.VIEW,
    PERMISSIONS.TEAM.VIEW,
    PERMISSIONS.MEMBER.VIEW,
    PERMISSIONS.MEMBER.APPROVE,
    PERMISSIONS.ROLE.VIEW,
    PERMISSIONS.ROLE.ASSIGN,
    PERMISSIONS.BONUS.VIEW,
    PERMISSIONS.BONUS.APPROVE,
    PERMISSIONS.NOTIFICATION.VIEW,
    PERMISSIONS.NOTIFICATION.CREATE,
    PERMISSIONS.REPORT.VIEW,
    PERMISSIONS.REPORT.EXPORT
  ],
  
  // 业务线负责人 - 本业务线岗位管理权限
  BUSINESS_LINE_MANAGER: [
    PERMISSIONS.EMPLOYEE.VIEW,
    PERMISSIONS.POSITION.VIEW,
    PERMISSIONS.POSITION_ENCYCLOPEDIA.VIEW,
    PERMISSIONS.POSITION_ENCYCLOPEDIA.UPDATE_REQUIREMENTS,
    PERMISSIONS.POSITION_ENCYCLOPEDIA.UPDATE_CAREER_PATH,
    PERMISSIONS.POSITION_ENCYCLOPEDIA.UPDATE_SKILLS,
    PERMISSIONS.PROJECT.VIEW,
    PERMISSIONS.TEAM.VIEW,
    PERMISSIONS.MEMBER.VIEW,
    PERMISSIONS.NOTIFICATION.VIEW,
    PERMISSIONS.REPORT.VIEW
  ],
  
  // HR专员 - 基础人力资源权限
  HR_SPECIALIST: [
    PERMISSIONS.EMPLOYEE.VIEW,
    PERMISSIONS.EMPLOYEE.CREATE,
    PERMISSIONS.EMPLOYEE.UPDATE,
    PERMISSIONS.POSITION.VIEW,
    PERMISSIONS.POSITION_ENCYCLOPEDIA.VIEW,
    PERMISSIONS.POSITION_ENCYCLOPEDIA.UPDATE_SKILLS,
    PERMISSIONS.PROJECT.VIEW,
    PERMISSIONS.TEAM.VIEW,
    PERMISSIONS.MEMBER.VIEW,
    PERMISSIONS.NOTIFICATION.VIEW,
    PERMISSIONS.REPORT.VIEW
  ],
  
  // 财务管理员 - 奖金计算相关权限
  FINANCE_ADMIN: [
    PERMISSIONS.EMPLOYEE.VIEW,
    PERMISSIONS.POSITION.VIEW,
    PERMISSIONS.POSITION_ENCYCLOPEDIA.VIEW,
    PERMISSIONS.PROJECT.WEIGHTS_VIEW_ALL, // 查看所有项目权重
    PERMISSIONS.PROJECT.WEIGHTS_APPROVE, // 审批权重配置
    PERMISSIONS.CALCULATION.ALL,
    PERMISSIONS.SIMULATION.ALL,
    PERMISSIONS.BONUS.ALL,
    PERMISSIONS.BONUS_POOL.ALL, // 完全的奖金池管理权限
    PERMISSIONS.FINANCE.ALL,
    PERMISSIONS.REPORT.ALL
  ],
  
  // 项目经理 - 项目管理权限
  PROJECT_MANAGER: [
    PERMISSIONS.EMPLOYEE.VIEW,
    PERMISSIONS.POSITION.VIEW,
    PERMISSIONS.POSITION_ENCYCLOPEDIA.VIEW,
    PERMISSIONS.PROJECT.VIEW,
    PERMISSIONS.PROJECT.CREATE,
    PERMISSIONS.PROJECT.UPDATE,
    PERMISSIONS.PROJECT.MANAGE,
    PERMISSIONS.PROJECT.WEIGHTS_VIEW_OWN, // 只能查看自己管理的项目权重
    PERMISSIONS.PROJECT.WEIGHTS_UPDATE_OWN, // 只能修改自己管理的项目权重
    PERMISSIONS.COLLABORATION.ALL,
    PERMISSIONS.TEAM.ALL,
    PERMISSIONS.MEMBER.ALL,
    PERMISSIONS.NOTIFICATION.VIEW,
    PERMISSIONS.REPORT.VIEW
  ],
  
  // 普通员工 - 基础查看权限
  EMPLOYEE: [
    PERMISSIONS.POSITION.VIEW,
    PERMISSIONS.POSITION_ENCYCLOPEDIA.VIEW,
    PERMISSIONS.PROJECT.VIEW,
    PERMISSIONS.COLLABORATION.VIEW,
    PERMISSIONS.TEAM.VIEW,
    PERMISSIONS.NOTIFICATION.VIEW,
    PERMISSIONS.REPORT.PERSONAL
  ]
}

// 权限验证辅助函数
class PermissionValidator {
  /**
   * 验证权限数组是否有效
   * @param {Array} permissions - 权限数组
   * @returns {boolean}
   */
  static isValidPermissionArray(permissions) {
    return Array.isArray(permissions) && permissions.length > 0
  }
  
  /**
   * 安全获取用户权限
   * @param {Object} user - 用户对象
   * @returns {Array} 权限数组
   */
  static getUserPermissions(user) {
    if (!user) return []
    
    // 优先使用直接权限
    if (user.permissions && Array.isArray(user.permissions)) {
      return user.permissions
    }
    
    // 从角色获取权限
    if (user.Role && user.Role.permissions && Array.isArray(user.Role.permissions)) {
      return user.Role.permissions
    }
    
    // 从角色名称推断权限
    if (user.roleName) {
      return this.getRolePermissions(user.roleName) || []
    }
    
    return []
  }
  
  /**
   * 获取角色权限
   * @param {string} roleName - 角色名称
   * @returns {Array} 权限数组
   */
  static getRolePermissions(roleName) {
    const roleKey = roleName.toUpperCase().replace(/\s+/g, '_')
    return ROLE_PERMISSIONS[roleKey] || []
  }
  
  /**
   * 检查用户是否拥有指定权限
   * @param {Array} userPermissions - 用户权限数组
   * @param {string|Array} requiredPermissions - 所需权限
   * @returns {boolean}
   */
  static hasPermission(userPermissions, requiredPermissions) {
    if (!this.isValidPermissionArray(userPermissions)) {
      return false
    }
    
    // 超级管理员拥有所有权限
    if (userPermissions.includes(PERMISSIONS.SUPER_ADMIN)) {
      return true
    }
    
    const required = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions]
    
    return required.some(permission => {
      // 检查精确权限匹配
      if (userPermissions.includes(permission)) {
        return true
      }
      
      // 检查通配符权限匹配 - 安全处理null/undefined
      if (permission && typeof permission === 'string') {
        const [resource, action] = permission.split(':')
        if (resource && action) {
          return userPermissions.includes(`${resource}:*`) || userPermissions.includes(`*:${action}`)
        }
      }
      
      return false
    })
  }

  /**
   * RBAC权限检查方法（兼容性方法）
   * @param {Array} userPermissions - 用户权限数组
   * @param {string} resource - 资源类型
   * @param {string} action - 操作类型
   * @returns {boolean}
   */
  static hasRBACPermission(userPermissions, resource, action) {
    const requiredPermission = `${resource}:${action}`
    return this.hasPermission(userPermissions, requiredPermission)
  }
  
  /**
   * 检查用户是否拥有资源访问权限
   * @param {Object} user - 用户对象
   * @param {string} resourceType - 资源类型
   * @param {string} action - 操作类型
   * @param {Object} resource - 资源对象（可选）
   * @returns {boolean}
   */
  static canAccessResource(user, resourceType, action, resource = null) {
    const userPermissions = this.getUserPermissions(user)
    const requiredPermission = `${resourceType}:${action}`
    
    // 检查基础权限
    if (!this.hasPermission(userPermissions, requiredPermission)) {
      return false
    }
    
    // 如果有资源对象，检查资源级权限
    if (resource) {
      return this.checkResourceLevelPermission(user, resourceType, action, resource)
    }
    
    return true
  }
  
  /**
   * 检查资源级权限
   * @param {Object} user - 用户对象
   * @param {string} resourceType - 资源类型
   * @param {string} action - 操作类型
   * @param {Object} resource - 资源对象
   * @returns {boolean}
   */
  static checkResourceLevelPermission(user, resourceType, action, resource) {
    // 项目资源权限检查
    if (resourceType === 'project') {
      return this.checkProjectPermission(user, action, resource)
    }
    
    // 部门资源权限检查
    if (resourceType === 'department') {
      return this.checkDepartmentPermission(user, action, resource)
    }
    
    // 员工资源权限检查
    if (resourceType === 'employee') {
      return this.checkEmployeePermission(user, action, resource)
    }
    
    return true
  }
  
  /**
   * 检查项目权限
   * @param {Object} user - 用户对象
   * @param {string} action - 操作类型
   * @param {Object} project - 项目对象
   * @returns {boolean}
   */
  static checkProjectPermission(user, action, project) {
    const userPermissions = this.getUserPermissions(user)
    
    // 超级管理员和系统管理员拥有所有项目权限
    if (this.hasPermission(userPermissions, ['*', 'project:*'])) {
      return true
    }
    
    // 项目经理可以管理自己管理的项目
    if (action === 'manage' && project.managerId === user.employeeId) {
      return true
    }
    
    // 项目成员可以查看自己参与的项目
    if (action === 'view' && project.members && project.members.includes(user.employeeId)) {
      return true
    }
    
    // 部门经理可以查看本部门项目
    if (action === 'view' && project.departmentId === user.departmentId) {
      return this.hasPermission(userPermissions, 'department:view')
    }
    
    return false
  }
  
  /**
   * 检查部门权限
   * @param {Object} user - 用户对象
   * @param {string} action - 操作类型
   * @param {Object} department - 部门对象
   * @returns {boolean}
   */
  static checkDepartmentPermission(user, action, department) {
    const userPermissions = this.getUserPermissions(user)
    
    // 超级管理员和系统管理员拥有所有部门权限
    if (this.hasPermission(userPermissions, ['*', 'department:*'])) {
      return true
    }
    
    // 部门经理可以管理本部门
    if (department.managerId === user.employeeId) {
      return true
    }
    
    // 检查是否是上级部门
    if (action === 'view' && department.parentId) {
      return this.checkDepartmentPermission(user, action, { id: department.parentId })
    }
    
    return false
  }
  
  /**
   * 检查员工权限
   * @param {Object} user - 用户对象
   * @param {string} action - 操作类型
   * @param {Object} employee - 员工对象
   * @returns {boolean}
   */
  static checkEmployeePermission(user, action, employee) {
    const userPermissions = this.getUserPermissions(user)
    
    // 超级管理员和系统管理员拥有所有员工权限
    if (this.hasPermission(userPermissions, ['*', 'employee:*'])) {
      return true
    }
    
    // 用户可以查看自己的信息
    if (action === 'view' && employee.id === user.employeeId) {
      return true
    }
    
    // 部门经理可以查看本部门员工
    if (action === 'view' && employee.departmentId === user.departmentId) {
      return this.hasPermission(userPermissions, 'department:view')
    }
    
    return false
  }
  
  /**
   * 获取用户可访问的资源列表
   * @param {Object} user - 用户对象
   * @param {string} resourceType - 资源类型
   * @param {Array} resources - 资源列表
   * @returns {Array} 过滤后的资源列表
   */
  static filterAccessibleResources(user, resourceType, resources) {
    if (!Array.isArray(resources)) return []
    
    return resources.filter(resource => 
      this.canAccessResource(user, resourceType, 'view', resource)
    )
  }
  
  /**
   * 检查权限委派
   * @param {Object} user - 用户对象
   * @param {string} permission - 所需权限
   * @param {Object} context - 上下文信息
   * @returns {boolean}
   */
  static checkDelegatedPermission(user, permission, context = {}) {
    // TODO: 实现权限委派检查逻辑
    // 这里可以检查用户是否有临时委派的权限
    return false
  }

  /**
   * 检查用户是否拥有指定权限
   * @param {Object} user - 用户对象
   * @param {string|Array} requiredPermissions - 所需权限
   * @returns {boolean}
   */
  static checkUserPermission(user, requiredPermissions) {
    const userPermissions = this.getUserPermissions(user)
    return this.hasPermission(userPermissions, requiredPermissions)
  }
}

// 权限委派配置
const DELEGATION_CONFIG = {
  // 委派权限的最大有效期（毫秒）
  MAX_DURATION: 7 * 24 * 60 * 60 * 1000, // 7天
  
  // 允许委派的权限类型
  DELEGATABLE_PERMISSIONS: [
    'project:view',
    'project:update',
    'team:view',
    'team:manage',
    'member:view',
    'member:approve',
    'bonus:view',
    'bonus:calculate'
  ],
  
  // 委派权限的审批要求
  APPROVAL_REQUIRED: [
    'project:delete',
    'team:delete',
    'member:remove',
    'bonus:approve',
    'finance:manage'
  ]
}

// 权限审计配置
const AUDIT_CONFIG = {
  // 需要记录审计日志的操作
  AUDITED_ACTIONS: [
    'user:create',
    'user:delete',
    'project:create',
    'project:delete',
    'bonus:approve',
    'finance:manage',
    'system:config'
  ],
  
  // 审计日志保留时间（天）
  RETENTION_DAYS: 365,
  
  // 敏感操作阈值
  SENSITIVE_THRESHOLDS: {
    'bonus:approve': 100000, // 10万以上奖金审批
    'finance:manage': 500000, // 50万以上财务操作
    'project:delete': 1000000 // 100万以上项目删除
  }
}

// 敏感操作权限映射
const SENSITIVE_OPERATIONS = {
  DELETE_USER: [PERMISSIONS.USER.DELETE],
  DELETE_EMPLOYEE: [PERMISSIONS.EMPLOYEE.DELETE],
  RESET_PASSWORD: [PERMISSIONS.USER.RESET_PASSWORD],
  EXECUTE_CALCULATION: [PERMISSIONS.CALCULATION.EXECUTE],
  SYSTEM_CONFIG: [PERMISSIONS.SYSTEM.CONFIG],
  DATA_EXPORT: [PERMISSIONS.CALCULATION.EXPORT, PERMISSIONS.REPORT.EXPORT]
}

// 数据访问级别
const DATA_ACCESS_LEVELS = {
  SELF: 'self',          // 只能访问自己的数据
  DEPARTMENT: 'department', // 只能访问本部门数据
  MANAGER: 'manager',    // 经理可以访问下属数据
  ALL: 'all'            // 可以访问所有数据
}

module.exports = {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  PermissionValidator,
  DELEGATION_CONFIG,
  AUDIT_CONFIG,
  SENSITIVE_OPERATIONS,
  DATA_ACCESS_LEVELS
}