const express = require('express')
const router = express.Router()
const { authenticateToken, rbacCheck } = require('../middlewares/auth')
const projectCostController = require('../controllers/projectCostController')

/**
 * @swagger
 * tags:
 *   name: ProjectCosts
 *   description: 项目成本管理
 */

/**
 * @swagger
 * /api/project-costs:
 *   post:
 *     summary: 创建项目成本记录
 *     tags: [ProjectCosts]
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
 *               - costType
 *               - amount
 *               - description
 *             properties:
 *               projectId:
 *                 type: string
 *                 description: 项目ID
 *               costType:
 *                 type: string
 *                 enum: [人力成本, 材料成本, 其他成本]
 *                 description: 成本类型
 *               amount:
 *                 type: number
 *                 description: 成本金额
 *               description:
 *                 type: string
 *                 description: 成本描述
 *               date:
 *                 type: string
 *                 format: date
 *                 description: 发生日期
 *     responses:
 *       201:
 *         description: 成本记录创建成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       403:
 *         description: 无权限
 */
router.post('/', authenticateToken, rbacCheck('project', 'cost:create'), projectCostController.createCost)

/**
 * @swagger
 * /api/project-costs:
 *   get:
 *     summary: 获取项目成本列表
 *     tags: [ProjectCosts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: 项目ID筛选
 *       - in: query
 *         name: costType
 *         schema:
 *           type: string
 *         description: 成本类型筛选
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
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 无权限
 */
router.get('/', authenticateToken, rbacCheck('project', 'cost:view'), projectCostController.getCosts)

/**
 * @swagger
 * /api/project-costs/{costId}:
 *   get:
 *     summary: 根据ID获取成本记录
 *     tags: [ProjectCosts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: costId
 *         required: true
 *         schema:
 *           type: string
 *         description: 成本记录ID
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 成本记录不存在
 *       401:
 *         description: 未认证
 *       403:
 *         description: 无权限
 */
router.get('/:costId', authenticateToken, rbacCheck('project', 'cost:view'), projectCostController.getCostById)

/**
 * @swagger
 * /api/project-costs/{costId}:
 *   put:
 *     summary: 更新成本记录
 *     tags: [ProjectCosts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: costId
 *         required: true
 *         schema:
 *           type: string
 *         description: 成本记录ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               costType:
 *                 type: string
 *                 enum: [人力成本, 材料成本, 其他成本]
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: 更新成功
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: 成本记录不存在
 *       401:
 *         description: 未认证
 *       403:
 *         description: 无权限
 */
router.put('/:costId', authenticateToken, rbacCheck('project', 'cost:update'), projectCostController.updateCost)

/**
 * @swagger
 * /api/project-costs/{costId}:
 *   delete:
 *     summary: 删除成本记录
 *     tags: [ProjectCosts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: costId
 *         required: true
 *         schema:
 *           type: string
 *         description: 成本记录ID
 *     responses:
 *       200:
 *         description: 删除成功
 *       404:
 *         description: 成本记录不存在
 *       401:
 *         description: 未认证
 *       403:
 *         description: 无权限
 */
router.delete('/:costId', authenticateToken, rbacCheck('project', 'cost:delete'), projectCostController.deleteCost)

/**
 * @swagger
 * /api/project-costs/project/{projectId}/summary:
 *   get:
 *     summary: 获取项目成本汇总
 *     tags: [ProjectCosts]
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
 *       404:
 *         description: 项目不存在
 *       401:
 *         description: 未认证
 *       403:
 *         description: 无权限
 */
router.get('/project/:projectId/summary', authenticateToken, rbacCheck('project', 'cost:view'), projectCostController.getProjectCostSummary)

/**
 * @swagger
 * /api/project-costs/summary/all:
 *   get:
 *     summary: 获取所有项目的成本汇总
 *     tags: [ProjectCosts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 无权限
 */
router.get('/summary/all', authenticateToken, rbacCheck('project', 'cost:view'), projectCostController.getAllProjectCostSummaries)

module.exports = router
