const personalBonusService = require('../services/personalBonusService')
const nedbService = require('../services/nedbService')
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
      const history = await personalBonusService.getPersonalBonusHistory(user.id, {
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

      console.log(`🔍 个人奖金概览请求详情:`)
      console.log(`  - 用户ID: ${userId}`)
      console.log(`  - 用户对象:`, {
        id: req.user.id,
        username: req.user.username,
        realName: req.user.realName,
        email: req.user.email,
        employeeId: req.user.employeeId,
        roleId: req.user.roleId
      })
      console.log(`  - 期间: ${period || '当前'}`)

      logger.info(`获取个人奖金概览请求: 用户${userId}, 期间${period || '当前'}`)

      const overview = await personalBonusService.getPersonalBonusOverview(userId, period)

      res.json({
        code: 200,
        message: '获取个人奖金概览成功',
        data: overview
      })

    } catch (error) {
      console.error(`❌ 获取个人奖金概览失败:`, error)
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
  getBonusTrend = async (req, res, next) => {
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
      const trendAnalysis = this.analyzeTrendData(history.history || [])

      // 确保数据安全，添加默认值
      const safeHistory = history.history || []
      const safeSummary = history.summary || { totalBonus: 0, totalAllocations: 0, averageBonus: 0 }

      // 计算最佳和最差月份
      let bestMonth = { period: '暂无', amount: 0 }
      let worstMonth = { period: '暂无', amount: 0 }
      
      if (safeHistory.length > 0) {
        const amountsWithPeriods = safeHistory.map(h => ({
          period: h.allocationPeriod || h.period || '未知期间',
          amount: h.totalAmount || h.amount || 0
        }))
        
        if (amountsWithPeriods.length > 0) {
          bestMonth = amountsWithPeriods.reduce((best, current) => 
            current.amount > best.amount ? current : best, amountsWithPeriods[0])
          worstMonth = amountsWithPeriods.reduce((worst, current) => 
            current.amount < worst.amount ? current : worst, amountsWithPeriods[0])
        }
      }

      // 完善summary对象
      const enhancedSummary = {
        ...safeSummary,
        bestMonth,
        worstMonth,
        totalPeriods: safeHistory.length
      }

      const trendData = {
        user: history.user || {},
        employee: history.employee || {},
        summary: enhancedSummary,
        trendAnalysis,
        chartData: {
          periods: safeHistory.map(h => h.allocationPeriod || h.period || '未知期间').filter(Boolean).reverse(),
          totalAmounts: safeHistory.map(h => h.totalAmount || h.amount || 0).reverse(),
          regularBonuses: safeHistory
            .filter(h => (h.bonusType === 'monthly_regular') || (h.allocationType === 'regular'))
            .map(h => ({ 
              period: h.allocationPeriod || h.period || '未知期间', 
              amount: h.totalAmount || h.amount || 0 
            }))
            .reverse(),
          projectBonuses: safeHistory
            .filter(h => (h.bonusType === 'project') || (h.allocationType === 'project'))
            .map(h => ({ 
              period: h.allocationPeriod || h.period || '未知期间', 
              amount: h.totalAmount || h.amount || 0 
            }))
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
  getPeerComparison = async (req, res, next) => {
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
    // 确保history是数组
    if (!Array.isArray(history) || history.length < 2) {
      return {
        trend: 'insufficient_data',
        message: '历史数据不足以分析趋势',
        growthRate: 0,
        volatility: 0,
        recentAverage: 0,
        olderAverage: 0,
        totalPeriods: history?.length || 0
      }
    }

    // 安全地提取金额数据
    const amounts = history.map(h => {
      const amount = h.totalAmount || h.amount || 0
      return typeof amount === 'number' ? amount : 0
    }).filter(amount => amount >= 0)

    if (amounts.length < 2) {
      return {
        trend: 'insufficient_data',
        message: '有效数据不足以分析趋势',
        growthRate: 0,
        volatility: 0,
        recentAverage: 0,
        olderAverage: 0,
        totalPeriods: amounts.length
      }
    }

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
      totalPeriods: amounts.length,
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
   * 获取同级别员工奖金对比数据（从数据库查询）
   */
  async getPeerComparisonData(employee, period, myBonus) {
    try {
      // 从数据库查询同级别员工的真实数据
      const positionLevel = employee.position?.level || 1
      const departmentId = employee.departmentId
      
      // 查询同级别员工（相同职位级别和部门）
      const peerQuery = {
        'position.level': positionLevel,
        departmentId: departmentId,
        _id: { $ne: employee._id } // 排除自己
      }
      
      const peerEmployees = await nedbService.find('employees', peerQuery)
      
      if (!peerEmployees || peerEmployees.length === 0) {
        // 如果没有同级别员工，返回默认信息
        return {
          totalPeers: 0,
          averageBonus: myBonus,
          medianBonus: myBonus,
          percentile: 50,
          topQuartile: myBonus,
          bottomQuartile: myBonus,
          myRanking: 'average',
          myPercentile: 50,
          comparedToAverage: 0,
          comparedToMedian: 0,
          message: '暂无同级别员工数据对比'
        }
      }
      
      // 获取同级别员工的奖金数据
      const peerBonusData = []
      for (const peer of peerEmployees) {
        // 查询该员工的奖金记录
        const bonusQuery = {
          employeeId: peer._id,
          period: period
        }
        
        // 尝试从不同集合查询奖金数据
        let bonusRecords = await nedbService.find('bonusAllocationResults', bonusQuery)
        if (!bonusRecords || bonusRecords.length === 0) {
          bonusRecords = await nedbService.find('projectBonusAllocations', bonusQuery)
        }
        if (!bonusRecords || bonusRecords.length === 0) {
          bonusRecords = await nedbService.find('bonusAllocations', bonusQuery)
        }
        
        if (bonusRecords && bonusRecords.length > 0) {
          const totalBonus = bonusRecords.reduce((sum, record) => {
            return sum + (record.totalAmount || record.amount || 0)
          }, 0)
          peerBonusData.push(totalBonus)
        }
      }
      
      if (peerBonusData.length === 0) {
        // 如果没有奖金数据，返回默认信息
        return {
          totalPeers: peerEmployees.length,
          averageBonus: myBonus,
          medianBonus: myBonus,
          percentile: 50,
          topQuartile: myBonus,
          bottomQuartile: myBonus,
          myRanking: 'average',
          myPercentile: 50,
          comparedToAverage: 0,
          comparedToMedian: 0,
          message: '同级别员工暂无奖金数据'
        }
      }
      
      // 计算真实统计数据
      const sortedBonuses = peerBonusData.sort((a, b) => a - b)
      const totalPeers = peerBonusData.length
      const averageBonus = peerBonusData.reduce((sum, bonus) => sum + bonus, 0) / totalPeers
      const medianBonus = sortedBonuses[Math.floor(totalPeers / 2)]
      const topQuartile = sortedBonuses[Math.floor(totalPeers * 0.75)]
      const bottomQuartile = sortedBonuses[Math.floor(totalPeers * 0.25)]
      
      // 计算我的排名和百分位
      const myRank = sortedBonuses.findIndex(bonus => bonus >= myBonus) + 1
      const percentile = Math.round((myRank / (totalPeers + 1)) * 100)
      
      let ranking = 'average'
      if (myBonus >= topQuartile) ranking = 'top'
      else if (myBonus <= bottomQuartile) ranking = 'bottom'
      
      return {
        totalPeers,
        averageBonus,
        medianBonus,
        percentile,
        topQuartile,
        bottomQuartile,
        myRanking: ranking,
        myPercentile: percentile,
        comparedToAverage: myBonus - averageBonus,
        comparedToMedian: myBonus - medianBonus,
        message: this.getPeerComparisonMessage(ranking, percentile)
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

  /**
   * 获取个人奖金概览（别名方法，与getOverview功能相同）
   * GET /api/personal-bonus/overview-detail
   */
  async getPersonalBonusOverview(req, res, next) {
    return this.getOverview(req, res, next)
  }

  /**
   * 获取奖金趋势分析（别名方法，与getBonusTrend功能相同）  
   * GET /api/personal-bonus/trend-analysis
   */
  async getBonusTrendAnalysis(req, res, next) {
    return this.getBonusTrend(req, res, next)
  }

  /**
   * 获取绩效详情（别名方法，与getPerformanceDetail功能相同）
   * GET /api/personal-bonus/performance-detail
   */
  async getPerformanceDetailInfo(req, res, next) {
    return this.getPerformanceDetail(req, res, next)
  }

  /**
   * 获取项目参与情况（别名方法，与getProjectParticipation功能相同）
   * GET /api/personal-bonus/project-participation
   */  
  async getProjectParticipationInfo(req, res, next) {
    return this.getProjectParticipation(req, res, next)
  }

  /**
   * 获取改进建议（别名方法，与getImprovementSuggestions功能相同）
   * GET /api/personal-bonus/improvement-suggestions-detail
   */
  async getImprovementSuggestionsInfo(req, res, next) {
    return this.getImprovementSuggestions(req, res, next)
  }

  /**
   * 获取同级别对比（别名方法，与getPeerComparison功能相同）
   * GET /api/personal-bonus/peer-comparison-detail  
   */
  async getPeerComparisonInfo(req, res, next) {
    return this.getPeerComparison(req, res, next)
  }

  /**
   * 获取团队奖金概览（部门经理功能）
   * GET /api/bonus/team-overview
   */
  async getTeamBonusOverview(req, res, next) {
    try {
      const userId = req.user.id
      const { period, departmentId } = req.query

      logger.info(`获取团队奖金概览请求: 用户${userId}, 期间${period || '当前'}, 部门${departmentId || '当前用户部门'}`)

      // 获取当前用户的员工信息
      const userEmployee = await nedbService.getEmployeeByUserId(userId)
      if (!userEmployee) {
        return res.json({
          code: 404,
          message: '未找到关联的员工记录',
          data: {
            user: req.user,
            employee: null,
            teamData: null,
            message: '您尚未关联员工记录，请联系HR进行账户关联'
          }
        })
      }

      // 检查权限：只有部门经理或以上级别才能查看团队概览
      if (!['manager', 'director', 'admin'].includes(userEmployee.position?.level)) {
        return res.status(403).json({
          code: 403,
          message: '您没有权限查看团队奖金概览，仅限部门经理及以上级别',
          data: null
        })
      }

      // 确定要查询的部门
      const targetDepartmentId = departmentId || userEmployee.departmentId

      // 获取部门信息
      const department = await nedbService.getDepartmentById(targetDepartmentId)
      if (!department) {
        return res.status(404).json({
          code: 404,
          message: '指定部门不存在',
          data: null
        })
      }

      // 获取部门下所有员工
      const departmentEmployees = await nedbService.getEmployeesByDepartment(targetDepartmentId)
      
      // 获取每个员工的奖金信息
      const employeeBonusData = await Promise.all(
        departmentEmployees.map(async (employee) => {
          try {
            const bonusOverview = await personalBonusService.getPersonalBonusOverview(employee.userId, period)
            return {
              employee: {
                id: employee._id,
                name: employee.name,
                employeeNo: employee.employeeNo,
                position: employee.position
              },
              bonusData: bonusOverview.bonusData || {
                totalBonus: 0,
                bonusBreakdown: {
                  profit: 0,
                  position: 0,
                  performance: 0
                }
              }
            }
          } catch (error) {
            logger.warn(`获取员工${employee.name}奖金数据失败:`, error)
            return {
              employee: {
                id: employee._id,
                name: employee.name,
                employeeNo: employee.employeeNo,
                position: employee.position
              },
              bonusData: {
                totalBonus: 0,
                bonusBreakdown: {
                  profit: 0,
                  position: 0,
                  performance: 0
                }
              }
            }
          }
        })
      )

      // 计算团队统计数据
      const teamStats = {
        totalEmployees: employeeBonusData.length,
        totalBonus: employeeBonusData.reduce((sum, emp) => sum + emp.bonusData.totalBonus, 0),
        averageBonus: 0,
        maxBonus: 0,
        minBonus: 0,
        bonusDistribution: {
          profit: employeeBonusData.reduce((sum, emp) => sum + emp.bonusData.bonusBreakdown.profit, 0),
          position: employeeBonusData.reduce((sum, emp) => sum + emp.bonusData.bonusBreakdown.position, 0),
          performance: employeeBonusData.reduce((sum, emp) => sum + emp.bonusData.bonusBreakdown.performance, 0)
        }
      }

      if (employeeBonusData.length > 0) {
        const bonusAmounts = employeeBonusData.map(emp => emp.bonusData.totalBonus)
        teamStats.averageBonus = teamStats.totalBonus / employeeBonusData.length
        teamStats.maxBonus = Math.max(...bonusAmounts)
        teamStats.minBonus = Math.min(...bonusAmounts)
      }

      const teamOverview = {
        user: req.user,
        manager: userEmployee,
        department: {
          id: department._id,
          name: department.name,
          code: department.code
        },
        currentPeriod: period || new Date().toISOString().slice(0, 7),
        teamStats,
        employeeDetails: employeeBonusData,
        summary: {
          highPerformers: employeeBonusData.filter(emp => emp.bonusData.totalBonus > teamStats.averageBonus * 1.2).length,
          averagePerformers: employeeBonusData.filter(emp => 
            emp.bonusData.totalBonus >= teamStats.averageBonus * 0.8 && 
            emp.bonusData.totalBonus <= teamStats.averageBonus * 1.2
          ).length,
          lowPerformers: employeeBonusData.filter(emp => emp.bonusData.totalBonus < teamStats.averageBonus * 0.8).length
        }
      }

      res.json({
        code: 200,
        message: '获取团队奖金概览成功',
        data: teamOverview
      })

    } catch (error) {
      logger.error('获取团队奖金概览失败:', error)
      next(error)
    }
  }

  /**
   * 个人奖金查询（支持复杂查询参数）
   * GET /api/bonus/personal-query
   */
  async getPersonalBonusQuery(req, res, next) {
    try {
      const userId = req.user.id
      const { startDate, endDate, type, page = 1, limit = 10 } = req.query

      logger.info(`个人奖金查询请求: 用户${userId}, 类型${type || '全部'}, 日期范围${startDate || 'N/A'}-${endDate || 'N/A'}`)

      // 获取当前用户的员工信息
      const userEmployee = await nedbService.getEmployeeByUserId(userId)
      if (!userEmployee) {
        return res.json({
          code: 404,
          message: '未找到关联的员工记录',
          data: {
            user: req.user,
            employee: null,
            results: [],
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: 0,
              pages: 0
            },
            message: '您尚未关联员工记录，请联系HR进行账户关联'
          }
        })
      }

      // 构建查询条件
      const query = {
        employeeId: userEmployee._id
      }

      // 添加日期范围过滤
      if (startDate || endDate) {
        query.period = {}
        if (startDate) query.period.$gte = startDate
        if (endDate) query.period.$lte = endDate
      }

      // 添加类型过滤
      if (type) {
        query.type = type
      }

      // 获取奖金记录
      const allBonusRecords = await nedbService.getBonusAllocations(query)
      
      // 如果没有数据，返回空结果而不是生成模拟数据
      let bonusRecords = allBonusRecords
      if (bonusRecords.length === 0) {
        // 返回空结果，不生成模拟数据
        bonusRecords = []
      }

      // 应用类型过滤
      if (type) {
        bonusRecords = bonusRecords.filter(record => record.type === type)
      }

      // 应用日期过滤
      if (startDate || endDate) {
        bonusRecords = bonusRecords.filter(record => {
          const recordDate = record.period
          if (startDate && recordDate < startDate) return false
          if (endDate && recordDate > endDate) return false
          return true
        })
      }

      // 排序（最新的在前）
      bonusRecords.sort((a, b) => new Date(b.period) - new Date(a.period))

      // 分页处理
      const total = bonusRecords.length
      const offset = (page - 1) * limit
      const paginatedRecords = bonusRecords.slice(offset, offset + parseInt(limit))

      // 计算统计信息
      const stats = {
        totalAmount: bonusRecords.reduce((sum, record) => sum + record.amount, 0),
        totalCount: total,
        averageAmount: total > 0 ? bonusRecords.reduce((sum, record) => sum + record.amount, 0) / total : 0,
        typeDistribution: {}
      }

      // 按类型统计
      bonusRecords.forEach(record => {
        const recordType = record.type || 'regular'
        if (!stats.typeDistribution[recordType]) {
          stats.typeDistribution[recordType] = { count: 0, amount: 0 }
        }
        stats.typeDistribution[recordType].count += 1
        stats.typeDistribution[recordType].amount += record.amount
      })

      const queryResults = {
        user: req.user,
        employee: {
          id: userEmployee._id,
          name: userEmployee.name,
          employeeNo: userEmployee.employeeNo,
          department: userEmployee.department
        },
        queryParams: {
          startDate: startDate || null,
          endDate: endDate || null,
          type: type || null
        },
        results: paginatedRecords,
        statistics: stats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }

      res.json({
        code: 200,
        message: '个人奖金查询成功',
        data: queryResults
      })

    } catch (error) {
      logger.error('个人奖金查询失败:', error)
      next(error)
    }
  }
}

module.exports = new PersonalBonusController()