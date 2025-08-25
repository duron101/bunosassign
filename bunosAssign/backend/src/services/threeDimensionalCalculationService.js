const { Op, literal, fn, col } = require('sequelize')
const { sequelize, Employee, ThreeDimensionalWeightConfig, ThreeDimensionalCalculationResult, BonusPool } = require('../models')
const profitCalculationService = require('./profitCalculationService')
const positionValueService = require('./positionValueService')
const performanceCalculationService = require('./performanceCalculationService')

class ThreeDimensionalCalculationService {
  
  /**
   * 计算员工三维模型得分
   * @param {number} employeeId - 员工ID
   * @param {string} period - 计算期间
   * @param {number} weightConfigId - 权重配置ID
   * @param {Object} options - 计算选项
   * @returns {Object} 计算结果
   */
  async calculateEmployeeScore(employeeId, period, weightConfigId, options = {}) {
    try {
      // 获取权重配置
      const weightConfig = await ThreeDimensionalWeightConfig.findByPk(weightConfigId)
      if (!weightConfig) {
        throw new Error('权重配置不存在')
      }

      // 获取员工信息
      const employee = await Employee.findByPk(employeeId, {
        include: ['Department', 'Position']
      })
      if (!employee) {
        throw new Error('员工不存在')
      }

      // 获取三个维度的原始得分
      const profitScore = await this.getProfitContributionScore(employeeId, period, options)
      const positionScore = await this.getPositionValueScore(employeeId, period, options)
      const performanceScore = await this.getPerformanceScore(employeeId, period, options)

      // 标准化得分
      const normalizedScores = await this.normalizeScores({
        profitScore,
        positionScore,
        performanceScore
      }, period, options)

      // 计算加权得分
      const weightedScores = this.calculateWeightedScores(normalizedScores, weightConfig)

      // 计算综合得分
      const totalScore = this.calculateTotalScore(weightedScores, weightConfig)

      // 应用调整系数
      const adjustedScore = this.applyAdjustmentFactors(totalScore, employee, weightConfig, {
        profitScore,
        positionScore,
        performanceScore
      })

      // 构建详细计算数据
      const calculationDetails = {
        originalScores: { profitScore, positionScore, performanceScore },
        normalizedScores,
        weightedScores,
        totalScore,
        adjustedScore,
        weights: this.extractWeights(weightConfig),
        calculationParams: {
          method: weightConfig.calculationMethod,
          normalizationMethod: weightConfig.normalizationMethod,
          adjustmentFactors: {
            excellenceBonus: weightConfig.excellenceBonus,
            performanceMultiplier: weightConfig.performanceMultiplier,
            positionLevelMultiplier: weightConfig.positionLevelMultiplier
          }
        }
      }

      return {
        employeeId,
        employee,
        period,
        weightConfigId,
        ...calculationDetails
      }

    } catch (error) {
      console.error('计算员工三维得分失败:', error)
      throw new Error(`计算失败: ${error.message}`)
    }
  }

  /**
   * 获取利润贡献度得分
   */
  async getProfitContributionScore(employeeId, period, options = {}) {
    try {
      const contributionData = await profitCalculationService.calculateEmployeeProfitContribution(
        employeeId, 
        period, 
        options.projectId
      )
      
      // 综合计算利润贡献得分
      const dimensions = contributionData.dimensions
      const score = (
        dimensions.directContribution * 0.4 +
        dimensions.workloadContribution * 0.3 +
        dimensions.qualityContribution * 0.2 +
        dimensions.positionValueContribution * 0.1
      )

      return {
        score: parseFloat(score.toFixed(4)),
        details: contributionData,
        dataVersion: contributionData.calculatedAt
      }
    } catch (error) {
      console.warn(`获取利润贡献度得分失败 (员工${employeeId}):`, error.message)
      return { score: 0, details: null, dataVersion: null }
    }
  }

