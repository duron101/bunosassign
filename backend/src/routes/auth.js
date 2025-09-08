const express = require('express')
const { authController } = require('../controllers')
const { validate, userSchemas } = require('../utils/validation')
const { authenticateToken } = require('../middlewares/auth')

const router = express.Router()

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - 认证
 *     summary: 用户登录
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: 用户名
 *               password:
 *                 type: string
 *                 description: 密码
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     user:
 *                       type: object
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                 message:
 *                   type: string
 *                   example: "登录成功"
 */
router.post('/login', validate(userSchemas.login), (req, res, next) => authController.login(req, res, next))

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags:
 *       - 认证
 *     summary: 用户注册
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - realName
 *             properties:
 *               username:
 *                 type: string
 *                 description: 用户名
 *               password:
 *                 type: string
 *                 description: 密码
 *               realName:
 *                 type: string
 *                 description: 真实姓名
 *               email:
 *                 type: string
 *                 description: 邮箱
 *               phone:
 *                 type: string
 *                 description: 手机号
 *               departmentId:
 *                 type: integer
 *                 description: 部门ID
 *     responses:
 *       201:
 *         description: 注册成功
 */
router.post('/register', validate(userSchemas.register), (req, res, next) => authController.register(req, res, next))

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags:
 *       - 认证
 *     summary: 刷新访问令牌
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: 刷新令牌
 *     responses:
 *       200:
 *         description: 刷新成功
 */
router.post('/refresh', (req, res, next) => authController.refreshToken(req, res, next))

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags:
 *       - 认证
 *     summary: 获取当前用户信息
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/me', authenticateToken, (req, res, next) => authController.me(req, res, next))

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     tags:
 *       - 认证
 *     summary: 修改密码
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: 当前密码
 *               newPassword:
 *                 type: string
 *                 description: 新密码
 *     responses:
 *       200:
 *         description: 修改成功
 */
router.post('/change-password', authenticateToken, validate(userSchemas.changePassword), authController.changePassword)

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - 认证
 *     summary: 用户登出
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 登出成功
 */
router.post('/logout', authenticateToken, authController.logout)

module.exports = router