const express = require('express')
const { positionController } = require('../controllers')
const { authenticateToken, authorize, logOperation } = require('../middlewares/auth')
const { 
  canViewPositionEncyclopedia, 
  canUpdateRequirements, 
  canUpdateCareerPath, 
  canUpdateSkills,
  businessLineDataAccess,
  canExport
} = require('../middlewares/positionEncyclopediaAuth')
const { validate } = require('../utils/validation')
const Joi = require('joi')

const router = express.Router()

// 所有岗位管理接口都需要认证
router.use(authenticateToken)

// 岗位验证规则
const positionSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    code: Joi.string().min(2).max(50).required(),
    description: Joi.string().max(500).allow('').optional(),
    level: Joi.string().valid('P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'M1', 'M2', 'M3', 'M4').required(),
    benchmarkValue: Joi.number().positive().required(),
    businessLineId: Joi.string().optional(),
    responsibilities: Joi.array().items(Joi.string()).optional(),
    requirements: Joi.array().items(Joi.string()).optional()
  }),
  
  update: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    code: Joi.string().min(2).max(50).optional(),
    description: Joi.string().max(500).allow('').optional(),
    level: Joi.string().valid('P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'M1', 'M2', 'M3', 'M4').optional(),
    benchmarkValue: Joi.number().positive().optional(),
    businessLineId: Joi.string().optional(),
    responsibilities: Joi.array().items(Joi.string()).optional(),
    requirements: Joi.array().items(Joi.string()).optional(),
    status: Joi.number().integer().valid(0, 1).optional()
  })
}

// 岗位大全相关验证规则
const positionEncyclopediaSchemas = {
  updateRequirements: Joi.object({
    positionId: Joi.string().required(),
    requirements: Joi.object({
      basicRequirements: Joi.array().items(Joi.string()).optional(),
      skills: Joi.array().items(Joi.string()).optional(),
      experience: Joi.array().items(Joi.string()).optional(),
      careerPath: Joi.object({
        nextLevel: Joi.string().optional(),
        estimatedTime: Joi.string().optional(),
        lateralMoves: Joi.array().items(Joi.string()).optional(),
        specializations: Joi.array().items(Joi.string()).optional(),
        growthAreas: Joi.array().items(Joi.string()).optional()
      }).optional(),
      salaryRange: Joi.object({
        junior: Joi.string().optional(),
        middle: Joi.string().optional(),
        senior: Joi.string().optional(),
        factors: Joi.array().items(Joi.string()).optional()
      }).optional()
    }).required()
  }),
  
  updateCareerPath: Joi.object({
    positionId: Joi.string().required(),
    careerPath: Joi.object({
      nextLevel: Joi.string().required(),
      estimatedTime: Joi.string().required(),
      lateralMoves: Joi.array().items(Joi.string()).optional(),
      specializations: Joi.array().items(Joi.string()).optional(),
      growthAreas: Joi.array().items(Joi.string()).optional()
    }).required()
  }),
  
  updateSkills: Joi.object({
    positionId: Joi.string().required(),
    coreSkills: Joi.array().items(Joi.string()).required()
  }),
  
  batchUpdate: Joi.object({
    positionIds: Joi.array().items(Joi.string()).min(1).required(),
    updateType: Joi.string().valid('requirements', 'skills', 'careerPath').required(),
    updateData: Joi.object({
      requirements: Joi.string().optional(),
      skills: Joi.array().items(Joi.string()).optional(),
      careerPath: Joi.object({
        nextLevel: Joi.string().optional(),
        estimatedTime: Joi.string().optional()
      }).optional()
    }).required()
  }),
  
  batchUpdateBenchmarkValues: Joi.object({
    positions: Joi.array().items(
      Joi.object({
        id: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
        benchmarkValue: Joi.number().min(0).max(10).required()
      })
    ).min(1).required()
  }).unknown(false) // 不允许未知字段
}

