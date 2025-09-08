const nedbService = require('./nedbService')
const logger = require('../utils/logger')

class ProjectBonusService {
  /**
   * 创建项目奖金池
   */
  async createProjectBonusPool(projectId, period, totalAmount, profitRatio, createdBy) {
    try {
      // 检查项目是否存在
      const project = await nedbService.getProjectById(projectId)
      if (!project) {
        throw new Error('项目不存在')
      }

      // 检查是否已经存在该期间的奖金池
      const existingPool = await nedbService.getProjectBonusPool(projectId, period)
      if (existingPool) {
        throw new Error('该期间的项目奖金池已存在')
      }

      const poolData = {
        projectId,
        period,
        totalAmount,
        profitRatio,
        status: 'pending', // pending/approved/distributed
        createdBy,
        createdAt: new Date()
      }

      const pool = await nedbService.createProjectBonusPool(poolData)
      logger.info(`创建项目奖金池成功: ${pool._id}`)
      return pool

    } catch (error) {
      logger.error('创建项目奖金池失败:', error)
      throw error
    }
  }

  /**
   * 计算项目奖金分配
   */
  async calculateProjectBonus(poolId) {
    try {
      // 验证输入参数
      if (!poolId) {
        throw new Error('项目奖金池ID不能为空')
      }

      // 获取奖金池信息
      const pool = await nedbService.findOne('projectBonusPools', { _id: poolId })
      if (!pool) {
        throw new Error(`项目奖金池不存在: ${poolId}`)
      }

      console.log(`📊 开始计算项目奖金: 项目${pool.projectId}, 期间${pool.period}, 总金额${pool.totalAmount}`)

      // 获取项目成员列表并进行详细校验
      let members = await nedbService.getProjectMembers(pool.projectId)
      
      if (!members) {
        console.warn(`项目 ${pool.projectId} 返回的成员列表为 null，尝试使用替代方法获取`)
        members = await nedbService.find('projectMembers', { projectId: pool.projectId })
      }
      
      if (!Array.isArray(members)) {
        console.error(`项目成员数据格式错误:`, typeof members, members)
        throw new Error('项目成员数据格式错误')
      }

      if (members.length === 0) {
        throw new Error(`项目 ${pool.projectId} 暂无成员，请先添加项目成员`)
      }

      // 获取已审批的成员，放宽条件以避免无人符合的问题
      const approvedMembers = members.filter(m => {
        // 基本条件: 必须有员工ID
        if (!m.employeeId) {
          console.warn(`成员 ${m._id} 缺少员工ID`)
          return false
        }

        // 状态校验: approved 或者 active
        const validStatuses = ['approved', 'active', 'confirmed']
        const hasValidStatus = validStatuses.includes(m.status)
        
        // 角色校验: 必须有角色或者有默认角色
        const hasRole = m.roleId || m.role || m.defaultRole
        
        if (!hasValidStatus) {
          console.warn(`成员 ${m._id} (员工${m.employeeId}) 状态不符合: ${m.status}`)
        }
        
        if (!hasRole) {
          console.warn(`成员 ${m._id} (员工${m.employeeId}) 缺少角色信息`)
          // 为没有角色的成员设置默认角色
          m.roleId = m.roleId || 'developer' // 设置默认角色
          m.defaultRoleAssigned = true
        }
        
        return hasValidStatus
      })
      
      console.log('🔍 项目成员状态分析:', {
        总成员数: members.length,
        已审批成员数: approvedMembers.length,
        成员详情: members.map(m => ({
          id: m._id,
          employeeId: m.employeeId,
          status: m.status,
          roleId: m.roleId,
          hasRole: !!(m.roleId || m.role || m.defaultRole),
          isApproved: ['approved', 'active', 'confirmed'].includes(m.status)
        }))
      })
      
      if (approvedMembers.length === 0) {
        // 提供更详细的错误信息
        const statusCounts = {}
        members.forEach(m => {
          statusCounts[m.status] = (statusCounts[m.status] || 0) + 1
        })
        
        const errorMessage = `项目 ${pool.projectId} 暂无符合条件的成员。` +
          `现有成员状态统计: ${JSON.stringify(statusCounts)}。` +
          `请检查成员状态是否为 'approved'、'active' 或 'confirmed'，` +
          `并确保每个成员都有角色信息。`
        
        throw new Error(errorMessage)
      }

      // 获取角色权重配置
      const roleWeights = await this.getProjectRoleWeights(pool.projectId)
      console.log(`📋 角色权重配置:`, roleWeights)
      
      // 计算每个成员的奖金
      const allocations = []
      let totalWeight = 0
      const validMembers = [] // 用于存储有效的成员和其权重

      console.log(`📋 开始计算成员权重...`)

      // 首先计算总权重并收集有效成员
      for (const member of approvedMembers) {
        try {
          const employee = await nedbService.getEmployeeById(member.employeeId)
          if (!employee) {
            console.warn(`未找到员工信息: ${member.employeeId}`)
            continue
          }

          // 获取角色权重，处理默认情况
          const roleId = member.roleId || 'developer' // 默认角色
          const roleWeight = roleWeights[roleId] || roleWeights['developer'] || 1.0
          
          // 获取绩效系数
          const performanceCoeff = await this.getEmployeePerformanceCoeff(member.employeeId, pool.period)
          
          // 获取参与比例
          const participationRatio = parseFloat(member.participationRatio) || 1.0
          
          // 计算最终权重
          const memberWeight = roleWeight * performanceCoeff * participationRatio
          
          if (memberWeight > 0) {
            totalWeight += memberWeight
            validMembers.push({
              member,
              employee,
              roleId,
              roleWeight,
              performanceCoeff,
              participationRatio,
              memberWeight
            })
            
            console.log(`成员 ${employee.name} (角色: ${roleId})：权重 = ${roleWeight} × ${performanceCoeff} × ${participationRatio} = ${memberWeight}`)
          } else {
            console.warn(`成员 ${employee.name} 的权重为0，将被跳过`)
          }
        } catch (error) {
          console.error(`处理成员 ${member.employeeId} 时出错:`, error.message)
        }
      }

      if (totalWeight <= 0 || validMembers.length === 0) {
        throw new Error(`项目成员总权重为0或没有有效成员，无法进行奖金分配`)
      }

      console.log(`📋 总权重: ${totalWeight}，有效成员: ${validMembers.length} 名`)

      // 然后计算每个成员的实际奖金
      console.log(`💰 开始奖金分配计算...`)
      
      for (const memberData of validMembers) {
        const { member, employee, roleId, roleWeight, performanceCoeff, participationRatio, memberWeight } = memberData
        
        // 计算奖金金额
        const bonusAmount = (pool.totalAmount * memberWeight / totalWeight)
        
        // 防止金额为负数或无效值
        const finalBonusAmount = Math.max(0, Math.round(bonusAmount * 100) / 100)

        const allocation = {
          poolId: pool._id,
          projectId: pool.projectId,
          memberId: member._id,
          employeeId: member.employeeId,
          employeeName: employee.name,
          roleId: roleId,
          roleWeight,
          performanceCoeff,
          participationRatio,
          calculatedWeight: memberWeight,
          bonusAmount: finalBonusAmount,
          status: 'calculated',
          calculatedAt: new Date(),
          defaultRoleAssigned: member.defaultRoleAssigned || false // 标记是否使用了默认角色
        }

        allocations.push(allocation)
        
        console.log(`✅ ${employee.name}: ${finalBonusAmount} 元 (权重比例: ${(memberWeight/totalWeight*100).toFixed(2)}%)`)
      }

      // 验证分配结果
      const totalAllocated = allocations.reduce((sum, allocation) => sum + allocation.bonusAmount, 0)
      const allocationDifference = Math.abs(totalAllocated - pool.totalAmount)
      
      if (allocationDifference > 1) { // 允许小于1元的误差
        console.warn(`奖金分配总额与奖金池总额不一致: 分配${totalAllocated}, 池${pool.totalAmount}, 差异${allocationDifference}`)
      }

      // 保存分配结果
      console.log(`💾 保存奖金分配结果...`)
      const savedAllocations = []
      
      for (const allocation of allocations) {
        try {
          const saved = await nedbService.createProjectBonusAllocation(allocation)
          savedAllocations.push(saved)
        } catch (error) {
          console.error(`保存分配结果失败:`, allocation.employeeName, error.message)
          throw new Error(`保存奖金分配结果失败: ${error.message}`)
        }
      }

      logger.info(`项目奖金计算完成，共分配给 ${allocations.length} 名成员，总金额 ${totalAllocated} 元`)
      
      return {
        poolId: pool._id,
        projectId: pool.projectId,
        period: pool.period,
        totalAmount: pool.totalAmount,
        totalAllocated,
        memberCount: allocations.length,
        allocations: savedAllocations,
        summary: {
          validMembers: validMembers.length,
          totalWeight,
          averageBonus: allocations.length > 0 ? totalAllocated / allocations.length : 0,
          maxBonus: allocations.length > 0 ? Math.max(...allocations.map(a => a.bonusAmount)) : 0,
          minBonus: allocations.length > 0 ? Math.min(...allocations.map(a => a.bonusAmount)) : 0
        }
      }

    } catch (error) {
      console.error('🚫 计算项目奖金失败:', {
        poolId,
        error: error.message,
        stack: error.stack
      })
      logger.error('计算项目奖金失败:', error)
      throw new Error(`项目奖金计算失败: ${error.message}`)
    }
  }

