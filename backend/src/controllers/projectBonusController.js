const projectBonusService = require('../services/projectBonusService')
const nedbService = require('../services/nedbService')
const logger = require('../utils/logger')
const { PermissionValidator } = require('../config/permissions')

class ProjectBonusController {
  /**
   * 创建项目奖金池
   */
  async createBonusPool(req, res, next) {
    try {
      const { projectId, period, totalAmount, profitRatio } = req.body
      const createdBy = req.user.id

      if (!projectId || !period || !totalAmount) {
        return res.status(400).json({
          success: false,
          message: '项目ID、期间和奖金总额不能为空'
        })
      }

      const pool = await projectBonusService.createProjectBonusPool(
        projectId, period, totalAmount, profitRatio, createdBy
      )

      res.json({
        success: true,
        message: '项目奖金池创建成功',
        data: pool
      })
    } catch (error) {
      logger.error('创建项目奖金池失败:', error)
      res.status(500).json({
        success: false,
        message: error.message || '创建项目奖金池失败'
      })
    }
  }

  /**
   * 计算项目奖金分配
   */
  async calculateBonus(req, res, next) {
    try {
      const { poolId } = req.params

      if (!poolId) {
        return res.status(400).json({
          success: false,
          message: '奖金池ID不能为空'
        })
      }

      const result = await projectBonusService.calculateProjectBonus(poolId)

      res.json({
        success: true,
        message: '项目奖金计算完成',
        data: result
      })
    } catch (error) {
      logger.error('计算项目奖金失败:', error)
      res.status(500).json({
        success: false,
        message: error.message || '计算项目奖金失败'
      })
    }
  }

