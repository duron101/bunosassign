const express = require('express')
const router = express.Router()
const positionValueController = require('../controllers/positionValueController')
const { authenticate, authorize } = require('../middlewares/auth')

// ========== 评估标准管理路由 ==========

// 获取评估标准列表
router.get('/criteria', authenticate, positionValueController.getCriteriaList)

// 创建评估标准
router.post('/criteria', authenticate, authorize(['admin', 'hr']), positionValueController.createCriteria)

// 更新评估标准
router.put('/criteria/:id', authenticate, authorize(['admin', 'hr']), positionValueController.updateCriteria)

// ========== 岗位价值评估路由 ==========

// 计算岗位价值
router.post('/assessments/calculate', authenticate, authorize(['admin', 'hr', 'manager']), positionValueController.calculatePositionValue)

// 批量计算岗位价值
router.post('/assessments/batch-calculate', authenticate, authorize(['admin', 'hr']), positionValueController.batchCalculatePositionValues)

// 获取评估列表
router.get('/assessments', authenticate, positionValueController.getAssessmentList)

// 获取评估详情
router.get('/assessments/:id', authenticate, positionValueController.getAssessmentDetail)

// 审核评估结果
router.put('/assessments/:id/review', authenticate, authorize(['admin', 'hr', 'manager']), positionValueController.reviewAssessment)

// 导出评估数据
router.get('/assessments/export', authenticate, authorize(['admin', 'hr', 'manager']), positionValueController.exportAssessments)

// ========== 市场数据管理路由 ==========

// 获取市场数据列表
router.get('/market-data', authenticate, positionValueController.getMarketDataList)

// 创建市场数据
router.post('/market-data', authenticate, authorize(['admin', 'hr']), positionValueController.createMarketData)

// 批量导入市场数据
router.post('/market-data/batch-import', authenticate, authorize(['admin', 'hr']), positionValueController.batchImportMarketData)

// ========== 统计分析路由 ==========

// 获取岗位价值统计
router.get('/statistics', authenticate, positionValueController.getPositionValueStatistics)

module.exports = router