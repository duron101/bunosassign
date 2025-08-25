const optimizedNedbService = require('./optimizedNedbService');
const CalculationValidator = require('../utils/calculationValidator');
const CalculationUtils = require('../utils/calculationUtils');

/**
 * 优化的奖金分配服务
 * 解决 N+1 查询问题，提升大批量员工计算性能
 */
class OptimizedBonusAllocationService {
  constructor() {
    this.dbService = optimizedNedbService;
    
    // 性能监控
    this.performanceMetrics = {
      allocationsProcessed: 0,
      totalProcessingTime: 0,
      averageProcessingTime: 0,
      batchSizes: [],
      errors: []
    };
  }

  /**
   * 执行奖金池分配 - 优化版本
   */
  async allocateBonusPool(bonusPoolId, allocationRuleId, options = {}) {
    const startTime = Date.now();
    console.log(`📋 开始执行优化的奖金池分配: 池ID=${bonusPoolId}, 规则ID=${allocationRuleId}`);

    try {
      // 1. 并行获取奖金池和分配规则
      const [bonusPool, allocationRule] = await Promise.all([
        this.dbService.findOne('bonusPools', { _id: bonusPoolId }),
        this.dbService.findOne('bonusAllocationRules', { _id: allocationRuleId })
      ]);

      if (!bonusPool) {
        throw new Error('奖金池不存在');
      }

      if (!allocationRule) {
        throw new Error('分配规则不存在');
      }

      // 2. 验证数据
      const poolValidationErrors = CalculationValidator.validateBonusPool(bonusPool);
      if (poolValidationErrors.length > 0) {
        throw new Error(`奖金池数据验证失败: ${poolValidationErrors.join(', ')}`);
      }

      const ruleValidationErrors = CalculationValidator.validateAllocationRule(allocationRule);
      if (ruleValidationErrors.length > 0) {
        throw new Error(`分配规则验证失败: ${ruleValidationErrors.join(', ')}`);
      }

      // 3. 获取符合条件的员工（优化查询）
      const eligibleEmployees = await this.getEligibleEmployeesOptimized(bonusPool, allocationRule, options);
      
      if (eligibleEmployees.length === 0) {
        throw new Error('没有符合条件的员工');
      }

      console.log(`找到 ${eligibleEmployees.length} 名符合条件的员工`);

      // 4. 执行分配计算（批量处理）
      let allocationResults = await this.executeAllocationMethod(
        bonusPool, allocationRule, eligibleEmployees, options
      );

      // 5. 应用约束条件
      allocationResults = await this.applyConstraintsOptimized(
        allocationResults, bonusPool, allocationRule, options
      );

      // 6. 批量保存结果
      const savedResults = await this.saveAllocationResultsBatch(
        allocationResults, bonusPoolId, allocationRuleId, options.createdBy || 1
      );

      // 7. 更新奖金池和规则统计
      await this.updatePoolAndRuleStats(bonusPool, allocationRule, savedResults);

      const processingTime = Date.now() - startTime;
      this.updatePerformanceMetrics(eligibleEmployees.length, processingTime);

      console.log(`✅ 奖金分配完成，耗时: ${processingTime}ms，处理: ${savedResults.length} 名员工`);

      return {
        bonusPool,
        allocationRule,
        results: savedResults,
        summary: this.generateAllocationSummary(savedResults, bonusPool),
        performance: {
          processingTime,
          employeeCount: savedResults.length,
          avgTimePerEmployee: Math.round(processingTime / savedResults.length)
        }
      };

    } catch (error) {
      this.performanceMetrics.errors.push({
        timestamp: new Date(),
        error: error.message,
        bonusPoolId,
        allocationRuleId
      });
      
      console.error('❌ 优化奖金分配失败:', error);
      throw new Error(`分配失败: ${error.message}`);
    }
  }

