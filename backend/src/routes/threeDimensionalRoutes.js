const express = require('express')
const router = express.Router()
const threeDimensionalController = require('../controllers/threeDimensionalController')
const { authenticate, authorize } = require('../middlewares/auth')

// ========== 权重配置管理路由 ==========

// 创建权重配置
router.post('/weight-configs', 
  authenticate, 
  authorize(['admin', 'hr']), 
  threeDimensionalController.createWeightConfig
)

// 获取权重配置列表
router.get('/weight-configs', 
  authenticate, 
  threeDimensionalController.getWeightConfigList
)

// 获取权重配置详情
router.get('/weight-configs/:id', 
  authenticate, 
  threeDimensionalController.getWeightConfigDetail
)

// 更新权重配置
router.put('/weight-configs/:id', 
  authenticate, 
  authorize(['admin', 'hr']), 
  threeDimensionalController.updateWeightConfig
)

// 删除权重配置
router.delete('/weight-configs/:id', 
  authenticate, 
  authorize(['admin', 'hr']), 
  threeDimensionalController.deleteWeightConfig
)

// 复制权重配置
router.post('/weight-configs/:id/copy', 
  authenticate, 
  authorize(['admin', 'hr']), 
  threeDimensionalController.copyWeightConfig
)

// ========== 三维计算功能路由 ==========

// 计算单个员工三维得分
router.post('/calculate-score', 
  authenticate, 
  authorize(['admin', 'hr', 'manager']), 
  threeDimensionalController.calculateEmployeeScore
)

// 批量计算员工三维得分
router.post('/batch-calculate', 
  authenticate, 
  authorize(['admin', 'hr']), 
  threeDimensionalController.batchCalculateScores
)

// 重新计算排名
router.post('/recalculate-rankings', 
  authenticate, 
  authorize(['admin', 'hr']), 
  threeDimensionalController.recalculateRankings
)

// ========== 计算结果管理路由 ==========

// 获取计算结果列表
router.get('/calculation-results', 
  authenticate, 
  threeDimensionalController.getCalculationResultList
)

// 获取计算结果详情
router.get('/calculation-results/:id', 
  authenticate, 
  threeDimensionalController.getCalculationResultDetail
)

// 更新计算结果
router.put('/calculation-results/:id', 
  authenticate, 
  authorize(['admin', 'hr', 'manager']), 
  threeDimensionalController.updateCalculationResult
)

// 审核计算结果
router.put('/calculation-results/:id/review', 
  authenticate, 
  authorize(['admin', 'hr', 'manager']), 
  threeDimensionalController.reviewCalculationResult
)

// ========== 统计分析路由 ==========

// 获取三维得分统计
router.get('/statistics', 
  authenticate, 
  threeDimensionalController.getScoreStatistics
)

// 获取趋势分析
router.get('/trend-analysis', 
  authenticate, 
  threeDimensionalController.getTrendAnalysis
)

// 导出计算结果
router.get('/export', 
  authenticate, 
  authorize(['admin', 'hr', 'manager']), 
  threeDimensionalController.exportCalculationResults
)

module.exports = router