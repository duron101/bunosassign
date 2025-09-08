/**
 * 计算验证器
 * 用于验证计算输入参数和结果的正确性
 */

class CalculationValidator {
  
  /**
   * 验证奖金池数据
   */
  static validateBonusPool(bonusPool) {
    const errors = []
    
    if (!bonusPool) {
      errors.push('奖金池数据不能为空')
      return errors
    }

    // 验证必需字段
    if (!bonusPool.period) {
      errors.push('奖金池期间不能为空')
    }

    if (!bonusPool.totalAmount || parseFloat(bonusPool.totalAmount) <= 0) {
      errors.push('奖金池总金额必须大于0')
    }

    // 验证数值范围
    const totalAmount = parseFloat(bonusPool.totalAmount) || 0
    const poolRatio = parseFloat(bonusPool.poolRatio) || 0
    const reserveRatio = parseFloat(bonusPool.reserveRatio) || 0
    const specialRatio = parseFloat(bonusPool.specialRatio) || 0

    if (poolRatio < 0 || poolRatio > 1) {
      errors.push('奖金池比例必须在0-1之间')
    }

    if (reserveRatio < 0 || reserveRatio > 0.5) {
      errors.push('预留比例必须在0-0.5之间')
    }

    if (specialRatio < 0 || specialRatio > 0.5) {
      errors.push('特殊奖金比例必须在0-0.5之间')
    }

    if (reserveRatio + specialRatio > 1) {
      errors.push('预留比例和特殊奖金比例之和不能超过100%')
    }

    // 验证金额计算
    const expectedPoolAmount = totalAmount * poolRatio
    const actualPoolAmount = parseFloat(bonusPool.poolAmount) || 0
    
    if (Math.abs(expectedPoolAmount - actualPoolAmount) > 0.01) {
      errors.push('奖金池金额计算不正确')
    }

    return errors
  }

  /**
   * 验证分配规则
   */
  static validateAllocationRule(allocationRule) {
    const errors = []
    
    if (!allocationRule) {
      errors.push('分配规则不能为空')
      return errors
    }

    // 验证分配方法
    const validMethods = ['score_based', 'tier_based', 'pool_percentage', 'fixed_amount', 'hybrid']
    if (!validMethods.includes(allocationRule.allocationMethod)) {
      errors.push('无效的分配方法')
    }

    // 验证比例字段
    const baseRatio = parseFloat(allocationRule.baseAllocationRatio) || 0
    const performanceRatio = parseFloat(allocationRule.performanceAllocationRatio) || 0
    const reserveRatio = parseFloat(allocationRule.reserveRatio) || 0

    if (baseRatio < 0 || baseRatio > 1) {
      errors.push('基础分配比例必须在0-1之间')
    }

    if (performanceRatio < 0 || performanceRatio > 1) {
      errors.push('绩效分配比例必须在0-1之间')
    }

    if (Math.abs(baseRatio + performanceRatio - 1) > 0.01) {
      errors.push('基础分配比例和绩效分配比例之和应该等于1')
    }

    // 验证阈值
    const minThreshold = parseFloat(allocationRule.minScoreThreshold) || 0
    const maxThreshold = parseFloat(allocationRule.maxScoreThreshold) || 1

    if (minThreshold < 0 || minThreshold > 1) {
      errors.push('最低分数阈值必须在0-1之间')
    }

    if (maxThreshold < minThreshold) {
      errors.push('最高分数阈值不能小于最低分数阈值')
    }

    // 验证分层配置（如果是分层分配）
    if (allocationRule.allocationMethod === 'tier_based') {
      if (!allocationRule.tierConfig || !Array.isArray(allocationRule.tierConfig)) {
        errors.push('分层分配必须配置有效的分层信息')
      } else {
        const tierErrors = this.validateTierConfig(allocationRule.tierConfig)
        errors.push(...tierErrors)
      }
    }

    return errors
  }

  /**
   * 验证分层配置
   */
  static validateTierConfig(tiers) {
    const errors = []
    
    if (!tiers || tiers.length === 0) {
      errors.push('分层配置不能为空')
      return errors
    }

    let totalRatio = 0
    const tierNames = new Set()
    
    tiers.forEach((tier, index) => {
      if (!tier.tier) {
        errors.push(`第${index + 1}层缺少层级名称`)
      } else if (tierNames.has(tier.tier)) {
        errors.push(`分层名称"${tier.tier}"重复`)
      } else {
        tierNames.add(tier.tier)
      }

      const ratio = parseFloat(tier.ratio) || 0
      const minScore = parseFloat(tier.minScore)

      if (ratio <= 0 || ratio > 1) {
        errors.push(`第${index + 1}层的分配比例必须在0-1之间`)
      }

      if (isNaN(minScore) || minScore < 0 || minScore > 1) {
        errors.push(`第${index + 1}层的最低分数必须在0-1之间`)
      }

      totalRatio += ratio
    })

    if (Math.abs(totalRatio - 1) > 0.01) {
      errors.push(`所有分层的分配比例之和必须等于1，当前为${totalRatio.toFixed(3)}`)
    }

    return errors
  }

