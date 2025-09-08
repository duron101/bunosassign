const { Op, fn, col, literal, sequelize } = require('sequelize')
const {
  BonusPool,
  BonusAllocationRule,
  BonusAllocationResult,
  ThreeDimensionalCalculationResult,
  Employee,
  Department,
  Position,
  BusinessLine
} = require('../models')
const CalculationValidator = require('../utils/calculationValidator')
const CalculationUtils = require('../utils/calculationUtils')
const nedbService = require('./nedbService')
const { PermissionValidator } = require('../config/permissions')
const logger = require('../utils/logger')

class BonusAllocationService {

  /**
   * 执行奖金池分配
   * @param {number} bonusPoolId - 奖金池ID
   * @param {number} allocationRuleId - 分配规则ID
   * @param {Object} options - 分配选项
   * @returns {Object} 分配结果
   */
  async allocateBonusPool(bonusPoolId, allocationRuleId, options = {}) {
    const transaction = await sequelize.transaction()
    
    try {
      console.log(`📋 开始执行奖金池分配: 池ID=${bonusPoolId}, 规则ID=${allocationRuleId}`)

      // 获取奖金池信息
      const bonusPool = await BonusPool.findByPk(bonusPoolId, { transaction })
      if (!bonusPool) {
        throw new Error('奖金池不存在')
      }

      // 验证奖金池数据
      const poolValidationErrors = CalculationValidator.validateBonusPool(bonusPool)
      if (poolValidationErrors.length > 0) {
        throw new Error(`奖金池数据验证失败: ${poolValidationErrors.join(', ')}`)
      }

      // 获取分配规则
      const allocationRule = await BonusAllocationRule.findByPk(allocationRuleId, { transaction })
      if (!allocationRule) {
        throw new Error('分配规则不存在')
      }

      // 验证分配规则
      const ruleValidationErrors = CalculationValidator.validateAllocationRule(allocationRule)
      if (ruleValidationErrors.length > 0) {
        throw new Error(`分配规则验证失败: ${ruleValidationErrors.join(', ')}`)
      }

      // 获取符合条件的员工及其三维计算结果
      const eligibleEmployees = await this.getEligibleEmployees(bonusPool, allocationRule, options)
      
      if (eligibleEmployees.length === 0) {
        throw new Error('没有符合条件的员工')
      }

      // 根据分配方法执行分配
      let allocationResults = []
      
      switch (allocationRule.allocationMethod) {
        case 'score_based':
          allocationResults = await this.scoreBasedAllocation(
            bonusPool, allocationRule, eligibleEmployees, options
          )
          break
        case 'tier_based':
          allocationResults = await this.tierBasedAllocation(
            bonusPool, allocationRule, eligibleEmployees, options
          )
          break
        case 'pool_percentage':
          allocationResults = await this.poolPercentageAllocation(
            bonusPool, allocationRule, eligibleEmployees, options
          )
          break
        case 'fixed_amount':
          allocationResults = await this.fixedAmountAllocation(
            bonusPool, allocationRule, eligibleEmployees, options
          )
          break
        case 'hybrid':
          allocationResults = await this.hybridAllocation(
            bonusPool, allocationRule, eligibleEmployees, options
          )
          break
        default:
          throw new Error('不支持的分配方法')
      }

      // 应用保障机制和约束条件
      allocationResults = await this.applyConstraints(
        allocationResults, bonusPool, allocationRule, options
      )

      // 保存分配结果
      const savedResults = await this.saveAllocationResults(
        allocationResults, bonusPoolId, allocationRuleId, options.createdBy || 1, transaction
      )

      // 更新奖金池状态
      await bonusPool.update({
        allocatedAmount: savedResults.reduce((sum, r) => sum + parseFloat(r.totalAmount), 0),
        allocatedCount: savedResults.length,
        status: 'allocated'
      }, { transaction })

      // 更新分配规则使用统计
      await allocationRule.increment(['usageCount', 'successCount'], { transaction })
      await allocationRule.update({ lastUsedAt: new Date() }, { transaction })

      await transaction.commit()

      return {
        bonusPool,
        allocationRule,
        results: savedResults,
        summary: this.generateAllocationSummary(savedResults, bonusPool)
      }

    } catch (error) {
      await transaction.rollback()
      console.error('奖金池分配失败:', error)
      throw new Error(`分配失败: ${error.message}`)
    }
  }

