const express = require('express')
const { businessLineController } = require('../controllers')
const { authenticateToken, authorize, logOperation } = require('../middlewares/auth')
const { validate } = require('../utils/validation')
const Joi = require('joi')

const router = express.Router()

// 所有业务线管理接口都需要认证
router.use(authenticateToken)

// 业务线验证规则
const businessLineSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    code: Joi.string().min(2).max(50).required(),
    description: Joi.string().max(500).allow('').optional(),
    managerId: Joi.string().allow(null, '').optional(),
    profitTarget: Joi.number().min(0).allow(null).optional(),
    kpiMetrics: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      target: Joi.number().required(),
      weight: Joi.number().min(0).max(1).required()
    })).optional()
  }),
  
  update: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    code: Joi.string().min(2).max(50).optional(),
    description: Joi.string().max(500).allow('').optional(),
    managerId: Joi.string().allow(null, '').optional(),
    profitTarget: Joi.number().min(0).allow(null).optional(),
    kpiMetrics: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      target: Joi.number().required(),
      weight: Joi.number().min(0).max(1).required()
    })).optional(),
    status: Joi.number().integer().valid(0, 1).optional()
  })
}

/**
 * @swagger
 * /api/business-lines:
 *   get:
 *     tags:
 *       - 业务线管理
 *     summary: 获取业务线列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: 每页数量
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *         description: 状态筛选
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/', 
  authorize(['business-line:view']),
  logOperation('查看', '业务线列表'),
  businessLineController.getBusinessLines
)

/**
 * @swagger
 * /api/business-lines/{id}:
 *   get:
 *     tags:
 *       - 业务线管理
 *     summary: 获取业务线详情
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 业务线ID
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 业务线不存在
 */
router.get('/:id', 
  authorize(['business-line:view']),
  logOperation('查看', '业务线详情'),
  businessLineController.getBusinessLine
)

/**
 * @swagger
 * /api/business-lines/{id}/performance:
 *   get:
 *     tags:
 *       - 业务线管理
 *     summary: 获取业务线绩效统计
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 业务线ID
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: 年份
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/:id/performance', 
  authorize(['business-line:view']),
  logOperation('查看', '业务线绩效'),
  businessLineController.getPerformanceStats
)

/**
 * @swagger
 * /api/business-lines/statistics:
 *   get:
 *     tags:
 *       - 业务线管理
 *     summary: 获取业务线统计
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/statistics', 
  authorize(['business-line:view']),
  logOperation('查看', '业务线统计'),
  businessLineController.getBusinessLineStats
)

/**
 * @swagger
 * /api/business-lines:
 *   post:
 *     tags:
 *       - 业务线管理
 *     summary: 创建业务线
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
 *             properties:
 *               name:
 *                 type: string
 *                 description: 业务线名称
 *               code:
 *                 type: string
 *                 description: 业务线代码
 *               description:
 *                 type: string
 *                 description: 业务线描述
 *               managerId:
 *                 type: integer
 *                 description: 负责人ID
 *               profitTarget:
 *                 type: number
 *                 description: 利润目标
 *               kpiMetrics:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     target:
 *                       type: number
 *                     weight:
 *                       type: number
 *                 description: KPI指标
 *     responses:
 *       201:
 *         description: 创建成功
 *       400:
 *         description: 请求参数错误
 */
router.post('/', 
  authorize(['business-line:create']),
  validate(businessLineSchemas.create),
  logOperation('创建', '业务线'),
  businessLineController.createBusinessLine
)

/**
 * @swagger
 * /api/business-lines/{id}:
 *   put:
 *     tags:
 *       - 业务线管理
 *     summary: 更新业务线
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 业务线ID
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 业务线不存在
 */
router.put('/:id', 
  authorize(['business-line:update']),
  validate(businessLineSchemas.update),
  logOperation('更新', '业务线'),
  businessLineController.updateBusinessLine
)

/**
 * @swagger
 * /api/business-lines/{id}:
 *   delete:
 *     tags:
 *       - 业务线管理
 *     summary: 删除业务线
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 业务线ID
 *     responses:
 *       200:
 *         description: 删除成功
 *       404:
 *         description: 业务线不存在
 */
router.delete('/:id', 
  authorize(['business-line:delete']),
  logOperation('删除', '业务线'),
  businessLineController.deleteBusinessLine
)

/**
 * @swagger
 * /api/business-lines/batch:
 *   post:
 *     tags:
 *       - 业务线管理
 *     summary: 批量操作业务线（已废弃）
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       410:
 *         description: 此功能已废弃
 */
router.post('/batch', 
  authorize(['business-line:update']),
  logOperation('批量操作', '业务线'),
  (req, res) => {
    res.status(410).json({
      code: 410,
      message: '批量操作功能已废弃',
      data: null
    })
  }
)

module.exports = router