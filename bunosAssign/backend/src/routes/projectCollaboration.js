const express = require('express')
const router = express.Router()
const projectCollaborationController = require('../controllers/projectCollaborationController')
const { authenticateToken } = require('../middlewares/auth')
const {
  checkPublishPermission,
  checkTeamApplyPermission,
  checkProjectViewPermission,
  checkProjectManagePermission,
  checkTeamManagePermission,
  checkMemberApprovalPermission,
  checkRoleAssignPermission,
  checkNotificationPermission
} = require('../middlewares/projectCollaborationAuth')

// 所有路由都需要认证
router.use(authenticateToken)

/**
 * @swagger
 * tags:
 *   name: ProjectCollaboration
 *   description: 项目协作管理
 */

/**
 * @swagger
 * /api/project-collaboration/publish:
 *   post:
 *     summary: 管理层发布项目
 *     tags: [ProjectCollaboration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *               - description
 *               - workContent
 *             properties:
 *               name:
 *                 type: string
 *                 description: 项目名称
 *               code:
 *                 type: string
 *                 description: 项目代码
 *               description:
 *                 type: string
 *                 description: 项目描述
 *               workContent:
 *                 type: string
 *                 description: 工作内容详情
 *               budget:
 *                 type: number
 *                 description: 项目预算
 *               bonusScale:
 *                 type: number
 *                 description: 预计奖金规模
 *               profitTarget:
 *                 type: number
 *                 description: 利润目标
 *               skillRequirements:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 技能要求
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: 开始日期
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: 结束日期
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *                 description: 优先级
 *               requirements:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [technical, business, quality]
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     priority:
 *                       type: string
 *                       enum: [low, medium, high, critical]
 *                     isMandatory:
 *                       type: boolean
 *                     acceptanceCriteria:
 *                       type: array
 *                       items:
 *                         type: string
 *     responses:
 *       201:
 *         description: 项目发布成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       403:
 *         description: 无权限
 */
router.post('/publish', checkPublishPermission, projectCollaborationController.publishCollaboration)

/**
 * @swagger
 * /api/project-collaboration/{projectId}/apply-team:
 *   post:
 *     summary: 项目经理申请团队组建
 *     tags: [ProjectCollaboration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: 项目ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teamName
 *               - teamDescription
 *               - applicationReason
 *               - members
 *             properties:
 *               teamName:
 *                 type: string
 *                 description: 团队名称
 *               teamDescription:
 *                 type: string
 *                 description: 团队描述
 *               applicationReason:
 *                 type: string
 *                 description: 申请理由
 *               estimatedCost:
 *                 type: number
 *                 description: 预估成本
 *               members:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     employeeId:
 *                       type: string
 *                       description: 员工ID
 *                     roleId:
 *                       type: string
 *                       description: 角色ID
 *                     roleName:
 *                       type: string
 *                       description: 角色名称
 *                     contributionWeight:
 *                       type: number
 *                       description: 贡献权重
 *                     estimatedWorkload:
 *                       type: number
 *                       description: 预估工作量占比
 *                     allocationPercentage:
 *                       type: number
 *                       description: 分配比例
 *                     reason:
 *                       type: string
 *                       description: 申请理由
 *     responses:
 *       201:
 *         description: 团队申请提交成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       403:
 *         description: 无权限
 *       404:
 *         description: 项目不存在
 */
router.post('/:projectId/apply-team', checkTeamApplyPermission, projectCollaborationController.applyForTeam)

/**
 * @swagger
 * /api/project-collaboration/applications/{applicationId}/approve:
 *   post:
 *     summary: 管理层审批团队申请
 *     tags: [ProjectCollaboration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *         description: 申请ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject, modify]
 *                 description: 审批操作
 *               comments:
 *                 type: string
 *                 description: 审批意见
 *               modifications:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     memberId:
 *                       type: string
 *                       description: 成员ID
 *                     action:
 *                       type: string
 *                       enum: [remove, modify]
 *                       description: 修改操作
 *                     reason:
 *                       type: string
 *                       description: 修改理由
 *     responses:
 *       200:
 *         description: 审批成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       403:
 *         description: 无权限
 *       404:
 *         description: 申请不存在
 */
router.post('/applications/:applicationId/approve', checkMemberApprovalPermission, projectCollaborationController.approveTeamApplication)

/**
 * @swagger
 * /api/project-collaboration/{projectId}:
 *   get:
 *     summary: 获取项目协作详情
 *     tags: [ProjectCollaboration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: 项目ID
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 *       404:
 *         description: 项目不存在
 */
router.get('/:projectId', checkProjectViewPermission, projectCollaborationController.getCollaborations)

/**
 * @swagger
 * /api/project-collaboration/applications/pending:
 *   get:
 *     summary: 获取待审批的团队申请列表
 *     tags: [ProjectCollaboration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每页数量
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: 项目ID（可选）
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: 申请状态（可选）
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
 *                     applications:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *       401:
 *         description: 未认证
 *       403:
 *         description: 无权限
 */
router.get('/applications/pending', checkMemberApprovalPermission, projectCollaborationController.getTeamApplications)

/**
 * @swagger
 * /api/project-collaboration/applications/my:
 *   get:
 *     summary: 获取我的申请列表
 *     tags: [ProjectCollaboration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每页数量
 *       - in: query
 *         name: projectName
 *         schema:
 *           type: string
 *         description: 项目名称（可选）
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: 申请状态（可选）
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
 *                     applications:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *       401:
 *         description: 未认证
 *       403:
 *         description: 无权限
 */
router.get('/applications/my', checkTeamApplyPermission, projectCollaborationController.getMyApplications)

/**
 * @swagger
 * /api/project-collaboration/notifications/my:
 *   get:
 *     summary: 获取我的通知
 *     tags: [ProjectCollaboration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 每页数量
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *           default: false
 *         description: 只显示未读通知
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 */
router.get('/notifications/my', checkNotificationPermission, projectCollaborationController.getMyNotifications)

/**
 * @swagger
 * /api/project-collaboration/notifications/{notificationId}/read:
 *   post:
 *     summary: 标记通知为已读
 *     tags: [ProjectCollaboration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: 通知ID
 *     responses:
 *       200:
 *         description: 标记成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 无权限
 *       404:
 *         description: 通知不存在
 */
router.post('/notifications/:notificationId/read', checkNotificationPermission, projectCollaborationController.markNotificationRead)

/**
 * @swagger
 * /api/project-collaboration/notifications/mark-all-read:
 *   post:
 *     summary: 批量标记通知为已读
 *     tags: [ProjectCollaboration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 批量标记成功
 *       401:
 *         description: 未认证
 */
router.post('/notifications/mark-all-read', checkNotificationPermission, projectCollaborationController.markAllNotificationsRead)

module.exports = router