const express = require('express')
const reportsController = require('../controllers/reportsController')
const { authenticate, authorize, logOperation } = require('../middlewares/auth')

const router = express.Router()

// 所有报表路由都需要认证
router.use(authenticate)

// 获取报表列表
router.get('/', 
  authorize(['report:view']),
  reportsController.getReports
)

// 创建报表
router.post('/', 
  authorize(['report:create', 'report:*']),
  logOperation('create', 'report'),
  reportsController.createReport
)

// 删除报表
router.delete('/:id', 
  authorize(['report:delete', 'report:*']),
  logOperation('delete', 'report'),
  reportsController.deleteReport
)

// 下载报表
router.get('/:id/download', 
  authorize(['report:view']),
  reportsController.downloadReport
)

// 预览报表
router.get('/:id/preview', 
  authorize(['report:view']),
  reportsController.previewReport
)

// 重新生成报表
router.post('/:id/regenerate', 
  authorize(['report:create', 'report:*']),
  logOperation('regenerate', 'report'),
  reportsController.regenerateReport
)

// 获取报表模板
router.get('/templates', 
  authorize(['report:view']),
  reportsController.getReportTemplates
)

// 使用模板创建报表
router.post('/templates/:templateId/generate', 
  authorize(['report:create', 'report:*']),
  logOperation('create', 'template_report'),
  reportsController.createReportFromTemplate
)

// 查询个人奖金信息
router.get('/personal-bonus', 
  authorize(['report:personal', 'report:view', 'bonus:view']),
  reportsController.queryPersonalBonus
)

// 导出个人奖金报告
router.post('/personal-bonus/export', 
  authorize(['report:export', 'report:*']),
  logOperation('export', 'personal_bonus'),
  reportsController.exportPersonalBonusReport
)

// 获取员工历史奖金数据
router.get('/employees/:employeeId/bonus-history', 
  authorize(['report:view', 'bonus:view']),
  reportsController.getEmployeeBonusHistory
)

// 获取员工绩效雷达图数据
router.get('/employees/:employeeId/performance-radar', 
  authorize(['report:view', 'employee:view']),
  reportsController.getEmployeePerformanceRadar
)

module.exports = router