  /**
   * 验证员工数据
   */
  static validateEmployee(employee) {
    const errors = []
    
    if (!employee) {
      errors.push('员工数据不能为空')
      return errors
    }

    if (!employee.id && !employee.employeeId) {
      errors.push('员工ID不能为空')
    }

    if (!employee.name) {
      errors.push('员工姓名不能为空')
    }

    if (!employee.departmentId && !employee.Department) {
      errors.push('员工部门信息不能为空')
    }

    if (!employee.positionId && !employee.Position) {
      errors.push('员工职位信息不能为空')
    }

    if (employee.status && !['active', 'inactive', 'terminated'].includes(employee.status)) {
      errors.push('员工状态无效')
    }

    return errors
  }

  /**
   * 验证三维计算结果
   */
  static validateThreeDimensionalResult(result) {
    const errors = []
    
    if (!result) {
      errors.push('计算结果不能为空')
      return errors
    }

    // 验证得分字段
    const scores = [
      { name: '利润贡献得分', value: result.profitContributionScore },
      { name: '岗位价值得分', value: result.positionValueScore },
      { name: '绩效表现得分', value: result.performanceScore },
      { name: '最终得分', value: result.finalScore }
    ]

    scores.forEach(score => {
      const value = parseFloat(score.value)
      if (isNaN(value)) {
        errors.push(`${score.name}无效`)
      } else if (value < 0) {
        errors.push(`${score.name}不能为负数`)
      }
    })

    // 验证权重
    if (result.weights) {
      const weightSum = Object.values(result.weights.main || {})
        .reduce((sum, weight) => sum + (parseFloat(weight) || 0), 0)
      
      if (Math.abs(weightSum - 1) > 0.01) {
        errors.push('权重总和应该等于1')
      }
    }

    return errors
  }

  /**
   * 验证分配结果
   */
  static validateAllocationResult(result) {
    const errors = []
    
    if (!result) {
      errors.push('分配结果不能为空')
      return errors
    }

    if (!result.employeeId) {
      errors.push('员工ID不能为空')
    }

    // 验证金额字段
    const amounts = [
      { name: '基础金额', value: result.baseAmount },
      { name: '绩效金额', value: result.performanceAmount },
      { name: '调整金额', value: result.adjustmentAmount },
      { name: '总金额', value: result.totalAmount }
    ]

    amounts.forEach(amount => {
      const value = parseFloat(amount.value)
      if (isNaN(value)) {
        errors.push(`${amount.name}无效`)
      } else if (value < 0 && amount.name !== '调整金额') {
        errors.push(`${amount.name}不能为负数`)
      }
    })

    // 验证总金额计算
    const baseAmount = parseFloat(result.baseAmount) || 0
    const performanceAmount = parseFloat(result.performanceAmount) || 0
    const adjustmentAmount = parseFloat(result.adjustmentAmount) || 0
    const expectedTotal = baseAmount + performanceAmount + adjustmentAmount
    const actualTotal = parseFloat(result.totalAmount) || 0

    if (Math.abs(expectedTotal - actualTotal) > 0.01) {
      errors.push('总金额计算不正确')
    }

    return errors
  }

  /**
   * 验证项目奖金数据
   */
  static validateProjectBonusData(data) {
    const errors = []
    
    if (!data) {
      errors.push('项目奖金数据不能为空')
      return errors
    }

    if (!data.projectId) {
      errors.push('项目ID不能为空')
    }

    if (!data.period) {
      errors.push('期间不能为空')
    }

    if (!data.totalAmount || parseFloat(data.totalAmount) <= 0) {
      errors.push('奖金总额必须大于0')
    }

    if (data.profitRatio !== undefined) {
      const ratio = parseFloat(data.profitRatio)
      if (isNaN(ratio) || ratio < 0 || ratio > 1) {
        errors.push('利润比例必须在0-1之间')
      }
    }

    return errors
  }

  /**
   * 验证计算参数的边界情况
   */
  static validateCalculationEdgeCases(params) {
    const warnings = []
    
    // 检查是否有极值
    if (params.totalEmployees > 1000) {
      warnings.push('员工数量较大，计算可能耗时较长')
    }

    if (params.totalAmount > 10000000) {
      warnings.push('奖金总额较大，请确认数据正确性')
    }

    if (params.averageScore && params.averageScore < 0.3) {
      warnings.push('平均得分较低，可能影响分配结果')
    }

    if (params.scoreVariance && params.scoreVariance > 0.5) {
      warnings.push('得分差异较大，请检查计算逻辑')
    }

    return warnings
  }
}

module.exports = CalculationValidator