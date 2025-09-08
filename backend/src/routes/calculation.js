const express = require('express')
const { calculationController } = require('../controllers')
const { authenticate, authorize, logOperation } = require('../middlewares/auth')

const router = express.Router()

// 所有计算路由都需要认证
router.use(authenticate)

// 奖金池管理
router.post('/bonus-pools', 
  authorize(['calculation:create']),
  logOperation('create', 'bonus_pool'),
  calculationController.createBonusPool
)

router.get('/bonus-pools', 
  authorize(['calculation:read']),
  calculationController.getBonusPools
)

router.get('/bonus-pools/:id', 
  authorize(['calculation:read']),
  calculationController.getBonusPoolDetail
)

router.put('/bonus-pools/:id', 
  authorize(['calculation:update']),
  logOperation('update', 'bonus_pool'),
  calculationController.updateBonusPool
)

router.delete('/bonus-pools/:id', 
  authorize(['calculation:delete']),
  logOperation('delete', 'bonus_pool'),
  calculationController.deleteBonusPool
)

// 奖金计算
router.post('/bonus-calculations', 
  authorize(['calculation:execute']),
  logOperation('calculate', 'bonus'),
  calculationController.calculate
)

router.get('/bonus-calculations/:taskId', 
  authorize(['calculation:read']),
  calculationController.getResult
)

router.post('/bonus-calculations/simulate', 
  authorize(['calculation:simulate']),
  calculationController.simulate
)

// 统计和导出
router.get('/bonus-calculations/statistics', 
  authorize(['calculation:read']),
  calculationController.getStatistics
)

router.get('/bonus-pools/:id/export', 
  authorize(['calculation:export']),
  calculationController.exportResult
)

// 复制奖金池
router.post('/bonus-pools/:id/copy', 
  authorize(['calculation:create']),
  logOperation('copy', 'bonus_pool'),
  calculationController.copyBonusPool
)

// 获取可分配员工列表
router.get('/bonus-pools/:id/eligible-employees', 
  authorize(['calculation:read']),
  calculationController.getEligibleEmployees
)

// 预览计算结果
router.post('/bonus-calculations/preview', 
  authorize(['calculation:simulate']),
  calculationController.previewCalculation
)

module.exports = router