  /**
   * 获取符合条件的员工
   */
  async getEligibleEmployees(bonusPool, allocationRule, options = {}) {
    try {
      // 验证输入参数
      if (!bonusPool || !bonusPool.period) {
        throw new Error('奖金池信息不完整')
      }

      if (!allocationRule) {
        throw new Error('分配规则不存在')
      }

      const whereClause = {
        calculationPeriod: bonusPool.period,
        reviewStatus: 'approved'
      }

      // 添加权重配置过滤
      if (bonusPool.weightConfigId) {
        whereClause.weightConfigId = bonusPool.weightConfigId
      }

      // 添加得分有效性检查
      whereClause.finalScore = { 
        [Op.and]: [
          { [Op.not]: null },
          { [Op.gte]: allocationRule.minScoreThreshold || 0 },
          { [Op.gt]: 0 } // 确保得分大于0
        ]
      }

      const includeClause = [{
        model: Employee,
        required: true,
        where: {
          status: 'active' // 只包含在职员工
        },
        include: [
          { 
            model: Department, 
            attributes: ['id', 'name'],
            required: false
          },
          { 
            model: Position, 
            attributes: ['id', 'name', 'level'],
            required: false
          },
          { 
            model: BusinessLine, 
            attributes: ['id', 'name'], 
            through: { attributes: [] },
            required: false
          }
        ]
      }]

      // 应用适用范围筛选
      if (allocationRule.applicableBusinessLines && Array.isArray(allocationRule.applicableBusinessLines) && allocationRule.applicableBusinessLines.length > 0) {
        if (includeClause[0].include[2]) {
          includeClause[0].include[2].where = {
            id: { [Op.in]: allocationRule.applicableBusinessLines }
          }
          includeClause[0].include[2].required = true
        }
      }

      if (allocationRule.applicableDepartments && Array.isArray(allocationRule.applicableDepartments) && allocationRule.applicableDepartments.length > 0) {
        if (includeClause[0].include[0]) {
          includeClause[0].include[0].where = {
            id: { [Op.in]: allocationRule.applicableDepartments }
          }
          includeClause[0].include[0].required = true
        }
      }

      if (allocationRule.applicablePositionLevels && Array.isArray(allocationRule.applicablePositionLevels) && allocationRule.applicablePositionLevels.length > 0) {
        if (includeClause[0].include[1]) {
          includeClause[0].include[1].where = {
            level: { [Op.in]: allocationRule.applicablePositionLevels }
          }
          includeClause[0].include[1].required = true
        }
      }

      const employees = await ThreeDimensionalCalculationResult.findAll({
        where: whereClause,
        include: includeClause,
        order: [['finalScore', 'DESC']]
      })

      console.log(`找到符合条件的员工数量: ${employees.length}`, {
        期间: bonusPool.period,
        得分阈值: allocationRule.minScoreThreshold || 0
      })

      return employees
    } catch (error) {
      console.error('获取符合条件员工失败:', error)
      throw new Error(`获取员工失败: ${error.message}`)
    }
  }

  /**
   * 基于得分的分配算法
   */
  async scoreBasedAllocation(bonusPool, allocationRule, employees, options = {}) {
    try {
      // 验证输入参数
      if (!employees || employees.length === 0) {
        throw new Error('没有符合条件的员工')
      }

      // 计算总得分，处理null和无效值
      const validScores = employees
        .map(emp => parseFloat(emp.finalScore) || 0)
        .filter(score => score > 0)

      if (validScores.length === 0) {
        throw new Error('没有有效的员工得分')
      }

      const totalScore = validScores.reduce((sum, score) => sum + score, 0)
      
      // 处理可能的除零情况
      if (totalScore <= 0) {
        throw new Error('员工总得分为零，无法进行分配')
      }

      const totalAmount = parseFloat(bonusPool.totalAmount) || 0
      const reserveRatio = parseFloat(allocationRule.reserveRatio) || 0
      const availableAmount = totalAmount * (1 - reserveRatio)
      
      if (availableAmount <= 0) {
        throw new Error('可分配金额不足')
      }

      const results = []

    for (const employee of employees) {
      const finalScore = parseFloat(employee.finalScore) || 0
      
      // 跳过无效得分的员工
      if (finalScore <= 0) {
        console.warn(`跳过得分无效的员工: ${employee.Employee?.name || employee.employeeId}, 得分: ${finalScore}`)
        continue
      }

      const scoreRatio = finalScore / totalScore
      let baseAmount = 0
      let performanceAmount = 0

      // 获取分配比例，设置默认值
      const baseAllocationRatio = parseFloat(allocationRule.baseAllocationRatio) || 0.6
      const performanceAllocationRatio = parseFloat(allocationRule.performanceAllocationRatio) || 0.4

      // 根据分配方法计算基础和绩效金额
      switch (allocationRule.scoreDistributionMethod) {
        case 'linear':
          baseAmount = availableAmount * baseAllocationRatio * scoreRatio
          performanceAmount = availableAmount * performanceAllocationRatio * scoreRatio
          break
        
        case 'exponential':
          const expFactor = parseFloat(allocationRule.exponentialFactor) || 2.0
          const expScore = Math.pow(finalScore, expFactor)
          const totalExpScore = validScores.reduce((sum, score) => 
            sum + Math.pow(score, expFactor), 0)
          
          if (totalExpScore > 0) {
            const expRatio = expScore / totalExpScore
            baseAmount = availableAmount * baseAllocationRatio * expRatio
            performanceAmount = availableAmount * performanceAllocationRatio * expRatio
          }
          break
        
        case 'logarithmic':
          const logScore = Math.log(finalScore + 1)
          const totalLogScore = validScores.reduce((sum, score) => 
            sum + Math.log(score + 1), 0)
          
          if (totalLogScore > 0) {
            const logRatio = logScore / totalLogScore
            baseAmount = availableAmount * baseAllocationRatio * logRatio
            performanceAmount = availableAmount * performanceAllocationRatio * logRatio
          }
          break
        
        case 'step':
          // 阶梯式分配
          const stepMultiplier = this.getStepMultiplier(finalScore, employee.scoreRank || 1, employees.length)
          baseAmount = availableAmount * baseAllocationRatio * scoreRatio * stepMultiplier
          performanceAmount = availableAmount * performanceAllocationRatio * scoreRatio * stepMultiplier
          break
        
        default: // linear
          baseAmount = availableAmount * baseAllocationRatio * scoreRatio
          performanceAmount = availableAmount * performanceAllocationRatio * scoreRatio
      }

      // 应用各种系数
      const coefficients = this.calculateCoefficients(employee, allocationRule)
      
      // 计算最终金额，确保不为负数
      const finalBaseAmount = Math.max(0, baseAmount * coefficients.finalCoeff)
      const finalPerformanceAmount = Math.max(0, performanceAmount * coefficients.finalCoeff)
      
      results.push({
        employee,
        originalScore: finalScore,
        finalScore: finalScore,
        baseAmount: Math.round(finalBaseAmount * 100) / 100, // 保留两位小数
        performanceAmount: Math.round(finalPerformanceAmount * 100) / 100,
        adjustmentAmount: 0,
        ...coefficients
      })
    }

    console.log(`分配计算完成，共处理 ${results.length} 名员工`)
    return results
    
    } catch (error) {
      console.error('基于得分的分配算法失败:', error)
      throw new Error(`分配计算失败: ${error.message}`)
    }
  }

