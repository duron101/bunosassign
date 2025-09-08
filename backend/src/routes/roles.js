const express = require('express')
const { roleController } = require('../controllers')
const { authenticateToken, authorize, logOperation } = require('../middlewares/auth')
const { validate } = require('../utils/validation')
const Joi = require('joi')

const router = express.Router()

// 所有角色管理接口都需要认证
router.use(authenticateToken)

// 角色验证规则
const roleSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    description: Joi.string().max(200),
    permissions: Joi.array().items(Joi.string()).required()
  }),
  
  update: Joi.object({
    name: Joi.string().min(2).max(50),
    description: Joi.string().max(200),
    permissions: Joi.array().items(Joi.string()),
    status: Joi.number().integer().valid(0, 1)
  })
}

/**
 * @swagger
 * /api/roles/permissions:
 *   get:
 *     tags:
 *       - 角色管理
 *     summary: 获取权限列表
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/permissions', 
  authorize(['role:view']),
  roleController.getPermissions
)

/**
 * @swagger
 * /api/roles:
 *   get:
 *     tags:
 *       - 角色管理
 *     summary: 获取角色列表
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
  authorize(['role:view']),
  logOperation('查看', '角色列表'),
  roleController.getRoles
)

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     tags:
 *       - 角色管理
 *     summary: 获取角色详情
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 角色ID
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 角色不存在
 */
router.get('/:id', 
  authorize(['role:view']),
  logOperation('查看', '角色详情'),
  roleController.getRole
)

/**
 * @swagger
 * /api/roles:
 *   post:
 *     tags:
 *       - 角色管理
 *     summary: 创建角色
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
 *               - permissions
 *             properties:
 *               name:
 *                 type: string
 *                 description: 角色名称
 *               description:
 *                 type: string
 *                 description: 角色描述
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 权限列表
 *     responses:
 *       201:
 *         description: 创建成功
 *       400:
 *         description: 请求参数错误
 */
router.post('/', 
  authorize(['role:create']),
  validate(roleSchemas.create),
  logOperation('创建', '角色'),
  roleController.createRole
)

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     tags:
 *       - 角色管理
 *     summary: 更新角色
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 角色ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 角色名称
 *               description:
 *                 type: string
 *                 description: 角色描述
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 权限列表
 *               status:
 *                 type: integer
 *                 enum: [0, 1]
 *                 description: 状态
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 角色不存在
 */
router.put('/:id', 
  authorize(['role:update']),
  validate(roleSchemas.update),
  logOperation('更新', '角色'),
  roleController.updateRole
)

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     tags:
 *       - 角色管理
 *     summary: 删除角色
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 角色ID
 *     responses:
 *       200:
 *         description: 删除成功
 *       404:
 *         description: 角色不存在
 */
router.delete('/:id', 
  authorize(['role:delete']),
  logOperation('删除', '角色'),
  roleController.deleteRole
)

/**
 * @swagger
 * /api/roles/batch:
 *   post:
 *     tags:
 *       - 角色管理
 *     summary: 批量操作角色
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
 *               - roleIds
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [enable, disable]
 *                 description: 操作类型
 *               roleIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 角色ID列表
 *     responses:
 *       200:
 *         description: 操作成功
 */
router.post('/batch', 
  authorize(['role:update']),
  logOperation('批量操作', '角色'),
  roleController.batchRoles
)

module.exports = router