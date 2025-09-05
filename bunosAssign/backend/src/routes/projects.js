const express = require('express')
const { projectController } = require('../controllers')
const { authenticateToken, authorize, logOperation } = require('../middlewares/auth')
const { validate } = require('../utils/validation')
const Joi = require('joi')

const router = express.Router()

// 所有项目管理接口都需要认证
router.use(authenticateToken)

// 项目验证规则
const projectSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    code: Joi.string().min(2).max(50).required(),
    description: Joi.string().max(1000),
    managerId: Joi.alternatives().try(
      Joi.number().integer().positive(),
      Joi.string().min(1)  // 允许任何非空字符串，因为NeDB使用字符串_id
    ),
    startDate: Joi.date(),
    endDate: Joi.date(),
    budget: Joi.number().min(0),
    profitTarget: Joi.number().min(0),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical')
  }),
  
  update: Joi.object({
    name: Joi.string().min(2).max(100),
    code: Joi.string().min(2).max(50),
    description: Joi.string().max(1000),
    managerId: Joi.alternatives().try(
      Joi.number().integer().positive(),
      Joi.string().min(1)  // 允许任何非空字符串，因为NeDB使用字符串_id
    ),
    startDate: Joi.date(),
    endDate: Joi.date(),
    budget: Joi.number().min(0),
    profitTarget: Joi.number().min(0),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical'),
    status: Joi.string().valid('planning', 'active', 'completed', 'cancelled', 'on_hold')
  }),

  weights: Joi.object({
    weights: Joi.array().items(
      Joi.object({
        businessLineId: Joi.string().required(),
        weight: Joi.number().min(0).max(1).required()
      })
    ).required(),
    reason: Joi.string().max(500)
  })
}

/**
 * @swagger
 * /api/projects:
 *   get:
 *     tags:
 *       - 项目管理
 *     summary: 获取项目列表
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
 *           type: string
 *           enum: [planning, active, completed, cancelled, on_hold]
 *         description: 状态筛选
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: 优先级筛选
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/', 
  authorize(['project:view']),
  logOperation('查看', '项目列表'),
  projectController.getProjects
)

/**
 * @swagger
 * /api/projects/available:
 *   get:
 *     tags:
 *       - 项目管理
 *     summary: 获取用户可申请的项目列表
 *     security:
 *       - bearerAuth: []
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
 *                   example: "获取成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     projects:
 *                       type: array
 *                       items:
 *                         type: object
 *                     total:
 *                       type: integer
 *       400:
 *         description: 用户未关联员工信息
 */
router.get('/available', 
  authorize(['project:view']),
  logOperation('查看', '可申请项目列表'),
  projectController.getAvailableProjects
)

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     tags:
 *       - 项目管理
 *     summary: 获取项目详情
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 项目ID
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 项目不存在
 */
router.get('/:id', 
  authorize(['project:view']),
  logOperation('查看', '项目详情'),
  projectController.getProject
)

/**
 * @swagger
 * /api/projects:
 *   post:
 *     tags:
 *       - 项目管理
 *     summary: 创建项目
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
 *                 description: 项目名称
 *               code:
 *                 type: string
 *                 description: 项目代码
 *               description:
 *                 type: string
 *                 description: 项目描述
 *               managerId:
 *                 type: integer
 *                 description: 项目经理ID
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: 开始日期
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: 结束日期
 *               budget:
 *                 type: number
 *                 description: 项目预算
 *               profitTarget:
 *                 type: number
 *                 description: 利润目标
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *                 description: 优先级
 *     responses:
 *       201:
 *         description: 创建成功
 *       400:
 *         description: 请求参数错误
 */
router.post('/', 
  authorize(['project:create']),
  validate(projectSchemas.create),
  logOperation('创建', '项目'),
  projectController.createProject
)

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     tags:
 *       - 项目管理
 *     summary: 更新项目
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 项目ID
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 项目不存在
 */
