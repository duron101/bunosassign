const express = require('express')
const router = express.Router()
const projectBonusController = require('../controllers/projectBonusController')
const { authenticateToken, authorize } = require('../middlewares/auth')

// 获取奖金池列表 - 需要基本认证
router.get('/pools', 
  authenticateToken, 
  projectBonusController.getBonusPools
)

// 获取单个奖金池详情 - 需要基本认证
router.get('/pools/:poolId', 
  authenticateToken, 
  projectBonusController.getBonusPoolDetail
)

// 创建项目奖金池 - 需要财务权限
router.post('/pools', 
  authenticateToken, 
  authorize(['finance', 'admin']), 
  projectBonusController.createBonusPool
)

// 编辑项目奖金池 - 需要财务权限
router.put('/pools/:poolId', 
  authenticateToken, 
  authorize(['finance', 'admin']), 
  projectBonusController.updateBonusPool
)

// 删除项目奖金池 - 需要财务权限
router.delete('/pools/:poolId', 
  authenticateToken, 
  authorize(['finance', 'admin']), 
  projectBonusController.deleteBonusPool
)

// 计算项目奖金分配 - 需要项目经理或HR权限
router.post('/pools/:poolId/calculate', 
  authenticateToken, 
  authorize(['project_manager', 'hr', 'admin']), 
  projectBonusController.calculateBonus
)

// 审批项目奖金分配 - 需要HR权限
router.post('/pools/:poolId/approve', 
  authenticateToken, 
  authorize(['hr', 'admin']), 
  projectBonusController.approveBonus
)

// 设置项目角色权重 - 需要项目经理权限
router.put('/projects/:projectId/role-weights', 
  authenticateToken, 
  authorize(['project_manager', 'admin']), 
  projectBonusController.setRoleWeights
)

// 获取项目角色权重
router.get('/projects/:projectId/role-weights', 
  authenticateToken, 
  projectBonusController.getRoleWeights
)

// 获取项目奖金分配详情
router.get('/projects/:projectId/periods/:period', 
  authenticateToken, 
  projectBonusController.getBonusDetails
)

module.exports = router