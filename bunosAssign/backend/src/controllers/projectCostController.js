const logger = require('../utils/logger')
const { PermissionValidator } = require('../config/permissions')

class ProjectCostController {
  /**
   * 创建项目成本记录
   */
  async createCost(req, res, next) {
    try {
      const user = req.user
      const { projectId, costType, amount, description, date } = req.body

      // 验证必要字段
      if (!projectId || !costType || !amount || !description) {
        return res.status(400).json({
          code: 400,
          message: '缺少必要字段',
          data: null
        })
      }

      // 验证成本类型
      const validCostTypes = ['人力成本', '材料成本', '其他成本']
      if (!validCostTypes.includes(costType)) {
        return res.status(400).json({
          code: 400,
          message: '无效的成本类型',
          data: null
        })
      }

      // 验证金额
      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({
          code: 400,
          message: '成本金额必须为正数',
          data: null
        })
      }

      // 检查项目是否存在
      const project = await global.nedbService.findOne('projects', { _id: projectId })
      if (!project) {
        return res.status(404).json({
          code: 404,
          message: '项目不存在',
          data: null
        })
      }

      // 检查用户权限
      if (!PermissionValidator.checkProjectPermission(user, 'manage', project)) {
        return res.status(403).json({
          code: 403,
          message: '您没有权限为此项目添加成本记录',
          data: null
        })
      }

      // 创建成本记录
      const costData = {
        projectId,
        costType,
        amount,
        description,
        date: date ? new Date(date) : new Date(),
        recordedBy: user.employeeId || user.id,
        status: 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = await global.nedbService.createProjectCost(costData)

      res.status(201).json({
        code: 201,
        message: '成本记录创建成功',
        data: result
      })

    } catch (error) {
      logger.error('Create project cost error:', error)
      next(error)
    }
  }

  /**
   * 获取项目成本列表
   */
  async getCosts(req, res, next) {
    try {
      const user = req.user
      const { projectId, costType, page = 1, pageSize = 20 } = req.query

      // 构建查询条件
      const query = {}
      if (projectId) query.projectId = projectId
      if (costType) query.costType = costType

      // 如果指定了项目ID，检查用户权限
      if (projectId) {
        const project = await global.nedbService.findOne('projects', { _id: projectId })
        if (!project) {
          return res.status(404).json({
            code: 404,
            message: '项目不存在',
            data: null
          })
        }

        // 检查用户是否有权限查看此项目的成本
        if (!PermissionValidator.checkProjectPermission(user, 'view', project)) {
          return res.status(403).json({
            code: 403,
            message: '您没有权限查看此项目的成本信息',
            data: null
          })
        }
      } else {
        // 如果没有指定项目ID，只返回用户有权限查看的项目成本
        const accessibleProjects = await global.nedbService.getProjects({
          $or: [
            { managerId: user.employeeId || user.id },
            { members: user.employeeId || user.id },
            { status: 'public' }
          ]
        })

        if (accessibleProjects.length > 0) {
          query.projectId = { $in: accessibleProjects.map(p => p._id) }
        } else {
          // 如果用户没有可访问的项目，返回空列表
          return res.json({
            code: 200,
            message: '获取成功',
            data: {
              costs: [],
              pagination: {
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                total: 0,
                totalPages: 0
              }
            }
          })
        }
      }

      // 获取成本列表
      const costs = await global.nedbService.getProjectCosts(query)
      const total = costs.length

      // 分页
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + parseInt(pageSize)
      const paginatedCosts = costs.slice(startIndex, endIndex)

      res.json({
        code: 200,
        message: '获取成功',
        data: {
          costs: paginatedCosts,
          pagination: {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            total,
            totalPages: Math.ceil(total / parseInt(pageSize))
          }
        }
      })

    } catch (error) {
      logger.error('Get project costs error:', error)
      next(error)
    }
  }

  /**
   * 根据ID获取成本记录
   */
  async getCostById(req, res, next) {
    try {
      const user = req.user
      const { costId } = req.params

      // 获取成本记录
      const cost = await global.nedbService.findOne('projectCosts', { _id: costId })
      if (!cost) {
        return res.status(404).json({
          code: 404,
          message: '成本记录不存在',
          data: null
        })
      }

      // 检查用户权限
      const project = await global.nedbService.findOne('projects', { _id: cost.projectId })
      if (!project) {
        return res.status(404).json({
          code: 404,
          message: '关联的项目不存在',
          data: null
        })
      }

      if (!PermissionValidator.checkProjectPermission(user, 'view', project)) {
        return res.status(403).json({
          code: 403,
          message: '您没有权限查看此成本记录',
          data: null
        })
      }

      res.json({
        code: 200,
        message: '获取成功',
        data: cost
      })

    } catch (error) {
      logger.error('Get project cost by ID error:', error)
      next(error)
    }
  }

