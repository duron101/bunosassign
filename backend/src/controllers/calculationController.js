const { BonusPool, Employee, Department, Position, BusinessLine } = require('../models')
const logger = require('../utils/logger')
const bonusAllocationService = require('../services/bonusAllocationService')
const threeDimensionalCalculationService = require('../services/threeDimensionalCalculationService')
const projectBonusService = require('../services/projectBonusService')
const personalBonusService = require('../services/personalBonusService')

class CalculationController {
  // 获取奖金池列表
  async getBonusPools(req, res, next) {
    try {
      const { 
        page = 1, 
        pageSize = 20, 
        status 
      } = req.query
      
      const offset = (page - 1) * pageSize
      const where = {}
      
      if (status) where.status = status
      
      const { count, rows } = await BonusPool.findAndCountAll({
        where,
        offset,
        limit: parseInt(pageSize),
        order: [['createdAt', 'DESC']]
      })

      res.json({
        code: 200,
        data: {
          bonusPools: rows,
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
      logger.error('Get bonus pools error:', error)
      next(error)
    }
  }

  // 获取奖金池详情
  async getBonusPoolDetail(req, res, next) {
    try {
      const { id } = req.params
      
      const bonusPool = await BonusPool.findByPk(id)
      if (!bonusPool) {
        return res.status(404).json({
          code: 404,
          message: '奖金池不存在',
          data: null
        })
      }

      res.json({
        code: 200,
        data: bonusPool,
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get bonus pool detail error:', error)
      next(error)
    }
  }

  // 更新奖金池
  async updateBonusPool(req, res, next) {
    try {
      const { id } = req.params
      const updates = req.body
      
      const bonusPool = await BonusPool.findByPk(id)
      if (!bonusPool) {
        return res.status(404).json({
          code: 404,
          message: '奖金池不存在',
          data: null
        })
      }

      // 重新计算相关金额
      if (updates.totalProfit || updates.poolRatio) {
        const totalProfit = updates.totalProfit || bonusPool.totalProfit
        const poolRatio = updates.poolRatio || bonusPool.poolRatio
        const reserveRatio = updates.reserveRatio || bonusPool.reserveRatio
        const specialRatio = updates.specialRatio || bonusPool.specialRatio
        
        updates.poolAmount = totalProfit * poolRatio
        updates.distributableAmount = updates.poolAmount * (1 - reserveRatio - specialRatio)
      }

      await bonusPool.update(updates)
      
      logger.info(`奖金池更新成功: ${bonusPool.period}`)

      res.json({
        code: 200,
        data: bonusPool,
        message: '更新成功'
      })

    } catch (error) {
      logger.error('Update bonus pool error:', error)
      next(error)
    }
  }

  // 删除奖金池
  async deleteBonusPool(req, res, next) {
    try {
      const { id } = req.params
      
      const bonusPool = await BonusPool.findByPk(id)
      if (!bonusPool) {
        return res.status(404).json({
          code: 404,
          message: '奖金池不存在',
          data: null
        })
      }

      if (bonusPool.status === 'allocated') {
        return res.status(400).json({
          code: 400,
          message: '已分配的奖金池不能删除',
          data: null
        })
      }

      await bonusPool.destroy()
      
      logger.info(`奖金池删除成功: ${bonusPool.period}`)

      res.json({
        code: 200,
        data: null,
        message: '删除成功'
      })

    } catch (error) {
      logger.error('Delete bonus pool error:', error)
      next(error)
    }
  }

  // 创建奖金池
  async createBonusPool(req, res, next) {
    try {
      const { 
        period, 
        totalProfit, 
        poolRatio, 
        reserveRatio = 0.02, 
        specialRatio = 0.03,
        lineWeights 
      } = req.body

      // 检查期间是否已存在
      const existingPool = await BonusPool.findOne({ where: { period } })
      if (existingPool) {
        return res.status(400).json({
          code: 400,
          message: '该期间的奖金池已存在',
          data: null
        })
      }

      // 计算奖金池金额
      const poolAmount = totalProfit * poolRatio
      const distributableAmount = poolAmount * (1 - reserveRatio - specialRatio)

      const bonusPool = await BonusPool.create({
        period,
        totalProfit,
        poolRatio,
        poolAmount,
        reserveRatio,
        specialRatio,
        distributableAmount,
        status: 'draft',
        createdBy: req.user.id
      })

      logger.info(`奖金池创建成功: ${period}`)

      res.json({
        code: 200,
        data: {
          id: bonusPool.id,
          period: bonusPool.period,
          poolAmount: bonusPool.poolAmount,
          distributableAmount: bonusPool.distributableAmount
        },
        message: '创建成功'
      })

    } catch (error) {
      logger.error('Create bonus pool error:', error)
      next(error)
    }
  }

  // 执行奖金计算
  async calculate(req, res, next) {
    try {
      const { poolId, allocationRuleId, calculationType = 'three_dimensional' } = req.body

      // 验证输入参数
      if (!poolId) {
        return res.status(400).json({
          code: 400,
          message: '奖金池ID不能为空',
          data: null
        })
      }

      const bonusPool = await BonusPool.findByPk(poolId)
      if (!bonusPool) {
        return res.status(404).json({
          code: 404,
          message: '奖金池不存在',
          data: null
        })
      }

      // 检查奖金池状态
      if (bonusPool.status === 'allocated') {
        return res.status(400).json({
          code: 400,
          message: '该奖金池已经完成分配，无法重复计算',
          data: null
        })
      }

      // 生成计算任务ID
      const taskId = `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const userId = req.user?.id || 1

      logger.info(`奖金计算任务启动: ${taskId}`, {
        poolId,
        allocationRuleId,
        calculationType,
        userId
      })

      // 启动异步计算任务
      this.executeCalculation(taskId, poolId, allocationRuleId, calculationType, userId)
        .catch(error => {
          logger.error(`计算任务 ${taskId} 执行失败:`, error)
        })

      res.json({
        code: 200,
        data: {
          taskId,
          poolId,
          status: 'processing',
          startTime: new Date().toISOString()
        },
        message: '计算任务已提交'
      })

    } catch (error) {
      logger.error('Start calculation error:', error)
      next(error)
    }
  }

  // 获取计算结果
  async getResult(req, res, next) {
    try {
      const { taskId } = req.params

      if (!taskId) {
        return res.status(400).json({
          code: 400,
          message: '任务ID不能为空',
          data: null
        })
      }

      // 从缓存或数据库中获取计算结果
      const result = this.getCalculationResult(taskId)
      
      if (!result) {
        return res.status(404).json({
          code: 404,
          message: '计算结果不存在或已过期',
          data: null
        })
      }

      res.json({
        code: 200,
        data: result,
        message: result.status === 'error' ? '计算失败' : 'success'
      })

    } catch (error) {
      logger.error('Get calculation result error:', error)
      next(error)
    }
  }

  // 模拟计算
  async simulate(req, res, next) {
    try {
      const { poolId, allocationRuleId, ...options } = req.body

      if (!poolId) {
        return res.status(400).json({
          code: 400,
          message: '奖金池ID不能为空',
          data: null
        })
      }

      const bonusPool = await BonusPool.findByPk(poolId)
      if (!bonusPool) {
        return res.status(404).json({
          code: 404,
          message: '奖金池不存在',
          data: null
        })
      }

      logger.info(`开始模拟计算: 奖金池${poolId}, 期间${bonusPool.period}`)

      // 使用真实的模拟计算服务
      let simulationResult
      
      if (allocationRuleId) {
        // 使用奖金分配服务进行模拟
        simulationResult = await bonusAllocationService.simulateAllocation(
          poolId, 
          allocationRuleId, 
          {
            ...options,
            createdBy: req.user?.id || 1
          }
        )
      } else {
        // 使用简化的模拟逻辑
        const totalAmount = parseFloat(bonusPool.distributableAmount) || parseFloat(bonusPool.poolAmount) || 0
        
        simulationResult = {
          status: 'completed',
          summary: {
            totalEmployees: 150,
            totalBonus: totalAmount * 0.95,
            averageBonus: (totalAmount * 0.95) / 150,
            maxBonus: (totalAmount * 0.95) / 150 * 3.5,
            minBonus: (totalAmount * 0.95) / 150 * 0.4
          },
          distribution: {
            byDepartment: {
              '实施': { count: 80, amount: totalAmount * 0.55 },
              '售前': { count: 30, amount: totalAmount * 0.20 },
              '市场': { count: 25, amount: totalAmount * 0.15 },
              '运营': { count: 15, amount: totalAmount * 0.10 }
            }
          },
          isSimulation: true
        }
      }

      logger.info(`模拟计算完成: ${bonusPool.period}`)

      res.json({
        code: 200,
        data: simulationResult,
        message: '模拟计算完成'
      })

    } catch (error) {
      logger.error('Simulate calculation error:', error)
      
      // 返回详细错误信息
      res.status(500).json({
        code: 500,
        message: `模拟计算失败: ${error.message}`,
        data: null,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    }
  }

  // 获取统计信息
  async getStatistics(req, res, next) {
    try {
      const totalPools = await BonusPool.count()
      const allocatedPools = await BonusPool.count({ where: { status: 'allocated' } })
      const totalAmountResult = await BonusPool.sum('poolAmount')
      const totalAmount = totalAmountResult || 0

      const statistics = {
        totalPools,
        allocatedPools,
        totalAmount,
        totalEmployees: 150 // 这里应该从实际数据库获取
      }

      res.json({
        code: 200,
        data: statistics,
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get statistics error:', error)
      next(error)
    }
  }

  // 导出结果
  async exportResult(req, res, next) {
    try {
      const { id } = req.params
      const { format = 'excel' } = req.query

      const bonusPool = await BonusPool.findByPk(id)
      if (!bonusPool) {
        return res.status(404).json({
          code: 404,
          message: '奖金池不存在',
          data: null
        })
      }

      if (bonusPool.status === 'draft') {
        return res.status(400).json({
          code: 400,
          message: '草稿状态的奖金池无法导出',
          data: null
        })
      }

      // 这里应该生成实际的导出文件
      logger.info(`导出奖金池结果: ${bonusPool.period}, 格式: ${format}`)

      res.json({
        code: 200,
        data: {
          downloadUrl: `/exports/bonus-pool-${id}-${Date.now()}.${format}`,
          fileName: `奖金池-${bonusPool.period}.${format}`
        },
        message: '导出成功'
      })

    } catch (error) {
      logger.error('Export result error:', error)
      next(error)
    }
  }

  /**
   * 执行计算任务
   */
  async executeCalculation(taskId, poolId, allocationRuleId, calculationType, userId) {
    try {
      // 设置任务状态为处理中
      this.setCalculationResult(taskId, {
        status: 'processing',
        startTime: new Date(),
        progress: 0
      })

      let result
      
      switch (calculationType) {
        case 'three_dimensional':
          result = await this.executeThreeDimensionalCalculation(poolId, allocationRuleId, userId)
          break
        case 'project_bonus':
          result = await this.executeProjectBonusCalculation(poolId, userId)
          break
        case 'bonus_allocation':
          result = await this.executeBonusAllocation(poolId, allocationRuleId, userId)
          break
        default:
          throw new Error(`不支持的计算类型: ${calculationType}`)
      }

      // 设置任务状态为完成
      this.setCalculationResult(taskId, {
        status: 'completed',
        endTime: new Date(),
        progress: 100,
        result
      })

      logger.info(`计算任务完成: ${taskId}`)

    } catch (error) {
      logger.error(`计算任务失败: ${taskId}`, error)
      
      // 设置任务状态为错误
      this.setCalculationResult(taskId, {
        status: 'error',
        endTime: new Date(),
        progress: 0,
        error: error.message
      })
    }
  }

  /**
   * 执行三维计算
   */
  async executeThreeDimensionalCalculation(poolId, weightConfigId, userId) {
    // 获取奖金池信息
    const bonusPool = await BonusPool.findByPk(poolId)
    if (!bonusPool) {
      throw new Error('奖金池不存在')
    }

    // 获取所有需要计算的员工
    const employees = await Employee.findAll({
      where: { status: 'active' },
      include: ['Department', 'Position']
    })

    if (employees.length === 0) {
      throw new Error('没有有效的员工数据')
    }

    const employeeIds = employees.map(emp => emp.id)
    
    // 批量计算三维得分
    const calculationResults = await threeDimensionalCalculationService.batchCalculateScores(
      employeeIds,
      bonusPool.period,
      weightConfigId || bonusPool.weightConfigId,
      { createdBy: userId }
    )

    // 保存计算结果
    if (calculationResults.results.length > 0) {
      await threeDimensionalCalculationService.batchSaveResults(
        calculationResults.results,
        poolId,
        userId
      )

      // 计算排名
      await threeDimensionalCalculationService.calculateRankings(
        bonusPool.period,
        weightConfigId || bonusPool.weightConfigId
      )
    }

    return {
      summary: {
        totalEmployees: employees.length,
        calculatedEmployees: calculationResults.results.length,
        errorCount: calculationResults.errors.length
      },
      results: calculationResults.results,
      errors: calculationResults.errors
    }
  }

  /**
   * 执行项目奖金计算
   */
  async executeProjectBonusCalculation(poolId, userId) {
    const result = await projectBonusService.calculateProjectBonus(poolId)
    return result
  }

  /**
   * 执行奖金分配
   */
  async executeBonusAllocation(poolId, allocationRuleId, userId) {
    if (!allocationRuleId) {
      throw new Error('奖金分配规则ID不能为空')
    }

    const result = await bonusAllocationService.allocateBonusPool(
      poolId,
      allocationRuleId,
      { createdBy: userId }
    )
    return result
  }

  /**
   * 设置计算结果缓存
   */
  setCalculationResult(taskId, result) {
    if (!this.calculationResults) {
      this.calculationResults = new Map()
    }
    
    this.calculationResults.set(taskId, {
      ...result,
      updatedAt: new Date()
    })

    // 设置过期时间（30分钟）
    setTimeout(() => {
      this.calculationResults.delete(taskId)
    }, 30 * 60 * 1000)
  }

  /**
   * 获取计算结果缓存
   */
  getCalculationResult(taskId) {
    if (!this.calculationResults) {
      return null
    }
    return this.calculationResults.get(taskId)
  }

  /**
   * 复制奖金池
   */
  async copyBonusPool(req, res, next) {
    try {
      const { id } = req.params
      const { newPeriod } = req.body
      
      if (!newPeriod) {
        return res.status(400).json({
          code: 400,
          message: '新期间不能为空',
          data: null
        })
      }

      const sourcePool = await BonusPool.findByPk(id)
      if (!sourcePool) {
        return res.status(404).json({
          code: 404,
          message: '源奖金池不存在',
          data: null
        })
      }

      // 检查新期间是否已存在
      const existingPool = await BonusPool.findOne({
        where: { period: newPeriod }
      })
      
      if (existingPool) {
        return res.status(400).json({
          code: 400,
          message: '该期间已存在奖金池',
          data: null
        })
      }

      // 创建新的奖金池
      const newPool = await BonusPool.create({
        period: newPeriod,
        totalProfit: sourcePool.totalProfit,
        poolRatio: sourcePool.poolRatio,
        reserveRatio: sourcePool.reserveRatio,
        specialRatio: sourcePool.specialRatio,
        poolAmount: sourcePool.poolAmount,
        distributableAmount: sourcePool.distributableAmount,
        status: 'draft',
        weightConfigId: sourcePool.weightConfigId
      })

      res.json({
        code: 200,
        data: newPool,
        message: '奖金池复制成功'
      })

    } catch (error) {
      logger.error('Copy bonus pool error:', error)
      next(error)
    }
  }

  /**
   * 获取可分配员工列表
   */
  async getEligibleEmployees(req, res, next) {
    try {
      const { id } = req.params
      
      const bonusPool = await BonusPool.findByPk(id)
      if (!bonusPool) {
        return res.status(404).json({
          code: 404,
          message: '奖金池不存在',
          data: null
        })
      }

      // 获取活跃员工
      const employees = await Employee.findAll({
        where: { status: 'active' },
        include: [
          { model: Department, as: 'Department' },
          { model: Position, as: 'Position' }
        ]
      })

      res.json({
        code: 200,
        data: {
          employees,
          total: employees.length
        },
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get eligible employees error:', error)
      next(error)
    }
  }

  /**
   * 预览计算结果
   */
  async previewCalculation(req, res, next) {
    try {
      const { poolId, mode = 'full', departments, businessLines, minScoreThreshold = 0.6 } = req.body
      
      if (!poolId) {
        return res.status(400).json({
          code: 400,
          message: '奖金池ID不能为空',
          data: null
        })
      }

      const bonusPool = await BonusPool.findByPk(poolId)
      if (!bonusPool) {
        return res.status(404).json({
          code: 404,
          message: '奖金池不存在',
          data: null
        })
      }

      // 执行预览计算
      const result = await this.executeThreeDimensionalCalculation(
        poolId,
        req.user.id,
        null,
        { mode, departments, businessLines, minScoreThreshold }
      )

      res.json({
        code: 200,
        data: result,
        message: '预览计算完成'
      })

    } catch (error) {
      logger.error('Preview calculation error:', error)
      next(error)
    }
  }
}

module.exports = new CalculationController()