  /**
   * 设置项目角色权重
   */
  async setRoleWeights(req, res, next) {
    try {
      const { projectId } = req.params
      const { weights } = req.body
      const updatedBy = req.user.id

      if (!projectId || !weights) {
        return res.status(400).json({
          success: false,
          message: '项目ID和权重配置不能为空'
        })
      }

      // 权限检查：获取项目信息以验证用户权限
      const project = await nedbService.getProjectById(projectId)
      if (!project) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        })
      }

      // 使用权限验证器获取用户权限
      const userPermissions = PermissionValidator.getUserPermissions(req.user)
      
      // 检查用户是否有权限修改项目角色权重
      let hasPermission = false
      
      // 检查是否有管理所有项目权重的权限
      if (PermissionValidator.hasPermission(userPermissions, ['project:weights:update_all', 'project:*', '*'])) {
        hasPermission = true
      }
      // 检查是否有管理自己项目权重的权限，并且确实是项目管理者
      else if (PermissionValidator.hasPermission(userPermissions, 'project:weights:update_own')) {
        // 验证用户是否为项目管理者
        if (project.managerId === req.user.employeeId || project.createdBy === req.user.id) {
          hasPermission = true
        }
      }

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: '权限不足：您没有权限修改此项目的角色权重配置',
          data: {
            required: ['project:weights:update_own', 'project:weights:update_all'],
            message: '需要项目权重管理权限，且只能管理自己负责的项目（除非有全局权限）'
          }
        })
      }

      const result = await projectBonusService.setProjectRoleWeights(
        projectId, weights, updatedBy
      )

      res.json({
        success: true,
        message: '项目角色权重设置成功',
        data: result
      })
    } catch (error) {
      logger.error('设置项目角色权重失败:', error)
      res.status(500).json({
        success: false,
        message: error.message || '设置项目角色权重失败'
      })
    }
  }

  /**
   * 获取项目角色权重
   */
  async getRoleWeights(req, res, next) {
    try {
      const { projectId } = req.params

      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: '项目ID不能为空'
        })
      }

      // 权限检查：获取项目信息以验证用户权限
      const project = await nedbService.getProjectById(projectId)
      if (!project) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        })
      }

      // 使用权限验证器获取用户权限
      const userPermissions = PermissionValidator.getUserPermissions(req.user)
      
      // 检查用户是否有权限查看项目角色权重
      let hasPermission = false
      
      // 检查是否有查看所有项目权重的权限
      if (PermissionValidator.hasPermission(userPermissions, ['project:weights:view_all', 'project:*', '*'])) {
        hasPermission = true
      }
      // 检查是否有查看自己项目权重的权限，并且确实是项目管理者
      else if (PermissionValidator.hasPermission(userPermissions, 'project:weights:view_own')) {
        // 验证用户是否为项目管理者或参与者
        if (project.managerId === req.user.employeeId || 
            project.createdBy === req.user.id ||
            (project.members && project.members.includes(req.user.employeeId))) {
          hasPermission = true
        }
      }

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: '权限不足：您没有权限查看此项目的角色权重配置',
          data: {
            required: ['project:weights:view_own', 'project:weights:view_all'],
            message: '需要项目权重查看权限，且只能查看自己参与的项目（除非有全局权限）'
          }
        })
      }

      const weights = await projectBonusService.getProjectRoleWeights(projectId)

      res.json({
        success: true,
        data: weights
      })
    } catch (error) {
      logger.error('获取项目角色权重失败:', error)
      res.status(500).json({
        success: false,
        message: error.message || '获取项目角色权重失败'
      })
    }
  }

  /**
   * 获取项目奖金分配详情
   */
  async getBonusDetails(req, res, next) {
    try {
      const { projectId, period } = req.params

      if (!projectId || !period) {
        return res.status(400).json({
          success: false,
          message: '项目ID和期间不能为空'
        })
      }

      const details = await projectBonusService.getProjectBonusDetails(projectId, period)

      res.json({
        success: true,
        data: details
      })
    } catch (error) {
      logger.error('获取项目奖金详情失败:', error)
      res.status(500).json({
        success: false,
        message: error.message || '获取项目奖金详情失败'
      })
    }
  }

  /**
   * 审批项目奖金分配
   */
  async approveBonus(req, res, next) {
    try {
      const { poolId } = req.params
      const approvedBy = req.user.id

      if (!poolId) {
        return res.status(400).json({
          success: false,
          message: '奖金池ID不能为空'
        })
      }

      await projectBonusService.approveProjectBonusAllocation(poolId, approvedBy)

      res.json({
        success: true,
        message: '项目奖金分配审批完成'
      })
    } catch (error) {
      logger.error('审批项目奖金分配失败:', error)
      res.status(500).json({
        success: false,
        message: error.message || '审批项目奖金分配失败'
      })
    }
  }

  /**
   * 获取奖金池列表
   */
  async getBonusPools(req, res, next) {
    try {
      const { projectId, period, status } = req.query
      const filters = {}
      
      if (projectId) filters.projectId = projectId
      if (period) filters.period = period
      if (status) filters.status = status

      const pools = await projectBonusService.getBonusPools(filters)

      res.json({
        success: true,
        data: pools,
        message: '获取奖金池列表成功'
      })
    } catch (error) {
      logger.error('获取奖金池列表失败:', error)
      res.status(500).json({
        success: false,
        message: error.message || '获取奖金池列表失败'
      })
    }
  }

  /**
   * 获取单个奖金池详情
   */
  async getBonusPoolDetail(req, res, next) {
    try {
      const { poolId } = req.params

      if (!poolId) {
        return res.status(400).json({
          success: false,
          message: '奖金池ID不能为空'
        })
      }

      const pool = await projectBonusService.getBonusPoolById(poolId)

      res.json({
        success: true,
        data: pool,
        message: '获取奖金池详情成功'
      })
    } catch (error) {
      logger.error('获取奖金池详情失败:', error)
      res.status(500).json({
        success: false,
        message: error.message || '获取奖金池详情失败'
      })
    }
  }

  /**
   * 编辑项目奖金池
   */
  async updateBonusPool(req, res, next) {
    try {
      const { poolId } = req.params
      const { totalAmount, profitRatio, description } = req.body
      const updatedBy = req.user.id

      if (!poolId) {
        return res.status(400).json({
          success: false,
          message: '奖金池ID不能为空'
        })
      }

      // 获取当前奖金池信息，检查状态
      const currentPool = await projectBonusService.getBonusPoolById(poolId)
      if (!currentPool) {
        return res.status(404).json({
          success: false,
          message: '奖金池不存在'
        })
      }

      // 只有pending状态的奖金池可以编辑
      if (currentPool.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `奖金池状态为"${currentPool.status}"，只有"待审批"状态的奖金池可以编辑`
        })
      }

      // 检查权限：只有创建者或管理员可以编辑
      if (currentPool.createdBy !== updatedBy && !req.user.Role?.permissions?.includes('admin')) {
        return res.status(403).json({
          success: false,
          message: '只有创建者或管理员可以编辑奖金池'
        })
      }

      const updateData = {}
      if (totalAmount !== undefined) updateData.totalAmount = totalAmount
      if (profitRatio !== undefined) updateData.profitRatio = profitRatio
      if (description !== undefined) updateData.description = description
      updateData.updatedBy = updatedBy

      const updatedPool = await projectBonusService.updateBonusPool(poolId, updateData)

      res.json({
        success: true,
        data: updatedPool,
        message: '奖金池编辑成功'
      })
    } catch (error) {
      logger.error('编辑奖金池失败:', error)
      res.status(500).json({
        success: false,
        message: error.message || '编辑奖金池失败'
      })
    }
  }

  /**
   * 删除项目奖金池
   */
  async deleteBonusPool(req, res, next) {
    try {
      const { poolId } = req.params
      const deletedBy = req.user.id

      if (!poolId) {
        return res.status(400).json({
          success: false,
          message: '奖金池ID不能为空'
        })
      }

      // 获取当前奖金池信息，检查状态
      const currentPool = await projectBonusService.getBonusPoolById(poolId)
      if (!currentPool) {
        return res.status(404).json({
          success: false,
          message: '奖金池不存在'
        })
      }

      // 只有pending状态的奖金池可以删除
      if (currentPool.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `奖金池状态为"${currentPool.status}"，只有"待审批"状态的奖金池可以删除`
        })
      }

      // 检查权限：只有创建者或管理员可以删除
      if (currentPool.createdBy !== deletedBy && !req.user.Role?.permissions?.includes('admin')) {
        return res.status(403).json({
          success: false,
          message: '只有创建者或管理员可以删除奖金池'
        })
      }

      await projectBonusService.deleteBonusPool(poolId, deletedBy)

      res.json({
        success: true,
        message: '奖金池删除成功'
      })
    } catch (error) {
      logger.error('删除奖金池失败:', error)
      res.status(500).json({
        success: false,
        message: error.message || '删除奖金池失败'
      })
    }
  }
}

module.exports = new ProjectBonusController()