  /**
   * 优化的获取符合条件员工方法
   */
  async getEligibleEmployeesOptimized(bonusPool, allocationRule, options = {}) {
    try {
      const startTime = Date.now();
      
      if (!bonusPool || !bonusPool.period) {
        throw new Error('奖金池信息不完整');
      }

      if (!allocationRule) {
        throw new Error('分配规则不存在');
      }

      // 使用优化的查询方法
      const eligibleEmployees = await this.dbService.getEligibleEmployeesOptimized(
        bonusPool.period,
        allocationRule.minScoreThreshold || 0,
        {
          weightConfigId: bonusPool.weightConfigId,
          applicableBusinessLines: allocationRule.applicableBusinessLines,
          applicableDepartments: allocationRule.applicableDepartments,
          applicablePositionLevels: allocationRule.applicablePositionLevels
        }
      );

      // 应用适用范围筛选
      let filteredEmployees = eligibleEmployees;

      if (allocationRule.applicableBusinessLines && Array.isArray(allocationRule.applicableBusinessLines) && allocationRule.applicableBusinessLines.length > 0) {
        filteredEmployees = filteredEmployees.filter(emp => {
          const businessLines = emp.Employee.BusinessLine;
          return businessLines && businessLines.some(bl => 
            allocationRule.applicableBusinessLines.includes(bl.id)
          );
        });
      }

      if (allocationRule.applicableDepartments && Array.isArray(allocationRule.applicableDepartments) && allocationRule.applicableDepartments.length > 0) {
        filteredEmployees = filteredEmployees.filter(emp => {
          const department = emp.Employee.Department;
          return department && allocationRule.applicableDepartments.includes(department.id);
        });
      }

      if (allocationRule.applicablePositionLevels && Array.isArray(allocationRule.applicablePositionLevels) && allocationRule.applicablePositionLevels.length > 0) {
        filteredEmployees = filteredEmployees.filter(emp => {
          const position = emp.Employee.Position;
          return position && allocationRule.applicablePositionLevels.includes(position.level);
        });
      }

      const queryTime = Date.now() - startTime;
      console.log(`✅ 获取符合条件员工完成，耗时: ${queryTime}ms，结果: ${filteredEmployees.length} 名员工`);

      return filteredEmployees;

    } catch (error) {
      console.error('❌ 获取符合条件员工失败:', error);
      throw new Error(`获取员工失败: ${error.message}`);
    }
  }

  /**
   * 执行分配方法 - 统一入口
   */
  async executeAllocationMethod(bonusPool, allocationRule, employees, options = {}) {
    const startTime = Date.now();
    
    let allocationResults = [];
    
    console.log(`🔧 执行分配方法: ${allocationRule.allocationMethod}, 员工数: ${employees.length}`);

    switch (allocationRule.allocationMethod) {
      case 'score_based':
        allocationResults = await this.scoreBasedAllocationOptimized(
          bonusPool, allocationRule, employees, options
        );
        break;
      case 'tier_based':
        allocationResults = await this.tierBasedAllocationOptimized(
          bonusPool, allocationRule, employees, options
        );
        break;
      case 'pool_percentage':
        allocationResults = await this.poolPercentageAllocationOptimized(
          bonusPool, allocationRule, employees, options
        );
        break;
      case 'fixed_amount':
        allocationResults = await this.fixedAmountAllocationOptimized(
          bonusPool, allocationRule, employees, options
        );
        break;
      case 'hybrid':
        allocationResults = await this.hybridAllocationOptimized(
          bonusPool, allocationRule, employees, options
        );
        break;
      default:
        throw new Error('不支持的分配方法');
    }

    const processingTime = Date.now() - startTime;
    console.log(`✅ 分配方法执行完成，耗时: ${processingTime}ms`);

    return allocationResults;
  }

