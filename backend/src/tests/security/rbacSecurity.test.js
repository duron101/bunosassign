/**
 * RBAC权限系统安全测试
 * 测试权限验证逻辑的安全性和正确性
 */

const { PermissionValidator, PERMISSIONS, ROLE_PERMISSIONS } = require('../../config/permissions')

describe('RBAC Security Tests', () => {
  describe('PermissionValidator.isValidPermissionArray', () => {
    test('应该正确验证有效的权限数组', () => {
      expect(PermissionValidator.isValidPermissionArray(['user:view', 'user:create'])).toBe(true)
      expect(PermissionValidator.isValidPermissionArray(['*'])).toBe(true)
    })

    test('应该正确识别无效的权限数组', () => {
      expect(PermissionValidator.isValidPermissionArray(null)).toBe(false)
      expect(PermissionValidator.isValidPermissionArray(undefined)).toBe(false)
      expect(PermissionValidator.isValidPermissionArray([])).toBe(false)
      expect(PermissionValidator.isValidPermissionArray('user:view')).toBe(false)
      expect(PermissionValidator.isValidPermissionArray({})).toBe(false)
    })
  })

  describe('PermissionValidator.hasPermission', () => {
    test('超级管理员应该拥有所有权限', () => {
      const superAdminPermissions = ['*']
      
      expect(PermissionValidator.hasPermission(superAdminPermissions, 'user:view')).toBe(true)
      expect(PermissionValidator.hasPermission(superAdminPermissions, 'user:delete')).toBe(true)
      expect(PermissionValidator.hasPermission(superAdminPermissions, 'system:config')).toBe(true)
      expect(PermissionValidator.hasPermission(superAdminPermissions, ['user:view', 'user:create'])).toBe(true)
    })

    test('应该正确检查精确权限匹配', () => {
      const userPermissions = ['user:view', 'employee:create']
      
      expect(PermissionValidator.hasPermission(userPermissions, 'user:view')).toBe(true)
      expect(PermissionValidator.hasPermission(userPermissions, 'employee:create')).toBe(true)
      expect(PermissionValidator.hasPermission(userPermissions, 'user:delete')).toBe(false)
    })

    test('应该正确检查通配符权限', () => {
      const userPermissions = ['user:*', 'employee:view']
      
      expect(PermissionValidator.hasPermission(userPermissions, 'user:view')).toBe(true)
      expect(PermissionValidator.hasPermission(userPermissions, 'user:create')).toBe(true)
      expect(PermissionValidator.hasPermission(userPermissions, 'user:delete')).toBe(true)
      expect(PermissionValidator.hasPermission(userPermissions, 'employee:create')).toBe(false)
    })

    test('应该处理数组形式的所需权限', () => {
      const userPermissions = ['user:view', 'employee:create']
      
      expect(PermissionValidator.hasPermission(userPermissions, ['user:view', 'user:create'])).toBe(true)
      expect(PermissionValidator.hasPermission(userPermissions, ['user:delete', 'user:update'])).toBe(false)
    })

    test('应该安全处理无效输入', () => {
      expect(PermissionValidator.hasPermission(null, 'user:view')).toBe(false)
      expect(PermissionValidator.hasPermission(undefined, 'user:view')).toBe(false)
      expect(PermissionValidator.hasPermission([], 'user:view')).toBe(false)
      expect(PermissionValidator.hasPermission(['user:view'], null)).toBe(false)
    })
  })

  describe('PermissionValidator.hasRBACPermission', () => {
    test('应该正确检查资源和操作权限', () => {
      const userPermissions = ['user:view', 'employee:*', 'calculation:execute']
      
      expect(PermissionValidator.hasRBACPermission(userPermissions, 'user', 'view')).toBe(true)
      expect(PermissionValidator.hasRBACPermission(userPermissions, 'user', 'create')).toBe(false)
      expect(PermissionValidator.hasRBACPermission(userPermissions, 'employee', 'view')).toBe(true)
      expect(PermissionValidator.hasRBACPermission(userPermissions, 'employee', 'create')).toBe(true)
      expect(PermissionValidator.hasRBACPermission(userPermissions, 'calculation', 'execute')).toBe(true)
    })

    test('超级管理员应该通过所有RBAC检查', () => {
      const superAdminPermissions = ['*']
      
      expect(PermissionValidator.hasRBACPermission(superAdminPermissions, 'user', 'delete')).toBe(true)
      expect(PermissionValidator.hasRBACPermission(superAdminPermissions, 'system', 'config')).toBe(true)
    })
  })

  describe('PermissionValidator.getUserPermissions', () => {
    test('应该优先从Role获取权限', () => {
      const user = {
        permissions: ['user:view'],
        Role: {
          permissions: ['user:*', 'employee:view']
        }
      }
      
      const permissions = PermissionValidator.getUserPermissions(user)
      expect(permissions).toEqual(['user:*', 'employee:view'])
    })

    test('应该在没有Role时使用直接权限', () => {
      const user = {
        permissions: ['user:view', 'employee:create']
      }
      
      const permissions = PermissionValidator.getUserPermissions(user)
      expect(permissions).toEqual(['user:view', 'employee:create'])
    })

    test('应该在没有权限时返回空数组', () => {
      const user = {}
      const permissions = PermissionValidator.getUserPermissions(user)
      expect(permissions).toEqual([])
    })

    test('应该安全处理null/undefined用户', () => {
      expect(PermissionValidator.getUserPermissions(null)).toEqual([])
      expect(PermissionValidator.getUserPermissions(undefined)).toEqual([])
    })
  })

  describe('权限注入攻击防护', () => {
    test('应该防止权限数组污染攻击', () => {
      const maliciousPermissions = [
        '*',
        'user:view',
        null,
        undefined,
        '',
        'invalid_permission',
        'user:', // 无效格式
        ':view', // 无效格式
        'user:view:extra' // 额外部分
      ]
      
      // 即使包含恶意数据，也应该能正常验证有效权限
      expect(PermissionValidator.hasPermission(maliciousPermissions, 'user:view')).toBe(true)
      expect(PermissionValidator.hasPermission(maliciousPermissions, 'user:delete')).toBe(true) // 因为包含 '*'
    })

    test('应该防止权限提升攻击', () => {
      const userPermissions = ['user:view'] // 普通用户权限
      
      // 尝试使用不同的权限格式进行提升攻击
      expect(PermissionValidator.hasPermission(userPermissions, 'user:delete')).toBe(false)
      expect(PermissionValidator.hasPermission(userPermissions, '*')).toBe(false)
      expect(PermissionValidator.hasPermission(userPermissions, 'user:*')).toBe(false)
    })

    test('应该防止路径遍历式权限攻击', () => {
      const userPermissions = ['user:view']
      
      // 尝试使用路径遍历方式访问其他资源
      expect(PermissionValidator.hasRBACPermission(userPermissions, '../admin', 'config')).toBe(false)
      expect(PermissionValidator.hasRBACPermission(userPermissions, 'user/../system', 'config')).toBe(false)
    })
  })

  describe('权限配置安全性', () => {
    test('所有预定义权限应该具有有效格式', () => {
      const flatPermissions = []
      
      // 收集所有权限
      Object.values(PERMISSIONS).forEach(permissionGroup => {
        if (typeof permissionGroup === 'string') {
          flatPermissions.push(permissionGroup)
        } else {
          Object.values(permissionGroup).forEach(permission => {
            flatPermissions.push(permission)
          })
        }
      })
      
      // 验证每个权限格式
      flatPermissions.forEach(permission => {
        expect(PermissionValidator.isValidPermission(permission)).toBe(true)
      })
    })

    test('角色权限配置应该只包含有效权限', () => {
      Object.entries(ROLE_PERMISSIONS).forEach(([roleName, permissions]) => {
        permissions.forEach(permission => {
          expect(PermissionValidator.isValidPermission(permission)).toBe(true)
        })
      })
    })
  })

  describe('边界条件测试', () => {
    test('应该处理大量权限数组', () => {
      const largePermissionArray = []
      for (let i = 0; i < 10000; i++) {
        largePermissionArray.push(`resource${i}:action${i}`)
      }
      
      expect(PermissionValidator.isValidPermissionArray(largePermissionArray)).toBe(true)
      expect(PermissionValidator.hasPermission(largePermissionArray, 'resource5000:action5000')).toBe(true)
    })

    test('应该处理极长的权限字符串', () => {
      const longPermission = 'a'.repeat(1000) + ':' + 'b'.repeat(1000)
      expect(PermissionValidator.isValidPermission(longPermission)).toBe(true)
    })

    test('应该处理特殊字符权限', () => {
      // 测试包含特殊字符的权限（应该被拒绝）
      expect(PermissionValidator.isValidPermission('user:view<script>')).toBe(false)
      expect(PermissionValidator.isValidPermission('user:view"onload')).toBe(false)
      expect(PermissionValidator.isValidPermission("user:view'alert")).toBe(false)
    })
  })

  describe('性能测试', () => {
    test('权限检查应该在合理时间内完成', () => {
      const userPermissions = ['user:view', 'employee:create', 'department:*']
      const start = Date.now()
      
      // 执行大量权限检查
      for (let i = 0; i < 10000; i++) {
        PermissionValidator.hasPermission(userPermissions, 'user:view')
        PermissionValidator.hasRBACPermission(userPermissions, 'employee', 'create')
      }
      
      const duration = Date.now() - start
      expect(duration).toBeLessThan(1000) // 应该在1秒内完成
    })
  })
})