/**
 * @swagger
 * /api/positions/levels:
 *   get:
 *     tags:
 *       - 岗位管理
 *     summary: 获取岗位级别选项
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/levels', 
  authorize(['position:view']),
  positionController.getLevelOptions
)

/**
 * @swagger
 * /api/positions/statistics:
 *   get:
 *     tags:
 *       - 岗位管理
 *     summary: 获取岗位级别统计
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/statistics', 
  authorize(['position:view']),
  logOperation('查看', '岗位统计'),
  positionController.getPositionStats
)

/**
 * @swagger
 * /api/positions:
 *   get:
 *     tags:
 *       - 岗位管理
 *     summary: 获取岗位列表
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
 *         name: level
 *         schema:
 *           type: string
 *         description: 岗位级别筛选
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
  authorize(['position:view']),
  logOperation('查看', '岗位列表'),
  positionController.getPositions
)

/**
 * @swagger
 * /api/positions/{id}:
 *   get:
 *     tags:
 *       - 岗位管理
 *     summary: 获取岗位详情
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 岗位ID
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 岗位不存在
 */
router.get('/:id', 
  authorize(['position:view']),
  logOperation('查看', '岗位详情'),
  positionController.getPosition
)

/**
 * @swagger
 * /api/positions:
 *   post:
 *     tags:
 *       - 岗位管理
 *     summary: 创建岗位
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
 *               - level
 *               - benchmarkValue
 *             properties:
 *               name:
 *                 type: string
 *                 description: 岗位名称
 *               code:
 *                 type: string
 *                 description: 岗位代码
 *               description:
 *                 type: string
 *                 description: 岗位描述
 *               level:
 *                 type: string
 *                 enum: [P1, P2, P3, P4, P5, P6, P7, M1, M2, M3, M4]
 *                 description: 岗位级别
 *               benchmarkValue:
 *                 type: number
 *                 description: 基准价值
 *               responsibilities:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 岗位职责
 *               requirements:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 任职要求
 *     responses:
 *       201:
 *         description: 创建成功
 *       400:
 *         description: 请求参数错误
 */
router.post('/', 
  authorize(['position:create']),
  validate(positionSchemas.create),
  logOperation('创建', '岗位'),
  positionController.createPosition
)

/**
 * @swagger
 * /api/positions/benchmark-values:
 *   put:
 *     tags:
 *       - 岗位管理
 *     summary: 批量更新基准值
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - positions
 *             properties:
 *               positions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: 岗位ID
 *                     benchmarkValue:
 *                       type: number
 *                       description: 新基准值
 *                 description: 岗位基准值列表
 *     responses:
 *       200:
 *         description: 更新成功
 */
// 独立的基准值验证中间件
const validateBenchmarkValues = (req, res, next) => {
  console.log('🔍 独立验证中间件 - 接收到的数据:', req.body)
  
  const benchmarkSchema = Joi.object({
    positions: Joi.array().items(
      Joi.object({
        id: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
        benchmarkValue: Joi.number().min(0).max(10).required()
      })
    ).min(1).required()
  }).unknown(true) // 允许未知字段，避免验证失败
  
  console.log('🔍 独立验证中间件 - schema描述:', benchmarkSchema.describe())
  
  const { error } = benchmarkSchema.validate(req.body)
  
  if (error) {
    console.log('🔍 独立验证中间件 - 验证失败:', error.details)
    return res.status(400).json({
      code: 400,
      message: `数据验证失败: ${error.details[0].message}`,
      data: null
    })
  }
  
  console.log('🔍 独立验证中间件 - 验证成功')
  next()
}

router.put('/benchmark-values', 
  authorize(['ADMIN', 'HR_ADMIN']),
  validateBenchmarkValues,
  logOperation('批量更新基准值', '岗位'),
  positionController.batchUpdateBenchmarkValues
)