  /**
   * 基于分层的分配算法
   */
  async tierBasedAllocation(bonusPool, allocationRule, employees, options = {}) {
    try {
      if (!employees || employees.length === 0) {
        throw new Error('没有符合条件的员工')
      }

      const totalAmount = parseFloat(bonusPool.totalAmount) || 0
      const reserveRatio = parseFloat(allocationRule.reserveRatio) || 0
      const availableAmount = totalAmount * (1 - reserveRatio)
      
      if (availableAmount <= 0) {
        throw new Error('可分配金额不足')
      }

      const tiers = allocationRule.tierConfig || []
      if (!Array.isArray(tiers) || tiers.length === 0) {
        throw new Error('分层配置不能为空')
      }

      // 验证分层配置的有效性
      const totalRatio = tiers.reduce((sum, tier) => sum + (parseFloat(tier.ratio) || 0), 0)
      if (Math.abs(totalRatio - 1.0) > 0.01) {
        console.warn(`分层配置比例总和不等于1: ${totalRatio}，将进行规范化`)
        // 规范化比例
        tiers.forEach(tier => {
          tier.ratio = (parseFloat(tier.ratio) || 0) / totalRatio
        })
      }

      const results = []
      const tierAssignments = this.assignEmployeesToTiers(employees, tiers)

    for (const tier of tiers) {
      const tierEmployees = tierAssignments[tier.tier] || []
      if (tierEmployees.length === 0) {
        console.log(`分层 ${tier.tier} 没有员工，跳过`)
        continue
      }

      const tierRatio = parseFloat(tier.ratio) || 0
      const tierAmount = availableAmount * tierRatio
      const avgAmountPerEmployee = tierAmount / tierEmployees.length

      console.log(`处理分层 ${tier.tier}: ${tierEmployees.length} 名员工，分层金额: ${tierAmount}`)

      for (const employee of tierEmployees) {
        const coefficients = this.calculateCoefficients(employee, allocationRule)
        const finalAmount = avgAmountPerEmployee * coefficients.finalCoeff

        const baseAllocationRatio = parseFloat(allocationRule.baseAllocationRatio) || 0.6
        const performanceAllocationRatio = parseFloat(allocationRule.performanceAllocationRatio) || 0.4

        results.push({
          employee,
          originalScore: parseFloat(employee.finalScore) || 0,
          finalScore: parseFloat(employee.finalScore) || 0,
          tierLevel: tier.tier,
          baseAmount: Math.max(0, Math.round(finalAmount * baseAllocationRatio * 100) / 100),
          performanceAmount: Math.max(0, Math.round(finalAmount * performanceAllocationRatio * 100) / 100),
          adjustmentAmount: 0,
          ...coefficients
        })
      }
    }

    console.log(`分层分配完成，共处理 ${results.length} 名员工`)
    return results
    
    } catch (error) {
      console.error('分层分配算法失败:', error)
      throw new Error(`分层分配失败: ${error.message}`)
    }
  }

  /**
   * 基于比例的分配算法
   */
  async poolPercentageAllocation(bonusPool, allocationRule, employees, options = {}) {
    const availableAmount = parseFloat(bonusPool.totalAmount) * (1 - parseFloat(allocationRule.reserveRatio))
    const avgAmount = availableAmount / employees.length
    
    const results = []

    for (const employee of employees) {
      const coefficients = this.calculateCoefficients(employee, allocationRule)
      const finalAmount = avgAmount * coefficients.finalCoeff

      results.push({
        employee,
        originalScore: employee.finalScore,
        finalScore: employee.finalScore,
        baseAmount: finalAmount * parseFloat(allocationRule.baseAllocationRatio),
        performanceAmount: finalAmount * parseFloat(allocationRule.performanceAllocationRatio),
        adjustmentAmount: 0,
        ...coefficients
      })
    }

    return results
  }

  /**
   * 固定金额分配算法
   */
  async fixedAmountAllocation(bonusPool, allocationRule, employees, options = {}) {
    const results = []
    const fixedAmount = options.fixedAmount || 10000 // 默认固定金额

    for (const employee of employees) {
      const coefficients = this.calculateCoefficients(employee, allocationRule)
      const finalAmount = fixedAmount * coefficients.finalCoeff

      results.push({
        employee,
        originalScore: employee.finalScore,
        finalScore: employee.finalScore,
        baseAmount: finalAmount * parseFloat(allocationRule.baseAllocationRatio),
        performanceAmount: finalAmount * parseFloat(allocationRule.performanceAllocationRatio),
        adjustmentAmount: 0,
        ...coefficients
      })
    }

    return results
  }

