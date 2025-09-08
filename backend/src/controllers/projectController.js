const nedbService = require('../services/nedbService')
const logger = require('../utils/logger')

class ProjectController {
  // 获取项目列表
  async getProjects(req, res, next) {
    try {
      const { 
        page = 1, 
        pageSize = 20, 
        search, 
        status,
        priority,
        manager 
      } = req.query

      // 获取所有项目
      let projects = await nedbService.getProjects()
      
      // 如果指定了manager参数，只返回当前用户管理的项目
      if (manager === 'true' && req.user) {
        // 首先通过用户ID获取对应的员工记录
        const userEmployee = await nedbService.getEmployeeByUserId(req.user.id)
        if (userEmployee) {
          projects = projects.filter(project => project.managerId === userEmployee._id)
        } else {
          // 如果没有找到对应的员工记录，返回空数组
          projects = []
        }
      }
      
      // 搜索过滤
      if (search) {
        projects = projects.filter(project => 
          project.name.toLowerCase().includes(search.toLowerCase()) ||
          project.code.toLowerCase().includes(search.toLowerCase()) ||
          (project.description && project.description.toLowerCase().includes(search.toLowerCase()))
        )
      }

      // 状态过滤
      if (status) {
        projects = projects.filter(project => project.status === status)
      }

      // 优先级过滤
      if (priority) {
        projects = projects.filter(project => project.priority === priority)
      }

      // 分页处理
      const total = projects.length
      const offset = (page - 1) * pageSize
      const paginatedProjects = projects.slice(offset, offset + parseInt(pageSize))

      // 获取每个项目的经理信息
      const projectsWithManager = await Promise.all(
        paginatedProjects.map(async (project) => {
          let manager = null
          if (project.managerId) {
            manager = await nedbService.getEmployeeById(project.managerId)
          }
          
          return {
            ...project,
            id: project._id, // 兼容前端期望的 id 字段
            Manager: manager ? {
              id: manager._id,
              name: manager.name,
              employeeNo: manager.employeeNo
            } : null
          }
        })
      )

      res.json({
        code: 200,
        data: {
          projects: projectsWithManager,
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
      logger.error('Get projects error:', error)
      next(error)
    }
  }

  // 获取项目详情
  async getProject(req, res, next) {
    try {
      const { id } = req.params

      const project = await nedbService.getProjectById(id)

      if (!project) {
        return res.status(404).json({
          code: 404,
          message: '项目不存在',
          data: null
        })
      }

      // 获取项目经理信息
      let manager = null
      if (project.managerId) {
        manager = await nedbService.getEmployeeById(project.managerId)
      }

      // 获取项目权重配置
      const weights = await nedbService.getProjectWeights(id)

      const projectWithDetails = {
        ...project,
        id: project._id, // 兼容前端期望的 id 字段
        Manager: manager ? {
          id: manager._id,
          name: manager.name,
          employeeNo: manager.employeeNo
        } : null,
        ProjectLineWeights: weights
      }

      res.json({
        code: 200,
        data: projectWithDetails,
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get project error:', error)
      next(error)
    }
  }

  // 创建项目
  async createProject(req, res, next) {
    try {
      const { 
        name, 
        code, 
        description, 
        managerId,
        startDate,
        endDate,
        budget,
        profitTarget,
        priority 
      } = req.body

      // 检查项目代码是否已存在
      const existingCode = await nedbService.findOne('projects', { code })
      if (existingCode) {
        return res.status(400).json({
          code: 400,
          message: '项目代码已存在',
          data: null
        })
      }

      // 检查项目名称是否已存在
      const existingName = await nedbService.findOne('projects', { name })
      if (existingName) {
        return res.status(400).json({
          code: 400,
          message: '项目名称已存在',
          data: null
        })
      }

      // 验证项目经理是否存在
      if (managerId) {
        logger.info(`正在验证项目经理ID: ${managerId}`)
        let manager = await nedbService.getEmployeeById(managerId)
        
        // 如果直接查询失败，尝试从员工列表中查找
        if (!manager) {
          logger.info(`直接查询失败，尝试从员工列表中查找`)
          const allEmployees = await nedbService.getEmployees()
          manager = allEmployees.find(emp => emp._id === managerId)
          if (manager) {
            logger.info(`从员工列表中找到项目经理: ${manager.name}`)
          }
        }
        
        if (!manager) {
          logger.error(`项目经理ID ${managerId} 不存在`)
          return res.status(400).json({
            code: 400,
            message: '指定项目经理不存在',
            data: null
          })
        }
        logger.info(`项目经理验证成功: ${manager.name}`)
      }

      const project = await nedbService.createProject({
        name,
        code,
        description,
        managerId,
        startDate,
        endDate,
        budget: budget || 0,
        profitTarget: profitTarget || 0,
        priority: priority || 'medium',
        createdBy: req.user.id
      })

      logger.info(`管理员${req.user.username}创建项目: ${name} (${code})`)

      res.status(201).json({
        code: 201,
        data: {
          ...project,
          id: project._id // 兼容前端期望的 id 字段
        },
        message: '项目创建成功'
      })

    } catch (error) {
      logger.error('Create project error:', error)
      next(error)
    }
  }

  // 更新项目
  async updateProject(req, res, next) {
    try {
      const { id } = req.params
      const { 
        name, 
        code, 
        description, 
        managerId,
        startDate,
        endDate,
        budget,
        profitTarget,
        priority,
        status 
      } = req.body

      const project = await nedbService.getProjectById(id)
      if (!project) {
        return res.status(404).json({
          code: 404,
          message: '项目不存在',
          data: null
        })
      }

      // 检查项目代码是否被其他项目使用
      if (code && code !== project.code) {
        const existingCode = await nedbService.findOne('projects', {
          code,
          _id: { $ne: id }
        })
        
        if (existingCode) {
          return res.status(400).json({
            code: 400,
            message: '项目代码已被其他项目使用',
            data: null
          })
        }
      }

      // 检查项目名称是否被其他项目使用
      if (name && name !== project.name) {
        const existingName = await nedbService.findOne('projects', {
          name,
          _id: { $ne: id }
        })
        
        if (existingName) {
          return res.status(400).json({
            code: 400,
            message: '项目名称已被其他项目使用',
            data: null
          })
        }
      }

      // 验证项目经理是否存在
      if (managerId && managerId !== project.managerId) {
        const manager = await nedbService.getEmployeeById(managerId)
        if (!manager) {
          return res.status(400).json({
            code: 400,
            message: '指定项目经理不存在',
            data: null
          })
        }
      }

      await nedbService.updateProject(id, {
        name: name || project.name,
        code: code || project.code,
        description: description !== undefined ? description : project.description,
        managerId: managerId !== undefined ? managerId : project.managerId,
        startDate: startDate || project.startDate,
        endDate: endDate || project.endDate,
        budget: budget !== undefined ? budget : project.budget,
        profitTarget: profitTarget !== undefined ? profitTarget : project.profitTarget,
        priority: priority || project.priority,
        status: status || project.status
      })

      logger.info(`管理员${req.user.username}更新项目: ${project.name} (${project.code})`)

      res.json({
        code: 200,
        data: project,
        message: '项目更新成功'
      })

    } catch (error) {
      logger.error('Update project error:', error)
      next(error)
    }
  }

  // 删除项目
  async deleteProject(req, res, next) {
    try {
      const { id } = req.params

      const project = await nedbService.getProjectById(id)
      if (!project) {
        return res.status(404).json({
          code: 404,
          message: '项目不存在',
          data: null
        })
      }

      // 检查项目是否有权重配置
      const weightCount = await nedbService.count('projectLineWeights', { projectId: id })

      if (weightCount > 0) {
        return res.status(400).json({
          code: 400,
          message: `该项目有${weightCount}个业务线权重配置，请先清理权重配置`,
          data: null
        })
      }

      await nedbService.deleteProject(id)

      logger.info(`管理员${req.user.username}删除项目: ${project.name} (${project.code})`)

      res.json({
        code: 200,
        data: null,
        message: '项目删除成功'
      })

    } catch (error) {
      logger.error('Delete project error:', error)
      next(error)
    }
  }

  // 获取项目业务线权重配置
  async getProjectWeights(req, res, next) {
    try {
      const { id } = req.params

      const project = await nedbService.getProjectById(id)
      if (!project) {
        return res.status(404).json({
          code: 404,
          message: '项目不存在',
          data: null
        })
      }

      // 获取所有业务线
      const businessLines = await nedbService.getBusinessLines()

      // 获取项目特定权重配置
      const projectWeights = await nedbService.getProjectWeights(id)

      // 构建权重配置列表
      const weightConfig = businessLines.map(line => {
        const customWeight = projectWeights.find(w => w.businessLineId === line._id)
        return {
          businessLineId: line._id,
          businessLineName: line.name,
          businessLineCode: line.code,
          defaultWeight: line.weight,
          customWeight: customWeight ? customWeight.weight : null,
          isCustom: !!customWeight,
          effectiveWeight: customWeight ? customWeight.weight : line.weight,
          reason: customWeight ? customWeight.reason : null,
          effectiveDate: customWeight ? customWeight.createdAt : null,
          configId: customWeight ? customWeight._id : null
        }
      })

      res.json({
        code: 200,
        data: {
          project: {
            id: project.id,
            name: project.name,
            code: project.code
          },
          weightConfig
        },
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get project weights error:', error)
      next(error)
    }
  }

  // 更新项目业务线权重配置
  async updateProjectWeights(req, res, next) {
    try {
      const { id } = req.params
      const { weights, reason } = req.body

      const project = await nedbService.getProjectById(id)
      if (!project) {
        return res.status(404).json({
          code: 404,
          message: '项目不存在',
          data: null
        })
      }

      // 验证权重总和是否为1
      const totalWeight = weights.reduce((sum, w) => sum + parseFloat(w.weight), 0)
      if (Math.abs(totalWeight - 1) > 0.001) {
        return res.status(400).json({
          code: 400,
          message: '权重总和必须等于100%',
          data: null
        })
      }

      // 验证业务线是否存在
      const businessLineIds = weights.map(w => w.businessLineId)
      const existingLines = await nedbService.getBusinessLines()
      const validLines = existingLines.filter(line => businessLineIds.includes(line._id))
      
      if (validLines.length !== businessLineIds.length) {
        return res.status(400).json({
          code: 400,
          message: '部分业务线不存在',
          data: null
        })
      }

      // 删除现有权重配置
      await nedbService.deleteMany('projectLineWeights', { projectId: id })

      // 创建新的权重配置
      const weightConfigs = weights.map(weight => ({
        projectId: id,
        businessLineId: weight.businessLineId,
        weight: weight.weight,
        reason: reason || null,
        isCustom: true,
        effectiveDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }))

      if (weightConfigs.length > 0) {
        await nedbService.createMany('projectLineWeights', weightConfigs)
      }

      logger.info(`管理员${req.user.username}更新项目${project.name}的业务线权重配置`)

      res.json({
        code: 200,
        data: { updatedCount: weightConfigs.length },
        message: '权重配置更新成功'
      })

    } catch (error) {
      logger.error('Update project weights error:', error)
      next(error)
    }
  }

  // 重置项目权重到默认值
  async resetProjectWeights(req, res, next) {
    try {
      const { id } = req.params

      const project = await nedbService.getProjectById(id)
      if (!project) {
        return res.status(404).json({
          code: 404,
          message: '项目不存在',
          data: null
        })
      }

      // 删除项目的自定义权重配置
      const deletedCount = await nedbService.deleteMany('projectLineWeights', { projectId: id })

      logger.info(`管理员${req.user.username}重置项目${project.name}的权重配置，删除${deletedCount}条自定义配置`)

      res.json({
        code: 200,
        data: { deletedCount },
        message: '权重配置已重置为默认值'
      })

    } catch (error) {
      logger.error('Reset project weights error:', error)
      next(error)
    }
  }

  // 获取权重使用情况统计
  async getWeightStatistics(req, res, next) {
    try {
      // 项目数量统计
      const allProjects = await nedbService.getProjects()
      const projectStats = []
      const statusCounts = {}
      
      allProjects.forEach(project => {
        const status = project.status || 'unknown'
        statusCounts[status] = (statusCounts[status] || 0) + 1
      })
      
      Object.entries(statusCounts).forEach(([status, count]) => {
        projectStats.push({ status, count })
      })

      // 自定义权重配置统计
      const allWeights = await nedbService.find('projectLineWeights', {})
      const customWeightCount = allWeights.filter(w => w.isCustom).length

      // 业务线权重配置分布
      const lineWeightStats = []
      const businessLines = await nedbService.getBusinessLines()
      
      businessLines.forEach(line => {
        const lineWeights = allWeights.filter(w => w.businessLineId === line._id)
        if (lineWeights.length > 0) {
          const avgWeight = lineWeights.reduce((sum, w) => sum + w.weight, 0) / lineWeights.length
          lineWeightStats.push({
            businessLineId: line._id,
            projectCount: lineWeights.length,
            avgWeight: avgWeight,
            BusinessLine: {
              name: line.name,
              code: line.code,
              weight: line.weight
            }
          })
        }
      })

      res.json({
        code: 200,
        data: {
          projectStats,
          customWeightCount,
          lineWeightStats
        },
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get weight statistics error:', error)
      next(error)
    }
  }


  // 获取用户可申请的项目列表
  async getAvailableProjects(req, res, next) {
    try {
      const userId = req.user.id
      console.log('获取可申请项目，用户ID:', userId)
      
      // 获取当前用户的员工信息
      const employee = await nedbService.getEmployeeByUserId(userId)
      if (!employee) {
        console.log('用户未关联员工信息')
        return res.status(400).json({
          code: 400,
          message: '当前用户未关联员工信息',
          data: null
        })
      }
      console.log('找到员工信息:', employee.name)

      // 获取所有项目
      const allProjects = await nedbService.getProjects()
      console.log('数据库中的项目总数:', allProjects.length)
      
      // 放宽状态过滤条件，包含更多状态的项目
      const availableStatuses = ['active', 'planning', 'team_building', 'recruiting']
      const activeProjects = allProjects.filter(project => 
        availableStatuses.includes(project.status)
      )
      console.log('符合状态条件的项目数:', activeProjects.length)
      console.log('项目状态分布:', activeProjects.map(p => ({ name: p.name, status: p.status })))

      // 获取用户已加入的项目ID列表
      const userProjectMembers = await nedbService.getEmployeeProjectMembers(employee._id)
      const joinedProjectIds = userProjectMembers
        .filter(member => member.status === 'active' || member.status === 'pending')
        .map(member => member.projectId)
      console.log('用户已加入的项目ID:', joinedProjectIds)

      // 过滤出用户未加入的项目
      const availableProjects = activeProjects.filter(project => 
        !joinedProjectIds.includes(project._id)
      )
      console.log('最终可申请的项目数:', availableProjects.length)

      // 获取每个项目的经理信息
      const projectsWithManager = await Promise.all(
        availableProjects.map(async (project) => {
          let manager = null
          if (project.managerId) {
            manager = await nedbService.getEmployeeById(project.managerId)
          }
          
          return {
            ...project,
            id: project._id, // 兼容前端期望的 id 字段
            Manager: manager ? {
              id: manager._id,
              name: manager.name,
              employeeNo: manager.employeeNo
            } : null
          }
        })
      )

      console.log('返回给前端的项目数据:', projectsWithManager.length, '个')
      res.json({
        code: 200,
        data: {
          projects: projectsWithManager,
          total: projectsWithManager.length
        },
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get available projects error:', error)
      next(error)
    }
  }

  // 获取我参与的项目列表
  async getMyProjects(req, res, next) {
    try {
      const userId = req.user.id
      const { status } = req.query
      
      // 获取当前用户的员工信息
      const employee = await nedbService.getEmployeeByUserId(userId)
      if (!employee) {
        return res.status(400).json({
          code: 400,
          message: '当前用户未关联员工信息',
          data: null
        })
      }

      // 获取用户的项目成员记录
      let projectMembers = await nedbService.getEmployeeProjectMembers(employee._id)
      
      // 状态过滤
      if (status) {
        projectMembers = projectMembers.filter(member => member.status === status)
      }

      // 获取项目详情
      const projectsWithDetails = await Promise.all(
        projectMembers.map(async (member) => {
          const project = await nedbService.getProjectById(member.projectId)
          if (!project) return null

          // 获取项目经理信息
          let manager = null
          if (project.managerId) {
            manager = await nedbService.getEmployeeById(project.managerId)
          }

          return {
            ...project,
            id: project._id,
            projectName: project.name,           // 前端期望的字段名
            projectCode: project.code,           // 前端期望的字段名
            projectStatus: project.status,       // 前端期望的字段名
            roleName: member.role || '成员',     // 前端期望的字段名
            joinDate: member.joinDate || member.createdAt,
            status: member.status || 'active',   // 参与状态
            participationRatio: member.expectedContribution || 0, // 前端期望的字段名
            projectBonus: member.projectBonus || 0, // 项目奖金
            Manager: manager ? {
              id: manager._id,
              name: manager.name,
              employeeNo: manager.employeeNo
            } : null
          }
        })
      )

      // 过滤掉不存在的项目
      const validProjects = projectsWithDetails.filter(project => project !== null)

      res.json({
        code: 200,
        data: {
          projects: validProjects,
          total: validProjects.length,
          employee: {
            id: employee._id,
            name: employee.name,
            employeeNo: employee.employeeNo
          }
        },
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get my projects error:', error)
      next(error)
    }
  }

  // 申请加入项目
  async applyToProject(req, res, next) {
    try {
      const userId = req.user.id
      const { projectId, role, reason, expectedContribution } = req.body
      
      // 获取当前用户的员工信息
      const employee = await nedbService.getEmployeeByUserId(userId)
      if (!employee) {
        return res.status(400).json({
          code: 400,
          message: '当前用户未关联员工信息',
          data: null
        })
      }

      // 检查项目是否存在
      const project = await nedbService.getProjectById(projectId)
      if (!project) {
        return res.status(404).json({
          code: 404,
          message: '项目不存在',
          data: null
        })
      }

      // 检查是否已经申请过该项目
      const existingApplication = await nedbService.findOne('projectMembers', {
        projectId: projectId,
        employeeId: employee._id
      })

      if (existingApplication) {
        return res.status(409).json({
          code: 409,
          message: `您已经${existingApplication.status === 'pending' ? '申请过' : '加入了'}该项目`,
          data: {
            currentStatus: existingApplication.status,
            applicationDate: existingApplication.createdAt
          }
        })
      }

      // 创建项目申请记录
      const application = await nedbService.createProjectMember({
        projectId: projectId,
        employeeId: employee._id,
        role: role,
        reason: reason,
        expectedContribution: expectedContribution || null,
        status: 'pending', // 待审批状态
        appliedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // 获取项目经理信息用于通知
      let projectManager = null
      if (project.managerId) {
        projectManager = await nedbService.getEmployeeById(project.managerId)
      }

      logger.info(`员工${employee.name}申请加入项目${project.name}，角色：${role}`)

      res.json({
        code: 200,
        data: {
          application: {
            id: application._id,
            projectId: projectId,
            projectName: project.name,
            role: role,
            status: 'pending',
            appliedAt: application.appliedAt,
            projectManager: projectManager ? {
              name: projectManager.name,
              employeeNo: projectManager.employeeNo
            } : null
          },
          nextSteps: [
            '您的申请已提交成功',
            '项目经理将在3个工作日内处理您的申请',
            '您可以在"我的项目"页面查看申请状态'
          ]
        },
        message: '项目申请提交成功'
      })

    } catch (error) {
      logger.error('Apply to project error:', error)
      next(error)
    }
  }
}

module.exports = new ProjectController()