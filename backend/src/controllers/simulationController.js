const nedbService = require('../services/nedbService')
const logger = require('../utils/logger')

class SimulationController {
  // 根据业务线代码获取当前默认权重
  getLineCurrentWeight(code) {
    const defaultWeights = {
      'implementation': 0.55,  // 实施
      'presales': 0.20,        // 售前
      'marketing': 0.15,       // 市场
      'operation': 0.10        // 运营
    }
    return defaultWeights[code] || 0.25 // 默认平均权重
  }
  // 运行参数模拟
  async runParameterSimulation(req, res, next) {
    try {
      const {
        bonusPoolId,
        totalProfit,
        poolRatio,
        lineWeights,
        minBonusRatio,
        maxBonusRatio
      } = req.body

      console.log('📊 参数模拟请求:', { bonusPoolId, totalProfit, poolRatio, lineWeights })

      const bonusPool = await nedbService.findOne('bonusPools', { _id: bonusPoolId })
      if (!bonusPool) {
        return res.status(404).json({
          code: 404,
          message: '奖金池不存在',
          data: null
        })
      }

      // 获取所有业务线
      const businessLines = await nedbService.getBusinessLines()
      console.log('📋 业务线列表:', businessLines.length, '个业务线')

      // 使用新参数计算模拟结果
      const newPoolAmount = totalProfit * poolRatio
      const newDistributableAmount = newPoolAmount * 0.95 // 假设95%可分配

      // 动态生成各条线奖金变化对比
      const lineComparison = businessLines.map(line => {
        const lineId = line._id
        const currentWeight = this.getLineCurrentWeight(line.code) // 根据业务线代码获取当前权重
        const newWeight = lineWeights[lineId] || currentWeight
        
        const currentBonus = (bonusPool.distributableAmount || bonusPool.totalAmount * 0.95) * currentWeight
        const simulatedBonus = newDistributableAmount * newWeight
        
        return {
          lineId,
          lineName: line.name,
          currentBonus,
          simulatedBonus,
          change: currentBonus > 0 ? (simulatedBonus - currentBonus) / currentBonus : 0,
          changAmount: simulatedBonus - currentBonus
        }
      })

      // 计算总体变化
      const currentTotalAmount = bonusPool.distributableAmount || bonusPool.totalAmount * 0.95
      const totalBonusChange = currentTotalAmount > 0 ? (newDistributableAmount - currentTotalAmount) / currentTotalAmount : 0
      
      const simulationResult = {
        totalBonusChange,
        avgBonusChange: totalBonusChange * 0.9, // 假设人均变化略小于总体变化
        affectedEmployees: 150, // 模拟受影响员工数
        lineComparison
      }

      logger.info(`参数模拟完成: 奖金池${bonusPoolId}`)

      res.json({
        code: 200,
        data: simulationResult,
        message: '参数模拟完成'
      })

    } catch (error) {
      logger.error('Parameter simulation error:', error)
      next(error)
    }
  }

  // 保存模拟场景
  async saveScenario(req, res, next) {
    try {
      const {
        name,
        description,
        basePoolId,
        parameters,
        isPublic = false
      } = req.body

      if (!name) {
        return res.status(400).json({
          code: 400,
          message: '场景名称不能为空',
          data: null
        })
      }

      // 这里应该保存到数据库，暂时模拟
      const scenario = {
        id: Date.now(),
        name,
        description,
        basePoolId,
        parameters,
        isPublic,
        createdBy: req.user.id,
        createdAt: new Date().toISOString(),
        // 模拟计算结果
        totalBonus: 1500000,
        avgBonus: 10000,
        utilizationRate: 0.95
      }

      logger.info(`模拟场景创建: ${name}`)

      res.json({
        code: 200,
        data: scenario,
        message: '场景保存成功'
      })

    } catch (error) {
      logger.error('Save scenario error:', error)
      next(error)
    }
  }

