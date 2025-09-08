const express = require('express')
const router = express.Router()
const profitDataController = require('../controllers/profitDataController')
const contributionCalculationController = require('../controllers/contributionCalculationController')
const { authenticate, authorize } = require('../middlewares/auth')

// 利润数据管理路由
// 获取利润数据列表
router.get('/data', authenticate, profitDataController.getProfitData)

// 获取利润数据详情
router.get('/data/:id', authenticate, profitDataController.getProfitDataDetail)

// 创建利润数据
router.post('/data', authenticate, authorize(['admin', 'finance']), profitDataController.createProfitData)

// 更新利润数据
router.put('/data/:id', authenticate, authorize(['admin', 'finance']), profitDataController.updateProfitData)

// 删除利润数据
router.delete('/data/:id', authenticate, authorize(['admin', 'finance']), profitDataController.deleteProfitData)

// 批量导入利润数据
router.post('/data/batch-import', authenticate, authorize(['admin', 'finance']), profitDataController.batchImportProfitData)

// 获取利润数据统计
router.get('/data/statistics', authenticate, profitDataController.getProfitDataStatistics)

// 获取期间选项
router.get('/data/periods', authenticate, profitDataController.getPeriodOptions)

// 贡献度计算路由
// 获取员工贡献度列表
router.get('/contributions', authenticate, contributionCalculationController.getEmployeeContributions)

// 获取贡献度详情
router.get('/contributions/:id', authenticate, contributionCalculationController.getContributionDetail)

// 计算员工贡献度
router.post('/contributions/calculate', authenticate, authorize(['admin', 'finance', 'manager']), contributionCalculationController.calculateEmployeeContribution)

// 批量计算贡献度
router.post('/contributions/batch-calculate', authenticate, authorize(['admin', 'finance']), contributionCalculationController.batchCalculateContributions)

// 审核贡献度
router.put('/contributions/:id/review', authenticate, authorize(['admin', 'finance', 'manager']), contributionCalculationController.reviewContribution)

// 获取贡献度统计
router.get('/contributions/statistics', authenticate, contributionCalculationController.getContributionStatistics)

// 获取项目贡献分析
router.get('/contributions/project-analysis', authenticate, contributionCalculationController.getProjectContributionAnalysis)

// 导出贡献度数据
router.get('/contributions/export', authenticate, authorize(['admin', 'finance', 'manager']), contributionCalculationController.exportContributions)

module.exports = router