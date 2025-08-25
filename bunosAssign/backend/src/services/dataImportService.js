const XLSX = require('xlsx')
const fs = require('fs')
const path = require('path')
const { sequelize } = require('../models')
const logger = require('../utils/logger')

class DataImportService {

  /**
   * 解析Excel文件
   * @param {string} filePath - 文件路径
   * @param {Object} options - 解析选项
   * @returns {Object} 解析结果
   */
  async parseExcelFile(filePath, options = {}) {
    try {
      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        throw new Error('文件不存在')
      }

      // 读取Excel文件
      const workbook = XLSX.readFile(filePath, {
        cellDates: true,
        cellNF: false,
        cellText: false
      })

      // 获取工作表名称
      const sheetNames = workbook.SheetNames
      if (sheetNames.length === 0) {
        throw new Error('Excel文件中没有工作表')
      }

      // 默认读取第一个工作表，或指定的工作表
      const sheetName = options.sheetName || sheetNames[0]
      const worksheet = workbook.Sheets[sheetName]

      if (!worksheet) {
        throw new Error(`工作表 ${sheetName} 不存在`)
      }

      // 转换为JSON数据
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: options.header || 1,
        defval: null,
        blankrows: false,
        range: options.range
      })

      // 获取表头信息
      const headers = this.extractHeaders(worksheet, options.header || 1)

      return {
        success: true,
        data: jsonData,
        headers,
        sheetNames,
        rowCount: jsonData.length,
        fileName: path.basename(filePath)
      }

    } catch (error) {
      logger.error('解析Excel文件失败:', error)
      return {
        success: false,
        error: error.message,
        data: [],
        headers: [],
        sheetNames: [],
        rowCount: 0
      }
    }
  }

  /**
   * 提取表头信息
   */
  extractHeaders(worksheet, headerRow = 1) {
    const headers = []
    const range = XLSX.utils.decode_range(worksheet['!ref'])
    
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: headerRow - 1, c: col })
      const cell = worksheet[cellAddress]
      const headerValue = cell ? cell.v : `Column${col + 1}`
      headers.push({
        index: col,
        name: headerValue,
        key: this.sanitizeColumnName(headerValue)
      })
    }
    
    return headers
  }

  /**
   * 清理列名，生成有效的属性名
   */
  sanitizeColumnName(columnName) {
    return String(columnName)
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^\w\u4e00-\u9fa5]/g, '')
      .toLowerCase()
  }

  /**
   * 验证数据格式
   * @param {Array} data - 数据数组
   * @param {Object} schema - 验证模式
   * @returns {Object} 验证结果
   */
  validateData(data, schema) {
    const errors = []
    const warnings = []
    const validData = []

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowErrors = []
      const rowWarnings = []
      const validRow = {}

      // 验证必填字段
      for (const field of schema.required || []) {
        if (!row[field] && row[field] !== 0) {
          rowErrors.push(`第${i + 2}行：${field} 为必填字段`)
        }
      }

      // 验证字段类型和格式
      for (const [fieldName, fieldSchema] of Object.entries(schema.fields || {})) {
        const value = row[fieldName]
        
        if (value !== null && value !== undefined && value !== '') {
          const validation = this.validateField(value, fieldSchema, fieldName, i + 2)
          
          if (validation.error) {
            rowErrors.push(validation.error)
          }
          if (validation.warning) {
            rowWarnings.push(validation.warning)
          }
          
          validRow[fieldName] = validation.value
        } else if (fieldSchema.default !== undefined) {
          validRow[fieldName] = fieldSchema.default
        }
      }

      if (rowErrors.length > 0) {
        errors.push(...rowErrors)
      }
      if (rowWarnings.length > 0) {
        warnings.push(...rowWarnings)
      }
      
      if (rowErrors.length === 0) {
        validData.push(validRow)
      }
    }

    return {
      success: errors.length === 0,
      validData,
      errors,
      warnings,
      totalRows: data.length,
      validRows: validData.length,
      errorRows: data.length - validData.length
    }
  }

  /**
   * 验证单个字段
   */
  validateField(value, fieldSchema, fieldName, rowNumber) {
    let processedValue = value

    try {
      // 类型转换和验证
      switch (fieldSchema.type) {
        case 'string':
          processedValue = String(value).trim()
          if (fieldSchema.maxLength && processedValue.length > fieldSchema.maxLength) {
            return { error: `第${rowNumber}行：${fieldName} 长度超过${fieldSchema.maxLength}个字符` }
          }
          break

        case 'number':
          processedValue = Number(value)
          if (isNaN(processedValue)) {
            return { error: `第${rowNumber}行：${fieldName} 必须是数字` }
          }
          if (fieldSchema.min !== undefined && processedValue < fieldSchema.min) {
            return { error: `第${rowNumber}行：${fieldName} 不能小于${fieldSchema.min}` }
          }
          if (fieldSchema.max !== undefined && processedValue > fieldSchema.max) {
            return { error: `第${rowNumber}行：${fieldName} 不能大于${fieldSchema.max}` }
          }
          break

        case 'integer':
          processedValue = parseInt(value)
          if (isNaN(processedValue) || !Number.isInteger(processedValue)) {
            return { error: `第${rowNumber}行：${fieldName} 必须是整数` }
          }
          break

        case 'date':
          if (value instanceof Date) {
            processedValue = value
          } else {
            processedValue = new Date(value)
            if (isNaN(processedValue.getTime())) {
              return { error: `第${rowNumber}行：${fieldName} 日期格式无效` }
            }
          }
          break

        case 'boolean':
          if (typeof value === 'boolean') {
            processedValue = value
          } else {
            const stringValue = String(value).toLowerCase()
            if (['true', '1', 'yes', '是', '真'].includes(stringValue)) {
              processedValue = true
            } else if (['false', '0', 'no', '否', '假'].includes(stringValue)) {
              processedValue = false
            } else {
              return { error: `第${rowNumber}行：${fieldName} 布尔值格式无效` }
            }
          }
          break

        case 'email':
          processedValue = String(value).trim().toLowerCase()
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(processedValue)) {
            return { error: `第${rowNumber}行：${fieldName} 邮箱格式无效` }
          }
          break

        case 'phone':
          processedValue = String(value).replace(/\D/g, '')
          if (processedValue.length < 11) {
            return { error: `第${rowNumber}行：${fieldName} 手机号码格式无效` }
          }
          break

        case 'enum':
          if (fieldSchema.values && !fieldSchema.values.includes(value)) {
            return { error: `第${rowNumber}行：${fieldName} 值必须是 ${fieldSchema.values.join(', ')} 中的一个` }
          }
          break
      }

      // 自定义验证函数
      if (fieldSchema.validate && typeof fieldSchema.validate === 'function') {
        const customValidation = fieldSchema.validate(processedValue, value)
        if (customValidation !== true) {
          return { error: `第${rowNumber}行：${fieldName} ${customValidation}` }
        }
      }

      return { value: processedValue }

    } catch (error) {
      return { error: `第${rowNumber}行：${fieldName} 验证失败 - ${error.message}` }
    }
  }

  /**
   * 批量导入数据到数据库
   * @param {Array} data - 待导入数据
   * @param {Object} model - Sequelize模型
   * @param {Object} options - 导入选项
   * @returns {Object} 导入结果
   */
  async batchImportToDatabase(data, model, options = {}) {
    const transaction = await sequelize.transaction()
    
    try {
      const results = {
        success: true,
        imported: 0,
        updated: 0,
        skipped: 0,
        errors: []
      }

      const batchSize = options.batchSize || 100
      const updateFields = options.updateFields || []
      const uniqueFields = options.uniqueFields || []

      // 分批处理数据
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize)
        
        for (const record of batch) {
          try {
            // 添加创建者信息
            if (options.createdBy) {
              record.createdBy = options.createdBy
            }

            if (uniqueFields.length > 0 && options.allowUpdate) {
              // 尝试更新现有记录
              const whereClause = {}
              uniqueFields.forEach(field => {
                whereClause[field] = record[field]
              })

              const existingRecord = await model.findOne({
                where: whereClause,
                transaction
              })

              if (existingRecord) {
                // 更新记录
                const updateData = {}
                updateFields.forEach(field => {
                  if (record[field] !== undefined) {
                    updateData[field] = record[field]
                  }
                })
                updateData.updatedBy = options.createdBy

                await existingRecord.update(updateData, { transaction })
                results.updated++
              } else {
                // 创建新记录
                await model.create(record, { transaction })
                results.imported++
              }
            } else {
              // 直接创建新记录
              await model.create(record, { transaction })
              results.imported++
            }

          } catch (error) {
            logger.error(`导入第${i + results.imported + results.updated + results.skipped + 1}条记录失败:`, error)
            results.errors.push({
              record,
              error: error.message
            })
            results.skipped++

            // 如果错误太多，中断导入
            if (results.errors.length > (options.maxErrors || 50)) {
              throw new Error(`错误数量超过限制(${options.maxErrors || 50})，导入中断`)
            }
          }
        }
      }

      await transaction.commit()
      return results

    } catch (error) {
      await transaction.rollback()
      logger.error('批量导入数据失败:', error)
      throw new Error(`导入失败: ${error.message}`)
    }
  }

  /**
   * 获取导入模板
   * @param {string} templateType - 模板类型
   * @returns {Object} 模板信息
   */
  getImportTemplate(templateType) {
    const templates = {
      employee: {
        name: '员工信息导入模板',
        headers: [
          { name: '姓名', key: 'name', required: true },
          { name: '工号', key: 'employeeNumber', required: true },
          { name: '邮箱', key: 'email', required: true },
          { name: '手机号', key: 'phone', required: false },
          { name: '部门', key: 'departmentName', required: true },
          { name: '岗位', key: 'positionName', required: true },
          { name: '入职日期', key: 'hireDate', required: true },
          { name: '状态', key: 'status', required: false }
        ],
        schema: {
          required: ['name', 'employeeNumber', 'email', 'departmentName', 'positionName', 'hireDate'],
          fields: {
            name: { type: 'string', maxLength: 50 },
            employeeNumber: { type: 'string', maxLength: 20 },
            email: { type: 'email' },
            phone: { type: 'phone' },
            departmentName: { type: 'string', maxLength: 100 },
            positionName: { type: 'string', maxLength: 100 },
            hireDate: { type: 'date' },
            status: { type: 'enum', values: ['active', 'inactive'], default: 'active' }
          }
        }
      },
      profitData: {
        name: '利润数据导入模板',
        headers: [
          { name: '期间', key: 'period', required: true },
          { name: '业务线', key: 'businessLineName', required: true },
          { name: '项目名称', key: 'projectName', required: false },
          { name: '收入', key: 'revenue', required: true },
          { name: '成本', key: 'cost', required: true },
          { name: '备注', key: 'notes', required: false }
        ],
        schema: {
          required: ['period', 'businessLineName', 'revenue', 'cost'],
          fields: {
            period: { type: 'string', maxLength: 20 },
            businessLineName: { type: 'string', maxLength: 100 },
            projectName: { type: 'string', maxLength: 100 },
            revenue: { type: 'number', min: 0 },
            cost: { type: 'number', min: 0 },
            notes: { type: 'string', maxLength: 500 }
          }
        }
      },
      performanceIndicator: {
        name: '绩效指标导入模板',
        headers: [
          { name: '指标名称', key: 'name', required: true },
          { name: '指标代码', key: 'code', required: true },
          { name: '指标类别', key: 'category', required: true },
          { name: '计量类型', key: 'measurementType', required: true },
          { name: '权重', key: 'weight', required: true },
          { name: '目标值', key: 'targetValue', required: false },
          { name: '描述', key: 'description', required: false }
        ],
        schema: {
          required: ['name', 'code', 'category', 'measurementType', 'weight'],
          fields: {
            name: { type: 'string', maxLength: 100 },
            code: { type: 'string', maxLength: 50 },
            category: { type: 'enum', values: ['work_output', 'work_quality', 'work_efficiency', 'collaboration', 'innovation', 'leadership', 'learning', 'other'] },
            measurementType: { type: 'enum', values: ['quantitative', 'qualitative', 'binary', 'percentage'] },
            weight: { type: 'number', min: 0, max: 1 },
            targetValue: { type: 'number' },
            description: { type: 'string', maxLength: 500 }
          }
        }
      }
    }

    return templates[templateType] || null
  }

  /**
   * 生成Excel导入模板
   * @param {string} templateType - 模板类型
   * @param {string} outputPath - 输出路径
   * @returns {Object} 生成结果
   */
  async generateImportTemplate(templateType, outputPath) {
    try {
      const template = this.getImportTemplate(templateType)
      if (!template) {
        throw new Error('未找到指定的模板类型')
      }

      // 创建工作簿
      const workbook = XLSX.utils.book_new()

      // 创建表头数据
      const headers = template.headers.map(h => h.name)
      const sampleData = [headers]

      // 添加示例数据行
      const sampleRow = template.headers.map(h => {
        switch (h.key) {
          case 'name': return '张三'
          case 'employeeNumber': return 'EMP001'
          case 'email': return 'zhangsan@company.com'
          case 'phone': return '13800138000'
          case 'departmentName': return '技术部'
          case 'positionName': return '软件工程师'
          case 'hireDate': return '2024-01-01'
          case 'period': return '2024-03'
          case 'businessLineName': return '产品线A'
          case 'revenue': return 1000000
          case 'cost': return 800000
          case 'weight': return 0.2
          default: return ''
        }
      })
      sampleData.push(sampleRow)

      // 创建工作表
      const worksheet = XLSX.utils.aoa_to_sheet(sampleData)

      // 设置列宽
      const colWidths = template.headers.map(() => ({ wch: 15 }))
      worksheet['!cols'] = colWidths

      // 添加到工作簿
      XLSX.utils.book_append_sheet(workbook, worksheet, template.name)

      // 写入文件
      XLSX.writeFile(workbook, outputPath)

      return {
        success: true,
        filePath: outputPath,
        templateName: template.name
      }

    } catch (error) {
      logger.error('生成导入模板失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 获取支持的模板类型列表
   */
  getSupportedTemplates() {
    return [
      { type: 'employee', name: '员工信息导入模板', description: '用于批量导入员工基本信息' },
      { type: 'profitData', name: '利润数据导入模板', description: '用于批量导入利润数据' },
      { type: 'performanceIndicator', name: '绩效指标导入模板', description: '用于批量导入绩效指标定义' }
    ]
  }
}

module.exports = new DataImportService()