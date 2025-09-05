const nedbService = require('./nedbService')
const projectBonusService = require('./projectBonusService')
const logger = require('../utils/logger')

/**
 * 个人奖金服务
 * 为所有员工提供个人奖金信息查询和分析功能
 */
class PersonalBonusService {

  /**
   * 获取个人奖金概览
   * @param {string} userId - 用户ID
   * @param {string} period - 期间 (可选，默认当前期间)
   */
  async getPersonalBonusOverview(userId, period = null) {
    try {
      // 验证输入参数
      if (!userId) {
        throw new Error('用户ID不能为空')
      }

      console.log(`📋 开始获取用户 ${userId} 的个人奖金概览`)

      // 获取用户信息
      const user = await nedbService.getUserById(userId)
      if (!user) {
        throw new Error(`用户不存在: ${userId}`)
      }

      console.log(`👤 用户信息:`, {
        id: user._id,
        username: user.username,
        realName: user.realName
      })

      // 尝试获取关联的员工记录
      const employee = await this.getEmployeeByUserId(userId)
      
      console.log(`🔍 getEmployeeByUserId 返回结果:`, {
        employeeFound: !!employee,
        employeeId: employee?._id,
        employeeName: employee?.name,
        employeeNo: employee?.employeeNo
      })
      
      // 如果没有当前期间，获取最新期间
      if (!period) {
        period = await this.getCurrentPeriod()
      }

      console.log(`📅 使用期间: ${period}`)
      
      if (employee) {
        console.log(`👷 员工信息:`, {
          id: employee._id,
          name: employee.name,
          employeeNo: employee.employeeNo,
          departmentId: employee.departmentId,
          positionId: employee.positionId
        })
        
        // 获取部门和岗位信息
        const department = await this.getDepartmentInfo(employee.departmentId)
        const position = await this.getPositionInfo(employee.positionId)
        
        // 将部门和岗位信息添加到员工对象中
        employee.department = department
        employee.position = position
      } else {
        console.warn(`⚠️ 未找到用户 ${userId} 对应的员工记录`)
      }

      console.log(`🔍 构建结果对象前的状态:`, {
        employeeExists: !!employee,
        employeeId: employee?._id,
        employeeName: employee?.name,
        employeeNo: employee?.employeeNo
      })

      const result = {
        user: {
          id: user._id,
          username: user.username,
          realName: user.realName,
          email: user.email
        },
        employee: employee ? {
          id: employee._id,
          employeeNumber: employee.employeeNo, // 前端期望 employeeNumber
          name: employee.name,
          departmentId: employee.departmentId,
          departmentName: employee.department ? employee.department.name : null, // 前端期望 departmentName
          positionId: employee.positionId,
          positionName: employee.position ? employee.position.name : null, // 前端期望 positionName
          level: employee.position ? employee.position.level : null,
          status: employee.status,
          joinDate: employee.hireDate || employee.entryDate, // 前端期望 joinDate
          userId: employee.userId
        } : null,
        currentPeriod: period,
        bonusData: await this.calculateBonusData(userId, employee, period),
        historicalData: await this.getBonusHistory(userId, employee?._id, 5), // 最近5期
        performanceMetrics: employee ? await this.getPerformanceMetrics(employee._id, period) : null
      }

      console.log(`🔍 构建结果对象后的状态:`, {
        resultEmployeeExists: !!result.employee,
        resultEmployeeId: result.employee?._id,
        resultEmployeeName: result.employee?.name
      })

      console.log(`💰 奖金数据汇总:`, {
        totalBonus: result.bonusData.totalBonus,
        regularBonus: result.bonusData.regularBonus?.totalAmount || 0,
        projectBonus: result.bonusData.projectBonus?.totalAmount || 0,
        breakdown: result.bonusData.bonusBreakdown
      })

      logger.info(`获取个人奖金概览成功: 用户${userId}, 期间${period}`)
      return result

    } catch (error) {
      console.error(`🚫 获取个人奖金概览失败:`, {
        userId,
        period,
        error: error.message
      })
      logger.error('获取个人奖金概览失败:', error)
      throw new Error(`获取个人奖金概览失败: ${error.message}`)
    }
  }

  /**
   * 获取个人奖金信息
   * @param {string} employeeId - 员工ID
   * @returns {Object} 个人奖金信息
   */
  async getPersonalBonusInfo(employeeId) {
    try {
      // 获取员工信息
      const employee = await global.nedbService.getEmployeeById(employeeId)
      if (!employee) {
        logger.error('员工不存在:', { 
          employeeId, 
          searchResult: 'null',
          availableEmployees: await global.nedbService.getEmployees().then(emps => emps.map(e => ({ id: e._id, name: e.name, username: e.username })))
        })
        throw new Error(`员工不存在 (ID: ${employeeId})`)
      }

      // 获取奖金分配记录
      const allocations = await global.nedbService.getBonusAllocations({
        employeeId,
        status: 'approved'
      })

      // 计算总奖金
      const totalBonus = allocations.reduce((sum, allocation) => sum + (allocation.amount || 0), 0)

      // 获取项目信息
      const projectIds = [...new Set(allocations.map(a => a.projectId))]
      const projects = await Promise.all(
        projectIds.map(id => global.nedbService.getProjectById(id))
      )

      // 按项目分组
      const bonusByProject = {}
      allocations.forEach(allocation => {
        const project = projects.find(p => p._id === allocation.projectId)
        if (project) {
          if (!bonusByProject[project._id]) {
            bonusByProject[project._id] = {
              projectId: project._id,
              projectName: project.name,
              projectCode: project.code,
              totalAmount: 0,
              allocations: []
            }
          }
          bonusByProject[project._id].totalAmount += allocation.amount || 0
          bonusByProject[project._id].allocations.push(allocation)
        }
      })

      return {
        employeeId,
        employeeName: employee.name,
        totalBonus,
        totalAllocations: allocations.length,
        bonusByProject: Object.values(bonusByProject),
        lastUpdated: new Date()
      }
    } catch (error) {
      logger.error('获取个人奖金信息失败:', error)
      throw error
    }
  }

