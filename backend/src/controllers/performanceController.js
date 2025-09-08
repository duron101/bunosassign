const { 
  PerformanceIndicator,
  PerformanceAssessment,
  PerformanceIndicatorData,
  Employee,
  Position,
  Department,
  BusinessLine,
  sequelize
} = require('../models')
const { Op } = require('sequelize')
const logger = require('../utils/logger')
const performanceCalculationService = require('../services/performanceCalculationService')

class PerformanceController {
  // ========== 绩效指标管理 ==========
  
  // 获取绩效指标列表
  async getIndicatorList(req, res, next) {
    try {
      const { 
        page = 1, 
        pageSize = 20, 
        category,
        status,
        measurementType,
        positionId,
        businessLineId
      } = req.query

      const where = {}
      
      if (category) {
        where.category = category
      }
      
      if (status) {
        where.status = status
      }
      
      if (measurementType) {
        where.measurementType = measurementType
      }
      
      if (positionId) {
        where.applicablePositions = {
          [Op.contains]: [parseInt(positionId)]
        }
      }
      
      if (businessLineId) {
        where.applicableBusinessLines = {
          [Op.contains]: [parseInt(businessLineId)]
        }
      }

      const offset = (page - 1) * pageSize

      const { count, rows } = await PerformanceIndicator.findAndCountAll({
        where,
        offset,
        limit: parseInt(pageSize),
        order: [['category', 'ASC'], ['displayOrder', 'ASC']]
      })

      res.json({
        code: 200,
        data: {
          indicators: rows,
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
      logger.error('Get indicator list error:', error)
      next(error)
    }
  }

  // 创建绩效指标
  async createIndicator(req, res, next) {
    try {
      const {
        name,
        code,
        category,
        measurementType,
        dataType,
        unit,
        scoringMethod,
        minValue,
        maxValue,
        targetValue,
        excellentThreshold,
        weight,
        priority,
        calculationFormula,
        scoringRules,
        applicablePositions,
        applicableLevels,
        applicableBusinessLines,
        dataSource,
        dataSourceConfig,
        updateFrequency,
        description,
        measurementGuideline,
        effectiveDate
      } = req.body

      const indicator = await PerformanceIndicator.create({
        name,
        code,
        category,
        measurementType,
        dataType,
        unit,
        scoringMethod,
        minValue,
        maxValue,
        targetValue,
        excellentThreshold,
        weight,
        priority,
        calculationFormula,
        scoringRules,
        applicablePositions,
        applicableLevels,
        applicableBusinessLines,
        dataSource,
        dataSourceConfig,
        updateFrequency,
        description,
        measurementGuideline,
        effectiveDate,
        status: 'draft',
        createdBy: req.user.id
      })

      logger.info(`管理员${req.user.username}创建绩效指标: ${name}`)

      res.status(201).json({
        code: 201,
        data: indicator,
        message: '绩效指标创建成功'
      })

    } catch (error) {
      logger.error('Create indicator error:', error)
      next(error)
    }
  }

  // 更新绩效指标
  async updateIndicator(req, res, next) {
    try {
      const { id } = req.params
      const updateData = req.body

      const indicator = await PerformanceIndicator.findByPk(id)
      if (!indicator) {
        return res.status(404).json({
          code: 404,
          message: '绩效指标不存在',
          data: null
        })
      }

      await indicator.update({
        ...updateData,
        updatedBy: req.user.id
      })

      logger.info(`管理员${req.user.username}更新绩效指标: ${indicator.name}`)

      res.json({
        code: 200,
        data: indicator,
        message: '绩效指标更新成功'
      })

    } catch (error) {
      logger.error('Update indicator error:', error)
      next(error)
    }
  }

  // ========== 绩效评估管理 ==========

  // 计算绩效评估
  async calculatePerformanceAssessment(req, res, next) {
    try {
      const { employeeId, assessmentPeriod, assessmentType } = req.body

      // 验证员工是否存在
      const employee = await Employee.findByPk(employeeId)
      if (!employee) {
        return res.status(400).json({
          code: 400,
          message: '指定员工不存在',
          data: null
        })
      }

      // 调用计算服务
      const result = await performanceCalculationService.calculatePerformanceAssessment(
        employeeId, 
        assessmentPeriod, 
        assessmentType
      )

      logger.info(`管理员${req.user.username}计算绩效评估: ${employee.name} - ${assessmentPeriod}`)

      res.json({
        code: 200,
        data: result,
        message: '计算成功'
      })

    } catch (error) {
      logger.error('Calculate performance assessment error:', error)
      next(error)
    }
  }

  // 批量计算绩效评估
  async batchCalculateAssessments(req, res, next) {
    try {
      const { employeeIds, assessmentPeriod, assessmentType } = req.body

      if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
        return res.status(400).json({
          code: 400,
          message: '请提供有效的员工ID列表',
          data: null
        })
      }

      const { results, errors } = await performanceCalculationService.batchCalculatePerformanceAssessments(
        employeeIds, 
        assessmentPeriod, 
        assessmentType
      )

      logger.info(`管理员${req.user.username}批量计算绩效评估: 期间${assessmentPeriod}, 成功${results.length}条，失败${errors.length}条`)

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
      logger.error('Batch calculate assessments error:', error)
      next(error)
    }
  }

  // 获取绩效评估列表
  async getAssessmentList(req, res, next) {
    try {
      const { 
        page = 1, 
        pageSize = 20, 
        employeeId,
        assessmentPeriod,
        assessmentType,
        assessmentStatus,
        performanceGrade,
        departmentId,
        startPeriod,
        endPeriod
      } = req.query

      const where = { status: 1 }
      
      if (employeeId) {
        where.employeeId = employeeId
      }
      
      if (assessmentPeriod) {
        where.assessmentPeriod = assessmentPeriod
      } else if (startPeriod && endPeriod) {
        where.assessmentPeriod = {
          [Op.between]: [startPeriod, endPeriod]
        }
      }
      
      if (assessmentType) {
        where.assessmentType = assessmentType
      }
      
      if (assessmentStatus) {
        where.assessmentStatus = assessmentStatus
      }
      
      if (performanceGrade) {
        where.performanceGrade = performanceGrade
      }

      const offset = (page - 1) * pageSize

      const { count, rows } = await PerformanceAssessment.findAndCountAll({
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
                attributes: ['id', 'name'],
                where: departmentId ? { id: departmentId } : undefined
              }
            ]
          }
        ],
        offset,
        limit: parseInt(pageSize),
        order: [['assessmentPeriod', 'DESC'], ['overallFinalScore', 'DESC']]
      })