  /**
   * 获取岗位价值得分
   */
  async getPositionValueScore(employeeId, period, options = {}) {
    try {
      const employee = await Employee.findByPk(employeeId, {
        include: ['Position']
      })

      const positionAssessment = await positionValueService.calculatePositionValue(
        employee.Position.id,
        period,
        { businessLineId: employee.Position.lineId }
      )

      return {
        score: parseFloat(positionAssessment.totalScore.toFixed(4)),
        details: positionAssessment,
        dataVersion: positionAssessment.calculatedAt
      }
    } catch (error) {
      console.warn(`获取岗位价值得分失败 (员工${employeeId}):`, error.message)
      return { score: 0, details: null, dataVersion: null }
    }
  }

  /**
   * 获取绩效表现得分
   */
  async getPerformanceScore(employeeId, period, options = {}) {
    try {
      const performanceResult = await performanceCalculationService.calculatePerformanceScore(
        employeeId,
        period,
        options
      )

      return {
        score: parseFloat(performanceResult.totalScore.toFixed(4)),
        details: performanceResult,
        dataVersion: performanceResult.calculatedAt
      }
    } catch (error) {
      console.warn(`获取绩效表现得分失败 (员工${employeeId}):`, error.message)
      return { score: 0, details: null, dataVersion: null }
    }
  }

  /**
   * 标准化得分
   */
  async normalizeScores(scores, period, options = {}) {
    // 获取同期所有员工的得分数据用于标准化
    const allScores = await this.getAllEmployeeScores(period, options)
    
    const normalizationMethod = options.normalizationMethod || 'z_score'
    
    switch (normalizationMethod) {
      case 'z_score':
        return this.zScoreNormalization(scores, allScores)
      case 'min_max':
        return this.minMaxNormalization(scores, allScores)
      case 'rank_based':
        return this.rankBasedNormalization(scores, allScores)
      case 'percentile':
        return this.percentileNormalization(scores, allScores)
      default:
        return this.zScoreNormalization(scores, allScores)
    }
  }

  /**
   * Z-Score标准化
   */
  zScoreNormalization(scores, allScores) {
    const normalize = (value, values) => {
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length
      const stdDev = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length)
      return stdDev > 0 ? (value - mean) / stdDev : 0
    }