  /**
   * 更新成本记录
   */
  async updateCost(req, res, next) {
    try {
      const user = req.user
      const { costId } = req.params
      const updateData = req.body

      // 获取成本记录
      const cost = await global.nedbService.findOne('projectCosts', { _id: costId })
      if (!cost) {
        return res.status(404).json({
          code: 404,
          message: '成本记录不存在',
          data: null
        })
      }

      // 检查用户权限
      const project = await global.nedbService.findOne('projects', { _id: cost.projectId })
      if (!project) {
        return res.status(404).json({
          code: 404,
          message: '关联的项目不存在',
          data: null
        })
      }

      if (!PermissionValidator.checkProjectPermission(user, 'manage', project)) {
        return res.status(403).json({
          code: 403,
          message: '您没有权限修改此成本记录',
          data: null
        })
      }

      // 验证更新数据
      if (updateData.amount && (typeof updateData.amount !== 'number' || updateData.amount <= 0)) {
        return res.status(400).json({
          code: 400,
          message: '成本金额必须为正数',
          data: null
        })
      }

      if (updateData.costType) {
        const validCostTypes = ['人力成本', '材料成本', '其他成本']
        if (!validCostTypes.includes(updateData.costType)) {
          return res.status(400).json({
            code: 400,
            message: '无效的成本类型',
            data: null
          })
        }
      }

      // 更新成本记录
      const result = await global.nedbService.updateProjectCost(costId, updateData)

      res.json({
        code: 200,
        message: '成本记录更新成功',
        data: result
      })

    } catch (error) {
      logger.error('Update project cost error:', error)
      next(error)
    }
  }

  /**
   * 删除成本记录
   */
  async deleteCost(req, res, next) {
    try {
      const user = req.user
      const { costId } = req.params

      // 获取成本记录
      const cost = await global.nedbService.findOne('projectCosts', { _id: costId })
      if (!cost) {
        return res.status(404).json({
          code: 404,
          message: '成本记录不存在',
          data: null
        })
      }

      // 检查用户权限
      const project = await global.nedbService.findOne('projects', { _id: cost.projectId })
      if (!project) {
        return res.status(404).json({
          code: 404,
          message: '关联的项目不存在',
          data: null
        })
      }

      if (!PermissionValidator.checkProjectPermission(user, 'manage', project)) {
        return res.status(403).json({
          code: 403,
          message: '您没有权限删除此成本记录',
          data: null
        })
      }

      // 删除成本记录
      await global.nedbService.deleteProjectCost(costId)

      res.json({
        code: 200,
        message: '成本记录删除成功',
        data: null
      })

    } catch (error) {
      logger.error('Delete project cost error:', error)
      next(error)
    }
  }

  /**
   * 获取项目成本汇总
   */
  async getProjectCostSummary(req, res, next) {
    try {
      const user = req.user
      const { projectId } = req.params

      // 检查项目是否存在
      const project = await global.nedbService.findOne('projects', { _id: projectId })
      if (!project) {
        return res.status(404).json({
          code: 404,
          message: '项目不存在',
          data: null
        })
      }

      // 检查用户权限
      if (!PermissionValidator.checkProjectPermission(user, 'view', project)) {
        return res.status(403).json({
          code: 403,
          message: '您没有权限查看此项目的成本汇总',
          data: null
        })
      }

      // 获取成本汇总
      const summary = await global.nedbService.getProjectCostSummary(projectId)

      res.json({
        code: 200,
        message: '获取成功',
        data: summary
      })

    } catch (error) {
      logger.error('Get project cost summary error:', error)
      next(error)
    }
  }

  /**
   * 获取所有项目的成本汇总
   */
  async getAllProjectCostSummaries(req, res, next) {
    try {
      const user = req.user

      // 检查用户权限
      if (!PermissionValidator.checkUserPermission(user, 'project:cost:view:all')) {
        return res.status(403).json({
          code: 403,
          message: '您没有权限查看所有项目的成本汇总',
          data: null
        })
      }

      // 获取所有项目的成本汇总
      const summaries = await global.nedbService.getAllProjectCostSummaries()

      res.json({
        code: 200,
        message: '获取成功',
        data: summaries
      })

    } catch (error) {
      logger.error('Get all project cost summaries error:', error)
      next(error)
    }
  }
}

module.exports = new ProjectCostController()