      res.json({
        code: 200,
        data: {
          assessments: rows,
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
      logger.error('Get assessment list error:', error)
      next(error)
    }
  }

  // 获取评估详情
  async getAssessmentDetail(req, res, next) {
    try {
      const { id } = req.params

      const assessment = await PerformanceAssessment.findByPk(id, {
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
            model: PerformanceIndicatorData,
            include: [
              {
                model: PerformanceIndicator,
                attributes: ['id', 'name', 'code', 'category', 'unit']
              }
            ]
          }
        ]
      })

      if (!assessment) {
        return res.status(404).json({
          code: 404,
          message: '评估记录不存在',
          data: null
        })
      }

      res.json({
        code: 200,
        data: assessment,
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get assessment detail error:', error)
      next(error)
    }
  }

  // 更新评估状态
  async updateAssessmentStatus(req, res, next) {
    try {
      const { id } = req.params
      const { assessmentStatus, comments } = req.body

      const assessment = await PerformanceAssessment.findByPk(id)
      if (!assessment) {
        return res.status(404).json({
          code: 404,
          message: '评估记录不存在',
          data: null
        })
      }

      const updateData = {
        assessmentStatus,
        updatedBy: req.user.id
      }

      // 根据状态更新相应字段
      switch (assessmentStatus) {
        case 'self_completed':
          updateData.selfAssessmentBy = req.user.id
          updateData.selfAssessmentDate = new Date()
          updateData.selfComments = comments
          break
        case 'manager_reviewing':
          updateData.managerAssessmentBy = req.user.id
          updateData.managerAssessmentDate = new Date()
          updateData.managerComments = comments
          break
        case 'hr_reviewing':
          updateData.hrReviewBy = req.user.id
          updateData.hrReviewDate = new Date()
          updateData.hrComments = comments
          break
        case 'completed':
          updateData.finalApprovalBy = req.user.id
          updateData.finalApprovalDate = new Date()
          updateData.finalComments = comments
          break
      }

      await assessment.update(updateData)

      logger.info(`管理员${req.user.username}更新评估状态: ${assessment.assessmentPeriod} - ${assessmentStatus}`)

      res.json({
        code: 200,
        data: assessment,
        message: '状态更新成功'
      })

    } catch (error) {
      logger.error('Update assessment status error:', error)
      next(error)
    }
  }

  // ========== 指标数据管理 ==========

  // 更新指标数据
  async updateIndicatorData(req, res, next) {
    try {
      const { id } = req.params
      const { 
        actualValue, 
        targetValue, 
        textValue, 
        booleanValue, 
        enumValue,
        selfScore,
        managerScore,
        selfComments,
        managerComments
      } = req.body

      const indicatorData = await PerformanceIndicatorData.findByPk(id)
      if (!indicatorData) {
        return res.status(404).json({
          code: 404,
          message: '指标数据不存在',
          data: null
        })
      }

      await indicatorData.update({
        actualValue,
        targetValue,
        textValue,
        booleanValue,
        enumValue,
        selfScore,
        managerScore,
        selfComments,
        managerComments,
        updatedBy: req.user.id
      })

      logger.info(`管理员${req.user.username}更新指标数据: ${indicatorData.period}`)

      res.json({
        code: 200,
        data: indicatorData,
        message: '指标数据更新成功'
      })

    } catch (error) {
      logger.error('Update indicator data error:', error)
      next(error)
    }
  }

  // 审核指标数据
  async reviewIndicatorData(req, res, next) {
    try {
      const { id } = req.params
      const { reviewStatus, reviewComments, adjustedScore } = req.body

      const indicatorData = await PerformanceIndicatorData.findByPk(id)
      if (!indicatorData) {
        return res.status(404).json({
          code: 404,
          message: '指标数据不存在',
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

      if (adjustedScore !== undefined) {
        updateData.finalScore = adjustedScore
        updateData.normalizedScore = Math.max(0, Math.min(100, adjustedScore))
      }

      await indicatorData.update(updateData)

      logger.info(`管理员${req.user.username}审核指标数据: ${indicatorData.period} - ${reviewStatus}`)

      res.json({
        code: 200,
        data: indicatorData,
        message: '审核成功'
      })

    } catch (error) {
      logger.error('Review indicator data error:', error)
      next(error)
    }
  }

  // ========== 统计分析 ==========

  // 获取绩效统计
  async getPerformanceStatistics(req, res, next) {
    try {
      const { assessmentPeriod, assessmentType, departmentId, businessLineId } = req.query

      const where = { status: 1 }
      
      if (assessmentPeriod) {
        where.assessmentPeriod = assessmentPeriod
      }
      
      if (assessmentType) {
        where.assessmentType = assessmentType
      }

      // 基础统计
      const totalStats = await PerformanceAssessment.findAll({
        where,
        attributes: [
          [sequelize.fn('AVG', sequelize.col('overall_final_score')), 'avgScore'],
          [sequelize.fn('MAX', sequelize.col('overall_final_score')), 'maxScore'],
          [sequelize.fn('MIN', sequelize.col('overall_final_score')), 'minScore'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalCount'],
          [sequelize.fn('COUNT', sequelize.literal('CASE WHEN assessment_status = "completed" THEN 1 END')), 'completedCount']
        ],
        raw: true
      })

      // 按等级统计
      const gradeStats = await PerformanceAssessment.findAll({
        where,
        attributes: [
          'performanceGrade',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('AVG', sequelize.col('overall_final_score')), 'avgScore']
        ],
        group: ['performanceGrade'],
        raw: true
      })

      // 按部门统计
      const departmentStats = await PerformanceAssessment.findAll({
        where,
        include: [
          {
            model: Employee,
            attributes: [],
            include: [
              {
                model: Department,
                attributes: ['id', 'name'],
                where: departmentId ? { id: departmentId } : undefined
              }
            ]
          }
        ],
        attributes: [
          [sequelize.col('Employee.Department.id'), 'departmentId'],
          [sequelize.col('Employee.Department.name'), 'departmentName'],
          [sequelize.fn('COUNT', sequelize.col('PerformanceAssessment.id')), 'count'],
          [sequelize.fn('AVG', sequelize.col('overall_final_score')), 'avgScore']
        ],
        group: ['Employee.Department.id'],
        raw: true
      })

      // 各维度得分统计
      const dimensionStats = await PerformanceAssessment.findAll({
        where,
        attributes: [
          [sequelize.fn('AVG', sequelize.col('work_output_score')), 'avgWorkOutput'],
          [sequelize.fn('AVG', sequelize.col('work_quality_score')), 'avgWorkQuality'],
          [sequelize.fn('AVG', sequelize.col('work_efficiency_score')), 'avgWorkEfficiency'],
          [sequelize.fn('AVG', sequelize.col('collaboration_score')), 'avgCollaboration'],
          [sequelize.fn('AVG', sequelize.col('innovation_score')), 'avgInnovation'],
          [sequelize.fn('AVG', sequelize.col('leadership_score')), 'avgLeadership'],
          [sequelize.fn('AVG', sequelize.col('learning_score')), 'avgLearning'],
          [sequelize.fn('AVG', sequelize.col('behavior_score')), 'avgBehavior']
        ],
        raw: true
      })

      res.json({
        code: 200,
        data: {
          summary: totalStats[0],
          gradeDistribution: gradeStats,
          departmentStats,
          dimensionStats: dimensionStats[0]
        },
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get performance statistics error:', error)
      next(error)
    }
  }

  // 导出绩效数据
  async exportPerformanceData(req, res, next) {
    try {
      const { assessmentPeriod, assessmentType, format = 'excel' } = req.query

      const where = { status: 1 }
      if (assessmentPeriod) {
        where.assessmentPeriod = assessmentPeriod
      }
      if (assessmentType) {
        where.assessmentType = assessmentType
      }

      const assessments = await PerformanceAssessment.findAll({
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
          }
        ],
        order: [['assessmentPeriod', 'DESC'], ['overallFinalScore', 'DESC']]
      })

      // 转换为导出格式
      const exportData = assessments.map(item => ({
        assessmentPeriod: item.assessmentPeriod,
        assessmentType: item.assessmentType,
        employeeName: item.Employee.name,
        employeeNo: item.Employee.employeeNo,
        department: item.Employee.Department.name,
        position: item.Employee.Position.name,
        level: item.Employee.Position.level,
        overallScore: item.overallFinalScore,
        performanceGrade: item.performanceGrade,
        finalCoefficient: item.finalCoefficient,
        workOutputScore: item.workOutputScore,
        workQualityScore: item.workQualityScore,
        workEfficiencyScore: item.workEfficiencyScore,
        collaborationScore: item.collaborationScore,
        innovationScore: item.innovationScore,
        leadershipScore: item.leadershipScore,
        learningScore: item.learningScore,
        behaviorScore: item.behaviorScore,
        assessmentStatus: item.assessmentStatus
      }))

      logger.info(`管理员${req.user.username}导出绩效数据: ${assessments.length}条记录`)

      res.json({
        code: 200,
        data: exportData,
        message: '导出成功'
      })

    } catch (error) {
      logger.error('Export performance data error:', error)
      next(error)
    }
  }

  // 获取绩效趋势分析
  async getPerformanceTrend(req, res, next) {
    try {
      const { employeeId, periods } = req.query

      if (!employeeId) {
        return res.status(400).json({
          code: 400,
          message: '员工ID必填',
          data: null
        })
      }

      const where = {
        employeeId: parseInt(employeeId),
        status: 1
      }

      if (periods) {
        where.assessmentPeriod = {
          [Op.in]: periods.split(',')
        }
      }

      const trendData = await PerformanceAssessment.findAll({
        where,
        attributes: [
          'assessmentPeriod',
          'overallFinalScore',
          'performanceGrade',
          'finalCoefficient',
          'workOutputScore',
          'workQualityScore',
          'workEfficiencyScore',
          'collaborationScore',
          'innovationScore',
          'leadershipScore',
          'learningScore',
          'behaviorScore'
        ],
        order: [['assessmentPeriod', 'ASC']]
      })

      res.json({
        code: 200,
        data: trendData,
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get performance trend error:', error)
      next(error)
    }
  }
}

module.exports = new PerformanceController()