const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const nedbService = require('../services/nedbService')
const logger = require('../utils/logger')

class AuthController {
  // 用户登录
  async login(req, res, next) {
    try {
      const { username, password } = req.body

      // 查找用户
      const user = await nedbService.getUserByUsername(username)
      
      if (!user) {
        return res.status(401).json({
          code: 401,
          message: '用户名或密码错误',
          data: null
        })
      }

      // 获取用户角色信息
      let role = null
      if (user.roleId) {
        role = await nedbService.getRoleById(user.roleId)
      }

      // 验证密码
      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) {
        return res.status(401).json({
          code: 401,
          message: '用户名或密码错误',
          data: null
        })
      }

      // 检查用户状态
      if (user.status !== 1) {
        return res.status(401).json({
          code: 401,
          message: '账户已被禁用',
          data: null
        })
      }

      // 生成JWT令牌
      const token = jwt.sign(
        { 
          id: user._id, // 使用NeDB的_id字段
          username: user.username,
          roleId: user.roleId,
          type: 'access'
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
      )

      // 生成刷新令牌
      const refreshToken = jwt.sign(
        { 
          id: user._id, // 使用NeDB的_id字段
          username: user.username,
          type: 'refresh'
        },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
      )

      // 更新最后登录时间
      await nedbService.updateLastLogin(user._id)

      // 返回用户信息（不包含密码）
      const userData = {
        id: user._id, // 使用NeDB的_id字段
        username: user.username,
        realName: user.realName,
        email: user.email,
        phone: user.phone,
        roleId: user.roleId,
        roleName: role?.name,
        departmentId: user.departmentId,
        status: user.status,
        lastLogin: user.lastLogin
      }

      const permissions = role?.permissions || []

      logger.info(`用户登录成功: ${username}`)

      res.json({
        code: 200,
        data: {
          token,
          refreshToken,
          user: userData,
          permissions
        },
        message: '登录成功'
      })

    } catch (error) {
      logger.error('Login error:', error)
      next(error)
    }
  }

  // 获取当前用户信息
  async me(req, res, next) {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '')
      
      if (!token) {
        return res.status(401).json({
          code: 401,
          message: '访问令牌不存在',
          data: null
        })
      }

      // 获取用户信息
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await nedbService.getUserById(decoded.id)
      
      if (!user) {
        return res.status(401).json({
          code: 401,
          message: '用户不存在',
          data: null
        })
      }

      // 获取用户角色信息
      let role = null
      if (user.roleId) {
        role = await nedbService.getRoleById(user.roleId)
      }

      // 返回用户信息（不包含密码）
      const userData = {
        id: user._id, // 使用NeDB的_id字段
        username: user.username,
        realName: user.realName,
        email: user.email,
        phone: user.phone,
        roleId: user.roleId,
        roleName: role?.name,
        departmentId: user.departmentId,
        status: user.status,
        lastLogin: user.lastLogin
      }

      res.json({
        code: 200,
        data: {
          user: userData,
          permissions: role?.permissions || []
        },
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get user info error:', error)
      next(error)
    }
  }

