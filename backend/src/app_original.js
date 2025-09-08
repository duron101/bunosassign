const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const path = require('path')

// 根据环境加载对应的配置文件
const envFile = process.env.NODE_ENV === 'development' ? 'env.development' : '.env'
require('dotenv').config({ path: path.join(__dirname, '..', envFile) })

// 验证关键环境变量
if (!process.env.JWT_SECRET) {
  console.error('❌ 错误: JWT_SECRET 环境变量未设置!')
  console.error('请检查配置文件:', path.join(__dirname, '..', envFile))
  process.exit(1)
}

console.log('✅ 环境变量加载成功:')
console.log('  NODE_ENV:', process.env.NODE_ENV)
console.log('  PORT:', process.env.PORT)
console.log('  JWT_SECRET:', process.env.JWT_SECRET ? '已设置' : '未设置')
console.log('')

const logger = require('./utils/logger')
const nedbService = require('./services/nedbService')
const errorHandler = require('./middlewares/error')

// 导入路由
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/user')
const roleRoutes = require('./routes/roles')
const employeeRoutes = require('./routes/employee')
const departmentRoutes = require('./routes/departments')
const positionRoutes = require('./routes/positions')
const businessLineRoutes = require('./routes/businessLines')
const projectRoutes = require('./routes/projects')
const calculationRoutes = require('./routes/calculation')
const simulationRoutes = require('./routes/simulation')
const profitRoutes = require('./routes/profitRoutes')
const positionValueRoutes = require('./routes/positionValueRoutes')
const performanceRoutes = require('./routes/performanceRoutes')
const threeDimensionalRoutes = require('./routes/threeDimensionalRoutes')
const bonusAllocationRoutes = require('./routes/bonusAllocationRoutes')
const dataImportExportRoutes = require('./routes/dataImportExportRoutes')
const personalBonusRoutes = require('./routes/personalBonus')
const projectCollaborationRoutes = require('./routes/projectCollaboration')

const app = express()
const PORT = process.env.PORT || 3000

// 中间件配置
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}))

// 限流配置
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: '请求过于频繁，请稍后再试'
})
app.use('/api/', limiter)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// 请求日志
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`)
  next()
})

// 路由配置
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/roles', roleRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/departments', departmentRoutes)
app.use('/api/positions', positionRoutes)
app.use('/api/business-lines', businessLineRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/project-members', require('./routes/projectMembers'))
app.use('/api/project-bonus', require('./routes/projectBonus'))
app.use('/api/calculations', calculationRoutes)
app.use('/api/simulations', simulationRoutes)
app.use('/api/profit', profitRoutes)
app.use('/api/position-value', positionValueRoutes)
app.use('/api/performance', performanceRoutes)
app.use('/api/three-dimensional', threeDimensionalRoutes)
app.use('/api/bonus-allocation', bonusAllocationRoutes)
app.use('/api/data', dataImportExportRoutes)
app.use('/api/personal-bonus', personalBonusRoutes)
app.use('/api/project-collaboration', projectCollaborationRoutes)

// Swagger API文档
if (process.env.NODE_ENV !== 'production') {
  const swaggerUi = require('swagger-ui-express')
  const swaggerSpec = require('./docs/swagger')
  
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
  logger.info('Swagger文档已启用: http://localhost:' + PORT + '/api/docs')
}

// 错误处理中间件
app.use(errorHandler)

// 启动服务器
async function startServer() {
  try {
    // 初始化 NeDB 服务
    await nedbService.initialize()
    logger.info('✅ NeDB 服务初始化成功')
    
    // 启动 HTTP 服务器
    app.listen(PORT, () => {
      logger.info(`🚀 服务器启动成功，端口: ${PORT}`)
      logger.info(`📊 数据库统计信息:`)
      
      // 获取数据库统计信息
      nedbService.getDatabaseStats()
        .then(stats => {
          logger.info(`   业务线: ${stats.businessLines} 条`)
          logger.info(`   部门: ${stats.departments} 条`)
          logger.info(`   岗位: ${stats.positions} 条`)
          logger.info(`   角色: ${stats.roles} 条`)
          logger.info(`   用户: ${stats.users} 条`)
          logger.info(`   员工: ${stats.employees} 条`)
        })
        .catch(err => {
          logger.error('获取数据库统计信息失败:', err.message)
        })
    })
    
  } catch (error) {
    logger.error('❌ 服务器启动失败:', error.message)
    process.exit(1)
  }
}

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('收到 SIGTERM 信号，正在关闭服务器...')
  process.exit(0)
})

process.on('SIGINT', () => {
  logger.info('收到 SIGINT 信号，正在关闭服务器...')
  process.exit(0)
})

// 启动服务器
startServer()

module.exports = app