  /**
   * 混合分配算法
   */
  async hybridAllocation(bonusPool, allocationRule, employees, options = {}) {
    // 混合算法：50%基于得分，30%基于分层，20%基于固定比例
    const scoreResults = await this.scoreBasedAllocation(bonusPool, allocationRule, employees, options)
    const tierResults = await this.tierBasedAllocation(bonusPool, allocationRule, employees, options)
    const percentageResults = await this.poolPercentageAllocation(bonusPool, allocationRule, employees, options)

    const results = []
    
    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i]
      const scoreResult = scoreResults[i]
      const tierResult = tierResults.find(r => r.employee.employeeId === employee.employeeId)
      const percentageResult = percentageResults[i]

      const hybridAmount = 
        (scoreResult.baseAmount + scoreResult.performanceAmount) * 0.5 +
        (tierResult ? (tierResult.baseAmount + tierResult.performanceAmount) : 0) * 0.3 +
        (percentageResult.baseAmount + percentageResult.performanceAmount) * 0.2

      results.push({
        employee,
        originalScore: employee.finalScore,
        finalScore: employee.finalScore,
        baseAmount: hybridAmount * parseFloat(allocationRule.baseAllocationRatio),
        performanceAmount: hybridAmount * parseFloat(allocationRule.performanceAllocationRatio),
        adjustmentAmount: 0,
        ...scoreResult
      })
    }

    return results
  }

  /**
   * 计算各种系数
   */
  calculateCoefficients(employee, allocationRule) {
    try {
      let baseAllocationCoeff = 1.0
      let performanceCoeff = 1.0
      let positionCoeff = 1.0
      let departmentCoeff = 1.0
      let specialCoeff = 1.0

      // 防止空引用错误
      if (!employee) {
        console.warn('员工信息为空，使用默认系数')
        return { baseAllocationCoeff, performanceCoeff, positionCoeff, departmentCoeff, specialCoeff, finalCoeff: 1.0 }
      }

      // 绩效系数：基于三维得分中的绩效部分
      const performanceScore = parseFloat(employee.performanceScore) || 0
      if (performanceScore > 0.8) {
        performanceCoeff = 1.2
      } else if (performanceScore < 0.4) {
        performanceCoeff = 0.8
      }

      // 岗位系数：基于岗位等级
      if (allocationRule?.positionLevelWeights && 
          employee.Employee?.Position?.level) {
        const levelWeight = allocationRule.positionLevelWeights[employee.Employee.Position.level]
        if (levelWeight !== undefined && levelWeight !== null) {
          const parsedWeight = parseFloat(levelWeight)
          if (!isNaN(parsedWeight) && parsedWeight > 0) {
            positionCoeff = parsedWeight
          }
        }
      }

      // 部门系数：基于部门权重配置
      if (allocationRule?.departmentWeights && 
          employee.Employee?.Department?.id) {
        const deptWeight = allocationRule.departmentWeights[employee.Employee.Department.id]
        if (deptWeight !== undefined && deptWeight !== null) {
          const parsedWeight = parseFloat(deptWeight)
          if (!isNaN(parsedWeight) && parsedWeight > 0) {
            departmentCoeff = parsedWeight
          }
        }
      }

      // 特殊系数：新员工、优秀员工等
      if (allocationRule?.specialRules) {
        try {
          specialCoeff = this.calculateSpecialCoefficient(employee, allocationRule.specialRules)
        } catch (error) {
          console.warn('计算特殊系数失败:', error.message)
          specialCoeff = 1.0
        }
      }

      // 确保所有系数都是有效数值
      baseAllocationCoeff = isNaN(baseAllocationCoeff) || baseAllocationCoeff <= 0 ? 1.0 : baseAllocationCoeff
      performanceCoeff = isNaN(performanceCoeff) || performanceCoeff <= 0 ? 1.0 : performanceCoeff
      positionCoeff = isNaN(positionCoeff) || positionCoeff <= 0 ? 1.0 : positionCoeff
      departmentCoeff = isNaN(departmentCoeff) || departmentCoeff <= 0 ? 1.0 : departmentCoeff
      specialCoeff = isNaN(specialCoeff) || specialCoeff <= 0 ? 1.0 : specialCoeff

      const finalCoeff = baseAllocationCoeff * performanceCoeff * positionCoeff * departmentCoeff * specialCoeff

      return {
        baseAllocationCoeff,
        performanceCoeff,
        positionCoeff,
        departmentCoeff,
        specialCoeff,
        finalCoeff: isNaN(finalCoeff) ? 1.0 : Math.max(0.1, finalCoeff) // 确保最终系数不会太小
      }
    } catch (error) {
      console.error('计算系数时发生错误:', error)
      return {
        baseAllocationCoeff: 1.0,
        performanceCoeff: 1.0,
        positionCoeff: 1.0,
        departmentCoeff: 1.0,
        specialCoeff: 1.0,
        finalCoeff: 1.0
      }
    }
  }

  /**
   * 计算特殊系数
   */
  calculateSpecialCoefficient(employee, specialRules) {
    try {
      let coefficient = 1.0

      if (!employee || !specialRules) {
        return coefficient
      }

      // 新员工减半
      if (specialRules.newEmployeeReduction) {
        const workMonths = parseFloat(employee.workMonths) || 0
        if (workMonths < 12) {
          coefficient *= 0.5
        }
      }

      // 优秀员工奖励
      if (specialRules.excellentEmployeeBonus) {
        const finalScore = parseFloat(employee.finalScore) || 0
        if (finalScore > 0.9) {
          coefficient *= 1.3
        }
      }

      // 关键岗位奖励
      if (specialRules.keyPositionBonus && 
          employee.Employee?.Position?.level === 'senior') {
        coefficient *= 1.1
      }

      // 返回有效系数
      return isNaN(coefficient) ? 1.0 : Math.max(0.1, Math.min(5.0, coefficient))
    } catch (error) {
      console.warn('计算特殊系数失败:', error.message)
      return 1.0
    }
  }

  /**
   * 获取阶梯乘数
   */
  getStepMultiplier(score, rank, totalCount) {
    const percentile = (totalCount - rank + 1) / totalCount

    if (percentile >= 0.9) return 2.0      // 前10%
    if (percentile >= 0.7) return 1.5      // 前30%
    if (percentile >= 0.4) return 1.0      // 前60%
    if (percentile >= 0.2) return 0.8      // 前80%
    return 0.6                             // 后20%
  }

  /**
   * 将员工分配到分层
   */
  assignEmployeesToTiers(employees, tiers) {
    try {
      const assignments = {}
      
      // 初始化各层
      tiers.forEach(tier => {
        if (tier.tier) {
          assignments[tier.tier] = []
        }
      })

      // 过滤有效员工并按得分排序
      const validEmployees = employees.filter(emp => {
        const score = parseFloat(emp.finalScore)
        return !isNaN(score) && score > 0
      })

      const sortedEmployees = validEmployees.sort((a, b) => {
        const scoreA = parseFloat(a.finalScore) || 0
        const scoreB = parseFloat(b.finalScore) || 0
        return scoreB - scoreA
      })
      
      console.log(`开始分层分配: 有效员工 ${sortedEmployees.length} 名`)
      
      for (const employee of sortedEmployees) {
        const score = parseFloat(employee.finalScore) || 0
        
        // 找到合适的分层（从高分层开始找）
        const sortedTiers = [...tiers].sort((a, b) => (b.minScore || 0) - (a.minScore || 0))
        let assignedTier = null
        
        for (const tier of sortedTiers) {
          const minScore = parseFloat(tier.minScore) || 0
          if (score >= minScore) {
            assignedTier = tier
            break
          }
        }
        
        // 如果没有找到合适的分层，分配到最低层
        if (!assignedTier && tiers.length > 0) {
          assignedTier = tiers.reduce((lowest, current) => {
            const lowestMin = parseFloat(lowest.minScore) || 0
            const currentMin = parseFloat(current.minScore) || 0
            return currentMin < lowestMin ? current : lowest
          })
        }
        
        if (assignedTier && assignedTier.tier) {
          assignments[assignedTier.tier].push(employee)
        } else {
          console.warn(`员工 ${employee.Employee?.name || employee.employeeId} 无法分配到任何分层，得分: ${score}`)
        }
      }

      // 记录分配结果
      Object.keys(assignments).forEach(tier => {
        console.log(`分层 ${tier}: ${assignments[tier].length} 名员工`)
      })

      return assignments
    } catch (error) {
      console.error('员工分层分配失败:', error)
      throw new Error(`分层分配失败: ${error.message}`)
    }
  }

  /**
   * 应用约束条件和保障机制
   */
  async applyConstraints(allocationResults, bonusPool, allocationRule, options = {}) {
    const results = [...allocationResults]
    const totalAllocated = results.reduce((sum, r) => sum + r.baseAmount + r.performanceAmount, 0)
    const availableAmount = parseFloat(bonusPool.totalAmount) * parseFloat(allocationRule.totalAllocationLimit)

    // 总额约束
    if (totalAllocated > availableAmount) {
      const adjustmentRatio = availableAmount / totalAllocated
      results.forEach(result => {
        result.baseAmount *= adjustmentRatio
        result.performanceAmount *= adjustmentRatio
        result.adjustmentAmount = (result.baseAmount + result.performanceAmount) * (adjustmentRatio - 1)
      })
    }

    // 应用最小/最大金额保障
    const avgAmount = availableAmount / results.length
    
    results.forEach(result => {
      const totalAmount = result.baseAmount + result.performanceAmount + result.adjustmentAmount
      let finalAmount = totalAmount
      
      // 最小金额保障
      if (allocationRule.minBonusAmount && totalAmount < parseFloat(allocationRule.minBonusAmount)) {
        finalAmount = parseFloat(allocationRule.minBonusAmount)
        result.minAmountApplied = true
      }
      
      if (allocationRule.minBonusRatio && totalAmount < avgAmount * parseFloat(allocationRule.minBonusRatio)) {
        finalAmount = avgAmount * parseFloat(allocationRule.minBonusRatio)
        result.minAmountApplied = true
      }

      // 最大金额限制
      if (allocationRule.maxBonusAmount && finalAmount > parseFloat(allocationRule.maxBonusAmount)) {
        finalAmount = parseFloat(allocationRule.maxBonusAmount)
        result.maxAmountApplied = true
      }
      
      if (allocationRule.maxBonusRatio && finalAmount > avgAmount * parseFloat(allocationRule.maxBonusRatio)) {
        finalAmount = avgAmount * parseFloat(allocationRule.maxBonusRatio)
        result.maxAmountApplied = true
      }

      // 记录原始计算金额
      if (finalAmount !== totalAmount) {
        result.originalCalculatedAmount = totalAmount
        result.adjustmentAmount += (finalAmount - totalAmount)
      }
    })

    return results
  }

  /**
   * 保存分配结果
   */
  async saveAllocationResults(allocationResults, bonusPoolId, allocationRuleId, createdBy, transaction) {
    const savedResults = []

    for (const result of allocationResults) {
      const employee = result.employee.Employee
      
      const allocationData = {
        bonusPoolId,
        allocationRuleId,
        employeeId: result.employee.employeeId,
        calculationResultId: result.employee.id,
        allocationPeriod: result.employee.calculationPeriod,
        allocationDate: new Date(),
        
        originalScore: result.originalScore,
        adjustedScore: result.adjustedScore,
        finalScore: result.finalScore,
        
        scoreRank: result.employee.scoreRank,
        percentileRank: result.employee.percentileRank,
        departmentRank: result.employee.departmentRank,
        tierLevel: result.tierLevel,
        
        baseAllocationCoeff: result.baseAllocationCoeff,
        performanceCoeff: result.performanceCoeff,
        positionCoeff: result.positionCoeff,
        departmentCoeff: result.departmentCoeff,
        specialCoeff: result.specialCoeff,
        finalCoeff: result.finalCoeff,
        
        baseAmount: result.baseAmount,
        performanceAmount: result.performanceAmount,
        adjustmentAmount: result.adjustmentAmount,
        totalAmount: result.baseAmount + result.performanceAmount + result.adjustmentAmount,
        
        minAmountApplied: result.minAmountApplied || false,
        maxAmountApplied: result.maxAmountApplied || false,
        originalCalculatedAmount: result.originalCalculatedAmount,
        
        calculationDetails: {
          allocationMethod: allocationRuleId,
          scoreDistribution: result.scoreDistribution,
          appliedCoefficients: {
            base: result.baseAllocationCoeff,
            performance: result.performanceCoeff,
            position: result.positionCoeff,
            department: result.departmentCoeff,
            special: result.specialCoeff
          }
        },
        
        // 员工信息快照
        employeeName: employee.name,
        departmentName: employee.Department?.name || '',
        positionName: employee.Position?.name || '',
        positionLevel: employee.Position?.level || '',
        businessLineName: employee.BusinessLine?.[0]?.name || '',
        
        employmentStartDate: employee.hireDate,
        eligibleForBonus: true,
        
        createdBy
      }

      const savedResult = await BonusAllocationResult.create(allocationData, { transaction })
      savedResults.push(savedResult)
    }

    return savedResults
  }

  /**
   * 生成分配摘要
   */
  generateAllocationSummary(results, bonusPool) {
    if (!results || results.length === 0) {
      return {
        totalEmployees: 0,
        totalAllocated: 0,
        allocationRatio: 0,
        remainingAmount: parseFloat(bonusPool?.totalAmount) || 0,
        statistics: { avgAmount: 0, maxAmount: 0, minAmount: 0, stdDeviation: 0 },
        distribution: { byDepartment: {}, byTier: {} },
        qualityMetrics: { minAmountAppliedCount: 0, maxAmountAppliedCount: 0, anomalyCount: 0 }
      }
    }

    // 使用计算工具生成摘要
    const basicSummary = CalculationUtils.generateCalculationSummary(results, bonusPool)
    
    const totalAllocated = basicSummary.totalAllocated
    const avgAmount = basicSummary.averageBonus
    const maxAmount = basicSummary.maxBonus
    const minAmount = basicSummary.minBonus

    // 部门分布
    const departmentDistribution = {}
    results.forEach(r => {
      const dept = r.departmentName
      if (!departmentDistribution[dept]) {
        departmentDistribution[dept] = { count: 0, amount: 0 }
      }
      departmentDistribution[dept].count++
      departmentDistribution[dept].amount += parseFloat(r.totalAmount)
    })

    // 分层分布
    const tierDistribution = {}
    results.forEach(r => {
      const tier = r.tierLevel || 'General'
      if (!tierDistribution[tier]) {
        tierDistribution[tier] = { count: 0, amount: 0 }
      }
      tierDistribution[tier].count++
      tierDistribution[tier].amount += parseFloat(r.totalAmount)
    })

    // 检测异常值
    const amounts = results.map(r => parseFloat(r.totalAmount) || 0)
    const outliers = CalculationUtils.detectOutliers(amounts)

    return {
      ...basicSummary,
      remainingAmount: CalculationUtils.roundToDecimals(
        (parseFloat(bonusPool?.totalAmount) || 0) - totalAllocated
      ),
      
      distribution: {
        byDepartment: departmentDistribution,
        byTier: tierDistribution
      },
      
      qualityMetrics: {
        minAmountAppliedCount: results.filter(r => r.minAmountApplied).length,
        maxAmountAppliedCount: results.filter(r => r.maxAmountApplied).length,
        anomalyCount: outliers.length,
        outliers: outliers.map(o => ({
          employeeIndex: o.index,
          amount: o.value,
          employeeName: results[o.index]?.employeeName
        }))
      },

      // 新增公平性指标
      fairnessMetrics: basicSummary.fairnessMetrics,
      
      // 验证结果
      validationSummary: this.validateAllocationResults(results)
    }
  }

  /**
   * 验证分配结果
   */
  validateAllocationResults(results) {
    let totalValidationErrors = 0
    const validationDetails = []

    results.forEach((result, index) => {
      const errors = CalculationValidator.validateAllocationResult(result)
      if (errors.length > 0) {
        totalValidationErrors++
        validationDetails.push({
          employeeIndex: index,
          employeeName: result.employeeName,
          errors
        })
      }
    })

    return {
      isValid: totalValidationErrors === 0,
      errorCount: totalValidationErrors,
      errorDetails: validationDetails.slice(0, 10), // 最多显示10个错误
      totalResults: results.length
    }
  }

  /**
   * 计算标准差（保留兼容性）
   */
  calculateStandardDeviation(values) {
    const stats = CalculationUtils.calculateStats(values)
    return stats.stdDev
  }

  /**
   * 获取分配结果统计
   */
  async getAllocationStatistics(bonusPoolId, allocationRuleId = null) {
    const whereClause = { bonusPoolId }
    if (allocationRuleId) {
      whereClause.allocationRuleId = allocationRuleId
    }

    const stats = await BonusAllocationResult.findAll({
      where: whereClause,
      attributes: [
        [fn('COUNT', col('id')), 'totalCount'],
        [fn('SUM', col('total_amount')), 'totalAmount'],
        [fn('AVG', col('total_amount')), 'avgAmount'],
        [fn('MAX', col('total_amount')), 'maxAmount'],
        [fn('MIN', col('total_amount')), 'minAmount'],
        [fn('STDDEV', col('total_amount')), 'stdDev'],
        [fn('COUNT', literal('CASE WHEN min_amount_applied = true THEN 1 END')), 'minAmountAppliedCount'],
        [fn('COUNT', literal('CASE WHEN max_amount_applied = true THEN 1 END')), 'maxAmountAppliedCount'],
        [fn('COUNT', literal('CASE WHEN has_anomalies = true THEN 1 END')), 'anomalyCount']
      ],
      raw: true
    })

    return stats[0]
  }

  /**
   * 模拟分配（不保存结果）
   */
  async simulateAllocation(bonusPoolId, allocationRuleId, options = {}) {
    // 获取奖金池和分配规则
    const bonusPool = await BonusPool.findByPk(bonusPoolId)
    const allocationRule = await BonusAllocationRule.findByPk(allocationRuleId)
    
    if (!bonusPool || !allocationRule) {
      throw new Error('奖金池或分配规则不存在')
    }

    // 获取符合条件的员工
    const eligibleEmployees = await this.getEligibleEmployees(bonusPool, allocationRule, options)
    
    if (eligibleEmployees.length === 0) {
      throw new Error('没有符合条件的员工')
    }

    // 执行模拟分配（不保存）
    let allocationResults = []
    
    switch (allocationRule.allocationMethod) {
      case 'score_based':
        allocationResults = await this.scoreBasedAllocation(bonusPool, allocationRule, eligibleEmployees, options)
        break
      case 'tier_based':
        allocationResults = await this.tierBasedAllocation(bonusPool, allocationRule, eligibleEmployees, options)
        break
      case 'pool_percentage':
        allocationResults = await this.poolPercentageAllocation(bonusPool, allocationRule, eligibleEmployees, options)
        break
      case 'fixed_amount':
        allocationResults = await this.fixedAmountAllocation(bonusPool, allocationRule, eligibleEmployees, options)
        break
      case 'hybrid':
        allocationResults = await this.hybridAllocation(bonusPool, allocationRule, eligibleEmployees, options)
        break
      default:
        throw new Error('不支持的分配方法')
    }

    // 应用约束条件
    allocationResults = await this.applyConstraints(allocationResults, bonusPool, allocationRule, options)

    // 生成模拟结果摘要
    const summary = this.generateAllocationSummary(allocationResults, bonusPool)

    return {
      bonusPool,
      allocationRule,
      results: allocationResults,
      summary,
      isSimulation: true
    }
  }

  /**
   * 创建奖金分配
   * @param {Object} allocationData - 分配数据
   * @returns {Object} 创建的分配记录
   */
  async createBonusAllocation(allocationData) {
    try {
      const allocation = {
        ...allocationData,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = await nedbService.createBonusAllocation(allocation)
      
      logger.info('奖金分配创建成功', {
        allocationId: result._id,
        projectId: allocationData.projectId,
        employeeId: allocationData.employeeId,
        amount: allocationData.amount
      })

      return result
    } catch (error) {
      logger.error('创建奖金分配失败:', error)
      throw error
    }
  }

  /**
   * 审批奖金分配
   * @param {string} allocationId - 分配ID
   * @param {string} approverId - 审批人ID
   * @param {boolean} approved - 是否批准
   * @param {string} comments - 审批意见
   * @returns {Object} 审批结果
   */
  async approveBonusAllocation(allocationId, approverId, approved, comments) {
    try {
      // 获取奖金分配信息
      const allocation = await nedbService.getBonusAllocationById(allocationId)
      if (!allocation) {
        throw new Error('奖金分配不存在')
      }

      // 更新分配状态
      const updatedAllocation = await nedbService.updateBonusAllocation(allocationId, {
        status: approved ? 'approved' : 'rejected',
        approvedBy: approverId,
        approvedAt: new Date(),
        approvalComments: comments,
        updatedAt: new Date()
      })

      if (approved) {
        logger.info('奖金分配已批准', {
          allocationId,
          projectId: allocation.projectId,
          employeeId: allocation.employeeId,
          amount: allocation.amount
        })
      } else {
        logger.info('奖金分配已拒绝', {
          allocationId,
          projectId: allocation.projectId,
          employeeId: allocation.employeeId,
          comments
        })
      }

      return updatedAllocation
    } catch (error) {
      logger.error('审批奖金分配失败:', error)
      throw error
    }
  }

  /**
   * 批量审批奖金分配
   * @param {Array} allocationIds - 分配ID列表
   * @param {string} approverId - 审批人ID
   * @param {boolean} approved - 是否批准
   * @param {string} comments - 审批意见
   * @returns {Object} 处理结果
   */
  async batchApproveBonusAllocations(allocationIds, approverId, approved, comments) {
    try {
      const results = []
      const errors = []

      for (const allocationId of allocationIds) {
        try {
          const result = await this.approveBonusAllocation(
            allocationId,
            approverId,
            approved,
            comments
          )
          results.push(result)
        } catch (error) {
          errors.push({
            allocationId,
            error: error.message
          })
        }
      }

      return {
        success: results.length,
        failed: errors.length,
        results,
        errors
      }
    } catch (error) {
      logger.error('批量审批奖金分配失败:', error)
      throw error
    }
  }

  /**
   * 获取奖金统计信息
   * @param {Object} options - 查询选项
   * @returns {Object} 统计信息
   */
  async getBonusStats(options = {}) {
    try {
      const { projectId, departmentId, startDate, endDate } = options
      
      // 构建查询条件
      const query = {}
      if (projectId) query.projectId = projectId
      if (departmentId) query.departmentId = departmentId
      
      // 时间范围查询
      if (startDate || endDate) {
        query.createdAt = {}
        if (startDate) query.createdAt.$gte = new Date(startDate)
        if (endDate) query.createdAt.$lte = new Date(endDate)
      }

      // 获取奖金分配列表
      const allocations = await nedbService.getBonusAllocations(query)
      
      // 统计信息
      const totalAllocations = allocations.length
      const totalAmount = allocations.reduce((sum, a) => sum + (a.amount || 0), 0)
      const pendingAllocations = allocations.filter(a => a.status === 'pending').length
      const approvedAllocations = allocations.filter(a => a.status === 'approved').length
      const rejectedAllocations = allocations.filter(a => a.status === 'rejected').length

      // 按项目统计
      const projectStats = {}
      allocations.forEach(allocation => {
        const projectId = allocation.projectId
        if (!projectStats[projectId]) {
          projectStats[projectId] = {
            count: 0,
            totalAmount: 0,
            pending: 0,
            approved: 0,
            rejected: 0
          }
        }
        projectStats[projectId].count++
        projectStats[projectId].totalAmount += allocation.amount || 0
        projectStats[projectId][allocation.status]++
      })

      // 按部门统计
      const departmentStats = {}
      allocations.forEach(allocation => {
        const deptId = allocation.departmentId
        if (!departmentStats[deptId]) {
          departmentStats[deptId] = {
            count: 0,
            totalAmount: 0,
            pending: 0,
            approved: 0,
            rejected: 0
          }
        }
        departmentStats[deptId].count++
        departmentStats[deptId].totalAmount += allocation.amount || 0
        departmentStats[deptId][allocation.status]++
      })

      return {
        overview: {
          totalAllocations,
          totalAmount,
          pendingAllocations,
          approvedAllocations,
          rejectedAllocations
        },
        byProject: projectStats,
        byDepartment: departmentStats,
        timeRange: {
          startDate,
          endDate
        }
      }
    } catch (error) {
      logger.error('获取奖金统计信息失败:', error)
      return {}
    }
  }

  /**
   * 检查用户奖金权限
   * @param {Object} user - 用户对象
   * @param {string} projectId - 项目ID
   * @param {string} action - 操作类型
   * @returns {boolean} 是否有权限
   */
  async checkUserBonusPermission(user, projectId, action) {
    try {
      // 检查基础权限
      if (!PermissionValidator.canAccessResource(user, 'bonus', action)) {
        return false
      }

      // 如果有项目ID，检查项目级权限
      if (projectId) {
        const project = await nedbService.getProjectById(projectId)
        if (!project) {
          return false
        }

        return PermissionValidator.checkProjectPermission(user, action, project)
      }

      return true
    } catch (error) {
      logger.error('检查用户奖金权限失败:', error)
      return false
    }
  }

  /**
   * 获取用户可管理的奖金项目
   * @param {Object} user - 用户对象
   * @returns {Array} 可管理的项目列表
   */
  async getUserManagedBonusProjects(user) {
    try {
      const projects = await nedbService.getProjects()
      
      // 过滤用户可管理的项目
      return projects.filter(project => 
        PermissionValidator.checkProjectPermission(user, 'manage', project)
      )
    } catch (error) {
      logger.error('获取用户可管理奖金项目失败:', error)
      return []
    }
  }

  /**
   * 验证奖金分配数据
   * @param {Object} allocationData - 分配数据
   * @returns {Object} 验证结果
   */
  validateBonusAllocationData(allocationData) {
    const errors = []

    if (!allocationData.projectId) {
      errors.push('项目ID不能为空')
    }

    if (!allocationData.employeeId) {
      errors.push('员工ID不能为空')
    }

    if (!allocationData.amount || allocationData.amount <= 0) {
      errors.push('奖金金额必须大于0')
    }

    if (allocationData.amount > 1000000) {
      errors.push('单次奖金分配不能超过100万')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 计算奖金分配建议
   * @param {Object} project - 项目信息
   * @param {Array} employees - 员工列表
   * @param {number} totalBonus - 总奖金池
   * @returns {Array} 分配建议
   */
  async calculateBonusAllocationSuggestions(project, employees, totalBonus) {
    try {
      const suggestions = []
      const totalWeight = employees.reduce((sum, emp) => sum + (emp.contributionWeight || 1), 0)

      employees.forEach(employee => {
        const weight = employee.contributionWeight || 1
        const suggestedAmount = Math.round((weight / totalWeight) * totalBonus * 100) / 100
        
        suggestions.push({
          employeeId: employee.id,
          employeeName: employee.name,
          contributionWeight: weight,
          suggestedAmount,
          percentage: Math.round((weight / totalWeight) * 10000) / 100
        })
      })

      return suggestions.sort((a, b) => b.suggestedAmount - a.suggestedAmount)
    } catch (error) {
      logger.error('计算奖金分配建议失败:', error)
      return []
    }
  }
}

module.exports = new BonusAllocationService()