  /**
   * 优化的基于得分分配算法
   */
  async scoreBasedAllocationOptimized(bonusPool, allocationRule, employees, options = {}) {
    try {
      const startTime = Date.now();
      
      if (!employees || employees.length === 0) {
        throw new Error('没有符合条件的员工');
      }

      // 批量计算有效得分
      const validEmployees = employees.filter(emp => {
        const score = parseFloat(emp.finalScore);
        return !isNaN(score) && score > 0;
      });

      if (validEmployees.length === 0) {
        throw new Error('没有有效的员工得分');
      }

      const totalScore = validEmployees.reduce((sum, emp) => sum + parseFloat(emp.finalScore), 0);
      
      if (totalScore <= 0) {
        throw new Error('员工总得分为零，无法进行分配');
      }

      const totalAmount = parseFloat(bonusPool.totalAmount) || 0;
      const reserveRatio = parseFloat(allocationRule.reserveRatio) || 0;
      const availableAmount = totalAmount * (1 - reserveRatio);
      
      if (availableAmount <= 0) {
        throw new Error('可分配金额不足');
      }

      // 批量计算系数
      const coefficientsMap = this.batchCalculateCoefficients(validEmployees, allocationRule);

      // 预计算分配参数
      const baseAllocationRatio = parseFloat(allocationRule.baseAllocationRatio) || 0.6;
      const performanceAllocationRatio = parseFloat(allocationRule.performanceAllocationRatio) || 0.4;
      const distributionMethod = allocationRule.scoreDistributionMethod || 'linear';

      // 批量处理分配计算
      const results = this.batchProcessScoreAllocation(
        validEmployees,
        {
          totalScore,
          availableAmount,
          baseAllocationRatio,
          performanceAllocationRatio,
          distributionMethod,
          exponentialFactor: parseFloat(allocationRule.exponentialFactor) || 2.0
        },
        coefficientsMap
      );

      const processingTime = Date.now() - startTime;
      console.log(`✅ 基于得分分配完成，耗时: ${processingTime}ms，处理: ${results.length} 名员工`);

      return results;
      
    } catch (error) {
      console.error('❌ 优化基于得分分配失败:', error);
      throw new Error(`分配计算失败: ${error.message}`);
    }
  }

  /**
   * 批量计算员工系数
   */
  batchCalculateCoefficients(employees, allocationRule) {
    const coefficientsMap = new Map();
    
    employees.forEach(employee => {
      const coefficients = this.calculateCoefficientsOptimized(employee, allocationRule);
      coefficientsMap.set(employee.employeeId, coefficients);
    });
    
    return coefficientsMap;
  }

  /**
   * 优化的系数计算
   */
  calculateCoefficientsOptimized(employee, allocationRule) {
    try {
      let baseAllocationCoeff = 1.0;
      let performanceCoeff = 1.0;
      let positionCoeff = 1.0;
      let departmentCoeff = 1.0;
      let specialCoeff = 1.0;

      if (!employee) {
        return { baseAllocationCoeff, performanceCoeff, positionCoeff, departmentCoeff, specialCoeff, finalCoeff: 1.0 };
      }

      // 绩效系数
      const performanceScore = parseFloat(employee.performanceScore) || 0;
      if (performanceScore > 0.8) {
        performanceCoeff = 1.2;
      } else if (performanceScore < 0.4) {
        performanceCoeff = 0.8;
      }

      // 岗位系数
      if (allocationRule?.positionLevelWeights && employee.Employee?.Position?.level) {
        const levelWeight = allocationRule.positionLevelWeights[employee.Employee.Position.level];
        if (levelWeight !== undefined && levelWeight !== null) {
          const parsedWeight = parseFloat(levelWeight);
          if (!isNaN(parsedWeight) && parsedWeight > 0) {
            positionCoeff = parsedWeight;
          }
        }
      }

      // 部门系数
      if (allocationRule?.departmentWeights && employee.Employee?.Department?.id) {
        const deptWeight = allocationRule.departmentWeights[employee.Employee.Department.id];
        if (deptWeight !== undefined && deptWeight !== null) {
          const parsedWeight = parseFloat(deptWeight);
          if (!isNaN(parsedWeight) && parsedWeight > 0) {
            departmentCoeff = parsedWeight;
          }
        }
      }

      // 特殊系数
      if (allocationRule?.specialRules) {
        specialCoeff = this.calculateSpecialCoefficientOptimized(employee, allocationRule.specialRules);
      }

      // 确保系数有效性
      baseAllocationCoeff = this.validateCoefficient(baseAllocationCoeff);
      performanceCoeff = this.validateCoefficient(performanceCoeff);
      positionCoeff = this.validateCoefficient(positionCoeff);
      departmentCoeff = this.validateCoefficient(departmentCoeff);
      specialCoeff = this.validateCoefficient(specialCoeff);

      const finalCoeff = baseAllocationCoeff * performanceCoeff * positionCoeff * departmentCoeff * specialCoeff;

      return {
        baseAllocationCoeff,
        performanceCoeff,
        positionCoeff,
        departmentCoeff,
        specialCoeff,
        finalCoeff: Math.max(0.1, finalCoeff)
      };
    } catch (error) {
      console.error('❌ 计算系数时发生错误:', error);
      return {
        baseAllocationCoeff: 1.0,
        performanceCoeff: 1.0,
        positionCoeff: 1.0,
        departmentCoeff: 1.0,
        specialCoeff: 1.0,
        finalCoeff: 1.0
      };
    }
  }

