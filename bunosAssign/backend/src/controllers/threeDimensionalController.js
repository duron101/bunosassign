const { Op, fn, col, literal, sequelize } = require('sequelize')
const {
  ThreeDimensionalWeightConfig,
  ThreeDimensionalCalculationResult,
  Employee,
  Department,
  Position,
  BusinessLine,
  BonusPool
} = require('../models')
const threeDimensionalCalculationService = require('../services/threeDimensionalCalculationService')
const logger = require('../utils/logger')

class ThreeDimensionalController {

  // ========== 权重配置管理 ==========

  /**
   * 创建权重配置
   */
  async createWeightConfig(req, res) {
    try {
      const configData = {
        ...req.body,
        createdBy: req.user.id,
        effectiveDate: req.body.effectiveDate || new Date()
      }

      const weightConfig = await ThreeDimensionalWeightConfig.create(configData)
      
      logger.info(`用户${req.user.id}创建三维权重配置: ${weightConfig.name}`)
      
      res.status(201).json({
        code: 200,
        message: '权重配置创建成功',
        data: weightConfig
      })
    } catch (error) {
      logger.error('创建权重配置失败:', error)
      res.status(500).json({
        code: 500,
        message: error.message || '创建权重配置失败'
      })
    }
  }

  /**
   * 获取权重配置列表
   */
  async getWeightConfigList(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        name,
        businessLineId,
        effectiveDate
      } = req.query

      const whereClause = {}
      
      if (status) whereClause.status = status
      if (name) whereClause.name = { [Op.like]: `%${name}%` }
      
      if (effectiveDate) {
        whereClause.effectiveDate = { [Op.lte]: new Date(effectiveDate) }
        whereClause[Op.or] = [
          { expiryDate: null },
          { expiryDate: { [Op.gte]: new Date(effectiveDate) } }
        ]
      }

      const { count, rows } = await ThreeDimensionalWeightConfig.findAndCountAll({
        where: whereClause,
        include: [{
          model: ThreeDimensionalWeightConfig,
          as: 'ParentConfig',
          attributes: ['id', 'name', 'version']
        }],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      })

