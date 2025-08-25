const express = require('express')
const { departmentController } = require('../controllers')
const { authenticateToken, authorize, logOperation } = require('../middlewares/auth')
const { validate } = require('../utils/validation')
const Joi = require('joi')

const router = express.Router()

// 所有部门管理接口都需要认证
router.use(authenticateToken)

// 部门验证规则
const departmentSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    code: Joi.string().min(2).max(50).required(),
    description: Joi.string().max(500).allow('').optional(),
    businessLineId: Joi.string().allow(null, '').optional(),
    managerId: Joi.string().allow(null, '').optional(),
    parentId: Joi.string().allow(null, '').optional()
  }),
  
  update: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    code: Joi.string().min(2).max(50).optional(),
    description: Joi.string().max(500).allow('').optional(),
    businessLineId: Joi.string().allow(null, '').optional(),
    managerId: Joi.string().allow(null, '').optional(),
    parentId: Joi.string().allow(null, '').optional(),
    status: Joi.number().integer().valid(0, 1).optional()
  })
}

/**
 * @swagger
 * /api/departments/tree:
 *   get:
 *     tags:
 *       - 部门管理
 *     summary: 获取部门树形结构
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: businessLineId
 *         schema:
 *           type: integer
 *         description: 业务线ID筛选
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/tree', 
  authorize(['department:view']),
  departmentController.getDepartmentTree
)

/**
 * @swagger
 * /api/departments/statistics:
 *   get:
 *     tags:
 *       - 部门管理
 *     summary: 获取部门统计
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/statistics', 
  authorize(['department:view']),
  logOperation('查看', '部门统计'),
  departmentController.getDepartmentStats
)

/**
 * @swagger
 * /api/departments:
 *   get:
 *     tags:
 *       - 部门管理
 *     summary: 获取部门列表
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
 *         name: businessLineId
 *         schema:
 *           type: integer
 *         description: 业务线ID筛选
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
  authorize(['department:view']),
  logOperation('查看', '部门列表'),
  departmentController.getDepartments
)

/**
 * @swagger
 * /api/departments/options:
 *   get:
 *     tags:
 *       - 部门管理
 *     summary: 获取部门选项（用于下拉列表）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *           default: 1
 *         description: 状态筛选
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/options', 
  authenticateToken,
  departmentController.getDepartmentOptions
)

/**
 * @swagger
 * /api/departments/{id}:
 *   get:
 *     tags:
 *       - 部门管理
 *     summary: 获取部门详情
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 部门ID
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 部门不存在
 */
router.get('/:id', 
  authorize(['department:view']),
  logOperation('查看', '部门详情'),
  departmentController.getDepartment
)

/**
 * @swagger
 * /api/departments:
 *   post:
 *     tags:
 *       - 部门管理
 *     summary: 创建部门
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
 *                 description: 部门名称
 *               code:
 *                 type: string
 *                 description: 部门代码
 *               description:
 *                 type: string
 *                 description: 部门描述
 *               businessLineId:
 *                 type: integer
 *                 description: 业务线ID
 *               managerId:
 *                 type: integer
 *                 description: 部门负责人ID
 *               parentId:
 *                 type: integer
 *                 description: 父部门ID
 *     responses:
 *       201:
 *         description: 创建成功
 *       400:
 *         description: 请求参数错误
 */
router.post('/', 
  authorize(['department:create']),
  validate(departmentSchemas.create),
  logOperation('创建', '部门'),
  departmentController.createDepartment
)

/**
 * @swagger
 * /api/departments/{id}:
 *   put:
 *     tags:
 *       - 部门管理
 *     summary: 更新部门
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 部门ID
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 部门不存在
 */
router.put('/:id', 
  authorize(['department:update']),
  validate(departmentSchemas.update),
  logOperation('更新', '部门'),
  departmentController.updateDepartment
)

/**
 * @swagger
 * /api/departments/{id}:
 *   delete:
 *     tags:
 *       - 部门管理
 *     summary: 删除部门
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 部门ID
 *     responses:
 *       200:
 *         description: 删除成功
 *       404:
 *         description: 部门不存在
 */
router.delete('/:id', 
  authorize(['department:delete']),
  logOperation('删除', '部门'),
  departmentController.deleteDepartment
)

/**
 * @swagger
 * /api/departments/batch:
 *   post:
 *     tags:
 *       - 部门管理
 *     summary: 批量操作部门
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
 *               - departmentIds
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [enable, disable]
 *                 description: 操作类型
 *               departmentIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 部门ID列表
 *     responses:
 *       200:
 *         description: 操作成功
 */
router.post('/batch', 
  authorize(['department:update']),
  logOperation('批量操作', '部门'),
  departmentController.batchDepartments
)

module.exports = router