router.put('/:id', 
  authorize(['project:update']),
  validate(projectSchemas.update),
  logOperation('更新', '项目'),
  projectController.updateProject
)

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     tags:
 *       - 项目管理
 *     summary: 删除项目
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 项目ID
 *     responses:
 *       200:
 *         description: 删除成功
 *       404:
 *         description: 项目不存在
 */
router.delete('/:id', 
  authorize(['project:delete']),
  logOperation('删除', '项目'),
  projectController.deleteProject
)

/**
 * @swagger
 * /api/projects/{id}/weights:
 *   get:
 *     tags:
 *       - 项目管理
 *     summary: 获取项目业务线权重配置
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 项目ID
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 项目不存在
 */
router.get('/:id/weights', 
  authorize(['project:view', 'business_line:view']),
  logOperation('查看', '项目权重配置'),
  projectController.getProjectWeights
)

/**
 * @swagger
 * /api/projects/{id}/weights:
 *   put:
 *     tags:
 *       - 项目管理
 *     summary: 更新项目业务线权重配置
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 项目ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - weights
 *             properties:
 *               weights:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     businessLineId:
 *                       type: integer
 *                       description: 业务线ID
 *                     weight:
 *                       type: number
 *                       description: 权重值(0-1)
 *                 description: 业务线权重配置列表
 *               reason:
 *                 type: string
 *                 description: 调整原因
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.put('/:id/weights', 
  authorize(['project:update', 'business_line:update']),
  validate(projectSchemas.weights),
  logOperation('更新', '项目权重配置'),
  projectController.updateProjectWeights
)

/**
 * @swagger
 * /api/projects/{id}/weights/reset:
 *   post:
 *     tags:
 *       - 项目管理
 *     summary: 重置项目权重配置为默认值
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 项目ID
 *     responses:
 *       200:
 *         description: 重置成功
 */
router.post('/:id/weights/reset', 
  authorize(['project:update', 'business_line:update']),
  logOperation('重置', '项目权重配置'),
  projectController.resetProjectWeights
)

/**
 * @swagger
 * /api/projects/statistics/weights:
 *   get:
 *     tags:
 *       - 项目管理
 *     summary: 获取权重配置统计信息
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/statistics/weights', 
  authorize(['project:view', 'business_line:view']),
  logOperation('查看', '权重统计'),
  projectController.getWeightStatistics
)

/**
 * @swagger
 * /api/projects/my-projects:
 *   get:
 *     tags:
 *       - 项目管理
 *     summary: 获取我参与的项目列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, pending, completed, cancelled]
 *         description: 项目状态筛选
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
 *                   example: "获取成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     projects:
 *                       type: array
 *                       items:
 *                         type: object
 *                     total:
 *                       type: integer
 *       400:
 *         description: 用户未关联员工信息
 */
router.get('/my-projects', 
  authorize(['project:view']),
  logOperation('查看', '我的项目列表'),
  projectController.getMyProjects
)

/**
 * @swagger
 * /api/projects/apply:
 *   post:
 *     tags:
 *       - 项目管理
 *     summary: 申请加入项目
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
 *               - role
 *               - reason
 *             properties:
 *               projectId:
 *                 type: string
 *                 description: 项目ID
 *               role:
 *                 type: string
 *                 description: 申请角色（如：开发工程师、测试工程师等）
 *               reason:
 *                 type: string
 *                 description: 申请理由
 *               expectedContribution:
 *                 type: string
 *                 description: 预期贡献（可选）
 *     responses:
 *       200:
 *         description: 申请提交成功
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
 *                   example: "项目申请提交成功"
 *                 data:
 *                   type: object
 *       400:
 *         description: 参数错误或用户未关联员工信息
 *       404:
 *         description: 项目不存在
 *       409:
 *         description: 已经申请过该项目
 */
router.post('/apply', 
  authorize(['project:view']),
  validate(Joi.object({
    projectId: Joi.string().required(),
    role: Joi.string().min(2).max(100).required(),
    reason: Joi.string().min(10).max(1000).required(),
    expectedContribution: Joi.string().max(1000).optional()
  })),
  logOperation('申请', '加入项目'),
  projectController.applyToProject
)

module.exports = router