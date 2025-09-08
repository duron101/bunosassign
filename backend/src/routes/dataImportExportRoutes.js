const express = require('express')
const router = express.Router()
const dataImportExportController = require('../controllers/dataImportExportController')
const { authenticate, authorize } = require('../middlewares/auth')

// ========== 数据导入路由 ==========

// 上传并解析文件
router.post('/upload', 
  authenticate, 
  authorize(['admin', 'hr']), 
  dataImportExportController.uploadAndParseFile
)

// 导入员工数据
router.post('/import/employees', 
  authenticate, 
  authorize(['admin', 'hr']), 
  dataImportExportController.importEmployeeData
)

// 导入利润数据
router.post('/import/profit-data', 
  authenticate, 
  authorize(['admin', 'hr', 'manager']), 
  dataImportExportController.importProfitData
)

// 导入绩效指标
router.post('/import/performance-indicators', 
  authenticate, 
  authorize(['admin', 'hr']), 
  dataImportExportController.importPerformanceIndicators
)

// ========== 数据导出路由 ==========

// 导出奖金分配结果
router.get('/export/bonus-allocation', 
  authenticate, 
  authorize(['admin', 'hr', 'manager']), 
  dataImportExportController.exportBonusAllocationResults
)

// 导出三维计算结果
router.get('/export/three-dimensional', 
  authenticate, 
  authorize(['admin', 'hr', 'manager']), 
  dataImportExportController.exportThreeDimensionalResults
)

// 批量导出报表
router.post('/export/batch', 
  authenticate, 
  authorize(['admin', 'hr', 'manager']), 
  dataImportExportController.batchExportReports
)

// ========== 模板管理路由 ==========

// 获取导入模板列表
router.get('/templates', 
  authenticate, 
  dataImportExportController.getImportTemplates
)

// 下载导入模板
router.get('/templates/:templateType/download', 
  authenticate, 
  authorize(['admin', 'hr', 'manager']), 
  dataImportExportController.downloadImportTemplate
)

// ========== 文件管理路由 ==========

// 获取导出文件列表
router.get('/files', 
  authenticate, 
  authorize(['admin', 'hr', 'manager']), 
  dataImportExportController.getExportFiles
)

// 清理导出文件
router.post('/files/cleanup', 
  authenticate, 
  authorize(['admin']), 
  dataImportExportController.cleanupExportFiles
)

module.exports = router