const express = require('express')
const router = express.Router()
const personalBonusController = require('../controllers/personalBonusController')
const { authenticateToken } = require('../middlewares/auth')
const {
  checkPersonalBonusPermission,
  checkBonusViewPermission,
  checkBonusApprovePermission,
  checkBonusAdjustPermission
} = require('../middlewares/bonusManagementAuth')

/**
 * @swagger
 * /api/personal-bonus/overview:
 *   get:
 *     summary: 获取个人奖金概览
 *     tags: [个人奖金]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *         description: 期间（格式：YYYY-MM）
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.get('/overview', authenticateToken, (req, res, next) => personalBonusController.getOverview(req, res, next))

/**
 * @swagger
 * /api/personal-bonus/trend:
 *   get:
 *     summary: 获取奖金趋势分析
 *     tags: [个人奖金]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: periods
 *         schema:
 *           type: integer
 *           default: 12
 *         description: 分析期间数
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.get('/trend', authenticateToken, (req, res, next) => personalBonusController.getBonusTrend(req, res, next))

/**
 * @swagger
 * /api/personal-bonus/performance:
 *   get:
 *     summary: 获取绩效详情
 *     tags: [个人奖金]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *         description: 期间（格式：YYYY-MM）
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.get('/performance', authenticateToken, (req, res, next) => personalBonusController.getPerformanceDetail(req, res, next))

/**
 * @swagger
 * /api/personal-bonus/projects:
 *   get:
 *     summary: 获取项目参与详情
 *     tags: [个人奖金]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *         description: 期间（格式：YYYY-MM）
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.get('/projects', authenticateToken, (req, res, next) => personalBonusController.getProjectParticipation(req, res, next))

/**
 * @swagger
 * /api/personal-bonus/three-dimensional:
 *   get:
 *     summary: 获取三维分解详情
 *     tags: [个人奖金]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *         description: 期间（格式：YYYY-MM）
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.get('/three-dimensional', authenticateToken, (req, res, next) => personalBonusController.getThreeDimensionalDetail(req, res, next))

/**
 * @swagger
 * /api/personal-bonus/simulation:
 *   get:
 *     summary: 获取奖金模拟分析
 *     tags: [个人奖金]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: scenarios
 *         schema:
 *           type: string
 *         description: 模拟场景参数（JSON字符串）
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.get('/simulation', authenticateToken, (req, res, next) => personalBonusController.getSimulation(req, res, next))

/**
 * @swagger
 * /api/personal-bonus/simulation:
 *   post:
 *     summary: 提交奖金模拟分析
 *     tags: [个人奖金]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scenarios:
 *                 type: object
 *                 description: 模拟场景参数
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.post('/simulation', authenticateToken, (req, res, next) => personalBonusController.postSimulation(req, res, next))

/**
 * @swagger
 * /api/personal-bonus/improvement-suggestions:
 *   get:
 *     summary: 获取个人改进建议
 *     tags: [个人奖金]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.get('/improvement-suggestions', authenticateToken, (req, res, next) => personalBonusController.getImprovementSuggestions(req, res, next))

/**
 * @swagger
 * /api/personal-bonus/peer-comparison:
 *   get:
 *     summary: 获取同级对比分析
 *     tags: [个人奖金]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *         description: 期间（格式：YYYY-MM）
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.get('/peer-comparison', authenticateToken, (req, res, next) => personalBonusController.getPeerComparison(req, res, next))

/**
 * @swagger
 * /api/personal-bonus/{employeeId}:
 *   get:
 *     summary: 获取个人奖金信息
 *     tags: [个人奖金]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: false
 *         schema:
 *           type: string
 *         description: 员工ID（可选，不传则获取当前用户）
 *     responses:
 *       200:
 *         description: 获取成功
 *       400:
 *         description: 请求参数错误
 *       403:
 *         description: 权限不足
 *       500:
 *         description: 服务器错误
 */
router.get('/:employeeId?', authenticateToken, checkPersonalBonusPermission, personalBonusController.getPersonalBonus)

/**
 * @swagger
 * /api/personal-bonus/{employeeId}/history:
 *   get:
 *     summary: 获取个人奖金历史
 *     tags: [个人奖金]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: 员工ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 获取成功
 *       403:
 *         description: 权限不足
 *       500:
 *         description: 服务器错误
 */
router.get('/:employeeId/history', authenticateToken, checkPersonalBonusPermission, personalBonusController.getPersonalBonusHistory)

/**
 * @swagger
 * /api/personal-bonus/{employeeId}/stats:
 *   get:
 *     summary: 获取个人奖金统计
 *     tags: [个人奖金]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: 员工ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期
 *     responses:
 *       200:
 *         description: 获取成功
 *       403:
 *         description: 权限不足
 *       500:
 *         description: 服务器错误
 */
router.get('/:employeeId/stats', authenticateToken, checkPersonalBonusPermission, personalBonusController.getPersonalBonusStats)

/**
 * @swagger
 * /api/personal-bonus/adjustment/request:
 *   post:
 *     summary: 申请奖金调整
 *     tags: [个人奖金]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - allocationId
 *               - adjustmentAmount
 *               - reason
 *             properties:
 *               allocationId:
 *                 type: string
 *                 description: 奖金分配ID
 *               adjustmentAmount:
 *                 type: number
 *                 description: 调整金额（正数为增加，负数为减少）
 *               reason:
 *                 type: string
 *                 description: 调整原因
 *     responses:
 *       200:
 *         description: 申请提交成功
 *       400:
 *         description: 参数错误
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 奖金分配不存在
 *       500:
 *         description: 服务器错误
 */
router.post('/adjustment/request', authenticateToken, checkBonusAdjustPermission, personalBonusController.requestBonusAdjustment)

/**
 * @swagger
 * /api/personal-bonus/adjustment/{adjustmentId}/approve:
 *   put:
 *     summary: 审批奖金调整申请
 *     tags: [个人奖金]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adjustmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: 调整申请ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - approved
 *             properties:
 *               approved:
 *                 type: boolean
 *                 description: 是否批准
 *               comments:
 *                 type: string
 *                 description: 审批意见
 *     responses:
 *       200:
 *         description: 审批完成
 *       400:
 *         description: 参数错误
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 调整申请不存在
 *       500:
 *         description: 服务器错误
 */
router.put('/adjustment/:adjustmentId/approve', authenticateToken, checkBonusApprovePermission, personalBonusController.approveBonusAdjustment)

/**
 * @swagger
 * /api/personal-bonus/adjustment/requests:
 *   get:
 *     summary: 获取奖金调整申请列表
 *     tags: [个人奖金]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: 申请状态
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 获取成功
 *       403:
 *         description: 权限不足
 *       500:
 *         description: 服务器错误
 */
router.get('/adjustment/requests', authenticateToken, checkBonusViewPermission, personalBonusController.getBonusAdjustmentRequests)

/**
 * 错误处理中间件
 */
router.use((error, req, res, next) => {
  console.error('Personal Bonus API Error:', error)
  
  if (error.message === '用户不存在') {
    return res.status(404).json({
      code: 404,
      message: '用户不存在',
      data: null
    })
  }
  
  if (error.message === '未找到关联的员工记录') {
    return res.status(404).json({
      code: 404,
      message: '未找到关联的员工记录，请联系HR进行账户关联',
      data: null
    })
  }
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      code: 400,
      message: '请求参数错误',
      data: null,
      errors: error.errors
    })
  }

  // 通用错误处理
  res.status(500).json({
    code: 500,
    message: '服务器内部错误，请稍后重试',
    data: null
  })
})

module.exports = router