describe('实际使用场景测试', () => {
  const createMockUser = (permissions, roleName = null) => {
    if (roleName) {
      return {
        id: 1,
        username: 'testuser',
        Role: {
          name: roleName,
          permissions: permissions
        }
      }
    } else {
      return {
        id: 1,
        username: 'testuser',
        permissions: permissions
      }
    }
  }

  test('管理员用户应该能访问所有资源', () => {
    const adminUser = createMockUser(['*'], 'admin')
    const permissions = PermissionValidator.getUserPermissions(adminUser)
    
    expect(PermissionValidator.hasPermission(permissions, PERMISSIONS.USER.DELETE)).toBe(true)
    expect(PermissionValidator.hasPermission(permissions, PERMISSIONS.CALCULATION.EXECUTE)).toBe(true)
    expect(PermissionValidator.hasPermission(permissions, PERMISSIONS.SYSTEM.CONFIG)).toBe(true)
  })

  test('HR管理员应该只能访问人力资源相关功能', () => {
    const hrUser = createMockUser(ROLE_PERMISSIONS.HR_ADMIN, 'hr_admin')
    const permissions = PermissionValidator.getUserPermissions(hrUser)
    
    expect(PermissionValidator.hasPermission(permissions, PERMISSIONS.EMPLOYEE.VIEW)).toBe(true)
    expect(PermissionValidator.hasPermission(permissions, PERMISSIONS.EMPLOYEE.CREATE)).toBe(true)
    expect(PermissionValidator.hasPermission(permissions, PERMISSIONS.CALCULATION.EXECUTE)).toBe(false)
    expect(PermissionValidator.hasPermission(permissions, PERMISSIONS.SYSTEM.CONFIG)).toBe(false)
  })

  test('普通员工应该只能查看基础信息', () => {
    const employeeUser = createMockUser(ROLE_PERMISSIONS.EMPLOYEE, 'employee')
    const permissions = PermissionValidator.getUserPermissions(employeeUser)
    
    expect(PermissionValidator.hasPermission(permissions, PERMISSIONS.PROJECT.VIEW)).toBe(true)
    expect(PermissionValidator.hasPermission(permissions, PERMISSIONS.REPORT.VIEW)).toBe(true)
    expect(PermissionValidator.hasPermission(permissions, PERMISSIONS.USER.CREATE)).toBe(false)
    expect(PermissionValidator.hasPermission(permissions, PERMISSIONS.EMPLOYEE.DELETE)).toBe(false)
  })

  test('财务管理员应该能执行奖金计算但不能管理用户', () => {
    const financeUser = createMockUser(ROLE_PERMISSIONS.FINANCE_ADMIN, 'finance_admin')
    const permissions = PermissionValidator.getUserPermissions(financeUser)
    
    expect(PermissionValidator.hasPermission(permissions, PERMISSIONS.CALCULATION.EXECUTE)).toBe(true)
    expect(PermissionValidator.hasPermission(permissions, PERMISSIONS.CALCULATION.EXPORT)).toBe(true)
    expect(PermissionValidator.hasPermission(permissions, PERMISSIONS.USER.CREATE)).toBe(false)
    expect(PermissionValidator.hasPermission(permissions, PERMISSIONS.USER.DELETE)).toBe(false)
  })
})