  /**
   * 获取项目角色权重配置
   */
  async getProjectRoleWeights(projectId) {
    try {
      if (!projectId) {
        console.warn('项目ID为空，使用默认角色权重')
        return this.getDefaultRoleWeights()
      }

      // 尝试获取项目特定的角色权重配置
      const projectWeights = await nedbService.findOne('projectRoleWeights', { 
        projectId: projectId.toString() 
      })
      
      if (projectWeights && projectWeights.weights && typeof projectWeights.weights === 'object') {
        // 验证权重数据的有效性
        const validWeights = {}
        for (const [role, weight] of Object.entries(projectWeights.weights)) {
          const numWeight = parseFloat(weight)
          if (!isNaN(numWeight) && numWeight > 0) {
            validWeights[role] = numWeight
          }
        }
        
        if (Object.keys(validWeights).length > 0) {
          console.log(`使用项目 ${projectId} 的专属角色权重:`, validWeights)
          return { ...this.getDefaultRoleWeights(), ...validWeights }
        }
      }

      // 如果没有项目特定配置，使用默认权重
      console.log(`项目 ${projectId} 没有专属角色权重，使用默认配置`)
      return this.getDefaultRoleWeights()
      
    } catch (error) {
      console.error(`获取项目 ${projectId} 角色权重失败:`, error.message)
      return this.getDefaultRoleWeights()
    }
  }

