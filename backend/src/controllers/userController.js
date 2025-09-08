const bcrypt = require('bcryptjs')
const { User, Role, Department } = require('../models')
const { Op } = require('sequelize')
const logger = require('../utils/logger')

// 安全导入NeDB服务，带错误处理
let nedbService = null
try {
  nedbService = require('../services/nedbService')
} catch (error) {
  console.error('❌ 导入NeDB服务失败:', error.message)
  throw new Error('无法导入NeDB服务: ' + error.message)
}

// 确保服务正确导入
if (!nedbService) {
  throw new Error('NeDB服务导入失败：服务为空')
}

// 辅助函数：确保NeDB服务已初始化
async function ensureNeDBService() {
  if (!nedbService) {
    throw new Error('NeDB服务未导入')
  }
  
  // 等待初始化完成，最多等待5秒
  let retryCount = 0
  const maxRetries = 25 // 5秒 / 200ms = 25次
  
  while (!nedbService.isInitialized && retryCount < maxRetries) {
    await new Promise(resolve => setTimeout(resolve, 200))
    retryCount++
  }
  
  if (!nedbService.isInitialized) {
    throw new Error('NeDB服务初始化超时')
  }
}

class UserController {
  // 获取用户列表
  async list(req, res) {
    try {
      // 确保NeDB服务已初始化
      await ensureNeDBService();
      const { 
        page = 1, 
        pageSize = 20, 
        search, 
        roleId, 
        departmentId, 
        status 
      } = req.query

      // 使用NeDB服务获取所有用户
      let allUsers = await nedbService.getUsers()
      
      // 应用搜索过滤
      if (search) {
        allUsers = allUsers.filter(user => 
          user.username?.toLowerCase().includes(search.toLowerCase()) ||
          user.realName?.toLowerCase().includes(search.toLowerCase()) ||
          user.email?.toLowerCase().includes(search.toLowerCase())
        )
      }

      // 应用其他过滤条件
      if (roleId && roleId !== '') {
        allUsers = allUsers.filter(user => user.roleId === roleId)
      }
      
      if (departmentId && departmentId !== '') {
        allUsers = allUsers.filter(user => user.departmentId === departmentId)
      }
      
      if (status !== undefined && status !== '') {
        allUsers = allUsers.filter(user => user.status === parseInt(status))
      }

      // 排序（按创建时间倒序）
      allUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      // 分页处理
      const total = allUsers.length
      const offset = (page - 1) * pageSize
      const users = allUsers.slice(offset, offset + parseInt(pageSize))

      // 为每个用户获取角色和部门信息
      const usersWithRelations = await Promise.all(users.map(async (user) => {
        let role = null
        let department = null
        
        if (user.roleId) {
          role = await nedbService.getRoleById(user.roleId)
        }
        
        if (user.departmentId) {
          department = await nedbService.getDepartmentById(user.departmentId)
        }

        // 排除密码字段，并将_id映射为id
        const { password, _id, ...userData } = user
        return {
          id: _id, // 将NeDB的_id字段映射为前端期望的id字段
          ...userData,
          Role: role,
          Department: department
        }
      }))

      console.log('查询条件:', { search, roleId, departmentId, status })
      console.log('查询结果数量:', total)
      console.log('查询结果数据:', usersWithRelations)

      res.json({
        code: 200,
        data: {
          users: usersWithRelations,
          pagination: {
            total,
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            totalPages: Math.ceil(total / pageSize)
          }
        },
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get users error:', error)
      res.status(500).json({
        code: 500,
        message: '获取用户列表失败',
        data: null
      })
    }
  }

  // 获取用户详情
  async detail(req, res, next) {
    try {
      // 确保NeDB服务已初始化
      await ensureNeDBService();
      
      const { id } = req.params

      // 使用NeDB服务直接查询用户
      const user = await nedbService.getUserById(id)
      if (!user) {
        return res.status(404).json({
          code: 404,
          message: '用户不存在',
          data: null
        })
      }

      // 获取角色和部门信息
      let role = null
      let department = null
      
      if (user.roleId) {
        role = await nedbService.getRoleById(user.roleId)
      }
      
      if (user.departmentId) {
        department = await nedbService.getDepartmentById(user.departmentId)
      }

      // 构建返回数据，排除密码字段，并将_id映射为id
      const { password, _id, ...userData } = user
      const result = {
        id: _id, // 将NeDB的_id字段映射为前端期望的id字段
        ...userData,
        Role: role,
        Department: department
      }

      res.json({
        code: 200,
        data: result,
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get user detail error:', error)
      next(error)
    }
  }

  // 创建用户
  async create(req, res, next) {
    try {
      // 确保NeDB服务已初始化
      await ensureNeDBService();
      
      const { username, password, realName, email, phone, roleId, departmentId, employeeId } = req.body

      // 检查用户名是否存在
      const existingUser = await nedbService.getUserByUsername(username)
      if (existingUser) {
        return res.status(400).json({
          code: 400,
          message: '用户名已存在',
          data: null
        })
      }

      // 检查邮箱是否存在
      if (email && email.trim()) {
        const emailExists = await nedbService.checkEmailExists(email)
        if (emailExists) {
          return res.status(400).json({
            code: 400,
            message: '邮箱已被其他用户使用',
            data: null
          })
        }
      }

      // 如果提供了员工ID，验证员工是否存在且未关联用户
      if (employeeId) {
        const employee = await nedbService.getEmployeeById(employeeId)
        if (!employee) {
          return res.status(400).json({
            code: 400,
            message: '指定的员工不存在',
            data: null
          })
        }
        
        if (employee.userId) {
          return res.status(400).json({
            code: 400,
            message: '该员工已关联用户账号',
            data: null
          })
        }

        // 如果员工存在，使用员工信息填充相关字段
        if (!realName) {
          realName = employee.name
        }
        if (!departmentId) {
          departmentId = employee.departmentId
        }
        if (!email && employee.email) {
          email = employee.email
        }
        if (!phone && employee.phone) {
          phone = employee.phone
        }
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 12)

      // 准备用户数据
      const userData = {
        username,
        password: hashedPassword,
        realName,
        email: email && email.trim() ? email.trim() : null,
        phone: phone && phone.trim() ? phone.trim() : null,
        roleId,
        departmentId,
        status: req.body.status || 1 // 使用前端传递的status值，默认为1
      }

      // 使用NeDB服务创建用户
      const user = await nedbService.createUser(userData)

      // 如果提供了员工ID，更新员工记录的userId字段
      if (employeeId) {
        await nedbService.updateEmployee(employeeId, { userId: user._id })
        logger.info(`用户 ${username} 已关联到员工 ${employeeId}`)
      }

      logger.info(`用户创建成功: ${username}`)

      // 获取完整的用户信息，包括角色和部门
      const fullUser = await nedbService.getUserById(user._id)
      
      // 获取角色和部门信息
      let role = null
      let department = null
      
      if (fullUser.roleId) {
        role = await nedbService.getRoleById(fullUser.roleId)
      }
      
      if (fullUser.departmentId) {
        department = await nedbService.getDepartmentById(fullUser.departmentId)
      }

      // 构建返回数据，排除密码字段，并将_id映射为id
      const { password: userPassword, _id, ...userDataResult } = fullUser
      const result = {
        id: _id, // 将NeDB的_id字段映射为前端期望的id字段
        ...userDataResult,
        Role: role,
        Department: department
      }

      res.json({
        code: 200,
        data: result,
        message: '创建成功'
      })

    } catch (error) {
      logger.error('Create user error:', error)
      next(error)
    }
  }

  // 更新用户
  async update(req, res, next) {
    try {
      // 确保NeDB服务已初始化
      await ensureNeDBService();
      
      const { id } = req.params
      const { realName, email, phone, roleId, departmentId, status } = req.body

      // 使用NeDB服务直接查询用户
      const user = await nedbService.getUserById(id)
      if (!user) {
        return res.status(404).json({
          code: 404,
          message: '用户不存在',
          data: null
        })
      }

      // 检查邮箱是否被其他用户使用
      if (email && email.trim() && email !== user.email) {
        const existingUsers = await nedbService.find('users', { email: email.trim() })
        const existingEmail = existingUsers.find(u => u._id !== id)
        if (existingEmail) {
          return res.status(400).json({
            code: 400,
            message: '邮箱已被其他用户使用',
            data: null
          })
        }
      }

      // 准备更新数据
      const updateData = {
        realName: realName || user.realName,
        email: email && email.trim() ? email.trim() : (user.email || null),
        phone: phone && phone.trim() ? phone.trim() : (user.phone || null),
        roleId: roleId || user.roleId,
        departmentId: departmentId || user.departmentId,
        status: status !== undefined ? status : user.status,
        updatedBy: req.user.id
      }

      // 使用NeDB服务更新用户
      await nedbService.updateUser(id, updateData)

      logger.info(`管理员${req.user.username}更新了用户: ${user.username}`)

      // 获取更新后的用户信息
      const updatedUser = await nedbService.getUserById(id)
      
      // 获取角色和部门信息
      let role = null
      let department = null
      
      if (updatedUser.roleId) {
        role = await nedbService.getRoleById(updatedUser.roleId)
      }
      
      if (updatedUser.departmentId) {
        department = await nedbService.getDepartmentById(updatedUser.departmentId)
      }

      // 构建返回数据，排除密码字段，并将_id映射为id
      const { password: userPassword, _id, ...userData } = updatedUser
      const result = {
        id: _id, // 将NeDB的_id字段映射为前端期望的id字段
        ...userData,
        Role: role,
        Department: department
      }

      res.json({
        code: 200,
        data: result,
        message: '更新成功'
      })

    } catch (error) {
      logger.error('Update user error:', error)
      next(error)
    }
  }

  // 重置用户密码
  async resetPassword(req, res, next) {
    try {
      // 确保NeDB服务已初始化
      await ensureNeDBService();
      
      const { id } = req.params
      const { newPassword } = req.body

      // 使用NeDB服务直接查询用户
      const user = await nedbService.getUserById(id)
      if (!user) {
        return res.status(404).json({
          code: 404,
          message: '用户不存在',
          data: null
        })
      }

      // 加密新密码
      const saltRounds = 12
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

      // 使用NeDB服务更新密码
      await nedbService.updatePassword(id, hashedPassword)

      logger.info(`管理员${req.user.username}重置了用户${user.username}的密码`)

      res.json({
        code: 200,
        data: null,
        message: '密码重置成功'
      })

    } catch (error) {
      logger.error('Reset password error:', error)
      next(error)
    }
  }

  // 删除用户
  async delete(req, res, next) {
    try {
      // 确保NeDB服务已初始化
      await ensureNeDBService();
      
      const { id } = req.params

      // 使用NeDB服务直接查询用户
      const user = await nedbService.getUserById(id)
      if (!user) {
        return res.status(404).json({
          code: 404,
          message: '用户不存在',
          data: null
        })
      }

      // 不能删除自己
      if (user._id === req.user.id) {
        return res.status(400).json({
          code: 400,
          message: '不能删除自己的账户',
          data: null
        })
      }

      // 软删除：将状态设为0
      await nedbService.updateUser(id, { 
        status: 0,
        updatedBy: req.user.id
      })

      logger.info(`管理员${req.user.username}删除了用户: ${user.username}`)

      res.json({
        code: 200,
        data: null,
        message: '删除成功'
      })

    } catch (error) {
      logger.error('Delete user error:', error)
      next(error)
    }
  }

  // 批量操作用户
  async batchOperation(req, res, next) {
    try {
      // 确保NeDB服务已初始化
      await ensureNeDBService();
      const { action, userIds } = req.body

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          code: 400,
          message: '请选择要操作的用户',
          data: null
        })
      }

      // 不能操作自己
      if (userIds.includes(req.user.id)) {
        return res.status(400).json({
          code: 400,
          message: '不能对自己执行批量操作',
          data: null
        })
      }

      let updateData = { updatedBy: req.user.id }
      let actionText = ''

      switch (action) {
        case 'enable':
          updateData.status = 1
          actionText = '启用'
          break
        case 'disable':
          updateData.status = 0
          actionText = '禁用'
          break
        default:
          return res.status(400).json({
            code: 400,
            message: '无效的操作类型',
            data: null
          })
      }

      // 使用NeDB服务批量更新用户
      let updatedCount = 0
      for (const userId of userIds) {
        try {
          await nedbService.updateUser(userId, updateData)
          updatedCount++
        } catch (error) {
          logger.error(`批量操作用户${userId}失败:`, error)
        }
      }

      logger.info(`管理员${req.user.username}批量${actionText}了${updatedCount}个用户`)

      res.json({
        code: 200,
        data: { updatedCount },
        message: `批量${actionText}成功，共处理${updatedCount}个用户`
      })

    } catch (error) {
      logger.error('Batch operation error:', error)
      next(error)
    }
  }
}

module.exports = new UserController()