const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middlewares/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     DashboardOverview:
 *       type: object
 *       properties:
 *         metrics:
 *           type: object
 *           properties:
 *             totalBonus:
 *               type: number
 *               description: 总奖金
 *             avgBonus:
 *               type: number
 *               description: 人均奖金
 *             utilizationRate:
 *               type: number
 *               description: 奖金池利用率
 *             totalEmployees:
 *               type: number
 *               description: 参与员工数
 *             bonusGrowth:
 *               type: number
 *               description: 奖金增长率
 *         departmentRanking:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *               totalBonus:
 *                 type: number
 *         bonusDistribution:
 *           type: object
 *           properties:
 *             ranges:
 *               type: array
 *               items:
 *                 type: object
 *             median:
 *               type: number
 *             giniCoefficient:
 *               type: number
 */

/**
 * @swagger
 * /api/dashboard/overview:
 *   get:
 *     summary: 获取管理驾驶舱概览数据
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         description: 开始日期 YYYY-MM
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         description: 结束日期 YYYY-MM
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/DashboardOverview'
 */
router.get('/overview', authenticateToken, (req, res) => dashboardController.getOverview(req, res));

/**
 * @swagger
 * /api/dashboard/trend:
 *   get:
 *     summary: 获取奖金趋势数据
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [total, avg, count]
 *         description: 数据类型
 *       - in: query
 *         name: months
 *         schema:
 *           type: number
 *         description: 月份数量，默认6个月
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       period:
 *                         type: string
 *                       totalBonus:
 *                         type: number
 *                       avgBonus:
 *                         type: number
 *                       employeeCount:
 *                         type: number
 */
router.get('/trend', authenticateToken, (req, res) => dashboardController.getTrendData(req, res));

/**
 * @swagger
 * /api/dashboard/distribution:
 *   get:
 *     summary: 获取业务线分布数据
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [amount, people]
 *         description: 分布类型
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       value:
 *                         type: number
 */
router.get('/distribution', authenticateToken, (req, res) => dashboardController.getDistributionData(req, res));

module.exports = router;