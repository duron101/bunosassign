const express = require('express')
const router = express.Router()
const bonusAllocationController = require('../controllers/bonusAllocationController')
const { authenticateToken } = require('../middlewares/auth')
const {
  checkBonusViewPermission,
  checkBonusCalculatePermission,
  checkBonusApprovePermission,
  checkBonusDistributePermission,
  checkBonusAdjustPermission
} = require('../middlewares/bonusManagementAuth')

/**
 * @swagger
 * /api/bonus-allocation:
 *   post:
 *     summary: 创建奖金分配
 *     tags: [奖金分配]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *               - employeeId
 *               - amount
 *             properties:
 *               projectId:
 *                 type: string
 *                 description: 项目ID
 *               employeeId:
 *                 type: string
 *                 description: 员工ID
 *               amount:
 *                 type: number
 *                 description: 奖金金额
 *               reason:
 *                 type: string
 *                 description: 分配原因
 *     responses:
 *       200:
 *         description: 创建成功
 *       400:
 *         description: 参数错误
 *       403:
 *         description: 权限不足
 *       500:
 *         description: 服务器错误
 */
router.post('/', authenticateToken, checkBonusDistributePermission, bonusAllocationController.createBonusAllocation)

/**
 * @swagger
 * /api/bonus-allocation/{allocationId}/approve:
 *   put:
 *     summary: 审批奖金分配
 *     tags: [奖金分配]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: allocationId
 *         required: true
 *         schema:
 *           type: string
 *         description: 奖金分配ID
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
 *         description: 奖金分配不存在
 *       500:
 *         description: 服务器错误
 */
router.put('/:allocationId/approve', authenticateToken, checkBonusApprovePermission, bonusAllocationController.approveBonusAllocation)

/**
 * @swagger
 * /api/bonus-allocation:
 *   get:
 *     summary: 获取奖金分配列表
 *     tags: [奖金分配]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: 项目ID
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *         description: 部门ID
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *         description: 员工ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: 状态
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
router.get('/', authenticateToken, checkBonusViewPermission, bonusAllocationController.getBonusAllocations)

/**
 * @swagger
 * /api/bonus-allocation/{allocationId}:
 *   put:
 *     summary: 更新奖金分配
 *     tags: [奖金分配]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: allocationId
 *         required: true
 *         schema:
 *           type: string
 *         description: 奖金分配ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: 奖金金额
 *               reason:
 *                 type: string
 *                 description: 分配原因
 *     responses:
 *       200:
 *         description: 更新成功
 *       400:
 *         description: 参数错误
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 奖金分配不存在
 *       500:
 *         description: 服务器错误
 */
router.put('/:allocationId', authenticateToken, checkBonusDistributePermission, bonusAllocationController.updateBonusAllocation)

/**
 * @swagger
 * /api/bonus-allocation/{allocationId}:
 *   delete:
 *     summary: 删除奖金分配
 *     tags: [奖金分配]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: allocationId
 *         required: true
 *         schema:
 *           type: string
 *         description: 奖金分配ID
 *     responses:
 *       200:
 *         description: 删除成功
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 奖金分配不存在
 *       500:
 *         description: 服务器错误
 */
router.delete('/:allocationId', authenticateToken, checkBonusDistributePermission, bonusAllocationController.deleteBonusAllocation)

/**
 * @swagger
 * /api/bonus-allocation/stats:
 *   get:
 *     summary: 获取奖金统计信息
 *     tags: [奖金分配]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: 项目ID
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *         description: 部门ID
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
router.get('/stats', authenticateToken, checkBonusViewPermission, bonusAllocationController.getBonusStats)

/**
 * @swagger
 * /api/bonus-allocation/batch-approve:
 *   post:
 *     summary: 批量审批奖金分配
 *     tags: [奖金分配]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - allocationIds
 *               - approved
 *             properties:
 *               allocationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 奖金分配ID列表
 *               approved:
 *                 type: boolean
 *                 description: 是否批准
 *               comments:
 *                 type: string
 *                 description: 审批意见
 *     responses:
 *       200:
 *         description: 批量审批完成
 *       400:
 *         description: 参数错误
 *       403:
 *         description: 权限不足
 *       500:
 *         description: 服务器错误
 */
router.post('/batch-approve', authenticateToken, checkBonusApprovePermission, bonusAllocationController.batchApproveBonusAllocations)

// 保留原有的路由（如果需要的话）
// 注意：这些路由可能需要更新以使用新的权限中间件

module.exports = router