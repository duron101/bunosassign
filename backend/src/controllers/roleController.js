const nedbService = require('../services/nedbService')
const logger = require('../utils/logger')

// 预定义的权限列表
const PERMISSIONS = {
  // 用户管理
  'user:view': '查看用户',
  'user:create': '创建用户',
  'user:update': '更新用户',
  'user:delete': '删除用户',
  'user:reset-password': '重置密码',
  
  // 角色管理
  'role:view': '查看角色',
  'role:create': '创建角色',
  'role:update': '更新角色',
  'role:delete': '删除角色',
  
  // 员工管理
  'employee:view': '查看员工',
  'employee:create': '创建员工',
  'employee:update': '更新员工',
  'employee:delete': '删除员工',
  
  // 部门管理
  'department:view': '查看部门',
  'department:create': '创建部门',
  'department:update': '更新部门',
  'department:delete': '删除部门',
  
  // 岗位管理
  'position:view': '查看岗位',
  'position:create': '创建岗位',
  'position:update': '更新岗位',
  'position:delete': '删除岗位',
  
  // 奖金池管理
  'bonus-pool:view': '查看奖金池',
  'bonus-pool:create': '创建奖金池',
  'bonus-pool:update': '更新奖金池',
  'bonus-pool:delete': '删除奖金池',
  'bonus-pool:calculate': '计算奖金',
  
  // 绩效管理
  'performance:view': '查看绩效',
  'performance:create': '录入绩效',
  'performance:update': '更新绩效',
  'performance:delete': '删除绩效',
  
  // 模拟分析
  'simulation:view': '查看模拟',
  'simulation:create': '创建模拟',
  'simulation:run': '运行模拟',
  'simulation:analyze': '敏感性分析',
  'simulation:delete': '删除模拟',
  'simulation:export': '导出报告',
  
  // 系统配置
  'system:view': '查看配置',
  'system:update': '更新配置',
  
  // 超级权限
  '*': '所有权限'
}