  /**
   * 获取默认角色权重
   */
  getDefaultRoleWeights() {
    return {
      // 管理类
      'project_manager': 3.5,   // 项目经理
      'tech_lead': 3.0,         // 技术负责人
      'team_lead': 2.8,         // 团队负责人
      
      // 开发类
      'senior_dev': 2.5,        // 高级开发工程师
      'developer': 2.0,         // 开发工程师
      'junior_dev': 1.5,        // 初级开发工程师
      'intern_dev': 1.0,        // 实习开发工程师
      
      // 测试类
      'test_lead': 2.5,         // 测试负责人
      'tester': 1.8,            // 测试工程师
      'junior_tester': 1.3,     // 初级测试工程师
      
      // 产品设计类
      'product_mgr': 2.5,       // 产品经理
      'ux_designer': 2.0,       // UX设计师
      'ui_designer': 1.8,       // UI设计师
      
      // 运维类
      'devops': 2.2,            // 运维工程师
      'dba': 2.0,               // 数据库管理员
      
      // 其他
      'analyst': 1.8,           // 分析师
      'consultant': 2.0,        // 咨询顾问
      'default': 1.5            // 默认角色
    }
  }

  /**
   * 获取员工绩效系数
   */
  async getEmployeePerformanceCoeff(employeeId, period) {
    try {
      if (!employeeId) {
        console.warn('员工ID为空，返回默认绩效系数')
        return 1.0
      }

      // 查找该期间的员工绩效评估
      const assessment = await nedbService.findOne('performanceAssessments', {
        employeeId: employeeId.toString(),
        period: period
      })

      if (assessment) {
        const finalScore = parseFloat(assessment.finalScore)
        
        if (isNaN(finalScore)) {
          console.warn(`员工 ${employeeId} 的绩效分数无效: ${assessment.finalScore}`)
          return 1.0
        }

        // 根据绩效分数计算系数（更合理的分段）
        if (finalScore >= 95) return 1.3      // 卓越
        if (finalScore >= 90) return 1.2      // 优秃
        if (finalScore >= 80) return 1.1      // 良好
        if (finalScore >= 70) return 1.0      // 合格
        if (finalScore >= 60) return 0.9      // 待改进
        if (finalScore >= 50) return 0.8      // 不合格
        return 0.7 // 严重不合格
      }

      // 如枟没有绩效数据，尝试查找相近期间的数据
      try {
        const recentAssessment = await nedbService.find('performanceAssessments', {
          employeeId: employeeId.toString()
        })
        
        if (recentAssessment && recentAssessment.length > 0) {
          // 使用最近的绩效评估
          const latest = recentAssessment
            .sort((a, b) => new Date(b.evaluationDate || b.createdAt) - new Date(a.evaluationDate || a.createdAt))[0]
          
          if (latest && latest.finalScore) {
            const finalScore = parseFloat(latest.finalScore)
            if (!isNaN(finalScore)) {
              console.log(`使用员工 ${employeeId} 的最近绩效数据: ${finalScore}`)
              
              // 返回但有所折扣，因为不是当期数据
              const baseCoeff = finalScore >= 90 ? 1.2 : finalScore >= 80 ? 1.1 : finalScore >= 70 ? 1.0 : finalScore >= 60 ? 0.9 : 0.8
              return Math.max(0.9, baseCoeff * 0.95) // 折扣5%
            }
          }
        }
      } catch (error) {
        console.warn(`获取员工 ${employeeId} 历史绩效数据失败:`, error.message)
      }

      // 如果没有任何绩效数据，默认系数为1.0
      console.log(`员工 ${employeeId} 没有绩效数据，使用默认系数 1.0`)
      return 1.0
    } catch (error) {
      console.error(`获取员工 ${employeeId} 绩效系数失败:`, error.message)
      return 1.0
    }
  }