/**
 * @swagger
 * /api/positions/{id}:
 *   put:
 *     tags:
 *       - 岗位管理
 *     summary: 更新岗位
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 岗位ID
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 岗位不存在
 */
router.put('/:id', 
  authorize(['position:update']),
  validate(positionSchemas.update),
  logOperation('更新', '岗位'),
  positionController.updatePosition
)

/**
 * @swagger
 * /api/positions/{id}:
 *   delete:
 *     tags:
 *       - 岗位管理
 *     summary: 删除岗位
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 岗位ID
 *     responses:
 *       200:
 *         description: 删除成功
 *       404:
 *         description: 岗位不存在
 */
router.delete('/:id', 
  authorize(['position:delete']),
  logOperation('删除', '岗位'),
  positionController.deletePosition
)


/**
 * @swagger
 * /api/positions/batch:
 *   post:
 *     tags:
 *       - 岗位管理
 *     summary: 批量操作岗位
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *               - positionIds
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [enable, disable]
 *                 description: 操作类型
 *               positionIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 岗位ID列表
 *     responses:
 *       200:
 *         description: 操作成功
 */
router.post('/batch', 
  authorize(['position:update']),
  logOperation('批量操作', '岗位'),
  positionController.batchPositions
)

// ========== 岗位大全管理API ==========

/**
 * @swagger
 * /api/positions/encyclopedia/requirements:
 *   put:
 *     tags:
 *       - 岗位大全管理
 *     summary: 更新岗位要求信息
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - positionId
 *               - requirements
 *             properties:
 *               positionId:
 *                 type: string
 *                 description: 岗位ID
 *               requirements:
 *                 type: object
 *                 properties:
 *                   basicRequirements:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: 基本要求
 *                   skills:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: 技能要求
 *                   experience:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: 经验要求
 *                   careerPath:
 *                     type: object
 *                     properties:
 *                       nextLevel:
 *                         type: string
 *                         description: 下一级别
 *                       estimatedTime:
 *                         type: string
 *                         description: 预计时间
 *                       lateralMoves:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: 横向发展
 *                       specializations:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: 专业方向
 *                       growthAreas:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: 成长领域
 *                   salaryRange:
 *                     type: object
 *                     properties:
 *                       junior:
 *                         type: string
 *                         description: 初级薪资
 *                       middle:
 *                         type: string
 *                         description: 中级薪资
 *                       senior:
 *                         type: string
 *                         description: 高级薪资
 *                       factors:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: 影响因素
 *     responses:
 *       200:
 *         description: 更新成功
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 岗位不存在
 */
router.put('/encyclopedia/requirements',
  canUpdateRequirements,
  businessLineDataAccess('update_requirements'),
  validate(positionEncyclopediaSchemas.updateRequirements),
  logOperation('更新岗位要求', '岗位大全'),
  positionController.updatePositionRequirements
)

/**
 * @swagger
 * /api/positions/encyclopedia/career-path:
 *   put:
 *     tags:
 *       - 岗位大全管理
 *     summary: 更新岗位职业路径
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - positionId
 *               - careerPath
 *             properties:
 *               positionId:
 *                 type: string
 *                 description: 岗位ID
 *               careerPath:
 *                 type: object
 *                 required:
 *                   - nextLevel
 *                   - estimatedTime
 *                 properties:
 *                   nextLevel:
 *                     type: string
 *                     description: 下一级别
 *                   estimatedTime:
 *                     type: string
 *                     description: 预计时间
 *                   lateralMoves:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: 横向发展
 *                   specializations:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: 专业方向
 *                   growthAreas:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: 成长领域
 *     responses:
 *       200:
 *         description: 更新成功
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 岗位不存在
 */
router.put('/encyclopedia/career-path',
  canUpdateCareerPath,
  businessLineDataAccess('update_career_path'),
  validate(positionEncyclopediaSchemas.updateCareerPath),
  logOperation('更新职业路径', '岗位大全'),
  positionController.updatePositionCareerPath
)

