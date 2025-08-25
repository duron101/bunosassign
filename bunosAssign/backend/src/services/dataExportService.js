const XLSX = require('xlsx')
const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')
const moment = require('moment')
const logger = require('../utils/logger')

class DataExportService {

  /**
   * 导出数据到Excel
   * @param {Array} data - 数据数组
   * @param {Object} options - 导出选项
   * @returns {Object} 导出结果
   */
  async exportToExcel(data, options = {}) {
    try {
      const {
        fileName = 'export',
        sheetName = 'Sheet1',
        headers = null,
        outputPath = './exports',
        includeIndex = false,
        dateFormat = 'YYYY-MM-DD',
        numberFormat = '#,##0.00'
      } = options

      // 确保输出目录存在  
      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true })
      }

      // 处理数据
      let processedData = this.processDataForExport(data, {
        headers,
        includeIndex,
        dateFormat
      })

      // 创建工作簿
      const workbook = XLSX.utils.book_new()

      // 创建工作表
      const worksheet = XLSX.utils.json_to_sheet(processedData.data, {
        header: processedData.headers
      })

      // 设置列宽
      const columnWidths = this.calculateColumnWidths(processedData.data, processedData.headers)
      worksheet['!cols'] = columnWidths

      // 设置数字格式
      if (numberFormat) {
        this.applyNumberFormat(worksheet, processedData.data, numberFormat)
      }

      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

      // 生成文件名
      const timestamp = moment().format('YYYYMMDD_HHmmss')
      const fullFileName = `${fileName}_${timestamp}.xlsx`
      const filePath = path.join(outputPath, fullFileName)

      // 写入文件
      XLSX.writeFile(workbook, filePath)

      return {
        success: true,
        filePath,
        fileName: fullFileName,
        rowCount: processedData.data.length,
        fileSize: fs.statSync(filePath).size
      }

    } catch (error) {
      logger.error('导出Excel失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 导出数据到PDF
   * @param {Array} data - 数据数组  
   * @param {Object} options - 导出选项
   * @returns {Object} 导出结果
   */
  async exportToPDF(data, options = {}) {
    try {
      const {
        fileName = 'export',
        title = '数据报表',
        outputPath = './exports',
        pageSize = 'A4',
        orientation = 'portrait',
        headers = null,
        includeIndex = false,
        maxRowsPerPage = 30,
        showSummary = false
      } = options

      // 确保输出目录存在
      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true })
      }

      // 处理数据
      let processedData = this.processDataForExport(data, {
        headers,
        includeIndex,
        dateFormat: 'YYYY-MM-DD'
      })

      // 生成文件名
      const timestamp = moment().format('YYYYMMDD_HHmmss')
      const fullFileName = `${fileName}_${timestamp}.pdf`
      const filePath = path.join(outputPath, fullFileName)

      // 创建PDF文档
      const doc = new PDFDocument({
        size: pageSize,
        layout: orientation,
        margin: 50
      })

      // 管道到文件
      doc.pipe(fs.createWriteStream(filePath))

      // 添加标题
      doc.fontSize(18)
         .font('Helvetica-Bold')
         .text(title, { align: 'center' })
         .moveDown()

      // 添加生成时间
      doc.fontSize(10)
         .font('Helvetica')
         .text(`生成时间: ${moment().format('YYYY-MM-DD HH:mm:ss')}`, { align: 'right' })
         .moveDown()

      // 计算表格布局
      const tableLayout = this.calculatePDFTableLayout(
        processedData.headers, 
        doc.page.width - 100
      )

      // 分页渲染数据
      let currentPage = 1
      let rowsOnCurrentPage = 0
      
      // 绘制表头
      this.drawPDFTableHeader(doc, processedData.headers, tableLayout)
      rowsOnCurrentPage = 1

      // 绘制数据行
      for (let i = 0; i < processedData.data.length; i++) {
        const row = processedData.data[i]
        
        // 检查是否需要换页
        if (rowsOnCurrentPage >= maxRowsPerPage) {
          doc.addPage()
          currentPage++
          rowsOnCurrentPage = 0
          
          // 在新页面重新绘制表头
          this.drawPDFTableHeader(doc, processedData.headers, tableLayout)
          rowsOnCurrentPage = 1
        }

        // 绘制数据行
        this.drawPDFTableRow(doc, row, processedData.headers, tableLayout)
        rowsOnCurrentPage++
      }

      // 添加汇总信息
      if (showSummary) {
        doc.moveDown(2)
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('汇总信息:', { align: 'left' })
           .font('Helvetica')
           .text(`总记录数: ${processedData.data.length}`)
           .text(`总页数: ${currentPage}`)
      }

      // 完成PDF
      doc.end()

      // 等待文件写入完成
      await new Promise((resolve) => {
        doc.on('end', resolve)
      })

      return {
        success: true,
        filePath,
        fileName: fullFileName,
        rowCount: processedData.data.length,
        pageCount: currentPage,
        fileSize: fs.statSync(filePath).size
      }

    } catch (error) {
      logger.error('导出PDF失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 处理导出数据
   */
  processDataForExport(data, options = {}) {
    const { headers, includeIndex, dateFormat } = options
    
    if (!Array.isArray(data) || data.length === 0) {
      return { data: [], headers: [] }
    }

    // 确定表头
    let finalHeaders = headers
    if (!finalHeaders) {
      finalHeaders = Object.keys(data[0])
    }

    // 添加序号列
    if (includeIndex) {
      finalHeaders = ['序号', ...finalHeaders]
    }

    // 处理数据
    const processedData = data.map((row, index) => {
      const processedRow = {}
      
      // 添加序号
      if (includeIndex) {
        processedRow['序号'] = index + 1
      }

      // 处理每个字段
      finalHeaders.forEach(header => {
        if (header === '序号' && includeIndex) return
        
        let value = row[header]
        
        // 处理日期格式
        if (value instanceof Date) {
          value = moment(value).format(dateFormat)
        }
        
        // 处理null/undefined
        if (value === null || value === undefined) {
          value = ''
        }
        
        // 处理对象和数组
        if (typeof value === 'object' && value !== null) {
          value = JSON.stringify(value)
        }
        
        processedRow[header] = value
      })
      
      return processedRow
    })

    return {
      data: processedData,
      headers: finalHeaders
    }
  }

  /**
   * 计算Excel列宽
   */
  calculateColumnWidths(data, headers) {
    const widths = headers.map(header => {
      // 基于表头长度
      let maxWidth = String(header).length
      
      // 检查数据长度
      data.forEach(row => {
        const cellValue = String(row[header] || '')
        maxWidth = Math.max(maxWidth, cellValue.length)
      })
      
      // 限制最大最小宽度
      maxWidth = Math.min(Math.max(maxWidth, 8), 50)
      
      return { wch: maxWidth }
    })
    
    return widths
  }

  /**
   * 应用Excel数字格式
   */
  applyNumberFormat(worksheet, data, format) {
    const range = XLSX.utils.decode_range(worksheet['!ref'])
    
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
        const cell = worksheet[cellAddress]
        
        if (cell && typeof cell.v === 'number') {
          cell.z = format
        }
      }
    }
  }

  /**
   * 计算PDF表格布局
   */
  calculatePDFTableLayout(headers, availableWidth) {
    const minWidth = 60
    const totalHeaders = headers.length
    const avgWidth = availableWidth / totalHeaders
    
    return headers.map((header, index) => ({
      header,
      width: Math.max(minWidth, avgWidth),
      x: index * Math.max(minWidth, avgWidth)
    }))
  }

  /**
   * 绘制PDF表头
   */
  drawPDFTableHeader(doc, headers, layout) {
    const y = doc.y
    const headerHeight = 25
    
    // 绘制表头背景
    doc.rect(layout[0].x - 5, y, 
             layout[layout.length - 1].x + layout[layout.length - 1].width + 5, 
             headerHeight)
       .fillAndStroke('#f0f0f0', '#000000')
    
    // 绘制表头文本
    doc.fillColor('#000000')
       .fontSize(10)
       .font('Helvetica-Bold')
    
    layout.forEach(col => {
      doc.text(col.header, col.x, y + 5, {
        width: col.width,
        align: 'center',
        ellipsis: true
      })
    })
    
    doc.y = y + headerHeight
  }

  /**
   * 绘制PDF数据行
   */
  drawPDFTableRow(doc, row, headers, layout) {
    const y = doc.y
    const rowHeight = 20
    
    // 绘制行边框
    doc.rect(layout[0].x - 5, y, 
             layout[layout.length - 1].x + layout[layout.length - 1].width + 5, 
             rowHeight)
       .stroke('#cccccc')
    
    // 绘制数据
    doc.fillColor('#000000')
       .fontSize(9)
       .font('Helvetica')
    
    layout.forEach(col => {
      const value = String(row[col.header] || '')
      doc.text(value, col.x, y + 3, {
        width: col.width,
        align: 'left',
        ellipsis: true
      })
    })
    
    doc.y = y + rowHeight
  }

  /**
   * 批量导出多个工作表到Excel
   */
  async exportMultiSheetExcel(sheetsData, options = {}) {
    try {
      const {
        fileName = 'multi_export',
        outputPath = './exports'
      } = options

      // 确保输出目录存在
      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true })
      }

      // 创建工作簿
      const workbook = XLSX.utils.book_new()

      // 添加每个工作表
      for (const sheetData of sheetsData) {
        const {
          data,
          sheetName,
          headers = null
        } = sheetData

        // 处理数据
        const processedData = this.processDataForExport(data, { headers })

        // 创建工作表
        const worksheet = XLSX.utils.json_to_sheet(processedData.data, {
          header: processedData.headers
        })

        // 设置列宽
        const columnWidths = this.calculateColumnWidths(processedData.data, processedData.headers)
        worksheet['!cols'] = columnWidths

        // 添加到工作簿
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
      }

      // 生成文件名
      const timestamp = moment().format('YYYYMMDD_HHmmss')
      const fullFileName = `${fileName}_${timestamp}.xlsx`
      const filePath = path.join(outputPath, fullFileName)

      // 写入文件
      XLSX.writeFile(workbook, filePath)

      return {
        success: true,
        filePath,
        fileName: fullFileName,
        sheetCount: sheetsData.length,
        fileSize: fs.statSync(filePath).size
      }

    } catch (error) {
      logger.error('批量导出Excel失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 导出报表数据
   */
  async exportReport(reportType, data, options = {}) {
    const reportConfigs = {
      bonusAllocation: {
        title: '奖金分配报表',
        headers: [
          '员工姓名', '部门', '岗位', '分配期间', '原始得分', 
          '最终得分', '排名', '基础奖金', '绩效奖金', '调整金额', '总金额'
        ],
        fileName: 'bonus_allocation_report'
      },
      profitContribution: {
        title: '利润贡献度报表',
        headers: [
          '员工姓名', '部门', '项目', '期间', '直接贡献', 
          '工作量贡献', '质量贡献', '综合得分'
        ],
        fileName: 'profit_contribution_report'
      },
      performanceAssessment: {
        title: '绩效评估报表',
        headers: [
          '员工姓名', '部门', '岗位', '评估期间', '工作产出', 
          '工作质量', '工作效率', '协作能力', '综合得分'
        ],
        fileName: 'performance_assessment_report'
      }
    }

    const config = reportConfigs[reportType]
    if (!config) {
      throw new Error('不支持的报表类型')
    }

    const mergedOptions = {
      ...options,
      title: config.title,
      fileName: config.fileName,
      headers: config.headers,
      showSummary: true
    }

    // 根据格式选择导出方法
    if (options.format === 'pdf') {
      return await this.exportToPDF(data, mergedOptions)
    } else {
      return await this.exportToExcel(data, mergedOptions)
    }
  }

  /**
   * 清理导出文件
   */
  async cleanupExportFiles(retentionDays = 7) {
    try {
      const exportPath = './exports'
      if (!fs.existsSync(exportPath)) {
        return { success: true, deletedCount: 0 }
      }

      const cutoffDate = moment().subtract(retentionDays, 'days')
      const files = fs.readdirSync(exportPath)
      let deleteCount = 0

      for (const file of files) {
        const filePath = path.join(exportPath, file)
        const stats = fs.statSync(filePath)
        
        if (moment(stats.mtime).isBefore(cutoffDate)) {
          fs.unlinkSync(filePath)
          deleteCount++
        }
      }

      return {
        success: true,
        deletedCount: deleteCount
      }

    } catch (error) {
      logger.error('清理导出文件失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 获取导出文件列表
   */
  async getExportFiles() {
    try {
      const exportPath = './exports'
      if (!fs.existsSync(exportPath)) {
        return { success: true, files: [] }
      }

      const files = fs.readdirSync(exportPath)
      const fileList = files.map(file => {
        const filePath = path.join(exportPath, file)
        const stats = fs.statSync(filePath)
        
        return {
          fileName: file,
          filePath,
          fileSize: stats.size,
          createdAt: stats.mtime,
          extension: path.extname(file)
        }
      })

      // 按创建时间降序排列
      fileList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      return {
        success: true,
        files: fileList
      }

    } catch (error) {
      logger.error('获取导出文件列表失败:', error)
      return {
        success: false,
        error: error.message,
        files: []
      }
    }
  }
}

module.exports = new DataExportService()