  /**
   * 设置项目角色权重
   */
  async setProjectRoleWeights(projectId, weights, updatedBy) {
    try {
      // 验证权重总和（可选，根据业务需求）
      const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0)
      
      const weightData = {
        projectId,
        weights,
        totalWeight,
        updatedBy,
        updatedAt: new Date()
      }

      // 检查是否已存在配置
      const existing = await nedbService.findOne('projectRoleWeights', { projectId })
      
      if (existing) {
        await nedbService.update('projectRoleWeights', { projectId }, { $set: weightData })
      } else {
        weightData.createdAt = new Date()
        await nedbService.insert('projectRoleWeights', weightData)
      }

      logger.info(`设置项目角色权重成功: 项目 ${projectId}`)
      return weightData

    } catch (error) {
      logger.error('设置项目角色权重失败:', error)
      throw error
    }
  }

  /**
   * 获取项目奖金分配详情
   */
  async getProjectBonusDetails(projectId, period) {
    try {
      const pool = await nedbService.getProjectBonusPool(projectId, period)
      if (!pool) {
        return null
      }

      const allocations = await nedbService.getProjectBonusAllocations(pool._id)
      
      return {
        pool,
        allocations,
        summary: {
          totalAmount: pool.totalAmount,
          memberCount: allocations.length,
          averageBonus: allocations.length > 0 ? pool.totalAmount / allocations.length : 0
        }
      }
    } catch (error) {
      logger.error('获取项目奖金详情失败:', error)
      throw error
    }
  }

  /**
   * 审批项目奖金分配
   */
  async approveProjectBonusAllocation(poolId, approvedBy) {
    try {
      // 更新奖金池状态
      await nedbService.update('projectBonusPools', 
        { _id: poolId }, 
        { 
          $set: { 
            status: 'approved', 
            approvedBy, 
            approvedAt: new Date() 
          } 
        }
      )

      // 更新所有分配记录状态
      await nedbService.update('projectBonusAllocations', 
        { poolId }, 
        { 
          $set: { 
            status: 'approved', 
            approvedAt: new Date() 
          } 
        }
      )

      logger.info(`项目奖金分配审批完成: ${poolId}`)
      return true

    } catch (error) {
      logger.error('审批项目奖金分配失败:', error)
      throw error
    }
  }

  /**
   * 获取奖金池列表
   */
  async getBonusPools(filters = {}) {
    try {
      // 默认不查询已删除的记录
      const queryFilters = {
        ...filters,
        status: filters.status || { $ne: 'deleted' }
      }
      
      const pools = await nedbService.find('projectBonusPools', queryFilters)
      
      // 为每个奖金池添加项目信息
      const poolsWithProject = []
      for (const pool of pools) {
        const project = await nedbService.getProjectById(pool.projectId)
        const poolWithProject = {
          ...pool,
          projectName: project ? project.name : '未知项目',
          projectCode: project ? project.code : '',
          memberCount: 0 // TODO: 计算实际成员数量
        }
        poolsWithProject.push(poolWithProject)
      }
      
      return poolsWithProject
    } catch (error) {
      logger.error('获取奖金池列表失败:', error)
      throw error
    }
  }

  /**
   * 根据ID获取奖金池详情
   */
  async getBonusPoolById(poolId) {
    try {
      const pool = await nedbService.findOne('projectBonusPools', { _id: poolId })
      if (!pool) {
        throw new Error('奖金池不存在')
      }
      
      // 添加项目信息
      const project = await nedbService.getProjectById(pool.projectId)
      return {
        ...pool,
        projectName: project ? project.name : '未知项目',
        projectCode: project ? project.code : ''
      }
    } catch (error) {
      logger.error('获取奖金池详情失败:', error)
      throw error
    }
  }

  /**
   * 更新奖金池
   */
  async updateBonusPool(poolId, updateData) {
    try {
      const updatedAt = new Date()
      const dataWithTimestamp = {
        ...updateData,
        updatedAt
      }
      
      await nedbService.update('projectBonusPools', 
        { _id: poolId }, 
        { $set: dataWithTimestamp }
      )
      
      logger.info(`奖金池更新成功: ${poolId}`)
      
      // 返回更新后的奖金池
      return await this.getBonusPoolById(poolId)
    } catch (error) {
      logger.error('更新奖金池失败:', error)
      throw error
    }
  }

  /**
   * 删除奖金池
   */
  async deleteBonusPool(poolId, deletedBy) {
    try {
      // 软删除：设置删除标记
      await nedbService.update('projectBonusPools', 
        { _id: poolId }, 
        { 
          $set: { 
            status: 'deleted',
            deletedBy,
            deletedAt: new Date() 
          } 
        }
      )
      
      // 同时删除相关的分配记录
      await nedbService.update('projectBonusAllocations', 
        { poolId }, 
        { 
          $set: { 
            status: 'deleted',
            deletedAt: new Date() 
          } 
        }
      )
      
      logger.info(`奖金池删除成功: ${poolId}`)
      return true
    } catch (error) {
      logger.error('删除奖金池失败:', error)
      throw error
    }
  }
}

module.exports = new ProjectBonusService()