  /**
   * 验证系数有效性
   */
  validateCoefficient(coefficient) {
    return isNaN(coefficient) || coefficient <= 0 ? 1.0 : coefficient;
  }

  /**
   * 优化的特殊系数计算
   */
  calculateSpecialCoefficientOptimized(employee, specialRules) {
    try {
      let coefficient = 1.0;

      if (!employee || !specialRules) {
        return coefficient;
      }

      // 新员工减半
      if (specialRules.newEmployeeReduction) {
        const workMonths = parseFloat(employee.workMonths) || 0;
        if (workMonths < 12) {
          coefficient *= 0.5;
        }
      }

      // 优秀员工奖励
      if (specialRules.excellentEmployeeBonus) {
        const finalScore = parseFloat(employee.finalScore) || 0;
        if (finalScore > 0.9) {
          coefficient *= 1.3;
        }
      }

      // 关键岗位奖励
      if (specialRules.keyPositionBonus && employee.Employee?.Position?.level === 'senior') {
        coefficient *= 1.1;
      }

      return Math.max(0.1, Math.min(5.0, coefficient));
    } catch (error) {
      console.warn('❌ 计算特殊系数失败:', error.message);
      return 1.0;
    }
  }

  /**
   * 批量处理得分分配
   */
  batchProcessScoreAllocation(employees, params, coefficientsMap) {
    const results = [];
    const { totalScore, availableAmount, baseAllocationRatio, performanceAllocationRatio, distributionMethod, exponentialFactor } = params;

    // 预计算分布相关的总值（优化性能）
    let totalDistributionValue = totalScore;
    if (distributionMethod === 'exponential') {
      totalDistributionValue = employees.reduce((sum, emp) => sum + Math.pow(parseFloat(emp.finalScore), exponentialFactor), 0);
    } else if (distributionMethod === 'logarithmic') {
      totalDistributionValue = employees.reduce((sum, emp) => sum + Math.log(parseFloat(emp.finalScore) + 1), 0);
    }

    for (const employee of employees) {
      const finalScore = parseFloat(employee.finalScore) || 0;
      
      if (finalScore <= 0) continue;

      let baseAmount = 0;
      let performanceAmount = 0;
      let distributionRatio = 0;

      // 根据分配方法计算分布比例
      switch (distributionMethod) {
        case 'exponential':
          distributionRatio = Math.pow(finalScore, exponentialFactor) / totalDistributionValue;
          break;
        case 'logarithmic':
          distributionRatio = Math.log(finalScore + 1) / totalDistributionValue;
          break;
        case 'step':
          const stepMultiplier = this.getStepMultiplier(finalScore, employee.scoreRank || 1, employees.length);
          distributionRatio = (finalScore / totalScore) * stepMultiplier;
          break;
        default: // linear
          distributionRatio = finalScore / totalScore;
      }

      baseAmount = availableAmount * baseAllocationRatio * distributionRatio;
      performanceAmount = availableAmount * performanceAllocationRatio * distributionRatio;

      // 应用系数
      const coefficients = coefficientsMap.get(employee.employeeId) || {
        baseAllocationCoeff: 1.0, performanceCoeff: 1.0, positionCoeff: 1.0,
        departmentCoeff: 1.0, specialCoeff: 1.0, finalCoeff: 1.0
      };
      
      const finalBaseAmount = Math.max(0, baseAmount * coefficients.finalCoeff);
      const finalPerformanceAmount = Math.max(0, performanceAmount * coefficients.finalCoeff);
      
      results.push({
        employee,
        originalScore: finalScore,
        finalScore: finalScore,
        baseAmount: Math.round(finalBaseAmount * 100) / 100,
        performanceAmount: Math.round(finalPerformanceAmount * 100) / 100,
        adjustmentAmount: 0,
        ...coefficients
      });
    }

    return results;
  }