  /**
   * 获取个人奖金历史
   * @param {string} userId - 用户ID
   * @param {Object} options - 查询选项
   * @returns {Object} 奖金历史信息
   */
  async getPersonalBonusHistory(userId, options = {}) {
    try {
      console.log(`🔍 getPersonalBonusHistory 开始: userId=${userId}, options=`, options)
      
      // 首先获取用户和员工信息
      const user = await nedbService.getUserById(userId)
      if (!user) {
        console.log(`❌ 用户不存在: ${userId}`)
        throw new Error(`用户不存在: ${userId}`)
      }
      console.log(`✅ 找到用户: ${user.username}`)

      // 获取员工信息
      const employee = await this.getEmployeeByUserId(userId)
      if (!employee) {
        console.log(`⚠️ 未找到员工信息，返回默认结果`)
        // 如果没有员工信息，返回包含用户信息但员工为null的结果
        return {
          user: {
            id: user._id,
            username: user.username,
            realName: user.realName,
            email: user.email
          },
          employee: null,
          history: [],
          summary: {
            totalBonus: 0,
            totalAllocations: 0,
            averageBonus: 0
          },
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            pages: 0
          }
        }
      }
      console.log(`✅ 找到员工: ${employee.name}`)

      const { startDate, endDate, page = 1, limit = 10 } = options
      console.log(`📊 查询参数: startDate=${startDate}, endDate=${endDate}, page=${page}, limit=${limit}`)

      // 构建查询条件 - 使用正确的集合和字段
      const query = { employeeId: employee._id }
      if (startDate || endDate) {
        query.createdAt = {}
        if (startDate) query.createdAt.$gte = new Date(startDate)
        if (endDate) query.createdAt.$lte = new Date(endDate)
      }
      console.log(`🔍 查询条件:`, query)
      console.log(`🔍 员工ID: ${employee._id}`)
      console.log(`🔍 员工姓名: ${employee.name}`)

      // 尝试从不同的集合获取奖金分配记录
      let allocations = []
      
      // 首先尝试从 bonusAllocationResults 集合查询
      console.log(`🔍 尝试从 bonusAllocationResults 集合查询...`)
      try {
        allocations = await nedbService.find('bonusAllocationResults', query)
        console.log(`✅ 从 bonusAllocationResults 找到 ${allocations.length} 条记录`)
        if (allocations.length > 0) {
          console.log(`🔍 第一条记录示例:`, {
            _id: allocations[0]._id,
            employeeId: allocations[0].employeeId,
            allocationPeriod: allocations[0].allocationPeriod,
            totalAmount: allocations[0].totalAmount
          })
        }
      } catch (error) {
        console.error(`❌ 查询 bonusAllocationResults 失败:`, error)
        console.error(`❌ 错误堆栈:`, error.stack)
        throw error
      }

      // 如果没有找到，尝试从 projectBonusAllocations 集合查询
      if (allocations.length === 0) {
        console.log(`🔍 尝试从 projectBonusAllocations 集合查询...`)
        try {
          allocations = await nedbService.find('projectBonusAllocations', query)
          console.log(`✅ 从 projectBonusAllocations 找到 ${allocations.length} 条记录`)
        } catch (error) {
          console.warn(`⚠️ 查询 projectBonusAllocations 失败:`, error.message)
        }
      }

      // 如果还是没有找到，尝试从 bonusAllocations 集合查询
      if (allocations.length === 0) {
        console.log(`🔍 尝试从 bonusAllocations 集合查询...`)
        try {
          allocations = await nedbService.find('bonusAllocations', query)
          console.log(`✅ 从 bonusAllocations 找到 ${allocations.length} 条记录`)
        } catch (error) {
          console.warn(`⚠️ 查询 bonusAllocations 失败:`, error.message)
        }
      }

      console.log(`📊 总共找到 ${allocations.length} 条奖金分配记录`)
      const total = allocations.length

      // 分页
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedAllocations = allocations.slice(startIndex, endIndex)
      console.log(`📄 分页结果: ${startIndex}-${endIndex}, 共 ${paginatedAllocations.length} 条`)

      // 获取项目信息
      const projectIds = [...new Set(paginatedAllocations.map(a => a.projectId).filter(Boolean))]
      console.log(`🔍 需要查询的项目ID:`, projectIds)
      
      const projects = await Promise.all(
        projectIds.map(async (id) => {
          try {
            const project = await nedbService.findOne('projects', { _id: id })
            return project
          } catch (error) {
            console.warn(`⚠️ 查询项目 ${id} 失败:`, error.message)
            return null
          }
        })
      )
      console.log(`✅ 成功查询 ${projects.filter(p => p).length} 个项目信息`)

      // 组装数据
      const history = paginatedAllocations.map(allocation => {
        const project = projects.find(p => p && p._id === allocation.projectId)
        return {
          ...allocation,
          projectName: project?.name || '未知项目',
          projectCode: project?.code || 'N/A'
        }
      })

      // 计算汇总信息
      const totalBonus = allocations.reduce((sum, a) => sum + (a.amount || a.bonusAmount || 0), 0)
      const averageBonus = total > 0 ? totalBonus / total : 0

      const result = {
        user: {
          id: user._id,
          username: user.username,
          realName: user.realName,
          email: user.email
        },
        employee: {
          id: employee._id,
          name: employee.name,
          employeeNo: employee.employeeNo,
          departmentId: employee.departmentId,
          positionId: employee.positionId
        },
        history,
        summary: {
          totalBonus,
          totalAllocations: total,
          averageBonus
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }

      console.log(`✅ getPersonalBonusHistory 完成: 返回 ${history.length} 条历史记录`)
      return result
      
    } catch (error) {
      console.error(`❌ getPersonalBonusHistory 失败:`, error)
      console.error(`❌ 错误堆栈:`, error.stack)
      logger.error('获取个人奖金历史失败:', error)
      throw error
    }
  }

