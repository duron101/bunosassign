const express = require('express')
const simulationController = require('../controllers/simulationController')
const { authenticate, authorize, logOperation } = require('../middlewares/auth')

const router = express.Router()

// 所有模拟分析路由都需要认证
router.use(authenticate)

// 参数模拟
router.post('/parameter-simulation', 
  authorize(['simulation:run']),
  logOperation('simulate', 'parameter'),
  simulationController.runParameterSimulation
)

// 场景管理
router.post('/scenarios', 
  authorize(['simulation:create']),
  logOperation('create', 'scenario'),
  simulationController.saveScenario
)

router.get('/scenarios', 
  authorize(['simulation:view']),
  simulationController.getScenarios
)

router.delete('/scenarios/:id', 
  authorize(['simulation:delete']),
  logOperation('delete', 'scenario'),
  simulationController.deleteScenario
)

// 敏感性分析
router.post('/sensitivity-analysis', 
  authorize(['simulation:analyze']),
  logOperation('analyze', 'sensitivity'),
  simulationController.runSensitivityAnalysis
)

// 历史分析
router.get('/history-analysis', 
  authorize(['simulation:view']),
  simulationController.getHistoryAnalysis
)

module.exports = router