  /**
   * 获取阶梯乘数
   */
  getStepMultiplier(score, rank, totalCount) {
    const percentile = (totalCount - rank + 1) / totalCount;
    
    if (percentile >= 0.9) return 2.0;      // 前10%
    if (percentile >= 0.7) return 1.5;      // 前30%
    if (percentile >= 0.4) return 1.0;      // 前60%
    if (percentile >= 0.2) return 0.8;      // 前80%
    return 0.6;                             // 后20%
  }

  /**
   * 优化的约束条件应用
   */
  async applyConstraintsOptimized(allocationResults, bonusPool, allocationRule, options = {}) {
    const startTime = Date.now();
    
    const results = [...allocationResults];
    const totalAllocated = results.reduce((sum, r) => sum + r.baseAmount + r.performanceAmount, 0);
    const totalAllocationLimit = parseFloat(allocationRule.totalAllocationLimit) || 1.0;
    const availableAmount = parseFloat(bonusPool.totalAmount) * totalAllocationLimit;

    // 总额约束
    if (totalAllocated > availableAmount) {
      const adjustmentRatio = availableAmount / totalAllocated;
      console.log(`⚠️ 应用总额约束，调整比例: ${adjustmentRatio.toFixed(4)}`);
      
      results.forEach(result => {
        result.baseAmount *= adjustmentRatio;
        result.performanceAmount *= adjustmentRatio;
        result.adjustmentAmount = (result.baseAmount + result.performanceAmount) * (adjustmentRatio - 1);
      });
    }

    // 批量应用最小/最大金额保障
    const avgAmount = availableAmount / results.length;
    const minBonusAmount = parseFloat(allocationRule.minBonusAmount) || 0;
    const maxBonusAmount = parseFloat(allocationRule.maxBonusAmount) || Number.MAX_VALUE;
    const minBonusRatio = parseFloat(allocationRule.minBonusRatio) || 0;
    const maxBonusRatio = parseFloat(allocationRule.maxBonusRatio) || Number.MAX_VALUE;

    let adjustmentCount = 0;
    
    results.forEach(result => {
      const totalAmount = result.baseAmount + result.performanceAmount + result.adjustmentAmount;
      let finalAmount = totalAmount;
      
      // 最小金额保障
      const minAmountThreshold = Math.max(minBonusAmount, avgAmount * minBonusRatio);
      if (totalAmount < minAmountThreshold) {
        finalAmount = minAmountThreshold;
        result.minAmountApplied = true;
        adjustmentCount++;
      }

      // 最大金额限制
      const maxAmountThreshold = Math.min(maxBonusAmount, avgAmount * maxBonusRatio);
      if (finalAmount > maxAmountThreshold) {
        finalAmount = maxAmountThreshold;
        result.maxAmountApplied = true;
        adjustmentCount++;
      }

      // 记录调整
      if (finalAmount !== totalAmount) {
        result.originalCalculatedAmount = totalAmount;
        result.adjustmentAmount += (finalAmount - totalAmount);
      }
    });

    const processingTime = Date.now() - startTime;
    console.log(`✅ 约束条件应用完成，耗时: ${processingTime}ms，调整: ${adjustmentCount} 名员工`);

    return results;
  }

