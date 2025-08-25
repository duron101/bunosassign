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
 * /api/personal-bonus:
 *   get:
 *     summary: 获取个人奖金信息
 *     tags: [个人奖金]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         schema:
 *           type: string
 *         description: 员工ID（可选，不传则获取当前用户）
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: 获取成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     employeeId:
 *                       type: string
 *                     employeeName:
 *                       type: string
 *                     totalBonus:
 *                       type: number
 *                     totalAllocations:
 *                       type: integer
 *                     bonusByProject:
 *                       type: array
 *                       items:
 *                         type: object
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

// 使用实际存在的控制器方法
router.get('/history', authenticateToken, personalBonusController.getPersonalBonusHistory)
router.get('/stats', authenticateToken, personalBonusController.getPersonalBonusStats)
router.get('/overview', authenticateToken, personalBonusController.getOverview)
router.get('/simulation', authenticateToken, personalBonusController.getSimulation)

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