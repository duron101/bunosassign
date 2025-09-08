const express = require('express')
const router = express.Router()
const personalBonusController = require('../controllers/personalBonusController')
const { authenticateToken } = require('../middlewares/auth')

// All bonus routes require authentication
router.use(authenticateToken)

/**
 * @swagger
 * /api/bonus/personal-overview:
 *   get:
 *     summary: 获取个人奖金概览
 *     tags: [奖金查看]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *         description: 查询期间（可选）
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
 *                   example: 获取个人奖金概览成功
 *                 data:
 *                   type: object
 *       404:
 *         description: 未找到关联员工记录
 */
router.get('/personal-overview', (req, res, next) => personalBonusController.getOverview(req, res, next))

/**
 * @swagger
 * /api/bonus/personal-details:
 *   get:
 *     summary: 获取个人奖金详情
 *     tags: [奖金查看]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *         description: 查询期间（可选）
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 未找到关联员工记录
 */
router.get('/personal-details', (req, res, next) => personalBonusController.getThreeDimensionalDetail(req, res, next))

/**
 * @swagger
 * /api/bonus/personal-trend:
 *   get:
 *     summary: 获取个人奖金趋势
 *     tags: [奖金查看]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: periods
 *         schema:
 *           type: integer
 *           default: 12
 *         description: 查询期间数量
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 未找到关联员工记录
 */
router.get('/personal-trend', (req, res, next) => personalBonusController.getBonusTrend(req, res, next))

/**
 * @swagger
 * /api/bonus/team-overview:
 *   get:
 *     summary: 获取团队奖金概览（部门经理）
 *     tags: [奖金查看]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *         description: 查询期间（可选）
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *         description: 部门ID（可选，默认当前用户部门）
 *     responses:
 *       200:
 *         description: 获取成功
 *       403:
 *         description: 权限不足
 */
router.get('/team-overview', (req, res, next) => personalBonusController.getTeamBonusOverview(req, res, next))

/**
 * @swagger
 * /api/bonus/personal-query:
 *   get:
 *     summary: 个人奖金查询
 *     tags: [奖金查看]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [regular, project, special]
 *         description: 奖金类型
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
 */
router.get('/personal-query', (req, res, next) => personalBonusController.getPersonalBonusQuery(req, res, next))

module.exports = router