  /**
   * 获取个人奖金统计
   * @param {string} employeeId - 员工ID
   * @param {Object} options - 查询选项
   * @returns {Object} 奖金统计信息
   */
  async getPersonalBonusStats(employeeId, options = {}) {
    try {
      const { startDate, endDate } = options

      // 构建查询条件
      const query = { employeeId }
      if (startDate || endDate) {
        query.createdAt = {}
        if (startDate) query.createdAt.$gte = new Date(startDate)
        if (endDate) query.createdAt.$lte = new Date(endDate)
      }

      // 获取奖金分配记录
      const allocations = await global.nedbService.getBonusAllocations(query)

      // 计算统计信息
      const totalBonus = allocations.reduce((sum, a) => sum + (a.amount || 0), 0)
      const totalAllocations = allocations.length
      const approvedAllocations = allocations.filter(a => a.status === 'approved').length
      const pendingAllocations = allocations.filter(a => a.status === 'pending').length
      const rejectedAllocations = allocations.filter(a => a.status === 'rejected').length

      // 按月份统计
      const monthlyStats = {}
      allocations.forEach(allocation => {
        const month = new Date(allocation.createdAt).toISOString().slice(0, 7)
        if (!monthlyStats[month]) {
          monthlyStats[month] = { count: 0, totalAmount: 0 }
        }
        monthlyStats[month].count++
        monthlyStats[month].totalAmount += allocation.amount || 0
      })

      // 按项目统计
      const projectStats = {}
      allocations.forEach(allocation => {
        const projectId = allocation.projectId
        if (!projectStats[projectId]) {
          projectStats[projectId] = { count: 0, totalAmount: 0 }
        }
        projectStats[projectId].count++
        projectStats[projectId].totalAmount += allocation.amount || 0
      })

      return {
        overview: {
          totalBonus,
          totalAllocations,
          approvedAllocations,
          pendingAllocations,
          rejectedAllocations
        },
        monthlyStats,
        projectStats,
        timeRange: { startDate, endDate }
      }
    } catch (error) {
      logger.error('获取个人奖金统计失败:', error)
      throw error
    }
  }

