const express = require('express')
const { employeeController } = require('../controllers')
const { authenticateToken, authorize, logOperation } = require('../middlewares/auth')
const { validate, employeeSchemas } = require('../utils/validation')

const router = express.Router()

// 所有员工路由都需要认证
router.use(authenticateToken)

/**
 * @swagger
 * /api/employees:
 *   get:
 *     tags:
 *       - 员工管理
 *     summary: 获取员工列表
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
 *         name: departmentId
 *         schema:
 *           type: integer
 *         description: 部门ID筛选
 *       - in: query
 *         name: positionId
 *         schema:
 *           type: integer
 *         description: 岗位ID筛选
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
  authorize(['employee:view']), 
  logOperation('查看', '员工列表'),
  employeeController.getEmployees
)

/**
 * @swagger
 * /api/employees/statistics:
 *   get:
 *     tags:
 *       - 员工管理
 *     summary: 获取员工统计信息
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/statistics', 
  authorize(['employee:view']),
  logOperation('查看', '员工统计'),
  employeeController.getEmployeeStats
)

/**
 * @swagger
 * /api/employees/available:
 *   get:
 *     tags:
 *       - 员工管理
 *     summary: 获取可用员工列表（未关联用户的员工）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *         description: 部门ID筛选
 *       - in: query
 *         name: positionId
 *         schema:
 *           type: string
 *         description: 岗位ID筛选
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/available', 
  authorize(['employee:view']),
  logOperation('查看', '可用员工列表'),
  employeeController.getAvailableEmployees
)

/**
 * @swagger
 * /api/employees/{id}:
 *   get:
 *     tags:
 *       - 员工管理
 *     summary: 获取员工详情
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 员工ID
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 员工不存在
 */
router.get('/:id', 
  authorize(['employee:view']),
  logOperation('查看', '员工详情'),
  employeeController.getEmployee
)

/**
 * @swagger
 * /api/employees:
 *   post:
 *     tags:
 *       - 员工管理
 *     summary: 创建员工
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmployeeCreate'
 *     responses:
 *       201:
 *         description: 创建成功
 *       400:
 *         description: 请求参数错误
 */
router.post('/', 
  authorize(['employee:create']),
  validate(employeeSchemas.create),
  logOperation('创建', '员工'),
  employeeController.createEmployee
)

/**
 * @swagger
 * /api/employees/{id}:
 *   put:
 *     tags:
 *       - 员工管理
 *     summary: 更新员工
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 员工ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmployeeUpdate'
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 员工不存在
 */
router.put('/:id', 
  authorize(['employee:update']),
  validate(employeeSchemas.update),
  logOperation('更新', '员工'),
  employeeController.updateEmployee
)

/**
 * @swagger
 * /api/employees/{id}/transfer:
 *   post:
 *     tags:
 *       - 员工管理
 *     summary: 员工转移
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 员工ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               departmentId:
 *                 type: integer
 *                 description: 目标部门ID
 *               positionId:
 *                 type: integer
 *                 description: 目标岗位ID
 *               annualSalary:
 *                 type: number
 *                 description: 新年薪
 *               transferReason:
 *                 type: string
 *                 description: 转移原因
 *               effectiveDate:
 *                 type: string
 *                 format: date
 *                 description: 生效日期
 *     responses:
 *       200:
 *         description: 转移成功
 */
router.post('/:id/transfer', 
  authorize(['employee:update']),
  logOperation('转移', '员工'),
  employeeController.transfer
)

/**
 * @swagger
 * /api/employees/{id}/resign:
 *   post:
 *     tags:
 *       - 员工管理
 *     summary: 员工离职
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 员工ID
 *     responses:
 *       200:
 *         description: 离职处理成功
 */
router.post('/:id/resign', 
  authorize(['employee:delete']),
  logOperation('离职', '员工'),
  employeeController.resign
)

/**
 * @swagger
 * /api/employees/batch:
 *   post:
 *     tags:
 *       - 员工管理
 *     summary: 批量操作员工
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
 *               - employeeIds
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [enable, disable]
 *                 description: 操作类型
 *               employeeIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 员工ID列表
 *     responses:
 *       200:
 *         description: 操作成功
 */
router.post('/batch', 
  authorize(['employee:update']),
  logOperation('批量操作', '员工'),
  employeeController.batchOperation
)

/**
 * @swagger
 * /api/employees/{id}:
 *   delete:
 *     tags:
 *       - 员工管理
 *     summary: 删除员工
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 员工ID
 *     responses:
 *       200:
 *         description: 删除成功
 *       404:
 *         description: 员工不存在
 */
router.delete('/:id', 
  authorize(['employee:delete']),
  logOperation('删除', '员工'),
  employeeController.deleteEmployee
)

module.exports = router