/**
 * @swagger
 * /api/positions/encyclopedia/skills:
 *   put:
 *     tags:
 *       - 岗位大全管理
 *     summary: 更新岗位核心技能
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - positionId
 *               - coreSkills
 *             properties:
 *               positionId:
 *                 type: string
 *                 description: 岗位ID
 *               coreSkills:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 核心技能列表
 *     responses:
 *       200:
 *         description: 更新成功
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 岗位不存在
 */
router.put('/encyclopedia/skills',
  canUpdateSkills,
  businessLineDataAccess('update_skills'),
  validate(positionEncyclopediaSchemas.updateSkills),
  logOperation('更新核心技能', '岗位大全'),
  positionController.updatePositionSkills
)

/**
 * @swagger
 * /api/positions/encyclopedia/export:
 *   get:
 *     tags:
 *       - 岗位大全管理
 *     summary: 导出岗位大全数据
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: businessLineId
 *         schema:
 *           type: string
 *         description: 业务线ID筛选
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv, excel]
 *           default: json
 *         description: 导出格式
 *     responses:
 *       200:
 *         description: 导出成功
 *       403:
 *         description: 权限不足
 */
router.get('/encyclopedia/export',
  canExport,
  logOperation('导出岗位大全', '岗位大全'),
  positionController.exportPositionEncyclopedia
)

// ==================== 新增管理接口 ====================

/**
 * @swagger
 * /api/positions:
 *   post:
 *     tags:
 *       - 岗位管理
 *     summary: 新增岗位
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
 *               - level
 *               - businessLineId
 *             properties:
 *               name:
 *                 type: string
 *                 description: 岗位名称
 *               code:
 *                 type: string
 *                 description: 岗位代码
 *               level:
 *                 type: string
 *                 description: 职级
 *               businessLineId:
 *                 type: string
 *                 description: 业务线ID
 *               description:
 *                 type: string
 *                 description: 岗位描述
 *               coreSkills:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 核心技能
 *               careerPath:
 *                 type: object
 *                 description: 职业路径
 *     responses:
 *       200:
 *         description: 创建成功
 *       400:
 *         description: 参数错误
 *       403:
 *         description: 权限不足
 */
router.post('/',
  authorize(['ADMIN', 'HR_ADMIN']),
  validate(positionSchemas.create),
  logOperation('新增岗位', '岗位管理'),
  positionController.createPosition
)

/**
 * @swagger
 * /api/positions/{id}:
 *   delete:
 *     tags:
 *       - 岗位管理
 *     summary: 删除岗位
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 岗位ID
 *     responses:
 *       200:
 *         description: 删除成功
 *       400:
 *         description: 岗位被占用
 *       404:
 *         description: 岗位不存在
 *       403:
 *         description: 权限不足
 */
router.delete('/:id',
  authorize(['ADMIN', 'HR_ADMIN']),
  logOperation('删除岗位', '岗位管理'),
  positionController.deletePosition
)

/**
 * @swagger
 * /api/positions/batch-update:
 *   put:
 *     tags:
 *       - 岗位管理
 *     summary: 批量更新岗位
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - positionIds
 *               - updateType
 *               - updateData
 *             properties:
 *               positionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 岗位ID列表
 *               updateType:
 *                 type: string
 *                 enum: [requirements, skills, careerPath]
 *                 description: 更新类型
 *               updateData:
 *                 type: object
 *                 description: 更新数据
 *     responses:
 *       200:
 *         description: 批量更新成功
 *       400:
 *         description: 参数错误
 *       403:
 *         description: 权限不足
 */
router.put('/batch-update',
  authorize(['ADMIN', 'HR_ADMIN']),
  validate(positionEncyclopediaSchemas.batchUpdate),
  logOperation('批量更新岗位', '岗位管理'),
  positionController.batchUpdatePositions
)

module.exports = router