  /**
   * 创建奖金调整申请
   * @param {Object} adjustmentData - 调整申请数据
   * @returns {Object} 创建的调整申请
   */
  async createBonusAdjustmentRequest(adjustmentData) {
    try {
      const adjustment = {
        ...adjustmentData,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = await global.nedbService.createBonusAdjustment(adjustment)
      logger.info('奖金调整申请创建成功', {
        adjustmentId: result._id,
        allocationId: adjustmentData.allocationId,
        employeeId: adjustmentData.employeeId,
        adjustmentAmount: adjustmentData.adjustmentAmount
      })

      return result
    } catch (error) {
      logger.error('创建奖金调整申请失败:', error)
      throw error
    }
  }

  /**
   * 审批奖金调整申请
   * @param {string} adjustmentId - 调整申请ID
   * @param {string} approverId - 审批人ID
   * @param {boolean} approved - 是否批准
   * @param {string} comments - 审批意见
   * @returns {Object} 审批结果
   */
  async approveBonusAdjustment(adjustmentId, approverId, approved, comments) {
    try {
      const adjustment = await global.nedbService.getBonusAdjustmentById(adjustmentId)
      if (!adjustment) {
        throw new Error('调整申请不存在')
      }

      // 更新调整申请状态
      const updatedAdjustment = await global.nedbService.updateBonusAdjustment(adjustmentId, {
        status: approved ? 'approved' : 'rejected',
        approvedBy: approverId,
        approvedAt: new Date(),
        approvalComments: comments,
        updatedAt: new Date()
      })

      if (approved) {
        // 如果批准，更新奖金分配
        const allocation = await global.nedbService.getBonusAllocationById(adjustment.allocationId)
        if (allocation) {
          const newAmount = (allocation.amount || 0) + adjustment.adjustmentAmount
          await global.nedbService.updateBonusAllocation(adjustment.allocationId, {
            amount: newAmount,
            updatedAt: new Date()
          })
          logger.info('奖金分配已更新', {
            allocationId: adjustment.allocationId,
            oldAmount: allocation.amount,
            newAmount,
            adjustmentAmount: adjustment.adjustmentAmount
          })
        }
      }

      logger.info('奖金调整申请已处理', {
        adjustmentId,
        approved,
        allocationId: adjustment.allocationId,
        employeeId: adjustment.employeeId
      })

      return updatedAdjustment
    } catch (error) {
      logger.error('审批奖金调整申请失败:', error)
      throw error
    }
  }

  /**
   * 获取奖金模拟分析
   * @param {string} userId - 用户ID
   * @param {Object} scenarios - 模拟场景
   */
  async getBonusSimulation(userId, scenarios = {}) {
    try {
      const user = await nedbService.getUserById(userId)
      if (!user) {
        throw new Error('用户不存在')
      }

      const employee = await this.getEmployeeByUserId(userId)
      if (!employee) {
        return {
          user: { id: user._id, username: user.username, realName: user.realName },
          employee: null,
          simulation: null,
          message: '未找到关联的员工记录，无法进行奖金模拟'
        }
      }

      const currentPeriod = await this.getCurrentPeriod()
      const currentBonus = await this.getPersonalBonusOverview(userId, currentPeriod)

      // 模拟不同的业绩表现情况
      const simulationResults = []

      // 场景1: 当前表现保持不变
      simulationResults.push({
        scenario: 'current',
        name: '当前表现保持',
        description: '基于当前绩效水平的奖金预测',
        bonusAmount: currentBonus.bonusData.totalBonus,
        breakdown: currentBonus.bonusData.bonusBreakdown,
        changes: {
          performance: 0,
          positionValue: 0,
          profitContribution: 0
        }
      })

      // 场景2: 绩效提升10%
      const improvedBonus = await this.simulateBonusWithPerformanceChange(employee, 1.1, currentPeriod)
      simulationResults.push({
        scenario: 'improved_10',
        name: '绩效提升10%',
        description: '如果个人绩效评分提升10%的奖金预测',
        bonusAmount: improvedBonus.totalAmount,
        breakdown: improvedBonus.breakdown,
        changes: {
          performance: improvedBonus.totalAmount - currentBonus.bonusData.totalBonus,
          positionValue: 0,
          profitContribution: 0
        }
      })

      // 场景3: 绩效提升20%
      const highImprovedBonus = await this.simulateBonusWithPerformanceChange(employee, 1.2, currentPeriod)
      simulationResults.push({
        scenario: 'improved_20',
        name: '绩效提升20%',
        description: '如果个人绩效评分提升20%的奖金预测',
        bonusAmount: highImprovedBonus.totalAmount,
        breakdown: highImprovedBonus.breakdown,
        changes: {
          performance: highImprovedBonus.totalAmount - currentBonus.bonusData.totalBonus,
          positionValue: 0,
          profitContribution: 0
        }
      })

      // 场景4: 晋升到更高职位
      if (scenarios.promotionPositionId) {
        const promotionBonus = await this.simulateBonusWithPositionChange(employee, scenarios.promotionPositionId, currentPeriod)
        simulationResults.push({
          scenario: 'promotion',
          name: '职位晋升',
          description: '如果晋升到更高职位的奖金预测',
          bonusAmount: promotionBonus.totalAmount,
          breakdown: promotionBonus.breakdown,
          changes: {
            performance: 0,
            positionValue: promotionBonus.totalAmount - currentBonus.bonusData.totalBonus,
            profitContribution: 0
          }
        })
      }

      // 场景5: 参与更多项目
      const projectBonus = await this.simulateAdditionalProjectBonus(employee._id, scenarios.additionalProjects || [])
      if (projectBonus.totalAmount > 0) {
        simulationResults.push({
          scenario: 'more_projects',
          name: '参与更多项目',
          description: '如果参与更多项目的奖金预测',
          bonusAmount: currentBonus.bonusData.totalBonus + projectBonus.totalAmount,
          breakdown: {
            ...currentBonus.bonusData.bonusBreakdown,
            project: currentBonus.bonusData.bonusBreakdown.project + projectBonus.totalAmount
          },
          changes: {
            performance: 0,
            positionValue: 0,
            profitContribution: projectBonus.totalAmount
          }
        })
      }

      return {
        user: {
          id: user._id,
          username: user.username,
          realName: user.realName
        },
        employee: {
          id: employee._id,
          name: employee.name,
          employeeNo: employee.employeeNo
        },
        currentBonusAmount: currentBonus.bonusData.totalBonus,
        simulations: simulationResults,
        recommendations: await this.generateBonusRecommendations(employee, simulationResults)
      }

    } catch (error) {
      logger.error('获取奖金模拟分析失败:', error)
      throw error
    }
  }

  /**
   * 获取个人改进建议
   * @param {string} userId - 用户ID
   */
  async getImprovementSuggestions(userId) {
    try {
      const user = await nedbService.getUserById(userId)
      if (!user) {
        throw new Error('用户不存在')
      }

      const employee = await this.getEmployeeByUserId(userId)
      if (!employee) {
        return {
          user: { id: user._id, username: user.username, realName: user.realName },
          employee: null,
          suggestions: [],
          message: '未找到关联的员工记录，无法提供改进建议'
        }
      }

      const currentPeriod = await this.getCurrentPeriod()
      const bonusOverview = await this.getPersonalBonusOverview(userId, currentPeriod)
      const performanceMetrics = await this.getPerformanceMetrics(employee._id, currentPeriod)

      const suggestions = []

      // 基于绩效表现的建议
      if (performanceMetrics && performanceMetrics.finalScore < 80) {
        suggestions.push({
          category: 'performance',
          title: '提升个人绩效评分',
          priority: 'high',
          impact: 'high',
          description: '当前绩效评分偏低，提升绩效可以直接增加奖金收入',
          actions: [
            '与直属上级讨论绩效改进计划',
            '参加相关技能培训课程',
            '主动承担更多工作职责',
            '改善工作质量和效率'
          ],
          potentialIncrease: await this.calculatePerformanceImprovementImpact(employee, performanceMetrics.finalScore, 85)
        })
      }

      // 基于项目参与的建议
      const projectParticipation = await this.getEmployeeProjectParticipation(employee._id, currentPeriod)
      if (projectParticipation.activeProjects < 2) {
        suggestions.push({
          category: 'projects',
          title: '增加项目参与度',
          priority: 'medium',
          impact: 'medium',
          description: '参与更多项目可以获得额外的项目奖金',
          actions: [
            '主动申请参与新项目',
            '提升项目相关技能',
            '在当前项目中承担更重要角色',
            '跨部门项目合作'
          ],
          potentialIncrease: await this.estimateProjectBonusOpportunity(employee)
        })
      }

      // 基于职业发展的建议
      const positionInfo = await this.getPositionInfo(employee.positionId)
      const higherPositions = await this.getAvailablePromotionPositions(employee)
      if (higherPositions.length > 0) {
        suggestions.push({
          category: 'career',
          title: '职业发展规划',
          priority: 'medium',
          impact: 'high',
          description: '职位晋升可以显著提升奖金水平',
          actions: [
            '制定职业发展计划',
            '提升岗位所需核心技能',
            '积累管理经验',
            '获得相关认证或资质'
          ],
          availablePositions: higherPositions,
          potentialIncrease: await this.calculatePromotionImpact(employee, higherPositions[0])
        })
      }

      // 基于三维模型的建议
      const threeDimensionalScore = await this.getThreeDimensionalScore(employee._id, currentPeriod)
      if (threeDimensionalScore) {
        // 利润贡献建议
        if (threeDimensionalScore.profitContribution < 0.7) {
          suggestions.push({
            category: 'profit_contribution',
            title: '提升利润贡献度',
            priority: 'high',
            impact: 'high',
            description: '提升个人对公司利润的贡献可以增加奖金分配比例',
            actions: [
              '关注业务结果和收入指标',
              '提高工作产出的业务价值',
              '优化工作流程降低成本',
              '参与高价值项目'
            ],
            currentScore: threeDimensionalScore.profitContribution,
            targetScore: 0.8,
            potentialIncrease: await this.calculateProfitContributionImpact(employee, 0.8)
          })
        }

        // 岗位价值建议
        if (threeDimensionalScore.positionValue < 0.75) {
          suggestions.push({
            category: 'position_value',
            title: '提升岗位价值',
            priority: 'medium',
            impact: 'medium',
            description: '通过技能提升和职责扩展来提高岗位价值',
            actions: [
              '学习新技术和工具',
              '承担更复杂的工作任务',
              '成为团队的技术专家',
              '分享知识和经验'
            ],
            currentScore: threeDimensionalScore.positionValue,
            targetScore: 0.85,
            potentialIncrease: await this.calculatePositionValueImpact(employee, 0.85)
          })
        }
      }

      // 基于历史数据的趋势建议
      const bonusHistory = await this.getBonusHistory(userId, employee._id, 6)
      const trendAnalysis = this.analyzeBonusTrend(bonusHistory)
      
      if (trendAnalysis.trend === 'declining') {
        suggestions.push({
          category: 'trend_reversal',
          title: '扭转奖金下降趋势',
          priority: 'high',
          impact: 'high',
          description: '最近几期奖金呈下降趋势，需要采取行动扭转',
          actions: [
            '分析奖金下降的根本原因',
            '制定针对性的改进计划',
            '寻求上级和HR的指导',
            '设定短期和长期目标'
          ],
          trendData: trendAnalysis
        })
      }

      // 排序建议（按优先级和影响力）
      suggestions.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        const impactOrder = { high: 3, medium: 2, low: 1 }
        
        const aScore = priorityOrder[a.priority] * impactOrder[a.impact]
        const bScore = priorityOrder[b.priority] * impactOrder[b.impact]
        
        return bScore - aScore
      })

      return {
        user: {
          id: user._id,
          username: user.username,
          realName: user.realName
        },
        employee: {
          id: employee._id,
          name: employee.name,
          employeeNo: employee.employeeNo,
          position: positionInfo
        },
        currentBonusAmount: bonusOverview.bonusData.totalBonus,
        currentPeriod,
        suggestions: suggestions.slice(0, 5), // 最多返回5个建议
        performanceInsights: {
          currentPerformance: performanceMetrics,
          threeDimensionalScore,
          projectParticipation,
          bonusTrend: trendAnalysis
        }
      }

    } catch (error) {
      logger.error('获取个人改进建议失败:', error)
      throw error
    }
  }

  /**
   * 计算个人奖金数据
   */
  async calculateBonusData(userId, employee, period) {
    try {
      // 如果员工信息不存在，返回默认值
      if (!employee) {
        console.log(`⚠️ 员工信息不存在，返回默认奖金数据`)
        return {
          regularBonus: null,
          projectBonus: null,
          totalBonus: 0,
          bonusBreakdown: {
            profitContribution: 0,
            positionValue: 0,
            performance: 0,
            projectBonus: 0
          }
        }
      }

      const regularBonus = await this.getRegularBonus(userId, employee.employeeNo, period)
      const projectBonus = await this.getProjectBonus(userId, employee._id, period)

      // 计算总奖金
      const totalBonus = (regularBonus?.totalAmount || 0) + (projectBonus?.totalAmount || 0)

      // 计算奖金构成
      const bonusBreakdown = {
        profitContribution: regularBonus?.profitContribution || 0,
        positionValue: regularBonus?.positionValue || 0,
        performance: regularBonus?.performance || 0,
        projectBonus: projectBonus?.totalAmount || 0  // 前端期望 projectBonus
      }

      return {
        regularBonus,
        projectBonus,
        totalBonus,
        bonusBreakdown
      }
    } catch (error) {
      console.error('计算奖金数据失败:', error)
      return {
        regularBonus: null,
        projectBonus: null,
        totalBonus: 0,
        bonusBreakdown: {
          profitContribution: 0,
          positionValue: 0,
          performance: 0,
          projectBonus: 0
        }
      }
    }
  }

  // ====== 辅助方法 ======

  /**
   * 通过用户ID获取员工记录
   */
  async getEmployeeByUserId(userId) {
    try {
      console.log(`🔍 开始查找用户 ${userId} 关联的员工记录`)
      
      // 获取用户信息
      const user = await nedbService.getUserById(userId)
      console.log(`👤 查询到的用户信息:`, {
        userId: userId,
        userFound: !!user,
        username: user?.username,
        realName: user?.realName,
        email: user?.email,
        employeeId: user?.employeeId
      })
      
      if (!user || !user.username) {
        console.log(`❌ 未找到用户信息或用户名为空`)
        return null
      }

      // 方法1: 优先通过用户表中的employeeId字段直接关联
      if (user.employeeId) {
        console.log(`🔗 尝试通过employeeId直接关联: ${user.employeeId}`)
        const employee = await nedbService.getEmployeeById(user.employeeId)
        if (employee) {
          console.log(`✅ 通过employeeId找到员工: ${employee.name}`)
          return employee
        } else {
          console.log(`⚠️ employeeId ${user.employeeId} 对应的员工不存在`)
        }
      }

      // 方法2: 通过用户名作为员工工号(employeeNo)匹配
      console.log(`🔍 尝试通过用户名作为员工工号匹配: ${user.username}`)
      const employee = await nedbService.findOne('employees', { employeeNo: user.username })
      if (employee) {
        console.log(`✅ 通过用户名匹配到员工: ${employee.name} (工号: ${employee.employeeNo})`)
        // 找到匹配的员工后，更新用户表的employeeId字段，建立关联
        await nedbService.updateUser(userId, { employeeId: employee._id })
        console.log(`🔗 已建立用户-员工关联: ${user.username} -> ${employee.name}`)
        return employee
      }

      // 方法3: 如果用户表中有realName字段，使用realName匹配员工姓名
      if (user.realName) {
        console.log(`🔍 尝试通过realName匹配员工姓名: ${user.realName}`)
        const employeeByName = await nedbService.findOne('employees', { name: user.realName })
        if (employeeByName) {
          console.log(`✅ 通过realName匹配到员工: ${employeeByName.name}`)
          // 找到匹配的员工后，更新用户表的employeeId字段，建立关联
          await nedbService.updateUser(userId, { employeeId: employeeByName._id })
          console.log(`🔗 已建立用户-员工关联: ${user.username} -> ${employeeByName.name}`)
          return employeeByName
        }
      }

      // 方法4: 通过邮箱匹配
      if (user.email) {
        console.log(`🔍 尝试通过邮箱匹配: ${user.email}`)
        const employeeByEmail = await nedbService.findOne('employees', { email: user.email })
        if (employeeByEmail) {
          console.log(`✅ 通过邮箱匹配到员工: ${employeeByEmail.name}`)
          // 找到匹配的员工后，更新用户表的employeeId字段，建立关联
          await nedbService.updateUser(userId, { employeeId: employeeByEmail._id })
          console.log(`🔗 已建立用户-员工关联: ${user.username} -> ${employeeByEmail.name}`)
          return employeeByEmail
        }
      }

      // 如果都没有找到，记录日志并返回null
      console.log(`❌ 用户 ${userId} 未找到关联的员工记录`)
      return null
    } catch (error) {
      console.error(`❌ 获取用户关联员工记录失败:`, error)
      logger.error('获取用户关联员工记录失败:', error)
      return null
    }
  }

  /**
   * 获取当前期间
   */
  async getCurrentPeriod() {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }

  /**
   * 获取部门信息
   */
  async getDepartmentInfo(departmentId) {
    if (!departmentId) return null
    try {
      const department = await nedbService.getDepartmentById(departmentId)
      return department ? {
        id: department._id,
        name: department.name,
        code: department.code
      } : null
    } catch (error) {
      return null
    }
  }

  /**
   * 获取职位信息
   */
  async getPositionInfo(positionId) {
    if (!positionId) return null
    try {
      const position = await nedbService.getPositionById(positionId)
      return position ? {
        id: position._id,
        name: position.name,
        level: position.level,
        baseSalary: position.baseSalary
      } : null
    } catch (error) {
      return null
    }
  }

  /**
   * 获取业务线信息
   */
  async getBusinessLineInfo(businessLineId) {
    if (!businessLineId) return null
    try {
      const businessLine = await nedbService.getBusinessLineById(businessLineId)
      return businessLine ? {
        id: businessLine._id,
        name: businessLine.name,
        code: businessLine.code
      } : null
    } catch (error) {
      return null
    }
  }

  /**
   * 获取常规奖金（基于三维模型的奖金分配结果）
   */
  async getRegularBonus(userId, employeeNo, period) {
    try {
      if (!employeeNo) {
        console.warn(`无员工编号，无法获取常规奖金`)
        return null
      }

      console.log(`📊 查找常规奖金: 员工编号=${employeeNo}, 期间=${period}`)

      // 查询奖金分配结果
      const bonusAllocation = await nedbService.findOne('bonusAllocationResults', {
        employeeNo: employeeNo.toString(),
        allocationPeriod: period
      })

      if (!bonusAllocation) {
        console.log(`未找到员工 ${employeeNo} 在期间 ${period} 的奖金分配结果`)
        
        // 尝试查找最近的奖金记录
        const recentAllocations = await nedbService.find('bonusAllocationResults', {
          employeeNo: employeeNo.toString()
        })
        
        if (recentAllocations && recentAllocations.length > 0) {
          const latest = recentAllocations
            .sort((a, b) => new Date(b.allocationDate) - new Date(a.allocationDate))[0]
          console.log(`找到最近的奖金记录: 期间=${latest.allocationPeriod}`)
        }
        
        return null
      }

      console.log(`✅ 找到常规奖金数据:`, {
        totalAmount: bonusAllocation.totalAmount,
        period: bonusAllocation.allocationPeriod,
        status: bonusAllocation.status
      })

      return {
        allocationId: bonusAllocation._id,
        period: bonusAllocation.allocationPeriod,
        totalAmount: parseFloat(bonusAllocation.totalAmount) || 0,
        profitContribution: parseFloat(bonusAllocation.profitContributionAmount) || 0,
        positionValue: parseFloat(bonusAllocation.positionValueAmount) || 0,
        performance: parseFloat(bonusAllocation.performanceAmount) || 0,
        baseAmount: parseFloat(bonusAllocation.baseAmount) || 0,
        performanceAmount: parseFloat(bonusAllocation.performanceAmount) || 0,
        adjustmentAmount: parseFloat(bonusAllocation.adjustmentAmount) || 0,
        finalScore: parseFloat(bonusAllocation.finalScore) || 0,
        rank: bonusAllocation.scoreRank || 0,
        allocationDate: bonusAllocation.allocationDate,
        status: bonusAllocation.status || 'calculated'
      }
    } catch (error) {
      console.error(`获取员工 ${employeeNo} 常规奖金失败:`, error.message)
      logger.error('获取常规奖金失败:', error)
      return null
    }
  }

  /**
   * 获取项目奖金
   */
  async getProjectBonus(userId, employeeId, period) {
    try {
      if (!employeeId) {
        console.warn(`无员工ID，无法获取项目奖金`)
        return null
      }

      console.log(`📊 查找项目奖金: 员工ID=${employeeId}, 期间=${period}`)

      // 查询该员工在指定期间的项目奖金分配
      const projectAllocations = await nedbService.find('projectBonusAllocations', {
        employeeId: employeeId.toString()
      })

      if (!projectAllocations || projectAllocations.length === 0) {
        console.log(`未找到员工 ${employeeId} 的项目奖金分配记录`)
        return null
      }

      // 过滤当前期间的项目奖金
      const currentPeriodAllocations = []
      console.log(`🔍 处理 ${projectAllocations.length} 条项目奖金分配记录`)
      
      for (const allocation of projectAllocations) {
        try {
          // 获取对应的项目奖金池信息来确定期间
          const pool = await nedbService.findOne('projectBonusPools', { _id: allocation.poolId })
          if (pool) {
            if (pool.period === period) {
              currentPeriodAllocations.push({
                ...allocation,
                projectName: pool.projectName || `项目${pool.projectId}`,
                poolTotalAmount: pool.totalAmount,
                period: pool.period
              })
              
              console.log(`✅ 匹配的项目奖金: 项目${pool.projectId}, 金额${allocation.bonusAmount}`)
            } else {
              console.log(`⏳ 跳过不同期间的项目: 项目${pool.projectId}, 期间${pool.period} vs ${period}`)
            }
          } else {
            console.warn(`⚠️ 未找到奖金池: ${allocation.poolId}`)
          }
        } catch (error) {
          console.error(`处理项目奖金分配 ${allocation._id} 时出错:`, error.message)
        }
      }

      if (currentPeriodAllocations.length === 0) {
        console.log(`员工 ${employeeId} 在期间 ${period} 没有项目奖金`)
        return null
      }

      const totalAmount = currentPeriodAllocations.reduce((sum, allocation) => 
        sum + (parseFloat(allocation.bonusAmount) || 0), 0)

      console.log(`✅ 找到项目奖金数据:`, {
        totalAmount,
        projectCount: currentPeriodAllocations.length
      })

      return {
        totalAmount: Math.round(totalAmount * 100) / 100,
        projectCount: currentPeriodAllocations.length,
        allocations: currentPeriodAllocations.map(allocation => ({
          projectId: allocation.projectId,
          projectName: allocation.projectName,
          amount: allocation.bonusAmount, // 前端API类型定义期望 amount
          role: allocation.role || '成员',
          status: allocation.status || 'active'
        })),
        period
      }
    } catch (error) {
      console.error(`获取员工 ${employeeId} 项目奖金失败:`, error.message)
      logger.error('获取项目奖金失败:', error)
      return null
    }
  }

  /**
   * 获取奖金历史记录
   */
  async getBonusHistory(userId, employeeId, limit = 12) {
    try {
      const history = []

      if (employeeId) {
        // 获取常规奖金历史
        const employee = await nedbService.getEmployeeById(employeeId)
        if (employee) {
          const regularHistory = await this.getRegularBonusHistory(employee.employeeNo, limit)
          
          // 获取项目奖金历史
          const projectHistory = await this.getProjectBonusHistory(employeeId, limit)
          
          // 合并历史记录
          return this.combineAndSortHistory(regularHistory, projectHistory)
        }
      }

      return []
    } catch (error) {
      logger.error('获取奖金历史失败:', error)
      return []
    }
  }

  /**
   * 获取常规奖金历史
   */
  async getRegularBonusHistory(employeeNo, limit = 12) {
    try {
      if (!employeeNo) return []

      const allocations = await nedbService.find('bonusAllocationResults', {
        employeeNo: employeeNo
      })

      return allocations
        .sort((a, b) => new Date(b.allocationDate) - new Date(a.allocationDate))
        .slice(0, limit)
        .map(allocation => ({
          type: 'regular',
          period: allocation.allocationPeriod,
          date: allocation.allocationDate,
          amount: allocation.totalAmount || 0,
          breakdown: {
            profitContribution: allocation.profitContributionAmount || 0,
            positionValue: allocation.positionValueAmount || 0,
            performance: allocation.performanceAmount || 0
          },
          score: allocation.finalScore,
          rank: allocation.scoreRank,
          status: allocation.status
        }))
    } catch (error) {
      logger.error('获取常规奖金历史失败:', error)
      return []
    }
  }

  /**
   * 获取项目奖金历史
   */
  async getProjectBonusHistory(employeeId, limit = 12) {
    try {
      if (!employeeId) return []

      const allocations = await nedbService.find('projectBonusAllocations', {
        employeeId: employeeId
      })

      const history = []
      for (const allocation of allocations) {
        const pool = await nedbService.findOne('projectBonusPools', { _id: allocation.poolId })
        if (pool) {
          history.push({
            type: 'project',
            period: pool.period,
            date: allocation.calculatedAt || allocation.createdAt,
            amount: allocation.bonusAmount || 0,
            projectId: pool.projectId,
            projectName: pool.projectName || `项目${pool.projectId}`,
            role: allocation.roleId,
            roleWeight: allocation.roleWeight,
            participationRatio: allocation.participationRatio,
            status: allocation.status
          })
        }
      }

      return history
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit)
    } catch (error) {
      logger.error('获取项目奖金历史失败:', error)
      return []
    }
  }

  /**
   * 合并并排序历史记录
   */
  combineAndSortHistory(regularHistory, projectHistory) {
    const combined = [...regularHistory, ...projectHistory]
    return combined.sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  /**
   * 计算历史汇总统计
   */
  calculateHistorySummary(history) {
    if (history.length === 0) {
      return {
        totalPeriods: 0,
        totalBonusReceived: 0,
        averageBonusPerPeriod: 0,
        highestBonus: { amount: 0, period: null },
        lowestBonus: { amount: 0, period: null }
      }
    }

    const totalBonus = history.reduce((sum, record) => sum + record.amount, 0)
    const amounts = history.map(record => record.amount)
    const maxAmount = Math.max(...amounts)
    const minAmount = Math.min(...amounts)

    return {
      totalPeriods: history.length,
      totalBonusReceived: totalBonus,
      averageBonusPerPeriod: totalBonus / history.length,
      highestBonus: {
        amount: maxAmount,
        period: history.find(r => r.amount === maxAmount)?.period
      },
      lowestBonus: {
        amount: minAmount,
        period: history.find(r => r.amount === minAmount)?.period
      }
    }
  }

  /**
   * 获取绩效指标
   */
  async getPerformanceMetrics(employeeId, period) {
    try {
      const assessment = await nedbService.findOne('performanceAssessments', {
        employeeId: employeeId,
        period: period
      })

      if (!assessment) return null

      return {
        finalScore: assessment.finalScore || 0,
        indicators: assessment.indicators || [],
        selfEvaluation: assessment.selfEvaluation || 0,
        supervisorEvaluation: assessment.supervisorEvaluation || 0,
        peerEvaluation: assessment.peerEvaluation || 0,
        status: assessment.status,
        evaluationDate: assessment.evaluationDate
      }
    } catch (error) {
      logger.error('获取绩效指标失败:', error)
      return null
    }
  }

  /**
   * 获取三维分数
   */
  async getThreeDimensionalScore(employeeId, period) {
    try {
      const result = await nedbService.findOne('threeDimensionalCalculationResults', {
        employeeId: employeeId,
        calculationPeriod: period
      })

      if (!result) return null

      return {
        profitContribution: result.profitContributionScore || 0,
        positionValue: result.positionValueScore || 0,
        performance: result.performanceScore || 0,
        finalScore: result.finalScore || 0,
        calculationDate: result.calculationDate
      }
    } catch (error) {
      logger.error('获取三维分数失败:', error)
      return null
    }
  }

  /**
   * 模拟绩效变化对奖金的影响
   */
  async simulateBonusWithPerformanceChange(employee, performanceMultiplier, period) {
    try {
      // 获取当前奖金数据
      const currentBonus = await this.getRegularBonus(null, employee.employeeNo, period)
      if (!currentBonus) {
        return { totalAmount: 0, breakdown: {} }
      }

      // 模拟绩效提升后的奖金
      const simulatedPerformanceAmount = (currentBonus.performance || 0) * performanceMultiplier
      const totalAmount = (currentBonus.profitContribution || 0) + 
                         (currentBonus.positionValue || 0) + 
                         simulatedPerformanceAmount

      return {
        totalAmount,
        breakdown: {
          profitContribution: currentBonus.profitContribution || 0,
          positionValue: currentBonus.positionValue || 0,
          performance: simulatedPerformanceAmount,
          project: 0
        }
      }
    } catch (error) {
      logger.error('模拟绩效变化失败:', error)
      return { totalAmount: 0, breakdown: {} }
    }
  }

  /**
   * 模拟职位变化对奖金的影响
   */
  async simulateBonusWithPositionChange(employee, newPositionId, period) {
    try {
      const currentBonus = await this.getRegularBonus(null, employee.employeeNo, period)
      if (!currentBonus) {
        return { totalAmount: 0, breakdown: {} }
      }

      const newPosition = await this.getPositionInfo(newPositionId)
      const currentPosition = await this.getPositionInfo(employee.positionId)

      if (!newPosition || !currentPosition) {
        return { totalAmount: 0, breakdown: {} }
      }

      // 假设职位价值提升比例基于基础薪资差异
      const positionValueMultiplier = (newPosition.baseSalary || currentPosition.baseSalary) / 
                                     (currentPosition.baseSalary || newPosition.baseSalary || 1)

      const simulatedPositionValue = (currentBonus.positionValue || 0) * positionValueMultiplier
      const totalAmount = (currentBonus.profitContribution || 0) + 
                         simulatedPositionValue + 
                         (currentBonus.performance || 0)

      return {
        totalAmount,
        breakdown: {
          profitContribution: currentBonus.profitContribution || 0,
          positionValue: simulatedPositionValue,
          performance: currentBonus.performance || 0,
          project: 0
        }
      }
    } catch (error) {
      logger.error('模拟职位变化失败:', error)
      return { totalAmount: 0, breakdown: {} }
    }
  }

  /**
   * 模拟额外项目奖金
   */
  async simulateAdditionalProjectBonus(employeeId, additionalProjects) {
    try {
      if (!additionalProjects || additionalProjects.length === 0) {
        return { totalAmount: 0, projects: [] }
      }

      let totalAmount = 0
      const projects = []

      for (const projectConfig of additionalProjects) {
        // 基于项目规模和角色估算奖金
        const estimatedAmount = (projectConfig.estimatedBudget || 100000) * 
                               (projectConfig.roleWeight || 0.1) * 
                               0.05 // 假设奖金占项目预算的5%

        totalAmount += estimatedAmount
        projects.push({
          projectId: projectConfig.projectId,
          estimatedAmount,
          role: projectConfig.role,
          participationRatio: projectConfig.participationRatio || 1
        })
      }

      return { totalAmount, projects }
    } catch (error) {
      logger.error('模拟额外项目奖金失败:', error)
      return { totalAmount: 0, projects: [] }
    }
  }

  /**
   * 生成奖金建议
   */
  async generateBonusRecommendations(employee, simulationResults) {
    const recommendations = []

    // 找出最佳提升方案
    const bestScenario = simulationResults
      .filter(s => s.scenario !== 'current')
      .sort((a, b) => b.bonusAmount - a.bonusAmount)[0]

    if (bestScenario) {
      recommendations.push({
        type: 'best_opportunity',
        title: '最佳提升机会',
        scenario: bestScenario.scenario,
        description: `通过${bestScenario.name}可以获得最大的奖金提升`,
        potentialIncrease: bestScenario.bonusAmount - simulationResults[0].bonusAmount,
        priority: 'high'
      })
    }

    // 短期建议
    recommendations.push({
      type: 'short_term',
      title: '短期行动建议',
      description: '可以立即开始的改进行动',
      actions: [
        '主动与上级讨论绩效目标',
        '参与团队的重要项目',
        '提高工作质量和效率'
      ],
      timeframe: '1-3个月',
      priority: 'high'
    })

    // 长期建议
    recommendations.push({
      type: 'long_term',
      title: '长期发展建议',
      description: '职业发展和能力提升建议',
      actions: [
        '制定职业发展规划',
        '提升核心技能和专业能力',
        '积累管理和领导经验'
      ],
      timeframe: '6-12个月',
      priority: 'medium'
    })

    return recommendations
  }

  /**
   * 分析奖金趋势
   */
  analyzeBonusTrend(history) {
    if (history.length < 3) {
      return { trend: 'insufficient_data', message: '历史数据不足以分析趋势' }
    }

    const recent = history.slice(0, 3).map(h => h.amount)
    const earlier = history.slice(3, 6).map(h => h.amount)

    const recentAvg = recent.reduce((sum, amt) => sum + amt, 0) / recent.length
    const earlierAvg = earlier.length > 0 ? 
      earlier.reduce((sum, amt) => sum + amt, 0) / earlier.length : recentAvg

    const changeRatio = (recentAvg - earlierAvg) / (earlierAvg || 1)

    let trend = 'stable'
    if (changeRatio > 0.1) trend = 'rising'
    else if (changeRatio < -0.1) trend = 'declining'

    return {
      trend,
      recentAverage: recentAvg,
      earlierAverage: earlierAvg,
      changeRatio,
      changeAmount: recentAvg - earlierAvg
    }
  }

  // 其他辅助计算方法的占位符
  async calculatePerformanceImprovementImpact(employee, currentScore, targetScore) {
    // 简化计算：假设绩效提升10分对应奖金增长5%
    const improvement = (targetScore - currentScore) / 10 * 0.05
    const currentBonus = await this.getRegularBonus(null, employee.employeeNo, await this.getCurrentPeriod())
    return (currentBonus?.totalAmount || 0) * improvement
  }

  async estimateProjectBonusOpportunity(employee) {
    // 简化估算：基于员工级别和公司平均项目奖金
    const position = await this.getPositionInfo(employee.positionId)
    const baseEstimate = (position?.baseSalary || 50000) * 0.1 // 基础薪资的10%
    return baseEstimate
  }

  async getAvailablePromotionPositions(employee) {
    // 简化实现：返回更高级别的岗位
    const allPositions = await nedbService.getPositions()
    const currentPosition = await this.getPositionInfo(employee.positionId)
    
    if (!currentPosition) return []
    
    return allPositions
      .filter(pos => (pos.level || 0) > (currentPosition.level || 0))
      .slice(0, 3) // 返回最多3个晋升机会
      .map(pos => ({
        id: pos._id,
        name: pos.name,
        level: pos.level,
        baseSalary: pos.baseSalary
      }))
  }

  async calculatePromotionImpact(employee, targetPosition) {
    // 简化计算：基于薪资差异估算奖金影响
    const currentPosition = await this.getPositionInfo(employee.positionId)
    if (!currentPosition || !targetPosition) return 0
    
    const salaryIncrease = (targetPosition.baseSalary || 0) - (currentPosition.baseSalary || 0)
    return salaryIncrease * 0.2 // 假设奖金增长为薪资增长的20%
  }

  async calculateProfitContributionImpact(employee, targetScore) {
    const currentBonus = await this.getRegularBonus(null, employee.employeeNo, await this.getCurrentPeriod())
    return (currentBonus?.profitContribution || 0) * (targetScore / 0.7 - 1)
  }

  async calculatePositionValueImpact(employee, targetScore) {
    const currentBonus = await this.getRegularBonus(null, employee.employeeNo, await this.getCurrentPeriod())
    return (currentBonus?.positionValue || 0) * (targetScore / 0.75 - 1)
  }

  async getEmployeeProjectParticipation(employeeId, period) {
    try {
      const projectMembers = await nedbService.getEmployeeProjectMembers(employeeId)
      const activeProjects = projectMembers.filter(pm => pm.status === 'approved').length
      
      return {
        activeProjects,
        totalProjects: projectMembers.length,
        currentPeriodProjects: projectMembers.filter(pm => {
          // 这里需要根据项目的期间来判断
          return pm.status === 'approved' // 简化实现
        }).length
      }
    } catch (error) {
      logger.error('获取员工项目参与情况失败:', error)
      return { activeProjects: 0, totalProjects: 0, currentPeriodProjects: 0 }
    }
  }
}

module.exports = new PersonalBonusService()