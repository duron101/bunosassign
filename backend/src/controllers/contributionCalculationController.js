const { EmployeeProfitContribution, Employee, Project, BusinessLine, Position, Department } = require('../models')
const { Op } = require('sequelize')
const logger = require('../utils/logger')
const profitCalculationService = require('../services/profitCalculationService')

class ContributionCalculationController {
  // 获取员工贡献度列表
  async getEmployeeContributions(req, res, next) {
    try {
      const { 
        page = 1, 
        pageSize = 20, 
        period,
        employeeId,
        projectId,
        reviewStatus,
        contributionType,
        startPeriod,
        endPeriod
      } = req.query

      const where = { status: 1 }
      
      // 期间筛选
      if (period) {
        where.period = period
      } else if (startPeriod && endPeriod) {
        where.period = {
          [Op.between]: [startPeriod, endPeriod]
        }
      } else if (startPeriod) {
        where.period = {
          [Op.gte]: startPeriod
        }
      } else if (endPeriod) {
        where.period = {
          [Op.lte]: endPeriod
        }
      }

      // 员工筛选
      if (employeeId) {
        where.employeeId = employeeId
      }

      // 项目筛选
      if (projectId) {
        where.projectId = projectId
      }

      // 审核状态筛选
      if (reviewStatus) {
        where.reviewStatus = reviewStatus
      }

      // 贡献类型筛选
      if (contributionType) {
        where.contributionType = contributionType
      }

      const offset = (page - 1) * pageSize

      const { count, rows } = await EmployeeProfitContribution.findAndCountAll({
        where,
        include: [
          {
            model: Employee,
            attributes: ['id', 'name', 'employeeNo'],
            include: [
              {
                model: Position,
                attributes: ['id', 'name', 'level']
              },
              {
                model: Department,
                attributes: ['id', 'name']
              }
            ]
          },
          {
            model: Project,
            attributes: ['id', 'name', 'code'],
            required: false
          }
        ],
        offset,
        limit: parseInt(pageSize),
        order: [['period', 'DESC'], ['totalContributionScore', 'DESC']]
      })

      res.json({
        code: 200,
        data: {
          contributions: rows,
          pagination: {
            total: count,
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            totalPages: Math.ceil(count / pageSize)
          }
        },
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get employee contributions error:', error)
      next(error)
    }
  }

  // 获取贡献度详情
  async getContributionDetail(req, res, next) {
    try {
      const { id } = req.params

      const contribution = await EmployeeProfitContribution.findByPk(id, {
        include: [
          {
            model: Employee,
            attributes: ['id', 'name', 'employeeNo'],
            include: [
              {
                model: Position,
                attributes: ['id', 'name', 'level', 'benchmarkValue']
              },
              {
                model: Department,
                attributes: ['id', 'name']
              }
            ]
          },
          {
            model: Project,
            attributes: ['id', 'name', 'code', 'status']
          }
        ]
      })

      if (!contribution) {
        return res.status(404).json({
          code: 404,
          message: '贡献度记录不存在',
          data: null
        })
      }

      res.json({
        code: 200,
        data: contribution,
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get contribution detail error:', error)
      next(error)
    }
  }

  // 计算员工贡献度
  async calculateEmployeeContribution(req, res, next) {
    try {
      const { employeeId, period, projectId } = req.body

      // 验证员工是否存在
      const employee = await Employee.findByPk(employeeId)
      if (!employee) {
        return res.status(400).json({
          code: 400,
          message: '指定员工不存在',
          data: null
        })
      }

      // 验证项目是否存在
      if (projectId) {
        const project = await Project.findByPk(projectId)
        if (!project) {
          return res.status(400).json({
            code: 400,
            message: '指定项目不存在',
            data: null
          })
        }
      }

      // 调用计算服务
      const result = await profitCalculationService.calculateEmployeeProfitContribution(
        employeeId, 
        period, 
        projectId
      )

      logger.info(`管理员${req.user.username}计算员工贡献度: ${employee.name} - ${period}`)

      res.json({
        code: 200,
        data: result,
        message: '计算成功'
      })

    } catch (error) {
      logger.error('Calculate employee contribution error:', error)
      next(error)
    }
  }

  // 批量计算贡献度
  async batchCalculateContributions(req, res, next) {
    try {
      const { period, employeeIds, projectId } = req.body

      if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
        return res.status(400).json({
          code: 400,
          message: '请提供有效的员工ID列表',
          data: null
        })
      }

      const results = []
      const errors = []

      for (let i = 0; i < employeeIds.length; i++) {
        try {
          const employeeId = employeeIds[i]
          
          const result = await profitCalculationService.calculateEmployeeProfitContribution(
            employeeId, 
            period, 
            projectId
          )
          
          results.push({ 
            employeeId, 
            success: true, 
            data: result 
          })
        } catch (error) {
          errors.push({ 
            employeeId: employeeIds[i], 
            error: error.message 
          })
        }
      }

      logger.info(`管理员${req.user.username}批量计算贡献度: 期间${period}, 成功${results.length}条，失败${errors.length}条`)

      res.json({
        code: 200,
        data: {
          successCount: results.length,
          errorCount: errors.length,
          results,
          errors
        },
        message: `批量计算完成：成功${results.length}条，失败${errors.length}条`
      })

    } catch (error) {
      logger.error('Batch calculate contributions error:', error)
      next(error)
    }
  }

  // 审核贡献度
  async reviewContribution(req, res, next) {
    try {
      const { id } = req.params
      const { reviewStatus, reviewComments, adjustedScore } = req.body

      const contribution = await EmployeeProfitContribution.findByPk(id)
      if (!contribution) {
        return res.status(404).json({
          code: 404,
          message: '贡献度记录不存在',
          data: null
        })
      }

      const updateData = {
        reviewStatus,
        reviewComments,
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
        updatedBy: req.user.id
      }

      // 如果是调整状态，更新得分
      if (reviewStatus === 'adjusted' && adjustedScore !== undefined) {
        updateData.totalContributionScore = adjustedScore
      }

      await contribution.update(updateData)

      logger.info(`管理员${req.user.username}审核贡献度: ${contribution.period} - ${reviewStatus}`)

      res.json({
        code: 200,
        data: contribution,
        message: '审核成功'
      })

    } catch (error) {
      logger.error('Review contribution error:', error)
      next(error)
    }
  }

  // 获取贡献度统计
  async getContributionStatistics(req, res, next) {
    try {
      const { period, projectId, departmentId } = req.query

      const where = { status: 1 }
      
      if (period) {
        where.period = period
      }
      
      if (projectId) {
        where.projectId = projectId
      }

      // 基础统计
      const totalStats = await EmployeeProfitContribution.findAll({
        where,
        attributes: [
          [sequelize.fn('SUM', sequelize.col('contribution_amount')), 'totalContribution'],
          [sequelize.fn('AVG', sequelize.col('total_contribution_score')), 'avgContributionScore'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'recordCount'],
          [sequelize.fn('COUNT', sequelize.literal('CASE WHEN review_status = "approved" THEN 1 END')), 'approvedCount'],
          [sequelize.fn('COUNT', sequelize.literal('CASE WHEN review_status = "pending" THEN 1 END')), 'pendingCount']
        ],
        raw: true
      })

      // 按贡献类型统计
      const typeStats = await EmployeeProfitContribution.findAll({
        where,
        attributes: [
          'contributionType',
          [sequelize.fn('SUM', sequelize.col('contribution_amount')), 'amount'],
          [sequelize.fn('AVG', sequelize.col('total_contribution_score')), 'avgScore'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['contributionType'],
        raw: true
      })

      // 按部门统计
      const departmentStats = await EmployeeProfitContribution.findAll({
        where,
        include: [
          {
            model: Employee,
            attributes: [],
            include: [
              {
                model: Department,
                attributes: ['id', 'name']
              }
            ]
          }
        ],
        attributes: [
          [sequelize.col('Employee.Department.id'), 'departmentId'],
          [sequelize.col('Employee.Department.name'), 'departmentName'],
          [sequelize.fn('SUM', sequelize.col('contribution_amount')), 'amount'],
          [sequelize.fn('AVG', sequelize.col('total_contribution_score')), 'avgScore'],
          [sequelize.fn('COUNT', sequelize.col('EmployeeProfitContribution.id')), 'count']
        ],
        group: ['Employee.Department.id'],
        raw: true
      })

      // Top 贡献者
      const topContributors = await EmployeeProfitContribution.findAll({
        where,
        include: [
          {
            model: Employee,
            attributes: ['id', 'name', 'employeeNo'],
            include: [
              {
                model: Position,
                attributes: ['name', 'level']
              }
            ]
          }
        ],
        order: [['totalContributionScore', 'DESC']],
        limit: 10
      })

      res.json({
        code: 200,
        data: {
          summary: totalStats[0],
          typeStats,
          departmentStats,
          topContributors
        },
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get contribution statistics error:', error)
      next(error)
    }
  }

  // 获取项目贡献分析
  async getProjectContributionAnalysis(req, res, next) {
    try {
      const { projectId, period } = req.query

      if (!projectId) {
        return res.status(400).json({
          code: 400,
          message: '项目ID必填',
          data: null
        })
      }

      // 调用计算服务获取项目贡献分析
      const projectContribution = await profitCalculationService.calculateProjectProfitContribution(
        projectId, 
        period
      )

      // 获取项目成员贡献详情
      const memberContributions = await EmployeeProfitContribution.findAll({
        where: {
          projectId,
          period: period || { [Op.ne]: null },
          status: 1
        },
        include: [
          {
            model: Employee,
            attributes: ['id', 'name', 'employeeNo'],
            include: [
              {
                model: Position,
                attributes: ['name', 'level']
              }
            ]
          }
        ],
        order: [['totalContributionScore', 'DESC']]
      })

      res.json({
        code: 200,
        data: {
          projectContribution,
          memberContributions
        },
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get project contribution analysis error:', error)
      next(error)
    }
  }

  // 导出贡献度数据
  async exportContributions(req, res, next) {
    try {
      const { period, format = 'excel' } = req.query

      const where = { status: 1 }
      if (period) {
        where.period = period
      }

      const contributions = await EmployeeProfitContribution.findAll({
        where,
        include: [
          {
            model: Employee,
            attributes: ['name', 'employeeNo'],
            include: [
              {
                model: Position,
                attributes: ['name', 'level']
              },
              {
                model: Department,
                attributes: ['name']
              }
            ]
          },
          {
            model: Project,
            attributes: ['name', 'code'],
            required: false
          }
        ],
        order: [['period', 'DESC'], ['totalContributionScore', 'DESC']]
      })

      // 转换为导出格式
      const exportData = contributions.map(item => ({
        period: item.period,
        employeeName: item.Employee.name,
        employeeNo: item.Employee.employeeNo,
        department: item.Employee.Department.name,
        position: item.Employee.Position.name,
        level: item.Employee.Position.level,
        project: item.Project ? item.Project.name : '无',
        contributionType: item.contributionType,
        contributionAmount: item.contributionAmount,
        contributionRatio: item.contributionRatio,
        workHours: item.workHours,
        qualityScore: item.qualityScore,
        totalScore: item.totalContributionScore,
        reviewStatus: item.reviewStatus
      }))

      logger.info(`管理员${req.user.username}导出贡献度数据: ${contributions.length}条记录`)

      res.json({
        code: 200,
        data: exportData,
        message: '导出成功'
      })

    } catch (error) {
      logger.error('Export contributions error:', error)
      next(error)
    }
  }
}

module.exports = new ContributionCalculationController()