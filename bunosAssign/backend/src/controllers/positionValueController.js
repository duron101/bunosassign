const { 
  PositionValueCriteria, 
  PositionValueAssessment, 
  PositionMarketData,
  Position,
  BusinessLine,
  Employee,
  sequelize
} = require('../models')
const { Op } = require('sequelize')
const logger = require('../utils/logger')
const positionValueService = require('../services/positionValueService')

class PositionValueController {
  // ========== 评估标准管理 ==========
  
  // 获取评估标准列表
  async getCriteriaList(req, res, next) {
    try {
      const { 
        page = 1, 
        pageSize = 20, 
        category,
        status,
        businessLineId
      } = req.query

      const where = {}
      
      if (category) {
        where.category = category
      }
      
      if (status) {
        where.status = status
      }
      
      if (businessLineId) {
        where.applicableBusinessLines = {
          [Op.contains]: [parseInt(businessLineId)]
        }
      }

      const offset = (page - 1) * pageSize

      const { count, rows } = await PositionValueCriteria.findAndCountAll({
        where,
        offset,
        limit: parseInt(pageSize),
        order: [['effectiveDate', 'DESC'], ['createdAt', 'DESC']]
      })

      res.json({
        code: 200,
        data: {
          criteria: rows,
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
      logger.error('Get criteria list error:', error)
      next(error)
    }
  }

  // 创建评估标准
  async createCriteria(req, res, next) {
    try {
      const {
        name,
        code,
        category,
        description,
        skillComplexityWeight,
        responsibilityWeight,
        decisionImpactWeight,
        experienceRequiredWeight,
        marketValueWeight,
        applicableBusinessLines,
        applicablePositionLevels,
        criteriaDetails,
        effectiveDate
      } = req.body

      const criteria = await PositionValueCriteria.create({
        name,
        code,
        category,
        description,
        skillComplexityWeight,
        responsibilityWeight,
        decisionImpactWeight,
        experienceRequiredWeight,
        marketValueWeight,
        applicableBusinessLines,
        applicablePositionLevels,
        criteriaDetails,
        effectiveDate,
        status: 'draft',
        createdBy: req.user.id
      })

      logger.info(`管理员${req.user.username}创建评估标准: ${name}`)

      res.status(201).json({
        code: 201,
        data: criteria,
        message: '评估标准创建成功'
      })

    } catch (error) {
      logger.error('Create criteria error:', error)
      next(error)
    }
  }

  // 更新评估标准
  async updateCriteria(req, res, next) {
    try {
      const { id } = req.params
      const updateData = req.body

      const criteria = await PositionValueCriteria.findByPk(id)
      if (!criteria) {
        return res.status(404).json({
          code: 404,
          message: '评估标准不存在',
          data: null
        })
      }

      await criteria.update({
        ...updateData,
        updatedBy: req.user.id
      })

      logger.info(`管理员${req.user.username}更新评估标准: ${criteria.name}`)

      res.json({
        code: 200,
        data: criteria,
        message: '评估标准更新成功'
      })

    } catch (error) {
      logger.error('Update criteria error:', error)
      next(error)
    }
  }

  // ========== 岗位价值评估 ==========

  // 计算岗位价值
  async calculatePositionValue(req, res, next) {
    try {
      const { positionId, assessmentPeriod, criteriaId } = req.body

      // 验证岗位是否存在
      const position = await Position.findByPk(positionId)
      if (!position) {
        return res.status(400).json({
          code: 400,
          message: '指定岗位不存在',
          data: null
        })
      }

      // 调用计算服务
      const result = await positionValueService.calculatePositionValue(
        positionId, 
        assessmentPeriod, 
        criteriaId
      )

      logger.info(`管理员${req.user.username}计算岗位价值: ${position.name} - ${assessmentPeriod}`)

      res.json({
        code: 200,
        data: result,
        message: '计算成功'
      })

    } catch (error) {
      logger.error('Calculate position value error:', error)
      next(error)
    }
  }

  // 批量计算岗位价值
  async batchCalculatePositionValues(req, res, next) {
    try {
      const { positionIds, assessmentPeriod, criteriaId } = req.body

      if (!Array.isArray(positionIds) || positionIds.length === 0) {
        return res.status(400).json({
          code: 400,
          message: '请提供有效的岗位ID列表',
          data: null
        })
      }

      const { results, errors } = await positionValueService.batchCalculatePositionValues(
        positionIds, 
        assessmentPeriod, 
        criteriaId
      )

      logger.info(`管理员${req.user.username}批量计算岗位价值: 期间${assessmentPeriod}, 成功${results.length}条，失败${errors.length}条`)

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
      logger.error('Batch calculate position values error:', error)
      next(error)
    }
  }

  // 获取岗位价值评估列表
  async getAssessmentList(req, res, next) {
    try {
      const { 
        page = 1, 
        pageSize = 20, 
        positionId,
        assessmentPeriod,
        valueGrade,
        reviewStatus,
        startPeriod,
        endPeriod
      } = req.query

      const where = { status: 1 }
      
      if (positionId) {
        where.positionId = positionId
      }
      
      if (assessmentPeriod) {
        where.assessmentPeriod = assessmentPeriod
      } else if (startPeriod && endPeriod) {
        where.assessmentPeriod = {
          [Op.between]: [startPeriod, endPeriod]
        }
      }
      
      if (valueGrade) {
        where.valueGrade = valueGrade
      }
      
      if (reviewStatus) {
        where.reviewStatus = reviewStatus
      }

      const offset = (page - 1) * pageSize

      const { count, rows } = await PositionValueAssessment.findAndCountAll({
        where,
        include: [
          {
            model: Position,
            attributes: ['id', 'name', 'level'],
            include: [
              {
                model: BusinessLine,
                attributes: ['id', 'name']
              }
            ]
          },
          {
            model: PositionValueCriteria,
            attributes: ['id', 'name', 'category']
          }
        ],
        offset,
        limit: parseInt(pageSize),
        order: [['assessmentPeriod', 'DESC'], ['normalizedValue', 'DESC']]
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

      const assessment = await PositionValueAssessment.findByPk(id, {
        include: [
          {
            model: Position,
            attributes: ['id', 'name', 'level', 'benchmarkValue'],
            include: [
              {
                model: BusinessLine,
                attributes: ['id', 'name']
              }
            ]
          },
          {
            model: PositionValueCriteria,
            attributes: ['id', 'name', 'category', 'description']
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

  // 审核评估结果
  async reviewAssessment(req, res, next) {
    try {
      const { id } = req.params
      const { reviewStatus, reviewComments, adjustedScore } = req.body

      const assessment = await PositionValueAssessment.findByPk(id)
      if (!assessment) {
        return res.status(404).json({
          code: 404,
          message: '评估记录不存在',
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
      if (reviewStatus === 'revision_required' && adjustedScore !== undefined) {
        updateData.normalizedValue = adjustedScore
        updateData.valueGrade = positionValueService.calculateGrade(adjustedScore)
      }

      await assessment.update(updateData)

      logger.info(`管理员${req.user.username}审核岗位价值评估: ${assessment.assessmentPeriod} - ${reviewStatus}`)

      res.json({
        code: 200,
        data: assessment,
        message: '审核成功'
      })

    } catch (error) {
      logger.error('Review assessment error:', error)
      next(error)
    }
  }

  // ========== 市场数据管理 ==========

  // 获取市场数据列表
  async getMarketDataList(req, res, next) {
    try {
      const { 
        page = 1, 
        pageSize = 20, 
        positionCategory,
        level,
        region,
        industry,
        status
      } = req.query

      const where = {}
      
      if (positionCategory) {
        where.positionCategory = { [Op.like]: `%${positionCategory}%` }
      }
      
      if (level) {
        where.level = level
      }
      
      if (region) {
        where.region = region
      }
      
      if (industry) {
        where.industry = industry
      }
      
      if (status) {
        where.status = status
      }

      const offset = (page - 1) * pageSize

      const { count, rows } = await PositionMarketData.findAndCountAll({
        where,
        offset,
        limit: parseInt(pageSize),
        order: [['dataCollectionDate', 'DESC']]
      })

      res.json({
        code: 200,
        data: {
          marketData: rows,
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
      logger.error('Get market data list error:', error)
      next(error)
    }
  }

  // 创建市场数据
  async createMarketData(req, res, next) {
    try {
      const marketData = await PositionMarketData.create({
        ...req.body,
        createdBy: req.user.id
      })

      logger.info(`管理员${req.user.username}创建市场数据: ${marketData.positionTitle}`)

      res.status(201).json({
        code: 201,
        data: marketData,
        message: '市场数据创建成功'
      })

    } catch (error) {
      logger.error('Create market data error:', error)
      next(error)
    }
  }

  // 批量导入市场数据
  async batchImportMarketData(req, res, next) {
    try {
      const { marketDataList } = req.body

      if (!Array.isArray(marketDataList) || marketDataList.length === 0) {
        return res.status(400).json({
          code: 400,
          message: '请提供有效的市场数据列表',
          data: null
        })
      }

      const results = []
      const errors = []

      for (let i = 0; i < marketDataList.length; i++) {
        try {
          const item = marketDataList[i]
          const marketData = await PositionMarketData.create({
            ...item,
            createdBy: req.user.id
          })
          results.push({ index: i, id: marketData.id, action: 'created' })
        } catch (error) {
          errors.push({ index: i, error: error.message })
        }
      }

      logger.info(`管理员${req.user.username}批量导入市场数据: 成功${results.length}条，失败${errors.length}条`)

      res.json({
        code: 200,
        data: {
          successCount: results.length,
          errorCount: errors.length,
          results,
          errors
        },
        message: `批量导入完成：成功${results.length}条，失败${errors.length}条`
      })

    } catch (error) {
      logger.error('Batch import market data error:', error)
      next(error)
    }
  }

  // ========== 统计分析 ==========

  // 获取岗位价值统计
  async getPositionValueStatistics(req, res, next) {
    try {
      const { assessmentPeriod, businessLineId } = req.query

      const where = { status: 1 }
      
      if (assessmentPeriod) {
        where.assessmentPeriod = assessmentPeriod
      }

      // 基础统计
      const totalStats = await PositionValueAssessment.findAll({
        where,
        attributes: [
          [sequelize.fn('AVG', sequelize.col('normalized_value')), 'avgValue'],
          [sequelize.fn('MAX', sequelize.col('normalized_value')), 'maxValue'],
          [sequelize.fn('MIN', sequelize.col('normalized_value')), 'minValue'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalCount'],
          [sequelize.fn('COUNT', sequelize.literal('CASE WHEN review_status = "approved" THEN 1 END')), 'approvedCount']
        ],
        raw: true
      })

      // 按等级统计
      const gradeStats = await PositionValueAssessment.findAll({
        where,
        attributes: [
          'valueGrade',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('AVG', sequelize.col('normalized_value')), 'avgValue']
        ],
        group: ['valueGrade'],
        raw: true
      })

      // 按业务线统计
      const lineStats = await PositionValueAssessment.findAll({
        where,
        include: [
          {
            model: Position,
            attributes: [],
            include: [
              {
                model: BusinessLine,
                attributes: ['id', 'name']
              }
            ]
          }
        ],
        attributes: [
          [sequelize.col('Position.BusinessLine.id'), 'businessLineId'],
          [sequelize.col('Position.BusinessLine.name'), 'businessLineName'],
          [sequelize.fn('COUNT', sequelize.col('PositionValueAssessment.id')), 'count'],
          [sequelize.fn('AVG', sequelize.col('normalized_value')), 'avgValue']
        ],
        group: ['Position.BusinessLine.id'],
        raw: true
      })

      res.json({
        code: 200,
        data: {
          summary: totalStats[0],
          gradeDistribution: gradeStats,
          businessLineStats: lineStats
        },
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get position value statistics error:', error)
      next(error)
    }
  }

  // 导出评估数据
  async exportAssessments(req, res, next) {
    try {
      const { assessmentPeriod, format = 'excel' } = req.query

      const where = { status: 1 }
      if (assessmentPeriod) {
        where.assessmentPeriod = assessmentPeriod
      }

      const assessments = await PositionValueAssessment.findAll({
        where,
        include: [
          {
            model: Position,
            attributes: ['name', 'level'],
            include: [
              {
                model: BusinessLine,
                attributes: ['name']
              }
            ]
          },
          {
            model: PositionValueCriteria,
            attributes: ['name', 'category']
          }
        ],
        order: [['assessmentPeriod', 'DESC'], ['normalizedValue', 'DESC']]
      })

      // 转换为导出格式
      const exportData = assessments.map(item => ({
        assessmentPeriod: item.assessmentPeriod,
        positionName: item.Position.name,
        positionLevel: item.Position.level,
        businessLine: item.Position.BusinessLine.name,
        criteriaName: item.PositionValueCriteria ? item.PositionValueCriteria.name : '默认标准',
        skillComplexityScore: item.skillComplexityScore,
        responsibilityScore: item.responsibilityScore,
        decisionImpactScore: item.decisionImpactScore,
        experienceRequiredScore: item.experienceRequiredScore,
        marketValueScore: item.marketValueScore,
        totalScore: item.totalScore,
        weightedScore: item.weightedScore,
        normalizedValue: item.normalizedValue,
        valueGrade: item.valueGrade,
        reviewStatus: item.reviewStatus
      }))

      logger.info(`管理员${req.user.username}导出岗位价值评估数据: ${assessments.length}条记录`)

      res.json({
        code: 200,
        data: exportData,
        message: '导出成功'
      })

    } catch (error) {
      logger.error('Export assessments error:', error)
      next(error)
    }
  }
}

module.exports = new PositionValueController()