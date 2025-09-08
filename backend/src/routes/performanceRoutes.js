const express = require('express')
const router = express.Router()
const performanceController = require('../controllers/performanceController')
const { authenticate, authorize } = require('../middlewares/auth')

// ========== 绩效指标管理路由 ==========

// 获取绩效指标列表
router.get('/indicators', authenticate, performanceController.getIndicatorList)

// 创建绩效指标
router.post('/indicators', authenticate, authorize(['admin', 'hr']), performanceController.createIndicator)

// 更新绩效指标
router.put('/indicators/:id', authenticate, authorize(['admin', 'hr']), performanceController.updateIndicator)

// ========== 绩效评估管理路由 ==========

// 计算绩效评估
router.post('/assessments/calculate', authenticate, authorize(['admin', 'hr', 'manager']), performanceController.calculatePerformanceAssessment)

// 批量计算绩效评估
router.post('/assessments/batch-calculate', authenticate, authorize(['admin', 'hr']), performanceController.batchCalculateAssessments)

// 获取绩效评估列表
router.get('/assessments', authenticate, performanceController.getAssessmentList)

// 获取评估详情
router.get('/assessments/:id', authenticate, performanceController.getAssessmentDetail)

// 更新评估状态
router.put('/assessments/:id/status', authenticate, authorize(['admin', 'hr', 'manager']), performanceController.updateAssessmentStatus)

// 获取绩效趋势分析
router.get('/assessments/trend', authenticate, performanceController.getPerformanceTrend)

// ========== 指标数据管理路由 ==========

// 更新指标数据
router.put('/indicator-data/:id', authenticate, authorize(['admin', 'hr', 'manager', 'employee']), performanceController.updateIndicatorData)

// 审核指标数据
router.put('/indicator-data/:id/review', authenticate, authorize(['admin', 'hr', 'manager']), performanceController.reviewIndicatorData)

// ========== 统计分析路由 ==========

// 获取绩效统计
router.get('/statistics', authenticate, performanceController.getPerformanceStatistics)

// 导出绩效数据
router.get('/export', authenticate, authorize(['admin', 'hr', 'manager']), performanceController.exportPerformanceData)

module.exports = router