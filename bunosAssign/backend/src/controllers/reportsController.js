const nedbService = require('../services/nedbService')
const logger = require('../utils/logger')
const { PermissionValidator } = require('../config/permissions')

class ReportsController {
  // 获取报表列表
  async getReports(req, res, next) {
    try {
      const { 
        page = 1, 
        pageSize = 20, 
        category, 
        status, 
        search 
      } = req.query

      console.log('📊 获取报表列表请求:', { page, pageSize, category, status, search })

      // 构建查询条件
      let query = { status: { $ne: 'deleted' } }
      
      if (category && category !== 'all') {
        query.category = category
      }
      
      if (status) {
        query.status = status
      }

      // 获取所有报表记录
      let reports = await nedbService.find('reports', query)
      console.log('📋 查询到报表记录:', reports.length, '条')

      // 搜索过滤
      if (search) {
        reports = reports.filter(report => 
          report.name.toLowerCase().includes(search.toLowerCase()) ||
          (report.description && report.description.toLowerCase().includes(search.toLowerCase()))
        )
      }

      // 排序
      reports.sort((a, b) => {
        const dateA = new Date(a.createdAt)
        const dateB = new Date(b.createdAt)
        return dateB - dateA // 按创建时间倒序
      })

      // 分页处理
      const total = reports.length
      const offset = (page - 1) * pageSize
      const paginatedReports = reports.slice(offset, offset + parseInt(pageSize))

      // 数据格式化
      const formattedReports = paginatedReports.map(report => ({
        ...report,
        id: report._id,
        createdAt: new Date(report.createdAt).toLocaleString('zh-CN'),
        updatedAt: report.updatedAt ? new Date(report.updatedAt).toLocaleString('zh-CN') : null
      }))

      res.json({
        code: 200,
        data: {
          reports: formattedReports,
          pagination: {
            total: total,
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            totalPages: Math.ceil(total / pageSize)
          }
        },
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get reports error:', error)
      next(error)
    }
  }

  // 创建报表
  async createReport(req, res, next) {
    try {
      const {
        name,
        category,
        description,
        dateRange,
        fields,
        filters,
        format = 'excel'
      } = req.body

      if (!name || !category) {
        return res.status(400).json({
          code: 400,
          message: '报表名称和分类不能为空',
          data: null
        })
      }

      console.log('📊 创建报表请求:', { name, category, dateRange })

      // 创建报表记录
      const reportData = {
        name,
        category,
        description,
        dateRange,
        fields: fields || [],
        filters: filters || {},
        format,
        status: 'generating',
        createdBy: req.user.id,
        createdByName: req.user.username || req.user.realName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const report = await nedbService.insert('reports', reportData)
      
      // 异步生成报表内容
      setImmediate(() => {
        this.generateReportContent(report._id, reportData).catch(error => {
          logger.error(`报表生成失败 ${report._id}:`, error)
        })
      })

      logger.info(`报表创建成功: ${name}`)

      res.json({
        code: 200,
        data: {
          ...report,
          id: report._id
        },
        message: '报表创建成功，正在生成中'
      })

    } catch (error) {
      logger.error('Create report error:', error)
      next(error)
    }
  }

  // 生成报表内容
  async generateReportContent(reportId, reportData) {
    try {
      console.log(`📊 开始生成报表内容: ${reportId}`)
      
      let reportContent = []
      let size = 0

      // 根据报表类型生成内容
      switch (reportData.category) {
        case 'bonus':
          reportContent = await this.generateBonusReport(reportData)
          break
        case 'statistics':
          reportContent = await this.generateStatisticsReport(reportData)
          break
        case 'custom':
          reportContent = await this.generateCustomReport(reportData)
          break
        default:
          throw new Error('不支持的报表类型')
      }

      // 计算文件大小（模拟）
      size = JSON.stringify(reportContent).length * 2

      // 更新报表状态
      await nedbService.update('reports', 
        { _id: reportId }, 
        { 
          $set: { 
            status: 'completed', 
            size: size,
            content: reportContent,
            completedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } 
        }
      )

      console.log(`✅ 报表生成完成: ${reportId}`)

    } catch (error) {
      console.error(`❌ 报表生成失败: ${reportId}`, error)
      
      // 更新为失败状态
      await nedbService.update('reports', 
        { _id: reportId }, 
        { 
          $set: { 
            status: 'failed', 
            error: error.message,
            updatedAt: new Date().toISOString()
          } 
        }
      )
    }
  }

  // 生成奖金报表
  async generateBonusReport(reportData) {
    console.log('📊 生成奖金报表')
    
    // 获取奖金分配数据
    const bonusAllocations = await nedbService.find('bonusAllocations', {})
    
    // 获取员工信息
    const employees = await nedbService.find('employees', { status: 1 })
    
    // 获取部门信息
    const departments = await nedbService.find('departments', { status: 1 })
    
    // 合并数据生成报表
    const reportContent = bonusAllocations.map(allocation => {
      const employee = employees.find(emp => emp._id === allocation.employeeId)
      const department = employee ? departments.find(dept => dept._id === employee.departmentId) : null
      
      return {
        employeeId: allocation.employeeId,
        employeeName: employee?.realName || '未知',
        department: department?.name || '未知',
        position: employee?.position || '未知',
        baseAmount: allocation.baseAmount || 0,
        performanceBonus: allocation.performanceBonus || 0,
        totalBonus: allocation.totalAmount || 0,
        period: allocation.period || '未知',
        calculationDate: allocation.createdAt
      }
    })

    return reportContent
  }

  // 生成统计报表
  async generateStatisticsReport(reportData) {
    console.log('📊 生成统计报表')
    
    // 获取各种统计数据
    const employeeCount = await nedbService.count('employees', { status: 1 })
    const departmentCount = await nedbService.count('departments', { status: 1 })
    const bonusPoolCount = await nedbService.count('bonusPools', {})
    const bonusAllocations = await nedbService.find('bonusAllocations', {})
    
    // 计算统计指标
    const totalBonusAmount = bonusAllocations.reduce((sum, allocation) => sum + (allocation.totalAmount || 0), 0)
    const avgBonusAmount = bonusAllocations.length > 0 ? totalBonusAmount / bonusAllocations.length : 0
    
    const reportContent = [{
      metric: '员工总数',
      value: employeeCount,
      unit: '人'
    }, {
      metric: '部门总数',
      value: departmentCount,
      unit: '个'
    }, {
      metric: '奖金池总数',
      value: bonusPoolCount,
      unit: '个'
    }, {
      metric: '总奖金金额',
      value: totalBonusAmount,
      unit: '元'
    }, {
      metric: '人均奖金',
      value: Math.round(avgBonusAmount),
      unit: '元'
    }]

    return reportContent
  }

  // 生成自定义报表
  async generateCustomReport(reportData) {
    console.log('📊 生成自定义报表')
    
    const { fields = [], filters = {} } = reportData
    
    // 根据用户选择的字段生成报表
    let reportContent = []
    
    if (fields.includes('employees')) {
      const employees = await nedbService.find('employees', { status: 1 })
      reportContent = reportContent.concat(employees.map(emp => ({
        type: 'employee',
        id: emp._id,
        name: emp.realName,
        department: emp.departmentName || '未知',
        position: emp.position || '未知',
        hireDate: emp.hireDate
      })))
    }
    
    if (fields.includes('bonus')) {
      const bonusAllocations = await nedbService.find('bonusAllocations', {})
      reportContent = reportContent.concat(bonusAllocations.map(allocation => ({
        type: 'bonus',
        employeeId: allocation.employeeId,
        amount: allocation.totalAmount,
        period: allocation.period,
        date: allocation.createdAt
      })))
    }

    return reportContent
  }

  // 删除报表
  async deleteReport(req, res, next) {
    try {
      const { id } = req.params

      const report = await nedbService.findOne('reports', { _id: id })
      if (!report) {
        return res.status(404).json({
          code: 404,
          message: '报表不存在',
          data: null
        })
      }

      // 软删除
      await nedbService.update('reports', 
        { _id: id }, 
        { $set: { status: 'deleted', deletedAt: new Date().toISOString() } }
      )

      logger.info(`报表删除成功: ${id}`)

      res.json({
        code: 200,
        data: null,
        message: '删除成功'
      })

    } catch (error) {
      logger.error('Delete report error:', error)
      next(error)
    }
  }

  // 下载报表
  async downloadReport(req, res, next) {
    try {
      const { id } = req.params

      const report = await nedbService.findOne('reports', { _id: id })
      if (!report || report.status !== 'completed') {
        return res.status(404).json({
          code: 404,
          message: '报表不存在或未完成',
          data: null
        })
      }

      // 生成下载内容
      const content = JSON.stringify(report.content || [], null, 2)
      const filename = `${report.name}_${new Date().toISOString().split('T')[0]}.json`

      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
      res.setHeader('Content-Type', 'application/json')
      res.send(content)

    } catch (error) {
      logger.error('Download report error:', error)
      next(error)
    }
  }

  // 预览报表
  async previewReport(req, res, next) {
    try {
      const { id } = req.params

      const report = await nedbService.findOne('reports', { _id: id })
      if (!report || report.status !== 'completed') {
        return res.status(404).json({
          code: 404,
          message: '报表不存在或未完成',
          data: null
        })
      }

      // 返回预览数据（前100条）
      const previewData = (report.content || []).slice(0, 100)

      res.json({
        code: 200,
        data: {
          preview: previewData,
          total: report.content ? report.content.length : 0,
          columns: this.getReportColumns(report.category)
        },
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Preview report error:', error)
      next(error)
    }
  }

  // 获取报表列定义
  getReportColumns(category) {
    const columnMap = {
      bonus: [
        { prop: 'employeeName', label: '员工姓名' },
        { prop: 'department', label: '部门' },
        { prop: 'position', label: '岗位' },
        { prop: 'baseAmount', label: '基础金额' },
        { prop: 'performanceBonus', label: '绩效奖金' },
        { prop: 'totalBonus', label: '总奖金' },
        { prop: 'period', label: '期间' }
      ],
      statistics: [
        { prop: 'metric', label: '指标名称' },
        { prop: 'value', label: '数值' },
        { prop: 'unit', label: '单位' }
      ],
      custom: [
        { prop: 'type', label: '类型' },
        { prop: 'name', label: '名称' },
        { prop: 'value', label: '值' }
      ]
    }

    return columnMap[category] || []
  }

  // 重新生成报表
  async regenerateReport(req, res, next) {
    try {
      const { id } = req.params

      const report = await nedbService.findOne('reports', { _id: id })
      if (!report) {
        return res.status(404).json({
          code: 404,
          message: '报表不存在',
          data: null
        })
      }

      // 更新状态为生成中
      await nedbService.update('reports', 
        { _id: id }, 
        { $set: { status: 'generating', updatedAt: new Date().toISOString() } }
      )

      // 异步重新生成
      setImmediate(() => {
        this.generateReportContent(id, report).catch(error => {
          logger.error(`报表重新生成失败 ${id}:`, error)
        })
      })

      res.json({
        code: 200,
        data: null,
        message: '开始重新生成报表'
      })

    } catch (error) {
      logger.error('Regenerate report error:', error)
      next(error)
    }
  }

  // 获取报表模板
  async getReportTemplates(req, res, next) {
    try {
      const templates = [
        {
          id: 1,
          name: '月度奖金汇总',
          description: '按部门统计月度奖金发放情况',
          type: 'bonus',
          category: 'bonus',
          fields: ['employeeName', 'department', 'totalBonus', 'period'],
          defaultFilters: { period: 'current_month' }
        },
        {
          id: 2,
          name: '员工奖金明细',
          description: '详细的员工奖金计算明细',
          type: 'detail',
          category: 'bonus',
          fields: ['employeeName', 'baseAmount', 'performanceBonus', 'totalBonus'],
          defaultFilters: {}
        },
        {
          id: 3,
          name: '绩效分析报告',
          description: '员工绩效评估和分析报告',
          type: 'analysis',
          category: 'statistics',
          fields: ['metric', 'value', 'unit'],
          defaultFilters: {}
        },
        {
          id: 4,
          name: '奖金分布统计',
          description: '奖金分布区间和统计分析',
          type: 'statistics',
          category: 'statistics',
          fields: ['metric', 'value', 'unit'],
          defaultFilters: {}
        }
      ]

      res.json({
        code: 200,
        data: templates,
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get report templates error:', error)
      next(error)
    }
  }

  // 使用模板创建报表
  async createReportFromTemplate(req, res, next) {
    try {
      const { templateId } = req.params
      const { dateRange, filters = {} } = req.body

      // 获取模板数据
      const templates = [
        {
          id: 1,
          name: '月度奖金汇总',
          description: '按部门统计月度奖金发放情况',
          type: 'bonus',
          category: 'bonus',
          fields: ['employeeName', 'department', 'totalBonus', 'period'],
          defaultFilters: { period: 'current_month' }
        },
        {
          id: 2,
          name: '员工奖金明细',
          description: '详细的员工奖金计算明细',
          type: 'detail', 
          category: 'bonus',
          fields: ['employeeName', 'baseAmount', 'performanceBonus', 'totalBonus'],
          defaultFilters: {}
        },
        {
          id: 3,
          name: '绩效分析报告',
          description: '员工绩效评估和分析报告',
          type: 'analysis',
          category: 'statistics',
          fields: ['metric', 'value', 'unit'],
          defaultFilters: {}
        },
        {
          id: 4,
          name: '奖金分布统计',
          description: '奖金分布区间和统计分析',
          type: 'statistics',
          category: 'statistics', 
          fields: ['metric', 'value', 'unit'],
          defaultFilters: {}
        }
      ]
      const template = templates.find(t => t.id === parseInt(templateId))
      
      if (!template) {
        return res.status(404).json({
          code: 404,
          message: '模板不存在',
          data: null
        })
      }

      // 使用模板创建报表
      const reportData = {
        name: `${template.name}_${new Date().toISOString().split('T')[0]}`,
        category: template.category,
        description: template.description,
        dateRange,
        fields: template.fields,
        filters: { ...template.defaultFilters, ...filters },
        format: 'excel'
      }

      // 调用创建报表方法
      req.body = reportData
      return this.createReport(req, res, next)

    } catch (error) {
      logger.error('Create report from template error:', error)
      next(error)
    }
  }

  // 查询个人奖金信息
  async queryPersonalBonus(req, res, next) {
    try {
      const { period, employeeId, employeeName } = req.query
      const currentUserId = req.user.id

      // 构建查询条件
      let employeeQuery = { status: 1 }
      
      if (employeeId) {
        employeeQuery._id = employeeId
      } else if (employeeName) {
        employeeQuery.realName = new RegExp(employeeName, 'i')
      } else {
        // 默认查询当前用户
        employeeQuery.userId = currentUserId
      }

      const employee = await nedbService.findOne('employees', employeeQuery)
      if (!employee) {
        return res.status(404).json({
          code: 404,
          message: '员工不存在',
          data: null
        })
      }

      // 查询奖金分配记录
      let bonusQuery = { employeeId: employee._id }
      if (period) {
        bonusQuery.period = period
      }

      const bonusAllocation = await nedbService.findOne('bonusAllocations', bonusQuery)
      
      // 构建返回数据
      const bonusInfo = {
        employeeId: employee._id,
        employeeName: employee.realName,
        department: employee.departmentName || '未知',
        position: employee.position || '未知',
        businessLine: employee.businessLineName || '未知',
        totalBonus: bonusAllocation?.totalAmount || 0,
        baseBonus: bonusAllocation?.baseAmount || 0,
        performanceBonus: bonusAllocation?.performanceBonus || 0,
        totalScore: bonusAllocation?.totalScore || 0,
        bonusRatio: bonusAllocation?.bonusRatio || 0,
        baseAmount: bonusAllocation?.baseAmount || 0,
        calculationDetails: bonusAllocation?.calculationDetails || [],
        compared: {
          monthlyGrowth: 0,
          yearlyGrowth: 0,
          departmentRanking: 1,
          companyRanking: 1
        },
        insights: [
          { id: 1, type: 'info', text: '本月奖金计算已完成' }
        ]
      }

      res.json({
        code: 200,
        data: bonusInfo,
        message: '查询成功'
      })

    } catch (error) {
      logger.error('Query personal bonus error:', error)
      next(error)
    }
  }

  // 导出个人奖金报告
  async exportPersonalBonusReport(req, res, next) {
    try {
      const { period, format = 'excel', content = [] } = req.body

      // 获取个人奖金数据
      req.query = { period }
      const bonusData = await this.queryPersonalBonus(req, { json: (data) => data }, () => {})

      if (!bonusData || bonusData.code !== 200) {
        return res.status(404).json({
          code: 404,
          message: '个人奖金数据不存在',
          data: null
        })
      }

      // 生成导出内容
      const exportContent = JSON.stringify(bonusData.data, null, 2)
      const filename = `个人奖金报告_${period || 'latest'}.json`

      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
      res.setHeader('Content-Type', 'application/json')
      res.send(exportContent)

    } catch (error) {
      logger.error('Export personal bonus report error:', error)
      next(error)
    }
  }

  // 获取员工历史奖金数据
  async getEmployeeBonusHistory(req, res, next) {
    try {
      const { employeeId } = req.params
      const { months = 12 } = req.query

      const bonusHistory = await nedbService.find('bonusAllocations', { 
        employeeId: employeeId 
      })

      // 按时间倒序排列并限制数量
      bonusHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      const limitedHistory = bonusHistory.slice(0, parseInt(months))

      const historyData = limitedHistory.map(allocation => ({
        period: allocation.period,
        totalAmount: allocation.totalAmount || 0,
        baseAmount: allocation.baseAmount || 0,
        performanceBonus: allocation.performanceBonus || 0,
        date: allocation.createdAt
      }))

      res.json({
        code: 200,
        data: historyData,
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get employee bonus history error:', error)
      next(error)
    }
  }

  // 获取员工绩效雷达图数据
  async getEmployeePerformanceRadar(req, res, next) {
    try {
      const { employeeId } = req.params
      const { period } = req.query

      // 查询员工绩效数据
      const performanceData = await nedbService.findOne('bonusAllocations', {
        employeeId: employeeId,
        period: period
      })

      const radarData = {
        indicators: [
          { name: '工作质量', max: 100 },
          { name: '工作效率', max: 100 },
          { name: '团队协作', max: 100 },
          { name: '创新能力', max: 100 },
          { name: '学习能力', max: 100 }
        ],
        data: [{
          value: [
            (performanceData?.qualityScore || 80),
            (performanceData?.efficiencyScore || 75),
            (performanceData?.collaborationScore || 85),
            (performanceData?.innovationScore || 70),
            (performanceData?.learningScore || 90)
          ],
          name: '当前绩效'
        }]
      }

      res.json({
        code: 200,
        data: radarData,
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get employee performance radar error:', error)
      next(error)
    }
  }
}

module.exports = new ReportsController()