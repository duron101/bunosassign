const express = require('express')
const { userController } = require('../controllers')
const { authenticateToken, authorize, logOperation } = require('../middlewares/auth')
const { validate, validateQuery, userSchemas, commonSchemas } = require('../utils/validation')
const Joi = require('joi')

const router = express.Router()

// 所有用户路由都需要认证
router.use(authenticateToken)

// 查询参数验证schema
const listQuerySchema = Joi.object({
  ...commonSchemas.pagination,
  search: Joi.string().max(50).allow('', null), // 允许空字符串和null
  roleId: Joi.string().allow('', null), // 改为字符串类型，允许空值
  departmentId: Joi.string().allow('', null), // 允许空字符串和null
  status: Joi.number().integer().valid(0, 1).allow('', null) // 允许空值
})

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags:
 *       - 用户管理
 *     summary: 获取用户列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: 每页条数
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/', 
  authorize(['user:view']), 
  validateQuery(listQuerySchema),
  logOperation('查看', '用户列表'),
  userController.list
)

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags:
 *       - 用户管理
 *     summary: 获取用户详情
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/:id', 
  authorize(['user:view']),
  logOperation('查看', '用户详情'),
  userController.detail
)

/**
 * @swagger
 * /api/users:
 *   post:
 *     tags:
 *       - 用户管理
 *     summary: 创建用户
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: 创建成功
 */
router.post('/', 
  authorize(['user:create']),
  validate(userSchemas.register),
  logOperation('创建', '用户'),
  userController.create
)

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     tags:
 *       - 用户管理
 *     summary: 更新用户
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.put('/:id', 
  authorize(['user:update']),
  validate(userSchemas.update),
  logOperation('更新', '用户'),
  userController.update
)

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     tags:
 *       - 用户管理
 *     summary: 删除用户
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.delete('/:id', 
  authorize(['user:delete']),
  logOperation('删除', '用户'),
  userController.delete
)

/**
 * @swagger
 * /api/users/{id}/reset-password:
 *   post:
 *     tags:
 *       - 用户管理
 *     summary: 重置用户密码
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 description: 新密码
 *     responses:
 *       200:
 *         description: 重置成功
 */
router.post('/:id/reset-password', 
  authorize(['user:reset-password']),
  logOperation('重置密码', '用户'),
  userController.resetPassword
)

/**
 * @swagger
 * /api/users/batch:
 *   post:
 *     tags:
 *       - 用户管理
 *     summary: 批量操作用户
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
 *               - userIds
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [enable, disable]
 *                 description: 操作类型
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 用户ID列表
 *     responses:
 *       200:
 *         description: 操作成功
 */
router.post('/batch', 
  authorize(['user:update']),
  logOperation('批量操作', '用户'),
  userController.batchOperation
)

module.exports = router