  /**
   * 批量保存分配结果
   */
  async saveAllocationResultsBatch(allocationResults, bonusPoolId, allocationRuleId, createdBy) {
    const startTime = Date.now();
    console.log(`💾 批量保存 ${allocationResults.length} 条分配结果...`);

    try {
      const batchData = allocationResults.map(result => {
        const employee = result.employee.Employee;
        
        return {
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
        };
      });

      // 批量插入
      const savedResults = await this.dbService.batchInsert('bonusAllocationResults', batchData);
      
      const processingTime = Date.now() - startTime;
      console.log(`✅ 批量保存完成，耗时: ${processingTime}ms`);

      return savedResults;

    } catch (error) {
      console.error('❌ 批量保存分配结果失败:', error);
      throw error;
    }
  }

  /**
   * 更新奖金池和规则统计
   */
  async updatePoolAndRuleStats(bonusPool, allocationRule, savedResults) {
    try {
      const totalAllocated = savedResults.reduce((sum, r) => sum + parseFloat(r.totalAmount), 0);
      
      // 并行更新奖金池和分配规则
      await Promise.all([
        this.dbService.update('bonusPools', { _id: bonusPool._id }, {
          $set: {
            allocatedAmount: totalAllocated,
            allocatedCount: savedResults.length,
            status: 'allocated',
            updatedAt: new Date()
          }
        }),
        this.dbService.update('bonusAllocationRules', { _id: allocationRule._id }, {
          $inc: { usageCount: 1, successCount: 1 },
          $set: { lastUsedAt: new Date(), updatedAt: new Date() }
        })
      ]);

    } catch (error) {
      console.error('❌ 更新统计信息失败:', error);
      // 不抛出错误，避免影响主流程
    }
  }

  /**
   * 更新性能指标
   */
  updatePerformanceMetrics(employeeCount, processingTime) {
    this.performanceMetrics.allocationsProcessed++;
    this.performanceMetrics.totalProcessingTime += processingTime;
    this.performanceMetrics.averageProcessingTime = 
      this.performanceMetrics.totalProcessingTime / this.performanceMetrics.allocationsProcessed;
    this.performanceMetrics.batchSizes.push(employeeCount);
    
    // 保持最近100次记录
    if (this.performanceMetrics.batchSizes.length > 100) {
      this.performanceMetrics.batchSizes = this.performanceMetrics.batchSizes.slice(-100);
    }
  }