    return {
      normalizedProfitScore: normalize(scores.profitScore.score, allScores.profitScores),
      normalizedPositionScore: normalize(scores.positionScore.score, allScores.positionScores),
      normalizedPerformanceScore: normalize(scores.performanceScore.score, allScores.performanceScores)
    }
  }

  /**
   * Min-Max标准化
   */
  minMaxNormalization(scores, allScores) {
    const normalize = (value, values) => {
      const min = Math.min(...values)
      const max = Math.max(...values)
      return max > min ? (value - min) / (max - min) : 0.5
    }

    return {
      normalizedProfitScore: normalize(scores.profitScore.score, allScores.profitScores),
      normalizedPositionScore: normalize(scores.positionScore.score, allScores.positionScores),
      normalizedPerformanceScore: normalize(scores.performanceScore.score, allScores.performanceScores)
    }
  }

  /**
   * 基于排名的标准化
   */
  rankBasedNormalization(scores, allScores) {
    const normalize = (value, values) => {
      const sorted = values.slice().sort((a, b) => b - a)
      const rank = sorted.indexOf(value) + 1
      return 1 - (rank - 1) / values.length
    }

    return {
      normalizedProfitScore: normalize(scores.profitScore.score, allScores.profitScores),
      normalizedPositionScore: normalize(scores.positionScore.score, allScores.positionScores),
      normalizedPerformanceScore: normalize(scores.performanceScore.score, allScores.performanceScores)
    }
  }

  /**
   * 百分位标准化
   */
  percentileNormalization(scores, allScores) {
    const normalize = (value, values) => {
      const count = values.filter(v => v <= value).length
      return count / values.length
    }

    return {
      normalizedProfitScore: normalize(scores.profitScore.score, allScores.profitScores),
      normalizedPositionScore: normalize(scores.positionScore.score, allScores.positionScores),
      normalizedPerformanceScore: normalize(scores.performanceScore.score, allScores.performanceScores)
    }
  }

  /**
   * 计算加权得分
   */
  calculateWeightedScores(normalizedScores, weightConfig) {
    return {
      weightedProfitScore: normalizedScores.normalizedProfitScore * weightConfig.profitContributionWeight,
      weightedPositionScore: normalizedScores.normalizedPositionScore * weightConfig.positionValueWeight,
      weightedPerformanceScore: normalizedScores.normalizedPerformanceScore * weightConfig.performanceWeight
    }
  }

  /**
   * 计算综合得分
   */
  calculateTotalScore(weightedScores, weightConfig) {
    const method = weightConfig.calculationMethod || 'weighted_sum'
    
    switch (method) {
      case 'weighted_sum':
        return weightedScores.weightedProfitScore + 
               weightedScores.weightedPositionScore + 
               weightedScores.weightedPerformanceScore
      
      case 'weighted_product':
        return Math.pow(weightedScores.weightedProfitScore + 1, weightConfig.profitContributionWeight) *
               Math.pow(weightedScores.weightedPositionScore + 1, weightConfig.positionValueWeight) *
               Math.pow(weightedScores.weightedPerformanceScore + 1, weightConfig.performanceWeight) - 1
      
      case 'hybrid':
        const sum = weightedScores.weightedProfitScore + weightedScores.weightedPositionScore + weightedScores.weightedPerformanceScore
        const product = Math.pow(weightedScores.weightedProfitScore + 1, 0.33) *
                       Math.pow(weightedScores.weightedPositionScore + 1, 0.33) *
                       Math.pow(weightedScores.weightedPerformanceScore + 1, 0.34) - 1
        return sum * 0.7 + product * 0.3
      
      default:
        return weightedScores.weightedProfitScore + 
               weightedScores.weightedPositionScore + 
               weightedScores.weightedPerformanceScore
    }
  }

  /**
   * 应用调整系数
   */
  applyAdjustmentFactors(totalScore, employee, weightConfig, originalScores) {
    let adjustedScore = totalScore

    // 卓越表现奖励
    const avgScore = (originalScores.profitScore.score + originalScores.positionScore.score + originalScores.performanceScore.score) / 3
    if (avgScore > 0.9) {
      adjustedScore *= (1 + weightConfig.excellenceBonus)
    }

    // 绩效乘数
    if (originalScores.performanceScore.score > 0.8) {
      adjustedScore *= weightConfig.performanceMultiplier
    }

    // 岗位等级乘数（基于岗位级别）
    if (employee.Position && employee.Position.level) {
      const levelMultiplier = this.getPositionLevelMultiplier(employee.Position.level, weightConfig)
      adjustedScore *= levelMultiplier
    }

    return Math.max(0, adjustedScore)
  }

  /**
   * 获取岗位等级乘数
   */
  getPositionLevelMultiplier(positionLevel, weightConfig) {
    // 根据岗位等级返回不同的乘数
    const levelMap = {
      'senior': weightConfig.positionLevelMultiplier,
      'middle': 1.0,
      'junior': 0.8
    }
    return levelMap[positionLevel] || 1.0
  }

  /**
   * 批量计算员工三维得分
   */
  async batchCalculateScores(employeeIds, period, weightConfigId, options = {}) {
    const results = []
    const errors = []
    const batchSize = options.batchSize || 10 // 批处理大小

    console.log(`📋 开始批量计算: ${employeeIds.length} 名员工，批大小: ${batchSize}`)

    // 预加载权重配置
    const weightConfig = await ThreeDimensionalWeightConfig.findByPk(weightConfigId)
    if (!weightConfig) {
      throw new Error('权重配置不存在')
    }

    // 预加载员工信息
    const employees = await Employee.findAll({
      where: { id: { [Op.in]: employeeIds } },
      include: [
        { model: Department, attributes: ['id', 'name'] },
        { model: Position, attributes: ['id', 'name', 'level'] }
      ]
    })

    const employeeMap = new Map()
    employees.forEach(emp => employeeMap.set(emp.id, emp))

    // 批量处理
    for (let i = 0; i < employeeIds.length; i += batchSize) {
      const batch = employeeIds.slice(i, i + batchSize)
      const batchPromises = batch.map(async employeeId => {
        try {
          const employee = employeeMap.get(employeeId)
          if (!employee) {
            throw new Error(`员工 ${employeeId} 不存在`)
          }

          const result = await this.calculateEmployeeScoreOptimized(
            employeeId, 
            employee, 
            period, 
            weightConfig, 
            options
          )
          return { success: true, result }
        } catch (error) {
          return { success: false, employeeId, error: error.message }
        }
      })

      const batchResults = await Promise.allSettled(batchPromises)
      
      batchResults.forEach((outcome, index) => {
        if (outcome.status === 'fulfilled') {
          if (outcome.value.success) {
            results.push(outcome.value.result)
          } else {
            errors.push({ employeeId: outcome.value.employeeId, error: outcome.value.error })
          }
        } else {
          errors.push({ employeeId: batch[index], error: outcome.reason.message })
        }
      })

      // 进度显示
      const progress = Math.min(100, ((i + batchSize) / employeeIds.length) * 100)
      console.log(`📋 计算进度: ${progress.toFixed(1)}% (${results.length + errors.length}/${employeeIds.length})`)
    }

    console.log(`✅ 批量计算完成: 成功 ${results.length} 个，失败 ${errors.length} 个`)
    return { results, errors }
  }

  /**
   * 保存计算结果到数据库
   */
  async saveCalculationResult(calculationData, bonusPoolId = null) {
    try {
      const {
        employeeId,
        period,
        weightConfigId,
        originalScores,
        normalizedScores,
        weightedScores,
        totalScore,
        adjustedScore,
        calculationParams
      } = calculationData

      // 检查是否已存在相同记录
      const existingResult = await ThreeDimensionalCalculationResult.findOne({
        where: {
          employeeId,
          weightConfigId,
          calculationPeriod: period
        }
      })

      const resultData = {
        employeeId,
        weightConfigId,
        calculationPeriod: period,
        bonusPoolId,
        
        // 原始得分
        profitContributionScore: originalScores.profitScore.score,
        positionValueScore: originalScores.positionScore.score,
        performanceScore: originalScores.performanceScore.score,
        
        // 标准化得分
        normalizedProfitScore: normalizedScores.normalizedProfitScore,
        normalizedPositionScore: normalizedScores.normalizedPositionScore,
        normalizedPerformanceScore: normalizedScores.normalizedPerformanceScore,
        
        // 加权得分
        weightedProfitScore: weightedScores.weightedProfitScore,
        weightedPositionScore: weightedScores.weightedPositionScore,
        weightedPerformanceScore: weightedScores.weightedPerformanceScore,
        
        // 综合得分
        totalScore,
        adjustedScore,
        finalScore: adjustedScore || totalScore,
        
        // 详细计算数据
        profitCalculationDetails: originalScores.profitScore.details,
        positionCalculationDetails: originalScores.positionScore.details,
        performanceCalculationDetails: originalScores.performanceScore.details,
        
        // 计算方法和参数
        calculationMethod: calculationParams.method,
        calculationParams,
        
        // 数据版本
        profitDataVersion: originalScores.profitScore.dataVersion,
        positionDataVersion: originalScores.positionScore.dataVersion,
        performanceDataVersion: originalScores.performanceScore.dataVersion,
        
        calculatedAt: new Date(),
        createdBy: calculationData.createdBy || 1
      }

      let result
      if (existingResult) {
        result = await existingResult.update(resultData)
      } else {
        result = await ThreeDimensionalCalculationResult.create(resultData)
      }

      return result
    } catch (error) {
      console.error('保存计算结果失败:', error)
      throw new Error(`保存失败: ${error.message}`)
    }
  }

  /**
   * 批量保存计算结果
   */
  async batchSaveResults(calculationResults, bonusPoolId = null, createdBy = 1) {
    const transaction = await sequelize.transaction()
    
    try {
      const savedResults = []
      
      for (const calculationData of calculationResults) {
        calculationData.createdBy = createdBy
        const result = await this.saveCalculationResult(calculationData, bonusPoolId)
        savedResults.push(result)
      }
      
      await transaction.commit()
      return savedResults
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  /**
   * 计算排名和百分位
   */
  async calculateRankings(period, weightConfigId = null) {
    try {
      const whereClause = { calculationPeriod: period }
      if (weightConfigId) {
        whereClause.weightConfigId = weightConfigId
      }

      const results = await ThreeDimensionalCalculationResult.findAll({
        where: whereClause,
        order: [['finalScore', 'DESC']],
        include: [{
          model: Employee,
          include: ['Department', 'Position']
        }]
      })

      // 计算总体排名和百分位
      for (let i = 0; i < results.length; i++) {
        const result = results[i]
        await result.update({
          scoreRank: i + 1,
          percentileRank: ((results.length - i) / results.length) * 100
        })
      }

      // 计算部门内排名
      const departmentGroups = {}
      results.forEach(result => {
        const deptId = result.Employee.departmentId
        if (!departmentGroups[deptId]) {
          departmentGroups[deptId] = []
        }
        departmentGroups[deptId].push(result)
      })

      for (const deptId in departmentGroups) {
        const deptResults = departmentGroups[deptId]
        for (let i = 0; i < deptResults.length; i++) {
          await deptResults[i].update({
            departmentRank: i + 1
          })
        }
      }

      // 计算同等级排名
      const levelGroups = {}
      results.forEach(result => {
        const level = result.Employee.Position?.level || 'unknown'
        if (!levelGroups[level]) {
          levelGroups[level] = []
        }
        levelGroups[level].push(result)
      })

      for (const level in levelGroups) {
        const levelResults = levelGroups[level]
        for (let i = 0; i < levelResults.length; i++) {
          await levelResults[i].update({
            levelRank: i + 1
          })
        }
      }

      return results
    } catch (error) {
      console.error('计算排名失败:', error)
      throw new Error(`排名计算失败: ${error.message}`)
    }
  }

  /**
   * 优化版本的单个员工计算
   */
  async calculateEmployeeScoreOptimized(employeeId, employee, period, weightConfig, options = {}) {
    try {
      // 并发获取三个维度的得分
      const [profitScore, positionScore, performanceScore] = await Promise.all([
        this.getProfitContributionScore(employeeId, period, options),
        this.getPositionValueScore(employeeId, period, options),
        this.getPerformanceScore(employeeId, period, options)
      ])

      // 标准化得分（简化版）
      const normalizedScores = this.normalizeScoresOptimized({
        profitScore,
        positionScore,
        performanceScore
      }, options)

      // 计算加权得分
      const weightedScores = this.calculateWeightedScores(normalizedScores, weightConfig)

      // 计算综合得分
      const totalScore = this.calculateTotalScore(weightedScores, weightConfig)

      // 应用调整系数
      const adjustedScore = this.applyAdjustmentFactors(totalScore, employee, weightConfig, {
        profitScore,
        positionScore,
        performanceScore
      })

      return {
        employeeId,
        employee,
        period,
        weightConfigId: weightConfig.id,
        originalScores: { profitScore, positionScore, performanceScore },
        normalizedScores,
        weightedScores,
        totalScore,
        adjustedScore,
        weights: this.extractWeights(weightConfig),
        calculationParams: {
          method: weightConfig.calculationMethod,
          normalizationMethod: weightConfig.normalizationMethod,
          adjustmentFactors: {
            excellenceBonus: weightConfig.excellenceBonus,
            performanceMultiplier: weightConfig.performanceMultiplier,
            positionLevelMultiplier: weightConfig.positionLevelMultiplier
          }
        }
      }

    } catch (error) {
      console.error(`优化计算员工${employeeId}得分失败:`, error)
      throw new Error(`计算失败: ${error.message}`)
    }
  }

  /**
   * 优化版本的得分标准化（使用预计算统计值）
   */
  normalizeScoresOptimized(scores, options = {}) {
    // 使用默认的标准化参数或传入的统计值
    const stats = options.normalizationStats || {
      profit: { mean: 0.5, std: 0.2 },
      position: { mean: 0.6, std: 0.25 },
      performance: { mean: 0.7, std: 0.2 }
    }

    const zScoreNormalize = (value, mean, std) => {
      return std > 0 ? (value - mean) / std : 0
    }

    return {
      normalizedProfitScore: zScoreNormalize(
        scores.profitScore.score,
        stats.profit.mean,
        stats.profit.std
      ),
      normalizedPositionScore: zScoreNormalize(
        scores.positionScore.score,
        stats.position.mean,
        stats.position.std
      ),
      normalizedPerformanceScore: zScoreNormalize(
        scores.performanceScore.score,
        stats.performance.mean,
        stats.performance.std
      )
    }
  }

  /**
   * 获取所有员工得分数据（用于标准化）
   */
  async getAllEmployeeScores(period, options = {}) {
    try {
      // 尝试从数据库获取实际数据
      const existingResults = await ThreeDimensionalCalculationResult.findAll({
        where: { calculationPeriod: period },
        attributes: ['profitContributionScore', 'positionValueScore', 'performanceScore']
      })

      if (existingResults && existingResults.length > 10) {
        return {
          profitScores: existingResults.map(r => parseFloat(r.profitContributionScore) || 0),
          positionScores: existingResults.map(r => parseFloat(r.positionValueScore) || 0),
          performanceScores: existingResults.map(r => parseFloat(r.performanceScore) || 0)
        }
      }
    } catch (error) {
      console.warn('获取历史得分数据失败，使用默认值:', error.message)
    }

    // 使用默认的模拟数据
    return {
      profitScores: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      positionScores: [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1],
      performanceScores: [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2]
    }
  }

  /**
   * 提取权重配置
   */
  extractWeights(weightConfig) {
    return {
      main: {
        profitContributionWeight: weightConfig.profitContributionWeight,
        positionValueWeight: weightConfig.positionValueWeight,
        performanceWeight: weightConfig.performanceWeight
      },
      profit: {
        directContributionWeight: weightConfig.profitDirectContributionWeight,
        workloadWeight: weightConfig.profitWorkloadWeight,
        qualityWeight: weightConfig.profitQualityWeight,
        positionValueWeight: weightConfig.profitPositionValueWeight
      },
      position: {
        skillComplexityWeight: weightConfig.positionSkillComplexityWeight,
        responsibilityWeight: weightConfig.positionResponsibilityWeight,
        decisionImpactWeight: weightConfig.positionDecisionImpactWeight,
        experienceWeight: weightConfig.positionExperienceWeight,
        marketValueWeight: weightConfig.positionMarketValueWeight
      },
      performance: {
        workOutputWeight: weightConfig.performanceWorkOutputWeight,
        workQualityWeight: weightConfig.performanceWorkQualityWeight,
        workEfficiencyWeight: weightConfig.performanceWorkEfficiencyWeight,
        collaborationWeight: weightConfig.performanceCollaborationWeight,
        innovationWeight: weightConfig.performanceInnovationWeight,
        leadershipWeight: weightConfig.performanceLeadershipWeight,
        learningWeight: weightConfig.performanceLearningWeight
      }
    }
  }

  /**
   * 获取计算结果统计
   */
  async getCalculationStatistics(period, weightConfigId = null) {
    try {
      const whereClause = { calculationPeriod: period }
      if (weightConfigId) {
        whereClause.weightConfigId = weightConfigId
      }

      const stats = await ThreeDimensionalCalculationResult.findAll({
        where: whereClause,
        attributes: [
          [fn('COUNT', col('id')), 'totalCount'],
          [fn('AVG', col('final_score')), 'avgScore'],
          [fn('MAX', col('final_score')), 'maxScore'],
          [fn('MIN', col('final_score')), 'minScore'],
          [fn('STDDEV', col('final_score')), 'stdDev'],
          [fn('AVG', col('profit_contribution_score')), 'avgProfitScore'],
          [fn('AVG', col('position_value_score')), 'avgPositionScore'],
          [fn('AVG', col('performance_score')), 'avgPerformanceScore']
        ],
        raw: true
      })

      return stats[0]
    } catch (error) {
      console.error('获取统计数据失败:', error)
      throw new Error(`统计失败: ${error.message}`)
    }
  }
}

module.exports = new ThreeDimensionalCalculationService()