  // 用户注册
  async register(req, res, next) {
    try {
      const { username, password, realName, email, phone, departmentId } = req.body

      // 检查用户名是否已存在
      const existingUser = await nedbService.findUserByUsernameOrEmail(username, email)

      if (existingUser) {
        return res.status(400).json({
          code: 400,
          message: existingUser.username === username ? '用户名已存在' : '邮箱已被注册',
          data: null
        })
      }

      // 密码强度验证（至少8位，包含字母和数字）
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          code: 400,
          message: '密码至少8位，需包含字母和数字',
          data: null
        })
      }

      // 加密密码
      const saltRounds = 12
      const hashedPassword = await bcrypt.hash(password, saltRounds)

      // 创建用户（默认为普通员工角色）
      const user = await nedbService.createUser({
        username,
        password: hashedPassword,
        realName,
        email,
        phone,
        departmentId: departmentId || null,
        roleId: 3, // 默认员工角色
        status: 1,
        createdBy: req.user?.id || 1
      })

      logger.info(`新用户注册: ${username}`)

      // 返回用户信息（不包含密码）
      const userData = {
        id: user.id,
        username: user.username,
        realName: user.realName,
        email: user.email,
        phone: user.phone,
        departmentId: user.departmentId,
        roleId: user.roleId,
        status: user.status
      }

      res.status(201).json({
        code: 201,
        data: userData,
        message: '注册成功'
      })

    } catch (error) {
      logger.error('Register error:', error)
      next(error)
    }
  }

  // 刷新访问令牌
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body

      if (!refreshToken) {
        return res.status(401).json({
          code: 401,
          message: '刷新令牌不存在',
          data: null
        })
      }

      // 验证刷新令牌
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET)
      
      if (decoded.type !== 'refresh') {
        return res.status(401).json({
          code: 401,
          message: '无效的刷新令牌',
          data: null
        })
      }

      // 查找用户
      const user = await nedbService.findUserById(decoded.id)

      if (!user || user.status !== 1) {
        return res.status(401).json({
          code: 401,
          message: '用户不存在或已被禁用',
          data: null
        })
      }

      // 获取用户角色信息
      let role = null
      if (user.roleId) {
        role = await nedbService.getRoleById(user.roleId)
      }

      // 生成新的访问令牌
      const newAccessToken = jwt.sign(
        { 
          id: user._id, // 使用NeDB的_id字段
          username: user.username,
          roleId: user.roleId,
          type: 'access'
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
      )

      // 生成新的刷新令牌
      const newRefreshToken = jwt.sign(
        { 
          id: user._id, // 使用NeDB的_id字段
          username: user.username,
          type: 'refresh'
        },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
      )

      res.json({
        code: 200,
        data: {
          token: newAccessToken,
          refreshToken: newRefreshToken,
          permissions: role?.permissions || []
        },
        message: '令牌刷新成功'
      })

    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(401).json({
          code: 401,
          message: '刷新令牌无效或已过期',
          data: null
        })
      }
      logger.error('Refresh token error:', error)
      next(error)
    }
  }

  // 修改密码
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body
      const userId = req.user.id

      // 获取用户当前密码
      const user = await nedbService.getUserById(userId)
      if (!user) {
        return res.status(404).json({
          code: 404,
          message: '用户不存在',
          data: null
        })
      }

      // 验证当前密码
      const isValidPassword = await bcrypt.compare(currentPassword, user.password)
      if (!isValidPassword) {
        return res.status(400).json({
          code: 400,
          message: '当前密码错误',
          data: null
        })
      }

      // 新密码强度验证
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/
      if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
          code: 400,
          message: '新密码至少8位，需包含字母和数字',
          data: null
        })
      }

      // 检查新密码不能与当前密码相同
      const isSamePassword = await bcrypt.compare(newPassword, user.password)
      if (isSamePassword) {
        return res.status(400).json({
          code: 400,
          message: '新密码不能与当前密码相同',
          data: null
        })
      }

      // 加密新密码
      const saltRounds = 12
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

      // 更新密码
      await nedbService.updatePassword(userId, hashedNewPassword)

      logger.info(`用户修改密码: ${user.username}`)

      res.json({
        code: 200,
        data: null,
        message: '密码修改成功'
      })

    } catch (error) {
      logger.error('Change password error:', error)
      next(error)
    }
  }

  // 用户登出
  async logout(req, res, next) {
    try {
      // 这里可以实现令牌黑名单逻辑
      // 目前简单返回成功，客户端删除本地令牌
      
      res.json({
        code: 200,
        data: null,
        message: '登出成功'
      })

    } catch (error) {
      logger.error('Logout error:', error)
      next(error)
    }
  }
}

module.exports = new AuthController()