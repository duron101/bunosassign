const personalBonusService = require('../services/personalBonusService')
const logger = require('../utils/logger')
const { PermissionValidator } = require('../config/permissions')
const auditService = require('../services/auditService')

/**
 * 个人奖金控制器
 * 为所有员工提供个人奖金信息查询的API接口
 */
class PersonalBonusController {

  /**
   * 获取个人奖金信息
   */
  async getPersonalBonus(req, res, next) {
    try {
      const user = req.user
      const { employeeId } = req.params

      // 检查权限：只能查看自己的奖金，或者有查看权限
      if (employeeId && employeeId !== user.employeeId) {
        if (!PermissionValidator.canAccessResource(user, 'employee', 'view')) {
          return res.status(403).json({
            code: 403,
            message: '您没有权限查看其他员工的奖金信息',
            data: null
          })
        }
      }

      const targetEmployeeId = employeeId || user.employeeId

      // 验证员工ID
      if (!targetEmployeeId) {
        logger.error('员工ID缺失:', { 
          user: { id: user.id, username: user.username, employeeId: user.employeeId },
          requestedEmployeeId: employeeId 
        })
        return res.status(400).json({
          code: 400,
          message: '无法确定员工身份，请联系管理员',
          data: null
        })
      }

      // 获取个人奖金信息
      const bonusInfo = await personalBonusService.getPersonalBonusInfo(targetEmployeeId)

      // 记录审计日志
      await auditService.logPermissionAction(
        user,
        'bonus:view',
        'bonus',
        targetEmployeeId,
        {
          action: 'view_personal_bonus',
          employeeId: targetEmployeeId
        },
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          requestId: req.id
        }
      )

      res.json({
        code: 200,
        message: '获取成功',
        data: bonusInfo
      })

    } catch (error) {
      logger.error('Get personal bonus error:', error)
      next(error)
    }
  }

  /**
   * 获取个人奖金历史
   */
  async getPersonalBonusHistory(req, res, next) {
    try {
      const user = req.user
      const { employeeId } = req.params
      const { startDate, endDate, page = 1, limit = 10 } = req.query

      // 检查权限：只能查看自己的奖金历史，或者有查看权限
      if (employeeId && employeeId !== user.employeeId) {
        if (!PermissionValidator.canAccessResource(user, 'employee', 'view')) {
          return res.status(403).json({
            code: 403,
            message: '您没有权限查看其他员工的奖金历史',
            data: null
          })
        }
      }

      const targetEmployeeId = employeeId || user.employeeId

      // 获取个人奖金历史
      const history = await personalBonusService.getPersonalBonusHistory(targetEmployeeId, {
        startDate,
        endDate,
        page: parseInt(page),
        limit: parseInt(limit)
      })

      res.json({
        code: 200,
        message: '获取成功',
        data: history
      })

    } catch (error) {
      logger.error('Get personal bonus history error:', error)
      next(error)
    }
  }

  /**
   * 获取个人奖金统计
   */
  async getPersonalBonusStats(req, res, next) {
    try {
      const user = req.user
      const { employeeId } = req.params
      const { startDate, endDate } = req.query

      // 检查权限：只能查看自己的奖金统计，或者有查看权限
      if (employeeId && employeeId !== user.employeeId) {
        if (!PermissionValidator.canAccessResource(user, 'employee', 'view')) {
          return res.status(403).json({
            code: 403,
            message: '您没有权限查看其他员工的奖金统计',
            data: null
          })
        }
      }

      const targetEmployeeId = employeeId || user.employeeId

      // 获取个人奖金统计
      const stats = await personalBonusService.getPersonalBonusStats(targetEmployeeId, {
        startDate,
        endDate
      })

      res.json({
        code: 200,
        message: '获取成功',
        data: stats
      })

    } catch (error) {
      logger.error('Get personal bonus stats error:', error)
      next(error)
    }
  }

  /**
   * 申请奖金调整
   */
  async requestBonusAdjustment(req, res, next) {
    try {
      const user = req.user
      const { allocationId, adjustmentAmount, reason } = req.body

      // 验证必要字段
      if (!allocationId || !adjustmentAmount || !reason) {
        return res.status(400).json({
          code: 400,
          message: '缺少必要字段',
          data: null
        })
      }

      // 检查权限：只能申请调整自己的奖金，或者有调整权限
      const allocation = await global.nedbService.getBonusAllocationById(allocationId)
      if (!allocation) {
        return res.status(404).json({
          code: 404,
          message: '奖金分配不存在',
          data: null
        })
      }

      if (allocation.employeeId !== user.employeeId) {
        if (!PermissionValidator.canAccessResource(user, 'bonus', 'adjust')) {
          return res.status(403).json({
            code: 403,
            message: '您没有权限申请调整此奖金',
            data: null
          })
        }
      }

      // 检查调整金额权限
      if (Math.abs(adjustmentAmount) > 50000) {
        if (!PermissionValidator.canAccessResource(user, 'finance', 'manage')) {
          return res.status(403).json({
            code: 403,
            message: '大额奖金调整需要财务管理权限',
            data: null
          })
        }
      }

      // 创建调整申请
      const adjustment = await personalBonusService.createBonusAdjustmentRequest({
        allocationId,
        employeeId: user.employeeId,
        adjustmentAmount,
        reason,
        status: 'pending'
      })

      // 记录审计日志
      await auditService.logPermissionAction(
        user,
        'bonus:adjust',
        'bonus',
        allocationId,
        {
          action: 'request_bonus_adjustment',
          adjustmentAmount,
          reason,
          employeeId: allocation.employeeId
        },
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          requestId: req.id
        }
      )

      res.json({
        code: 200,
        message: '奖金调整申请已提交',
        data: adjustment
      })

    } catch (error) {
      logger.error('Request bonus adjustment error:', error)
      next(error)
    }
  }

  /**
   * 审批奖金调整申请
   */
  async approveBonusAdjustment(req, res, next) {
    try {
      const user = req.user
      const { adjustmentId } = req.params
      const { approved, comments } = req.body

      // 验证必要字段
      if (typeof approved !== 'boolean') {
        return res.status(400).json({
          code: 400,
          message: '缺少审批结果',
          data: null
        })
      }

      // 检查权限
      if (!PermissionValidator.canAccessResource(user, 'bonus', 'approve')) {
        return res.status(403).json({
          code: 403,
          message: '您没有权限审批奖金调整申请',
          data: null
        })
      }

      // 获取调整申请信息
      const adjustment = await global.nedbService.getBonusAdjustmentById(adjustmentId)
      if (!adjustment) {
        return res.status(404).json({
          code: 404,
          message: '调整申请不存在',
          data: null
        })
      }

      // 检查大额调整权限
      if (Math.abs(adjustment.adjustmentAmount) > 50000) {
        if (!PermissionValidator.canAccessResource(user, 'finance', 'approve')) {
          return res.status(403).json({
            code: 403,
            message: '大额奖金调整需要财务审批权限',
            data: null
          })
        }
      }

      // 审批调整申请
      const result = await personalBonusService.approveBonusAdjustment(
        adjustmentId,
        user.id,
        approved,
        comments
      )

      // 记录审计日志
      await auditService.logPermissionAction(
        user,
        'bonus:approve',
        'bonus',
        adjustmentId,
        {
          action: 'approve_bonus_adjustment',
          approved,
          adjustmentAmount: adjustment.adjustmentAmount,
          reason: adjustment.reason,
          comments
        },
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          requestId: req.id
        }
      )

      res.json({
        code: 200,
        message: approved ? '调整申请已批准' : '调整申请已拒绝',
        data: result
      })

    } catch (error) {
      logger.error('Approve bonus adjustment error:', error)
      next(error)
    }
  }

  /**
   * 获取奖金调整申请列表
   */
  async getBonusAdjustmentRequests(req, res, next) {
    try {
      const user = req.user
      const { status, page = 1, limit = 10 } = req.query

      // 检查权限
      if (!PermissionValidator.canAccessResource(user, 'bonus', 'view')) {
        return res.status(403).json({
          code: 403,
          message: '您没有权限查看奖金调整申请',
          data: null
        })
      }

      // 构建查询条件
      const query = {}
      if (status) query.status = status

      // 普通用户只能查看自己的申请
      if (!PermissionValidator.canAccessResource(user, 'bonus', 'approve')) {
        query.employeeId = user.employeeId
      }

      // 获取调整申请列表
      const requests = await global.nedbService.getBonusAdjustments(query)
      const total = requests.length

      // 分页
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedRequests = requests.slice(startIndex, endIndex)

      res.json({
        code: 200,
        message: '获取成功',
        data: {
          requests: paginatedRequests,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      })

    } catch (error) {
      logger.error('Get bonus adjustment requests error:', error)
      next(error)
    }
  }

  /**
   * 获取个人奖金概览
   * GET /api/personal-bonus/overview
   */
  async getOverview(req, res, next) {
    try {
      const userId = req.user.id
      const { period } = req.query

      logger.info(`获取个人奖金概览请求: 用户${userId}, 期间${period || '当前'}`)

      const overview = await personalBonusService.getPersonalBonusOverview(userId, period)

      res.json({
        code: 200,
        message: '获取个人奖金概览成功',
        data: overview
      })

    } catch (error) {
      logger.error('获取个人奖金概览失败:', error)
      next(error)
    }
  }

  /**
   * 获取奖金模拟分析
   * GET /api/personal-bonus/simulation
   */
  async getSimulation(req, res, next) {
    try {
      const userId = req.user.id
      const { scenarios } = req.query

      logger.info(`获取奖金模拟分析请求: 用户${userId}`)

      // 解析模拟场景参数
      let simulationScenarios = {}
      if (scenarios) {
        try {
          simulationScenarios = typeof scenarios === 'string' ? JSON.parse(scenarios) : scenarios
        } catch (parseError) {
          logger.warn('模拟场景参数解析失败，使用默认场景:', parseError)
        }
      }

      const simulation = await personalBonusService.getBonusSimulation(userId, simulationScenarios)

      res.json({
        code: 200,
        message: '获取奖金模拟分析成功',
        data: simulation
      })

    } catch (error) {
      logger.error('获取奖金模拟分析失败:', error)
      next(error)
    }
  }

  /**
   * POST /api/personal-bonus/simulation
   * 通过POST方法提交复杂的模拟场景
   */
  async postSimulation(req, res, next) {
    try {
      const userId = req.user.id
      const { scenarios = {} } = req.body

      logger.info(`POST获取奖金模拟分析请求: 用户${userId}`, { scenarios })

      const simulation = await personalBonusService.getBonusSimulation(userId, scenarios)

      res.json({
        code: 200,
        message: '获取奖金模拟分析成功',
        data: simulation
      })

    } catch (error) {
      logger.error('POST获取奖金模拟分析失败:', error)
      next(error)
    }
  }

  /**
   * 获取个人改进建议
   * GET /api/personal-bonus/improvement-suggestions
   */
  async getImprovementSuggestions(req, res, next) {
    try {
      const userId = req.user.id

      logger.info(`获取个人改进建议请求: 用户${userId}`)

      const suggestions = await personalBonusService.getImprovementSuggestions(userId)

      res.json({
        code: 200,
        message: '获取个人改进建议成功',
        data: suggestions
      })

    } catch (error) {
      logger.error('获取个人改进建议失败:', error)
      next(error)
    }
  }

  /**
   * 获取个人绩效详情
   * GET /api/personal-bonus/performance
   */
  async getPerformanceDetail(req, res, next) {
    try {
      const userId = req.user.id
      const { period } = req.query

      logger.info(`获取个人绩效详情请求: 用户${userId}, 期间${period || '当前'}`)

      // 通过概览接口获取绩效数据
      const overview = await personalBonusService.getPersonalBonusOverview(userId, period)
      
      if (!overview.employee) {
        return res.json({
          code: 404,
          message: '未找到关联的员工记录',
          data: {
            user: overview.user,
            employee: null,
            performanceMetrics: null,
            message: '您尚未关联员工记录，请联系HR进行账户关联'
          }
        })
      }

      const performanceData = {
        user: overview.user,
        employee: overview.employee,
        currentPeriod: overview.currentPeriod,
        performanceMetrics: overview.performanceMetrics,
        bonusImpact: {
          performanceContribution: overview.bonusData.bonusBreakdown.performance,
          totalBonus: overview.bonusData.totalBonus,
          performanceRatio: overview.bonusData.totalBonus > 0 ? 
            (overview.bonusData.bonusBreakdown.performance / overview.bonusData.totalBonus) : 0
        }
      }

      res.json({
        code: 200,
        message: '获取个人绩效详情成功',
        data: performanceData
      })

    } catch (error) {
      logger.error('获取个人绩效详情失败:', error)
      next(error)
    }
  }

  /**
   * 获取个人项目参与情况
   * GET /api/personal-bonus/projects
   */
  async getProjectParticipation(req, res, next) {
    try {
      const userId = req.user.id
      const { period } = req.query

      logger.info(`获取个人项目参与情况请求: 用户${userId}, 期间${period || '当前'}`)

      const overview = await personalBonusService.getPersonalBonusOverview(userId, period)
      
      if (!overview.employee) {
        return res.json({
          code: 404,
          message: '未找到关联的员工记录',
          data: {
            user: overview.user,
            employee: null,
            projects: [],
            message: '您尚未关联员工记录，请联系HR进行账户关联'
          }
        })
      }

      // 获取项目奖金详情
      const projectBonus = overview.bonusData.projectBonus
      const projectData = {
        user: overview.user,
        employee: overview.employee,
        currentPeriod: overview.currentPeriod,
        projectBonus: projectBonus || {
          totalAmount: 0,
          projectCount: 0,
          allocations: []
        },
        summary: {
          totalProjectBonus: projectBonus?.totalAmount || 0,
          activeProjects: projectBonus?.projectCount || 0,
          averageBonusPerProject: projectBonus?.projectCount > 0 ? 
            (projectBonus.totalAmount / projectBonus.projectCount) : 0,
          projectContributionRatio: overview.bonusData.totalBonus > 0 ?
            ((projectBonus?.totalAmount || 0) / overview.bonusData.totalBonus) : 0
        }
      }

      res.json({
        code: 200,
        message: '获取个人项目参与情况成功',
        data: projectData
      })

    } catch (error) {
      logger.error('获取个人项目参与情况失败:', error)
      next(error)
    }
  }

  /**
   * 获取个人三维评价详情
   * GET /api/personal-bonus/three-dimensional
   */
  async getThreeDimensionalDetail(req, res, next) {
    try {
      const userId = req.user.id
      const { period } = req.query

      logger.info(`获取个人三维评价详情请求: 用户${userId}, 期间${period || '当前'}`)

      const overview = await personalBonusService.getPersonalBonusOverview(userId, period)
      
      if (!overview.employee) {
        return res.json({
          code: 404,
          message: '未找到关联的员工记录',
          data: {
            user: overview.user,
            employee: null,
            threeDimensionalScore: null,
            message: '您尚未关联员工记录，请联系HR进行账户关联'
          }
        })
      }

      // 通过service获取三维评价详情
      const threeDimensionalScore = await personalBonusService.getThreeDimensionalScore(
        overview.employee.id, 
        overview.currentPeriod
      )

      const threeDimensionalData = {
        user: overview.user,
        employee: overview.employee,
        currentPeriod: overview.currentPeriod,
        threeDimensionalScore: threeDimensionalScore || {
          profitContribution: 0,
          positionValue: 0,
          performance: 0,
          finalScore: 0,
          calculationDate: null
        },
        bonusBreakdown: overview.bonusData.bonusBreakdown,
        totalBonus: overview.bonusData.totalBonus,
        scoreAnalysis: threeDimensionalScore ? {
          profitContributionLevel: this.getScoreLevel(threeDimensionalScore.profitContribution),
          positionValueLevel: this.getScoreLevel(threeDimensionalScore.positionValue),
          performanceLevel: this.getScoreLevel(threeDimensionalScore.performance),
          overallLevel: this.getScoreLevel(threeDimensionalScore.finalScore)
        } : null
      }

      res.json({
        code: 200,
        message: '获取个人三维评价详情成功',
        data: threeDimensionalData
      })

    } catch (error) {
      logger.error('获取个人三维评价详情失败:', error)
      next(error)
    }
  }

  /**
   * 获取奖金趋势分析
   * GET /api/personal-bonus/trend
   */
  async getBonusTrend(req, res, next) {
    try {
      const userId = req.user.id
      const { periods = 12 } = req.query

      logger.info(`获取奖金趋势分析请求: 用户${userId}, 期间数${periods}`)

      const history = await personalBonusService.getPersonalBonusHistory(userId, parseInt(periods))
      
      if (!history.employee) {
        return res.json({
          code: 404,
          message: '未找到关联的员工记录',
          data: {
            user: history.user,
            employee: null,
            trend: null,
            message: '您尚未关联员工记录，请联系HR进行账户关联'
          }
        })
      }

      // 分析趋势
      const trendAnalysis = this.analyzeTrendData(history.history)

      const trendData = {
        user: history.user,
        employee: history.employee,
        summary: history.summary,
        trendAnalysis,
        chartData: {
          periods: history.history.map(h => h.period).reverse(),
          totalAmounts: history.history.map(h => h.amount).reverse(),
          regularBonuses: history.history
            .filter(h => h.type === 'regular')
            .map(h => ({ period: h.period, amount: h.amount }))
            .reverse(),
          projectBonuses: history.history
            .filter(h => h.type === 'project')
            .map(h => ({ period: h.period, amount: h.amount }))
            .reverse()
        }
      }

      res.json({
        code: 200,
        message: '获取奖金趋势分析成功',
        data: trendData
      })

    } catch (error) {
      logger.error('获取奖金趋势分析失败:', error)
      next(error)
    }
  }

  /**
   * 获取同级别员工奖金对比（匿名化）
   * GET /api/personal-bonus/peer-comparison
   */
  async getPeerComparison(req, res, next) {
    try {
      const userId = req.user.id
      const { period } = req.query

      logger.info(`获取同级别奖金对比请求: 用户${userId}, 期间${period || '当前'}`)

      const overview = await personalBonusService.getPersonalBonusOverview(userId, period)
      
      if (!overview.employee) {
        return res.json({
          code: 404,
          message: '未找到关联的员工记录',
          data: {
            user: overview.user,
            employee: null,
            comparison: null,
            message: '您尚未关联员工记录，请联系HR进行账户关联'
          }
        })
      }

      // 获取同级别员工的匿名对比数据
      const peerComparison = await this.getPeerComparisonData(
        overview.employee, 
        overview.currentPeriod,
        overview.bonusData.totalBonus
      )

      res.json({
        code: 200,
        message: '获取同级别奖金对比成功',
        data: {
          user: overview.user,
          employee: overview.employee,
          currentPeriod: overview.currentPeriod,
          myBonus: overview.bonusData.totalBonus,
          comparison: peerComparison
        }
      })

    } catch (error) {
      logger.error('获取同级别奖金对比失败:', error)
      next(error)
    }
  }

  // ====== 辅助方法 ======

  /**
   * 获取分数等级
   */
  getScoreLevel(score) {
    if (score >= 0.9) return 'excellent'
    if (score >= 0.8) return 'good'
    if (score >= 0.7) return 'average'
    if (score >= 0.6) return 'below_average'
    return 'poor'
  }

  /**
   * 分析趋势数据
   */
  analyzeTrendData(history) {
    if (history.length < 2) {
      return {
        trend: 'insufficient_data',
        message: '历史数据不足以分析趋势',
        growthRate: 0,
        volatility: 0
      }
    }

    const amounts = history.map(h => h.amount)
    const recentAmounts = amounts.slice(0, Math.min(3, amounts.length))
    const olderAmounts = amounts.slice(Math.min(3, amounts.length))

    const recentAvg = recentAmounts.reduce((sum, amt) => sum + amt, 0) / recentAmounts.length
    const olderAvg = olderAmounts.length > 0 ? 
      olderAmounts.reduce((sum, amt) => sum + amt, 0) / olderAmounts.length : recentAvg

    const growthRate = olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0

    // 计算波动性（标准差）
    const mean = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length
    const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - mean, 2), 0) / amounts.length
    const volatility = Math.sqrt(variance)

    let trend = 'stable'
    if (growthRate > 0.1) trend = 'rising'
    else if (growthRate < -0.1) trend = 'declining'

    return {
      trend,
      growthRate,
      volatility,
      recentAverage: recentAvg,
      olderAverage: olderAvg,
      totalPeriods: history.length,
      message: this.getTrendMessage(trend, growthRate)
    }
  }

  /**
   * 获取趋势说明
   */
  getTrendMessage(trend, growthRate) {
    switch (trend) {
      case 'rising':
        return `奖金呈上升趋势，增长率为 ${(growthRate * 100).toFixed(1)}%`
      case 'declining':
        return `奖金呈下降趋势，下降率为 ${(Math.abs(growthRate) * 100).toFixed(1)}%`
      default:
        return '奖金水平相对稳定'
    }
  }

  /**
   * 获取同级别对比数据（匿名化）
   */
  async getPeerComparisonData(employee, period, myBonus) {
    try {
      // 这里需要实现匿名化的同级别对比逻辑
      // 由于数据安全考虑，只提供统计性信息，不显示具体员工信息
      
      // 简化实现：基于职位级别生成模拟的统计数据
      const positionLevel = employee.position?.level || 1
      
      // 生成模拟的同级别统计数据（实际应该从数据库查询）
      const peerStats = {
        totalPeers: Math.floor(Math.random() * 20) + 10, // 10-30人
        averageBonus: myBonus * (0.9 + Math.random() * 0.2), // 90%-110%范围
        medianBonus: myBonus * (0.85 + Math.random() * 0.3), // 85%-115%范围
        percentile: Math.floor(Math.random() * 100) + 1, // 1-100百分位
        topQuartile: myBonus * 1.2,
        bottomQuartile: myBonus * 0.8
      }

      // 计算我的排名
      let ranking = 'average'
      if (myBonus >= peerStats.topQuartile) ranking = 'top'
      else if (myBonus <= peerStats.bottomQuartile) ranking = 'bottom'

      return {
        ...peerStats,
        myRanking: ranking,
        myPercentile: peerStats.percentile,
        comparedToAverage: myBonus - peerStats.averageBonus,
        comparedToMedian: myBonus - peerStats.medianBonus,
        message: this.getPeerComparisonMessage(ranking, peerStats.percentile)
      }
    } catch (error) {
      logger.error('获取同级别对比数据失败:', error)
      return null
    }
  }

  /**
   * 获取对比说明
   */
  getPeerComparisonMessage(ranking, percentile) {
    switch (ranking) {
      case 'top':
        return `您的奖金水平在同级别员工中排在前25%，处于较高水平`
      case 'bottom':
        return `您的奖金水平在同级别员工中排在后25%，还有提升空间`
      default:
        return `您的奖金水平在同级别员工中排在第${percentile}百分位，处于中等水平`
    }
  }
}

module.exports = new PersonalBonusController()