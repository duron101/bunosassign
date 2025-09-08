const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { 
  Employee, 
  Department, 
  Position, 
  BusinessLine, 
  ProfitData, 
  PerformanceIndicator,
  BonusAllocationResult,
  ThreeDimensionalCalculationResult
} = require('../models')
const dataImportService = require('../services/dataImportService')
const dataExportService = require('../services/dataExportService')
const logger = require('../utils/logger')

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = './uploads'
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now()
    const ext = path.extname(file.originalname)
    cb(null, `import_${timestamp}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB限制
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls', '.csv']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowedTypes.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('只支持Excel和CSV文件格式'))
    }
  }
})

class DataImportExportController {

  // ========== 数据导入功能 ==========

  /**
   * 上传并解析文件
   */
  async uploadAndParseFile(req, res) {
    try {
      upload.single('file')(req, res, async (err) => {
        if (err) {
          return res.status(400).json({
            code: 400,
            message: err.message
          })
        }

        if (!req.file) {
          return res.status(400).json({
            code: 400,
            message: '请选择要上传的文件'
          })
        }

        const { templateType } = req.body
        const filePath = req.file.path

        try {
          // 解析Excel文件
          const parseResult = await dataImportService.parseExcelFile(filePath, {
            sheetName: req.body.sheetName,
            header: parseInt(req.body.headerRow) || 1
          })

          if (!parseResult.success) {
            return res.status(400).json({
              code: 400,
              message: parseResult.error
            })
          }

          // 如果指定了模板类型，进行数据验证
          if (templateType) {
            const template = dataImportService.getImportTemplate(templateType)
            if (template) {
              const validation = dataImportService.validateData(parseResult.data, template.schema)
              parseResult.validation = validation
            }
          }

          logger.info(`用户${req.user.id}上传并解析文件: ${req.file.originalname}`)

          res.json({
            code: 200,
            message: '文件解析成功',
            data: {
              ...parseResult,
              fileId: path.basename(filePath, path.extname(filePath)),
              originalName: req.file.originalname
            }
          })

        } finally {
          // 清理临时文件
          setTimeout(() => {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath)
            }
          }, 300000) // 5分钟后删除
        }
      })
    } catch (error) {
      logger.error('上传并解析文件失败:', error)
      res.status(500).json({
        code: 500,
        message: '文件处理失败'
      })
    }
  }

  /**
   * 导入员工数据
   */
  async importEmployeeData(req, res) {
    try {
      const { data, options = {} } = req.body

      if (!Array.isArray(data) || data.length === 0) {
        return res.status(400).json({
          code: 400,
          message: '导入数据不能为空'
        })
      }

      // 验证数据格式
      const template = dataImportService.getImportTemplate('employee')
      const validation = dataImportService.validateData(data, template.schema)

      if (!validation.success) {
        return res.status(400).json({
          code: 400,
          message: '数据验证失败',
          data: {
            errors: validation.errors,
            warnings: validation.warnings
          }
        })
      }

      // 预处理数据：查找关联的部门和岗位ID
      const processedData = await this.preprocessEmployeeData(validation.validData)

      // 执行导入
      const importResult = await dataImportService.batchImportToDatabase(
        processedData,
        Employee,
        {
          createdBy: req.user.id,
          uniqueFields: ['employeeNumber'],
          updateFields: ['name', 'email', 'phone', 'departmentId', 'positionId', 'hireDate', 'status'],
          allowUpdate: options.allowUpdate || false,
          batchSize: 50,
          maxErrors: 10
        }
      )

      logger.info(`用户${req.user.id}导入员工数据: ${importResult.imported}条新增，${importResult.updated}条更新`)

      res.json({
        code: 200,
        message: '员工数据导入完成',
        data: importResult
      })

    } catch (error) {
      logger.error('导入员工数据失败:', error)
      res.status(500).json({
        code: 500,
        message: error.message || '导入失败'
      })
    }
  }

  /**
   * 导入利润数据
   */
  async importProfitData(req, res) {
    try {
      const { data, options = {} } = req.body

      if (!Array.isArray(data) || data.length === 0) {
        return res.status(400).json({
          code: 400,
          message: '导入数据不能为空'
        })
      }

      // 验证数据格式
      const template = dataImportService.getImportTemplate('profitData')
      const validation = dataImportService.validateData(data, template.schema)

      if (!validation.success) {
        return res.status(400).json({
          code: 400,
          message: '数据验证失败',
          data: {
            errors: validation.errors,
            warnings: validation.warnings
          }
        })
      }

      // 预处理数据：查找业务线ID
      const processedData = await this.preprocessProfitData(validation.validData)

      // 执行导入
      const importResult = await dataImportService.batchImportToDatabase(
        processedData,
        ProfitData,
        {
          createdBy: req.user.id,
          uniqueFields: ['period', 'businessLineId', 'projectName'],
          updateFields: ['revenue', 'cost', 'notes'],
          allowUpdate: options.allowUpdate || false,
          batchSize: 100,
          maxErrors: 20
        }
      )

      logger.info(`用户${req.user.id}导入利润数据: ${importResult.imported}条新增，${importResult.updated}条更新`)

      res.json({
        code: 200,
        message: '利润数据导入完成',
        data: importResult
      })

    } catch (error) {
      logger.error('导入利润数据失败:', error)
      res.status(500).json({
        code: 500,
        message: error.message || '导入失败'
      })
    }
  }

  /**
   * 导入绩效指标
   */
  async importPerformanceIndicators(req, res) {
    try {
      const { data, options = {} } = req.body

      if (!Array.isArray(data) || data.length === 0) {
        return res.status(400).json({
          code: 400,
          message: '导入数据不能为空'
        })
      }

      // 验证数据格式
      const template = dataImportService.getImportTemplate('performanceIndicator')
      const validation = dataImportService.validateData(data, template.schema)

      if (!validation.success) {
        return res.status(400).json({
          code: 400,
          message: '数据验证失败',
          data: {
            errors: validation.errors,
            warnings: validation.warnings
          }
        })
      }

      // 执行导入
      const importResult = await dataImportService.batchImportToDatabase(
        validation.validData,
        PerformanceIndicator,
        {
          createdBy: req.user.id,
          uniqueFields: ['code'],
          updateFields: ['name', 'category', 'measurementType', 'weight', 'targetValue', 'description'],
          allowUpdate: options.allowUpdate || false,
          batchSize: 50,
          maxErrors: 10
        }
      )

      logger.info(`用户${req.user.id}导入绩效指标: ${importResult.imported}条新增，${importResult.updated}条更新`)

      res.json({
        code: 200,
        message: '绩效指标导入完成',
        data: importResult
      })

    } catch (error) {
      logger.error('导入绩效指标失败:', error)
      res.status(500).json({
        code: 500,
        message: error.message || '导入失败'
      })
    }
  }

  // ========== 数据导出功能 ==========

  /**
   * 导出奖金分配结果
   */
  async exportBonusAllocationResults(req, res) {
    try {
      const { 
        format = 'excel',
        bonusPoolId,
        allocationPeriod,
        departmentId
      } = req.query

      const whereClause = {}
      if (bonusPoolId) whereClause.bonusPoolId = bonusPoolId
      if (allocationPeriod) whereClause.allocationPeriod = allocationPeriod
      if (departmentId) whereClause.departmentName = departmentId

      const results = await BonusAllocationResult.findAll({
        where: whereClause,
        include: [{
          model: Employee,
          include: [
            { model: Department, attributes: ['id', 'name'] },
            { model: Position, attributes: ['id', 'name', 'level'] }
          ]
        }],
        order: [['totalAmount', 'DESC']]
      })

      const exportData = results.map(r => ({
        员工姓名: r.employeeName,
        部门: r.departmentName,
        岗位: r.positionName,
        岗位等级: r.positionLevel,
        分配期间: r.allocationPeriod,
        原始得分: r.originalScore,
        最终得分: r.finalScore,
        得分排名: r.scoreRank,
        百分位排名: r.percentileRank,
        基础奖金: r.baseAmount,
        绩效奖金: r.performanceAmount,
        调整金额: r.adjustmentAmount,
        总奖金: r.totalAmount,
        审核状态: r.reviewStatus,
        发放状态: r.paymentStatus
      }))

      const exportResult = await dataExportService.exportReport(
        'bonusAllocation',
        exportData,
        {
          format,
          fileName: `bonus_allocation_${allocationPeriod || 'all'}`
        }
      )

      if (!exportResult.success) {
        return res.status(500).json({
          code: 500,
          message: exportResult.error
        })
      }

      logger.info(`用户${req.user.id}导出奖金分配结果: ${results.length}条记录`)

      res.json({
        code: 200,
        message: '导出成功',
        data: exportResult
      })

    } catch (error) {
      logger.error('导出奖金分配结果失败:', error)
      res.status(500).json({
        code: 500,
        message: '导出失败'
      })
    }
  }

  /**
   * 导出三维计算结果
   */
  async exportThreeDimensionalResults(req, res) {
    try {
      const { 
        format = 'excel',
        period,
        weightConfigId,
        departmentId
      } = req.query

      const whereClause = {}
      if (period) whereClause.calculationPeriod = period
      if (weightConfigId) whereClause.weightConfigId = weightConfigId

      const includeClause = [{
        model: Employee,
        include: [
          { model: Department, attributes: ['id', 'name'] },
          { model: Position, attributes: ['id', 'name', 'level'] }
        ]
      }]

      if (departmentId) {
        includeClause[0].include[0].where = { id: departmentId }
      }

      const results = await ThreeDimensionalCalculationResult.findAll({
        where: whereClause,
        include: includeClause,
        order: [['finalScore', 'DESC']]
      })

      const exportData = results.map(r => ({
        员工姓名: r.Employee.name,
        部门: r.Employee.Department?.name,
        岗位: r.Employee.Position?.name,
        岗位等级: r.Employee.Position?.level,
        计算期间: r.calculationPeriod,
        利润贡献得分: r.profitContributionScore,
        岗位价值得分: r.positionValueScore,
        绩效表现得分: r.performanceScore,
        综合得分: r.totalScore,
        最终得分: r.finalScore,
        得分排名: r.scoreRank,
        百分位排名: r.percentileRank,
        审核状态: r.reviewStatus
      }))

      const exportResult = await dataExportService.exportReport(
        'threeDimensional',
        exportData,
        {
          format,
          fileName: `three_dimensional_${period || 'all'}`,
          title: '三维模型计算结果报表'
        }
      )

      if (!exportResult.success) {
        return res.status(500).json({
          code: 500,
          message: exportResult.error
        })
      }

      logger.info(`用户${req.user.id}导出三维计算结果: ${results.length}条记录`)

      res.json({
        code: 200,
        message: '导出成功',
        data: exportResult
      })

    } catch (error) {
      logger.error('导出三维计算结果失败:', error)
      res.status(500).json({
        code: 500,
        message: '导出失败'
      })
    }
  }

  /**
   * 批量导出多个报表
   */
  async batchExportReports(req, res) {
    try {
      const { reports, format = 'excel', period } = req.body

      if (!Array.isArray(reports) || reports.length === 0) {
        return res.status(400).json({
          code: 400,
          message: '请指定要导出的报表'
        })
      }

      const sheetsData = []

      for (const reportType of reports) {
        let data = []
        let sheetName = ''

        switch (reportType) {
          case 'bonusAllocation':
            const bonusResults = await BonusAllocationResult.findAll({
              where: period ? { allocationPeriod: period } : {},
              include: [{ model: Employee, include: [Department, Position] }],
              order: [['totalAmount', 'DESC']]
            })
            data = bonusResults.map(r => ({
              员工姓名: r.employeeName,
              部门: r.departmentName,
              总奖金: r.totalAmount,
              审核状态: r.reviewStatus
            }))
            sheetName = '奖金分配结果'
            break

          case 'threeDimensional':
            const tdResults = await ThreeDimensionalCalculationResult.findAll({
              where: period ? { calculationPeriod: period } : {},
              include: [{ model: Employee, include: [Department, Position] }],
              order: [['finalScore', 'DESC']]
            })
            data = tdResults.map(r => ({
              员工姓名: r.Employee.name,
              部门: r.Employee.Department?.name,
              最终得分: r.finalScore,
              排名: r.scoreRank
            }))
            sheetName = '三维计算结果'
            break
        }

        if (data.length > 0) {
          sheetsData.push({ data, sheetName })
        }
      }

      const exportResult = await dataExportService.exportMultiSheetExcel(sheetsData, {
        fileName: `batch_reports_${period || 'all'}`
      })

      if (!exportResult.success) {
        return res.status(500).json({
          code: 500,
          message: exportResult.error
        })
      }

      logger.info(`用户${req.user.id}批量导出报表: ${reports.join(', ')}`)

      res.json({
        code: 200,
        message: '批量导出成功',
        data: exportResult
      })

    } catch (error) {
      logger.error('批量导出报表失败:', error)
      res.status(500).json({
        code: 500,
        message: '批量导出失败'
      })
    }
  }

  // ========== 模板管理 ==========

  /**
   * 获取导入模板列表
   */
  async getImportTemplates(req, res) {
    try {
      const templates = dataImportService.getSupportedTemplates()
      
      res.json({
        code: 200,
        message: '获取模板列表成功',
        data: templates
      })
    } catch (error) {
      logger.error('获取导入模板列表失败:', error)
      res.status(500).json({
        code: 500,
        message: '获取模板列表失败'
      })
    }
  }

  /**
   * 下载导入模板
   */
  async downloadImportTemplate(req, res) {
    try {
      const { templateType } = req.params

      const template = dataImportService.getImportTemplate(templateType)
      if (!template) {
        return res.status(404).json({
          code: 404,
          message: '模板不存在'
        })
      }

      const outputPath = `./exports/template_${templateType}_${Date.now()}.xlsx`
      const result = await dataImportService.generateImportTemplate(templateType, outputPath)

      if (!result.success) {
        return res.status(500).json({
          code: 500,
          message: result.error
        })
      }

      // 设置下载响应头
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', `attachment; filename="${template.name}.xlsx"`)

      // 发送文件
      const fileStream = fs.createReadStream(result.filePath)
      fileStream.pipe(res)

      // 清理临时文件
      fileStream.on('end', () => {
        setTimeout(() => {
          if (fs.existsSync(result.filePath)) {
            fs.unlinkSync(result.filePath)
          }
        }, 5000)
      })

      logger.info(`用户${req.user.id}下载导入模板: ${templateType}`)

    } catch (error) {
      logger.error('下载导入模板失败:', error)
      res.status(500).json({
        code: 500,
        message: '下载模板失败'
      })
    }
  }

  /**
   * 获取导出文件列表
   */
  async getExportFiles(req, res) {
    try {
      const result = await dataExportService.getExportFiles()
      
      res.json({
        code: 200,
        message: '获取导出文件列表成功',
        data: result.files
      })
    } catch (error) {
      logger.error('获取导出文件列表失败:', error)
      res.status(500).json({
        code: 500,
        message: '获取文件列表失败'
      })
    }
  }

  /**
   * 清理导出文件
   */
  async cleanupExportFiles(req, res) {
    try {
      const { retentionDays = 7 } = req.body
      
      const result = await dataExportService.cleanupExportFiles(retentionDays)
      
      logger.info(`用户${req.user.id}清理导出文件: 删除${result.deletedCount}个文件`)
      
      res.json({
        code: 200,
        message: '文件清理完成',
        data: result
      })
    } catch (error) {
      logger.error('清理导出文件失败:', error)
      res.status(500).json({
        code: 500,
        message: '文件清理失败'
      })
    }
  }

  // ========== 辅助方法 ==========

  /**
   * 预处理员工数据
   */
  async preprocessEmployeeData(data) {
    const processedData = []

    for (const row of data) {
      const processedRow = { ...row }

      // 查找部门ID
      if (row.departmentName) {
        const department = await Department.findOne({
          where: { name: row.departmentName }
        })
        if (department) {
          processedRow.departmentId = department.id
          delete processedRow.departmentName
        } else {
          throw new Error(`部门"${row.departmentName}"不存在`)
        }
      }

      // 查找岗位ID
      if (row.positionName) {
        const position = await Position.findOne({
          where: { name: row.positionName }
        })
        if (position) {
          processedRow.positionId = position.id
          delete processedRow.positionName
        } else {
          throw new Error(`岗位"${row.positionName}"不存在`)
        }
      }

      processedData.push(processedRow)
    }

    return processedData
  }

  /**
   * 预处理利润数据
   */
  async preprocessProfitData(data) {
    const processedData = []

    for (const row of data) {
      const processedRow = { ...row }

      // 查找业务线ID
      if (row.businessLineName) {
        const businessLine = await BusinessLine.findOne({
          where: { name: row.businessLineName }
        })
        if (businessLine) {
          processedRow.businessLineId = businessLine.id
          delete processedRow.businessLineName
        } else {
          throw new Error(`业务线"${row.businessLineName}"不存在`)
        }
      }

      processedData.push(processedRow)
    }

    return processedData
  }
}

module.exports = new DataImportExportController()