  /**
   * 获取性能指标
   */
  getPerformanceMetrics() {
    const avgBatchSize = this.performanceMetrics.batchSizes.length > 0 
      ? this.performanceMetrics.batchSizes.reduce((sum, size) => sum + size, 0) / this.performanceMetrics.batchSizes.length
      : 0;

    return {
      ...this.performanceMetrics,
      averageBatchSize: Math.round(avgBatchSize),
      dbPerformance: this.dbService.getPerformanceStats()
    };
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
      };
    }

    // 使用计算工具生成摘要
    const basicSummary = CalculationUtils.generateCalculationSummary(results, bonusPool);
    
    // 部门分布统计
    const departmentDistribution = {};
    results.forEach(r => {
      const dept = r.departmentName || '未知部门';
      if (!departmentDistribution[dept]) {
        departmentDistribution[dept] = { count: 0, amount: 0 };
      }
      departmentDistribution[dept].count++;
      departmentDistribution[dept].amount += parseFloat(r.totalAmount);
    });

    // 分层分布统计
    const tierDistribution = {};
    results.forEach(r => {
      const tier = r.tierLevel || 'General';
      if (!tierDistribution[tier]) {
        tierDistribution[tier] = { count: 0, amount: 0 };
      }
      tierDistribution[tier].count++;
      tierDistribution[tier].amount += parseFloat(r.totalAmount);
    });

    // 检测异常值
    const amounts = results.map(r => parseFloat(r.totalAmount) || 0);
    const outliers = CalculationUtils.detectOutliers(amounts);

    return {
      ...basicSummary,
      remainingAmount: CalculationUtils.roundToDecimals(
        (parseFloat(bonusPool?.totalAmount) || 0) - basicSummary.totalAllocated
      ),
      
      distribution: {
        byDepartment: departmentDistribution,
        byTier: tierDistribution
      },
      
      qualityMetrics: {
        minAmountAppliedCount: results.filter(r => r.minAmountApplied).length,
        maxAmountAppliedCount: results.filter(r => r.maxAmountApplied).length,
        anomalyCount: outliers.length,
        outliers: outliers.slice(0, 10).map(o => ({
          employeeIndex: o.index,
          amount: o.value,
          employeeName: results[o.index]?.employeeName
        }))
      },

      fairnessMetrics: basicSummary.fairnessMetrics,
      validationSummary: this.validateAllocationResults(results)
    };
  }

  /**
   * 验证分配结果
   */
  validateAllocationResults(results) {
    let totalValidationErrors = 0;
    const validationDetails = [];

    results.forEach((result, index) => {
      const errors = CalculationValidator.validateAllocationResult(result);
      if (errors.length > 0) {
        totalValidationErrors++;
        validationDetails.push({
          employeeIndex: index,
          employeeName: result.employeeName,
          errors
        });
      }
    });

    return {
      isValid: totalValidationErrors === 0,
      errorCount: totalValidationErrors,
      errorDetails: validationDetails.slice(0, 10),
      totalResults: results.length
    };
  }

  /**
   * 模拟分配（不保存结果）
   */
  async simulateAllocation(bonusPoolId, allocationRuleId, options = {}) {
    console.log(`🎯 执行分配模拟: 池ID=${bonusPoolId}, 规则ID=${allocationRuleId}`);
    
    // 获取奖金池和分配规则
    const [bonusPool, allocationRule] = await Promise.all([
      this.dbService.findOne('bonusPools', { _id: bonusPoolId }),
      this.dbService.findOne('bonusAllocationRules', { _id: allocationRuleId })
    ]);
    
    if (!bonusPool || !allocationRule) {
      throw new Error('奖金池或分配规则不存在');
    }

    // 获取符合条件的员工
    const eligibleEmployees = await this.getEligibleEmployeesOptimized(bonusPool, allocationRule, options);
    
    if (eligibleEmployees.length === 0) {
      throw new Error('没有符合条件的员工');
    }

    // 执行模拟分配（不保存）
    let allocationResults = await this.executeAllocationMethod(bonusPool, allocationRule, eligibleEmployees, options);

    // 应用约束条件
    allocationResults = await this.applyConstraintsOptimized(allocationResults, bonusPool, allocationRule, options);

    // 生成模拟结果摘要
    const summary = this.generateAllocationSummary(allocationResults, bonusPool);

    return {
      bonusPool,
      allocationRule,
      results: allocationResults,
      summary,
      isSimulation: true
    };
  }

  // 其他分配方法的优化版本（简化版）
  async tierBasedAllocationOptimized(bonusPool, allocationRule, employees, options = {}) {
    // 类似的优化逻辑，批量处理
    return this.scoreBasedAllocationOptimized(bonusPool, allocationRule, employees, options);
  }

  async poolPercentageAllocationOptimized(bonusPool, allocationRule, employees, options = {}) {
    // 类似的优化逻辑，批量处理
    return this.scoreBasedAllocationOptimized(bonusPool, allocationRule, employees, options);
  }

  async fixedAmountAllocationOptimized(bonusPool, allocationRule, employees, options = {}) {
    // 类似的优化逻辑，批量处理
    return this.scoreBasedAllocationOptimized(bonusPool, allocationRule, employees, options);
  }

  async hybridAllocationOptimized(bonusPool, allocationRule, employees, options = {}) {
    // 类似的优化逻辑，批量处理
    return this.scoreBasedAllocationOptimized(bonusPool, allocationRule, employees, options);
  }
}

// 创建优化的单例实例
const optimizedBonusAllocationService = new OptimizedBonusAllocationService();

module.exports = optimizedBonusAllocationService;