      res.json({
        code: 200,
        message: '获取权重配置列表成功',
        data: {
          list: rows,
          total: count,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      })
    } catch (error) {
      logger.error('获取权重配置列表失败:', error)
      res.status(500).json({
        code: 500,
        message: '获取权重配置列表失败'
      })
    }
  }

  /**
   * 获取权重配置详情
   */
  async getWeightConfigDetail(req, res) {
    try {
      const { id } = req.params
      
      const weightConfig = await ThreeDimensionalWeightConfig.findByPk(id, {
        include: [{
          model: ThreeDimensionalWeightConfig,
          as: 'ParentConfig',
          attributes: ['id', 'name', 'version']
        }]
      })

      if (!weightConfig) {
        return res.status(404).json({
          code: 404,
          message: '权重配置不存在'
        })
      }

      // 获取使用统计
      const usageStats = await ThreeDimensionalCalculationResult.findAll({
        where: { weightConfigId: id },
        attributes: [
          [fn('COUNT', col('id')), 'totalCalculations'],
          [fn('COUNT', fn('DISTINCT', col('employee_id'))), 'uniqueEmployees'],
          [fn('COUNT', fn('DISTINCT', col('calculation_period'))), 'uniquePeriods']
        ],
        raw: true
      })

      res.json({
        code: 200,
        message: '获取权重配置详情成功',
        data: {
          ...weightConfig.toJSON(),
          usageStatistics: usageStats[0]
        }
      })
    } catch (error) {
      logger.error('获取权重配置详情失败:', error)
      res.status(500).json({
        code: 500,
        message: '获取权重配置详情失败'
      })
    }
  }

  /**
   * 更新权重配置
   */
  async updateWeightConfig(req, res) {
    try {
      const { id } = req.params
      const updateData = {
        ...req.body,
        updatedBy: req.user.id
      }

      const weightConfig = await ThreeDimensionalWeightConfig.findByPk(id)
      if (!weightConfig) {
        return res.status(404).json({
          code: 404,
          message: '权重配置不存在'
        })
      }

      await weightConfig.update(updateData)
      
      logger.info(`用户${req.user.id}更新三维权重配置: ${weightConfig.name}`)
      
      res.json({
        code: 200,
        message: '权重配置更新成功',
        data: weightConfig
      })
    } catch (error) {
      logger.error('更新权重配置失败:', error)
      res.status(500).json({
        code: 500,
        message: error.message || '更新权重配置失败'
      })
    }
  }

  /**
   * 删除权重配置
   */
  async deleteWeightConfig(req, res) {
    try {
      const { id } = req.params
      
      const weightConfig = await ThreeDimensionalWeightConfig.findByPk(id)
      if (!weightConfig) {
        return res.status(404).json({
          code: 404,
          message: '权重配置不存在'
        })
      }

      // 检查是否有关联的计算结果
      const hasResults = await ThreeDimensionalCalculationResult.findOne({
        where: { weightConfigId: id }
      })

      if (hasResults) {
        return res.status(400).json({
          code: 400,
          message: '该权重配置已被使用，无法删除'
        })
      }

      await weightConfig.destroy()
      
      logger.info(`用户${req.user.id}删除三维权重配置: ${weightConfig.name}`)
      
      res.json({
        code: 200,
        message: '权重配置删除成功'
      })
    } catch (error) {
      logger.error('删除权重配置失败:', error)
      res.status(500).json({
        code: 500,
        message: '删除权重配置失败'
      })
    }
  }

  /**
   * 复制权重配置
   */
  async copyWeightConfig(req, res) {
    try {
      const { id } = req.params
      const { name, code } = req.body
      
      const originalConfig = await ThreeDimensionalWeightConfig.findByPk(id)
      if (!originalConfig) {
        return res.status(404).json({
          code: 404,
          message: '原权重配置不存在'
        })
      }

      const configData = originalConfig.toJSON()
      delete configData.id
      delete configData.createdAt
      delete configData.updatedAt
      
      const newConfig = await ThreeDimensionalWeightConfig.create({
        ...configData,
        name: name || `${originalConfig.name}_副本`,
        code: code || `${originalConfig.code}_copy_${Date.now()}`,
        parentConfigId: originalConfig.id,
        status: 'draft',
        createdBy: req.user.id,
        effectiveDate: new Date()
      })
      
      logger.info(`用户${req.user.id}复制三维权重配置: ${originalConfig.name} -> ${newConfig.name}`)
      
      res.status(201).json({
        code: 200,
        message: '权重配置复制成功',
        data: newConfig
      })
    } catch (error) {
      logger.error('复制权重配置失败:', error)
      res.status(500).json({
        code: 500,
        message: error.message || '复制权重配置失败'
      })
    }
  }

  // ========== 三维计算功能 ==========

  /**
   * 计算单个员工三维得分
   */
  async calculateEmployeeScore(req, res) {
    try {
      const { employeeId, period, weightConfigId } = req.body
      const options = {
        projectId: req.body.projectId,
        normalizationMethod: req.body.normalizationMethod,
        ...req.body.options
      }

      const result = await threeDimensionalCalculationService.calculateEmployeeScore(
        employeeId,
        period,
        weightConfigId,
        options
      )

      // 保存计算结果
      const savedResult = await threeDimensionalCalculationService.saveCalculationResult(
        result,
        req.body.bonusPoolId,
        req.user.id
      )

      logger.info(`用户${req.user.id}计算员工${employeeId}三维得分: ${period}`)
      
      res.json({
        code: 200,
        message: '三维得分计算成功',
        data: {
          calculation: result,
          saved: savedResult
        }
      })
    } catch (error) {
      logger.error('计算员工三维得分失败:', error)
      res.status(500).json({
        code: 500,
        message: error.message || '计算三维得分失败'
      })
    }
  }

  /**
   * 批量计算员工三维得分
   */
  async batchCalculateScores(req, res) {
    try {
      const { employeeIds, period, weightConfigId } = req.body
      const options = {
        projectId: req.body.projectId,
        normalizationMethod: req.body.normalizationMethod,
        ...req.body.options
      }

      const { results, errors } = await threeDimensionalCalculationService.batchCalculateScores(
        employeeIds,
        period,
        weightConfigId,
        options
      )

      // 批量保存计算结果
      if (results.length > 0) {
        await threeDimensionalCalculationService.batchSaveResults(
          results,
          req.body.bonusPoolId,
          req.user.id
        )
      }

      // 计算排名
      if (results.length > 0) {
        await threeDimensionalCalculationService.calculateRankings(period, weightConfigId)
      }

      logger.info(`用户${req.user.id}批量计算三维得分: ${employeeIds.length}名员工, 期间${period}`)
      
      res.json({
        code: 200,
        message: '批量计算完成',
        data: {
          successCount: results.length,
          errorCount: errors.length,
          results: results.map(r => ({
            employeeId: r.employeeId,
            totalScore: r.totalScore,
            finalScore: r.adjustedScore || r.totalScore
          })),
          errors
        }
      })
    } catch (error) {
      logger.error('批量计算三维得分失败:', error)
      res.status(500).json({
        code: 500,
        message: error.message || '批量计算失败'
      })
    }
  }

  /**
   * 获取计算结果列表
   */
  async getCalculationResultList(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        period,
        weightConfigId,
        employeeId,
        departmentId,
        reviewStatus,
        minScore,
        maxScore
      } = req.query

      const whereClause = {}
      
      if (period) whereClause.calculationPeriod = period
      if (weightConfigId) whereClause.weightConfigId = weightConfigId
      if (employeeId) whereClause.employeeId = employeeId
      if (reviewStatus) whereClause.reviewStatus = reviewStatus
      
      if (minScore) {
        whereClause.finalScore = whereClause.finalScore || {}
        whereClause.finalScore[Op.gte] = parseFloat(minScore)
      }
      if (maxScore) {
        whereClause.finalScore = whereClause.finalScore || {}
        whereClause.finalScore[Op.lte] = parseFloat(maxScore)
      }

      const includeClause = [{
        model: Employee,
        include: [
          { model: Department, attributes: ['id', 'name'] },
          { model: Position, attributes: ['id', 'name', 'level'] }
        ]
      }, {
        model: ThreeDimensionalWeightConfig,
        attributes: ['id', 'name', 'version']
      }]

      // 添加部门筛选
      if (departmentId) {
        includeClause[0].where = { departmentId }
      }

      const { count, rows } = await ThreeDimensionalCalculationResult.findAndCountAll({
        where: whereClause,
        include: includeClause,
        order: [['finalScore', 'DESC']],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      })

      res.json({
        code: 200,
        message: '获取计算结果列表成功',
        data: {
          list: rows,
          total: count,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      })
    } catch (error) {
      logger.error('获取计算结果列表失败:', error)
      res.status(500).json({
        code: 500,
        message: '获取计算结果列表失败'
      })
    }
  }

  /**
   * 获取计算结果详情
   */
  async getCalculationResultDetail(req, res) {
    try {
      const { id } = req.params
      
      const result = await ThreeDimensionalCalculationResult.findByPk(id, {
        include: [{
          model: Employee,
          include: [
            { model: Department, attributes: ['id', 'name'] },
            { model: Position, attributes: ['id', 'name', 'level'] }
          ]
        }, {
          model: ThreeDimensionalWeightConfig,
          attributes: ['id', 'name', 'version', 'calculationMethod', 'normalizationMethod']
        }, {
          model: BonusPool,
          attributes: ['id', 'name', 'totalAmount']
        }]
      })

      if (!result) {
        return res.status(404).json({
          code: 404,
          message: '计算结果不存在'
        })
      }

      res.json({
        code: 200,
        message: '获取计算结果详情成功',
        data: result
      })
    } catch (error) {
      logger.error('获取计算结果详情失败:', error)
      res.status(500).json({
        code: 500,
        message: '获取计算结果详情失败'
      })
    }
  }

  /**
   * 更新计算结果
   */
  async updateCalculationResult(req, res) {
    try {
      const { id } = req.params
      const { adjustedScore, reviewComments, bonusCoefficient } = req.body
      
      const result = await ThreeDimensionalCalculationResult.findByPk(id)
      if (!result) {
        return res.status(404).json({
          code: 404,
          message: '计算结果不存在'
        })
      }

      const updateData = {
        updatedBy: req.user.id
      }

      if (adjustedScore !== undefined) updateData.adjustedScore = adjustedScore
      if (reviewComments !== undefined) updateData.reviewComments = reviewComments
      if (bonusCoefficient !== undefined) updateData.bonusCoefficient = bonusCoefficient

      await result.update(updateData)
      
      logger.info(`用户${req.user.id}更新计算结果${id}`)
      
      res.json({
        code: 200,
        message: '计算结果更新成功',
        data: result
      })
    } catch (error) {
      logger.error('更新计算结果失败:', error)
      res.status(500).json({
        code: 500,
        message: '更新计算结果失败'
      })
    }
  }

  /**
   * 审核计算结果
   */
  async reviewCalculationResult(req, res) {
    try {
      const { id } = req.params
      const { status, comments } = req.body
      
      const result = await ThreeDimensionalCalculationResult.findByPk(id)
      if (!result) {
        return res.status(404).json({
          code: 404,
          message: '计算结果不存在'
        })
      }

      await result.update({
        reviewStatus: status,
        reviewComments: comments,
        reviewedBy: req.user.id,
        reviewedAt: new Date()
      })
      
      logger.info(`用户${req.user.id}审核计算结果${id}: ${status}`)
      
      res.json({
        code: 200,
        message: '审核完成',
        data: result
      })
    } catch (error) {
      logger.error('审核计算结果失败:', error)
      res.status(500).json({
        code: 500,
        message: '审核失败'
      })
    }
  }

  /**
   * 重新计算排名
   */
  async recalculateRankings(req, res) {
    try {
      const { period, weightConfigId } = req.body
      
      const results = await threeDimensionalCalculationService.calculateRankings(
        period,
        weightConfigId
      )
      
      logger.info(`用户${req.user.id}重新计算排名: 期间${period}, 配置${weightConfigId}`)
      
      res.json({
        code: 200,
        message: '排名计算完成',
        data: {
          count: results.length,
          period,
          weightConfigId
        }
      })
    } catch (error) {
      logger.error('重新计算排名失败:', error)
      res.status(500).json({
        code: 500,
        message: '排名计算失败'
      })
    }
  }

  // ========== 统计分析 ==========

  /**
   * 获取三维得分统计
   */
  async getScoreStatistics(req, res) {
    try {
      const { period, weightConfigId, departmentId } = req.query
      
      const whereClause = {}
      if (period) whereClause.calculationPeriod = period
      if (weightConfigId) whereClause.weightConfigId = weightConfigId

      const includeClause = []
      if (departmentId) {
        includeClause.push({
          model: Employee,
          where: { departmentId },
          attributes: []
        })
      }

      const statistics = await threeDimensionalCalculationService.getCalculationStatistics(
        period,
        weightConfigId
      )

      // 获取得分分布
      const scoreDistribution = await ThreeDimensionalCalculationResult.findAll({
        where: whereClause,
        include: includeClause,
        attributes: [
          [literal('CASE WHEN final_score < 0.2 THEN "很低" WHEN final_score < 0.4 THEN "较低" WHEN final_score < 0.6 THEN "中等" WHEN final_score < 0.8 THEN "较高" ELSE "很高" END'), 'scoreLevel'],
          [fn('COUNT', col('id')), 'count']
        ],
        group: [literal('CASE WHEN final_score < 0.2 THEN "很低" WHEN final_score < 0.4 THEN "较低" WHEN final_score < 0.6 THEN "中等" WHEN final_score < 0.8 THEN "较高" ELSE "很高" END')],
        raw: true
      })

      // 获取维度贡献分析
      const dimensionAnalysis = await ThreeDimensionalCalculationResult.findAll({
        where: whereClause,
        include: includeClause,
        attributes: [
          [fn('AVG', col('profit_contribution_rate')), 'avgProfitRate'],
          [fn('AVG', col('position_value_rate')), 'avgPositionRate'],
          [fn('AVG', col('performance_rate')), 'avgPerformanceRate']
        ],
        raw: true
      })

      res.json({
        code: 200,
        message: '获取统计数据成功',
        data: {
          summary: statistics,
          scoreDistribution,
          dimensionAnalysis: dimensionAnalysis[0]
        }
      })
    } catch (error) {
      logger.error('获取三维得分统计失败:', error)
      res.status(500).json({
        code: 500,
        message: '获取统计数据失败'
      })
    }
  }

  /**
   * 获取趋势分析
   */
  async getTrendAnalysis(req, res) {
    try {
      const { employeeId, weightConfigId, periods } = req.query
      
      const whereClause = {}
      if (employeeId) whereClause.employeeId = employeeId
      if (weightConfigId) whereClause.weightConfigId = weightConfigId
      
      if (periods) {
        const periodArray = periods.split(',')
        whereClause.calculationPeriod = { [Op.in]: periodArray }
      }

      const trendData = await ThreeDimensionalCalculationResult.findAll({
        where: whereClause,
        include: [{
          model: Employee,
          attributes: ['id', 'name']
        }],
        attributes: [
          'calculationPeriod',
          'employeeId',
          'finalScore',
          'profitContributionScore',
          'positionValueScore',
          'performanceScore',
          'scoreRank',
          'percentileRank'
        ],
        order: [['calculationPeriod', 'ASC'], ['employeeId', 'ASC']]
      })

      // 按员工分组整理趋势数据
      const groupedData = {}
      trendData.forEach(item => {
        const empId = item.employeeId
        if (!groupedData[empId]) {
          groupedData[empId] = {
            employee: item.Employee,
            data: []
          }
        }
        groupedData[empId].data.push({
          period: item.calculationPeriod,
          finalScore: item.finalScore,
          profitScore: item.profitContributionScore,
          positionScore: item.positionValueScore,
          performanceScore: item.performanceScore,
          rank: item.scoreRank,
          percentile: item.percentileRank
        })
      })

      res.json({
        code: 200,
        message: '获取趋势分析成功',
        data: Object.values(groupedData)
      })
    } catch (error) {
      logger.error('获取趋势分析失败:', error)
      res.status(500).json({
        code: 500,
        message: '获取趋势分析失败'
      })
    }
  }

  /**
   * 导出计算结果
   */
  async exportCalculationResults(req, res) {
    try {
      const { period, weightConfigId, format = 'excel' } = req.query
      
      const whereClause = {}
      if (period) whereClause.calculationPeriod = period
      if (weightConfigId) whereClause.weightConfigId = weightConfigId

      const results = await ThreeDimensionalCalculationResult.findAll({
        where: whereClause,
        include: [{
          model: Employee,
          include: [
            { model: Department, attributes: ['id', 'name'] },
            { model: Position, attributes: ['id', 'name', 'level'] }
          ]
        }, {
          model: ThreeDimensionalWeightConfig,
          attributes: ['id', 'name', 'version']
        }],
        order: [['finalScore', 'DESC']]
      })

      logger.info(`用户${req.user.id}导出三维计算结果: ${results.length}条记录`)

      res.json({
        code: 200,
        message: '导出数据准备完成',
        data: {
          count: results.length,
          results: results.map(r => ({
            employeeName: r.Employee.name,
            departmentName: r.Employee.Department?.name,
            positionName: r.Employee.Position?.name,
            positionLevel: r.Employee.Position?.level,
            period: r.calculationPeriod,
            profitScore: r.profitContributionScore,
            positionScore: r.positionValueScore,
            performanceScore: r.performanceScore,
            totalScore: r.totalScore,
            finalScore: r.finalScore,
            rank: r.scoreRank,
            percentile: r.percentileRank,
            bonusAmount: r.finalBonusAmount,
            reviewStatus: r.reviewStatus
          }))
        }
      })
    } catch (error) {
      logger.error('导出计算结果失败:', error)
      res.status(500).json({
        code: 500,
        message: '导出失败'
      })
    }
  }
}

module.exports = new ThreeDimensionalController()