class RoleController {
  // 获取权限列表
  async getPermissions(req, res, next) {
    try {
      const permissions = Object.entries(PERMISSIONS).map(([key, name]) => ({
        key,
        name,
        group: key.split(':')[0]
      }))

      // 按组分类
      const groupedPermissions = permissions.reduce((acc, permission) => {
        const group = permission.group
        if (!acc[group]) {
          acc[group] = []
        }
        acc[group].push(permission)
        return acc
      }, {})

      res.json({
        code: 200,
        data: {
          permissions,
          groupedPermissions
        },
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get permissions error:', error)
      next(error)
    }
  }

  // 获取角色列表
  async getRoles(req, res, next) {
    try {
      const { 
        page = 1, 
        pageSize = 20, 
        search, 
        status 
      } = req.query

      // 获取所有角色
      let roles = await nedbService.getRoles()
      
      // 搜索过滤
      if (search) {
        roles = roles.filter(role => 
          role.name.toLowerCase().includes(search.toLowerCase()) ||
          (role.description && role.description.toLowerCase().includes(search.toLowerCase()))
        )
      }

      // 状态过滤
      if (status !== undefined) {
        roles = roles.filter(role => role.status === parseInt(status))
      }

      // 分页处理
      const total = roles.length
      const offset = (page - 1) * pageSize
      const paginatedRoles = roles.slice(offset, offset + parseInt(pageSize))

      // 统计每个角色的用户数量
      const rolesWithUserCount = await Promise.all(
        paginatedRoles.map(async (role) => {
          const users = await nedbService.find('users', { roleId: role._id })
          const userCount = users.length
          
          return {
            id: role._id, // 兼容前端期望的 id 字段
            name: role.name,
            description: role.description,
            permissions: role.permissions,
            status: role.status,
            createdAt: role.createdAt,
            userCount,
            permissionNames: role.permissions.map(p => PERMISSIONS[p] || p)
          }
        })
      )

      res.json({
        code: 200,
        data: {
          roles: rolesWithUserCount,
          pagination: {
            total: total,
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            totalPages: Math.ceil(total / pageSize)
          }
        },
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get roles error:', error)
      next(error)
    }
  }

  // 获取角色详情
  async getRole(req, res, next) {
    try {
      const { id } = req.params

      const role = await nedbService.getRoleById(id)

      if (!role) {
        return res.status(404).json({
          code: 404,
          message: '角色不存在',
          data: null
        })
      }

      // 获取使用此角色的用户数量
      const users = await nedbService.find('users', { roleId: id })
      const userCount = users.length

      const roleData = {
        id: role._id, // 兼容前端期望的 id 字段
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        status: role.status,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
        userCount,
        permissionNames: role.permissions.map(p => PERMISSIONS[p] || p)
      }

      res.json({
        code: 200,
        data: roleData,
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get role error:', error)
      next(error)
    }
  }

  // 创建角色
  async createRole(req, res, next) {
    try {
      const { name, description, permissions } = req.body

      // 检查角色名是否已存在
      const existingRole = await nedbService.getRoleByName(name)
      if (existingRole) {
        return res.status(400).json({
          code: 400,
          message: '角色名已存在',
          data: null
        })
      }

      // 验证权限列表
      const validPermissions = permissions.filter(p => 
        Object.keys(PERMISSIONS).includes(p)
      )

      if (validPermissions.length !== permissions.length) {
        return res.status(400).json({
          code: 400,
          message: '包含无效的权限',
          data: null
        })
      }

      const role = await nedbService.createRole({
        name,
        description,
        permissions: validPermissions,
        status: 1,
        createdBy: req.user.id
      })

      logger.info(`管理员${req.user.username}创建了角色: ${name}`)

      const roleData = {
        ...role,
        userCount: 0,
        permissionNames: role.permissions.map(p => PERMISSIONS[p] || p)
      }

      res.status(201).json({
        code: 201,
        data: roleData,
        message: '角色创建成功'
      })

    } catch (error) {
      logger.error('Create role error:', error)
      next(error)
    }
  }

  // 更新角色
  async updateRole(req, res, next) {
    try {
      const { id } = req.params
      const { name, description, permissions, status } = req.body

      const role = await nedbService.getRoleById(id)
      if (!role) {
        return res.status(404).json({
          code: 404,
          message: '角色不存在',
          data: null
        })
      }

      // 检查角色名是否被其他角色使用
      if (name && name !== role.name) {
        const existingRole = await nedbService.getRoleByName(name)
        
        if (existingRole) {
          return res.status(400).json({
            code: 400,
            message: '角色名已被其他角色使用',
            data: null
          })
        }
      }

      // 验证权限列表
      if (permissions) {
        const validPermissions = permissions.filter(p => 
          Object.keys(PERMISSIONS).includes(p)
        )

        if (validPermissions.length !== permissions.length) {
          return res.status(400).json({
            code: 400,
            message: '包含无效的权限',
            data: null
          })
        }
      }

      await nedbService.updateRole(id, {
        name: name || role.name,
        description: description || role.description,
        permissions: permissions || role.permissions,
        status: status !== undefined ? status : role.status,
        updatedBy: req.user.id
      })

      logger.info(`管理员${req.user.username}更新了角色: ${role.name}`)

      // 获取用户数量
      const userCount = await nedbService.countUsersByRoleId(id)

      const roleData = {
        ...role,
        userCount,
        permissionNames: role.permissions.map(p => PERMISSIONS[p] || p)
      }

      res.json({
        code: 200,
        data: roleData,
        message: '角色更新成功'
      })

    } catch (error) {
      logger.error('Update role error:', error)
      next(error)
    }
  }

  // 删除角色
  async deleteRole(req, res, next) {
    try {
      const { id } = req.params

      const role = await nedbService.getRoleById(id)
      if (!role) {
        return res.status(404).json({
          code: 404,
          message: '角色不存在',
          data: null
        })
      }

      // 检查是否有用户正在使用此角色
      const userCount = await nedbService.countUsersByRoleId(id)

      if (userCount > 0) {
        return res.status(400).json({
          code: 400,
          message: `该角色正被${userCount}个用户使用，无法删除`,
          data: null
        })
      }

      // 不能删除系统预设角色（ID为1、2、3的角色）
      if ([1, 2, 3].includes(parseInt(id))) {
        return res.status(400).json({
          code: 400,
          message: '不能删除系统预设角色',
          data: null
        })
      }

      await nedbService.deleteRole(id)

      logger.info(`管理员${req.user.username}删除了角色: ${role.name}`)

      res.json({
        code: 200,
        data: null,
        message: '角色删除成功'
      })

    } catch (error) {
      logger.error('Delete role error:', error)
      next(error)
    }
  }

  // 批量操作角色
  async batchRoles(req, res, next) {
    try {
      const { action, roleIds } = req.body

      if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
        return res.status(400).json({
          code: 400,
          message: '请选择要操作的角色',
          data: null
        })
      }

      // 不能操作系统预设角色
      const systemRoleIds = roleIds.filter(id => [1, 2, 3].includes(parseInt(id)))
      if (systemRoleIds.length > 0) {
        return res.status(400).json({
          code: 400,
          message: '不能对系统预设角色执行批量操作',
          data: null
        })
      }

      let actionText = ''

      switch (action) {
        case 'enable':
          actionText = '启用'
          break
        case 'disable':
          actionText = '禁用'
          break
        default:
          return res.status(400).json({
            code: 400,
            message: '无效的操作类型',
            data: null
          })
      }

      // 批量更新角色状态
      const updateData = { status: action === 'enable' ? 1 : 0 }
      const updatedCount = await nedbService.updateRoles(updateData, { _id: { $in: roleIds } })

      logger.info(`管理员${req.user.username}批量${actionText}了${updatedCount}个角色`)

      res.json({
        code: 200,
        data: { updatedCount },
        message: `批量${actionText}成功，共处理${updatedCount}个角色`
      })

    } catch (error) {
      logger.error('Batch roles error:', error)
      next(error)
    }
  }
}

module.exports = new RoleController()