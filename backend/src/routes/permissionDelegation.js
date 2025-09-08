/**
 * 权限委派路由
 * 定义权限委派相关的API端点
 */

const express = require('express')
const router = express.Router()
const permissionDelegationController = require('../controllers/permissionDelegationController')
const { authenticateToken } = require('../middlewares/auth')
const { PermissionValidator } = require('../config/permissions')

/**
 * @swagger
 * tags:
 *   name: PermissionDelegation
 *   description: 权限委派管理
 */

/**
 * @swagger
 * /api/permission-delegation:
 *   post:
 *     summary: 创建权限委派
 *     tags: [PermissionDelegation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - delegateeId
 *               - permissions
 *             properties:
 *               delegateeId:
 *                 type: string
 *                 description: 被委派者ID
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 委派权限列表
 *               resourceType:
 *                 type: string
 *                 description: 资源类型（可选）
 *               resourceId:
 *                 type: string
 *                 description: 资源ID（可选）
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 description: 委派开始时间（可选）
 *               endTime:
 *                 type: string
 *                 format: date-time
 *                 description: 委派结束时间（可选）
 *               reason:
 *                 type: string
 *                 description: 委派原因
 *               conditions:
 *                 type: object
 *                 description: 委派条件
 *     responses:
 *       200:
 *         description: 委派创建成功
 *       400:
 *         description: 参数错误
 *       403:
 *         description: 权限不足
 */
router.post('/', authenticateToken, permissionDelegationController.createDelegation)

/**
 * @swagger
 * /api/permission-delegation/{delegationId}/approve:
 *   put:
 *     summary: 审批权限委派
 *     tags: [PermissionDelegation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: delegationId
 *         required: true
 *         schema:
 *           type: string
 *         description: 委派ID
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
 *         description: 审批成功
 *       403:
 *         description: 权限不足
 */
router.put('/:delegationId/approve', authenticateToken, permissionDelegationController.approveDelegation)

/**
 * @swagger
 * /api/permission-delegation/{delegationId}/revoke:
 *   put:
 *     summary: 撤销权限委派
 *     tags: [PermissionDelegation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: delegationId
 *         required: true
 *         schema:
 *           type: string
 *         description: 委派ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: 撤销原因
 *     responses:
 *       200:
 *         description: 撤销成功
 *       403:
 *         description: 权限不足
 */
router.put('/:delegationId/revoke', authenticateToken, permissionDelegationController.revokeDelegation)

/**
 * @swagger
 * /api/permission-delegation/user/{userId}/permissions:
 *   get:
 *     summary: 获取用户的委派权限
 *     tags: [PermissionDelegation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 获取成功
 *       403:
 *         description: 权限不足
 */
router.get('/user/:userId/permissions', authenticateToken, permissionDelegationController.getUserDelegatedPermissions)

/**
 * @swagger
 * /api/permission-delegation/pending:
 *   get:
 *     summary: 获取待审批的委派列表
 *     tags: [PermissionDelegation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *       403:
 *         description: 权限不足
 */
router.get('/pending', authenticateToken, permissionDelegationController.getPendingDelegations)

/**
 * @swagger
 * /api/permission-delegation/history:
 *   get:
 *     summary: 获取委派历史
 *     tags: [PermissionDelegation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, active, expired, revoked]
 *         description: 委派状态
 *       - in: query
 *         name: resourceType
 *         schema:
 *           type: string
 *         description: 资源类型
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
 */
router.get('/history', authenticateToken, permissionDelegationController.getDelegationHistory)

/**
 * @swagger
 * /api/permission-delegation/cleanup:
 *   post:
 *     summary: 清理过期的委派
 *     tags: [PermissionDelegation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 清理完成
 *       403:
 *         description: 权限不足
 */
router.post('/cleanup', authenticateToken, permissionDelegationController.cleanupExpiredDelegations)

module.exports = router