  // 获取保存的场景列表
  async getScenarios(req, res, next) {
    try {
      const { page = 1, pageSize = 20, isPublic } = req.query

      // 模拟场景数据
      const scenarios = [
        {
          id: 1,
          name: '基准场景',
          description: '当前参数配置',
          totalBonus: 1350000,
          avgBonus: 9000,
          utilizationRate: 0.95,
          createdAt: new Date().toISOString(),
          isPublic: true
        },
        {
          id: 2,
          name: '激进场景',
          description: '提高奖金池比例至18%',
          totalBonus: 1620000,
          avgBonus: 10800,
          utilizationRate: 0.97,
          createdAt: new Date().toISOString(),
          isPublic: false
        },
        {
          id: 3,
          name: '保守场景',
          description: '降低奖金池比例至12%',
          totalBonus: 1080000,
          avgBonus: 7200,
          utilizationRate: 0.92,
          createdAt: new Date().toISOString(),
          isPublic: true
        }
      ]

      res.json({
        code: 200,
        data: {
          scenarios,
          pagination: {
            total: scenarios.length,
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            totalPages: Math.ceil(scenarios.length / pageSize)
          }
        },
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get scenarios error:', error)
      next(error)
    }
  }

  // 运行敏感性分析
  async runSensitivityAnalysis(req, res, next) {
    try {
      const {
        bonusPoolId,
        parameter,
        range,
        step,
        lineWeights = {},
        businessLines = []
      } = req.body

      console.log('📊 敏感性分析请求:', { bonusPoolId, parameter, range, step, businessLines: businessLines.length })

      const bonusPool = await nedbService.findOne('bonusPools', { _id: bonusPoolId })
      if (!bonusPool) {
        return res.status(404).json({
          code: 404,
          message: '奖金池不存在',
          data: null
        })
      }

      // 敏感性分析计算
      const rangeValue = parseFloat(range)
      const stepValue = parseFloat(step)
      const steps = Math.floor(rangeValue * 2 / stepValue) + 1

      const analysisData = []
      for (let i = 0; i < steps; i++) {
        const changeRatio = -rangeValue + i * stepValue
        let newValue, impact

        // 解析参数类型
        if (parameter.startsWith('lineWeight_')) {
          // 业务线权重敏感性分析
          const lineId = parameter.replace('lineWeight_', '')
          const currentWeight = lineWeights[lineId] || 0.25
          newValue = currentWeight * (1 + changeRatio)
          
          // 计算业务线权重变化对总奖金的影响
          // 假设该业务线占总奖金池的当前权重比例
          impact = changeRatio * currentWeight
        } else {
          // 传统参数敏感性分析
          switch (parameter) {
            case 'totalProfit':
              newValue = bonusPool.totalAmount * (1 + changeRatio)
              impact = changeRatio * (bonusPool.profitRatio || 0.15)
              break
            case 'poolRatio':
              newValue = (bonusPool.profitRatio || 0.15) * (1 + changeRatio)
              impact = changeRatio
              break
            default:
              impact = changeRatio * 0.8 // 默认影响系数
          }
        }

        analysisData.push({
          changeRatio,
          parameter: newValue,
          impact: 1 + impact
        })
      }

      // 计算敏感度系数
      const maxImpact = Math.max(...analysisData.map(d => Math.abs(d.impact - 1)))
      const coefficient = maxImpact / rangeValue

      // 确定参数显示名称
      let parameterDisplayName = '总奖金'
      if (parameter.startsWith('lineWeight_')) {
        const lineId = parameter.replace('lineWeight_', '')
        const line = businessLines.find(l => l.id === lineId)
        parameterDisplayName = line ? `${line.name}条线权重` : '条线权重'
      } else if (parameter === 'totalProfit') {
        parameterDisplayName = '公司利润'
      } else if (parameter === 'poolRatio') {
        parameterDisplayName = '奖金池比例'
      }

      const sensitivityResult = {
        parameter,
        parameterDisplayName,
        range: rangeValue,
        step: stepValue,
        data: analysisData,
        mostSensitive: {
          metric: parameterDisplayName,
          coefficient
        },
        recommendedRange: coefficient > 1.5 ? '±10%' : coefficient > 1.0 ? '±15%' : '±20%',
        riskLevel: coefficient > 1.5 ? '高' : coefficient > 1.0 ? '中' : '低'
      }

      logger.info(`敏感性分析完成: 奖金池${bonusPoolId}, 参数${parameter}`)

      res.json({
        code: 200,
        data: sensitivityResult,
        message: '敏感性分析完成'
      })

    } catch (error) {
      logger.error('Sensitivity analysis error:', error)
      next(error)
    }
  }

  // 获取历史分析数据
  async getHistoryAnalysis(req, res, next) {
    try {
      const { dateRange, metric = 'totalBonus' } = req.query

      if (!dateRange) {
        return res.status(400).json({
          code: 400,
          message: '请选择日期范围',
          data: null
        })
      }

      // 模拟历史数据
      const historyData = {
        metric,
        periods: ['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4', '2025-Q1'],
        values: [1200000, 1350000, 1280000, 1450000, 1420000],
        avgGrowthRate: 8.5,
        maxVolatility: 12.3,
        trendPrediction: 6.2
      }

      res.json({
        code: 200,
        data: historyData,
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get history analysis error:', error)
      next(error)
    }
  }

  // 删除场景
  async deleteScenario(req, res, next) {
    try {
      const { id } = req.params

      // 这里应该从数据库删除
      logger.info(`删除模拟场景: ${id}`)

      res.json({
        code: 200,
        data: null,
        message: '删除成功'
      })

    } catch (error) {
      logger.error('Delete scenario error:', error)
      next(error)
    }
  }
}

module.exports = new SimulationController()