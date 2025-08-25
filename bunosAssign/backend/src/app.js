const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const path = require('path')
const fs = require('fs')

// 根据环境加载对应的配置文件
const envFile = process.env.NODE_ENV === 'development' ? 'env.development' : '.env'
const envPath = path.join(__dirname, '..', envFile)

console.log('🔧 尝试加载环境文件:', envPath)
console.log('🔧 当前 NODE_ENV:', process.env.NODE_ENV)

// 检查文件是否存在并加载环境变量
if (!fs.existsSync(envPath)) {
  console.warn('⚠️ 环境文件不存在，回退到默认.env文件')
  const fallbackPath = path.join(__dirname, '..', '.env')
  if (fs.existsSync(fallbackPath)) {
    require('dotenv').config({ path: fallbackPath })
  } else {
    console.error('❌ 找不到任何环境配置文件')
  }
} else {
  require('dotenv').config({ path: envPath })
}

// 验证关键环境变量并提供后备方案
if (!process.env.JWT_SECRET) {
  console.error('❌ 错误: JWT_SECRET 环境变量未设置!')
  console.error('尝试加载的配置文件:', envPath)
  console.error('当前环境变量 NODE_ENV:', process.env.NODE_ENV)
  
  // 使用后备方案避免系统崩溃
  if (process.env.NODE_ENV === 'development') {
    process.env.JWT_SECRET = 'dev-fallback-jwt-secret-key-2024'
    process.env.JWT_REFRESH_SECRET = 'dev-fallback-refresh-secret-key-2024'
    process.env.JWT_EXPIRES_IN = '2h'
    process.env.JWT_REFRESH_EXPIRES_IN = '7d'
    console.warn('⚠️ 开发环境：使用后备JWT密钥')
  } else {
    console.error('❌ 生产环境必须设置JWT_SECRET!')
    process.exit(1)
  }
}

console.log('✅ 环境变量加载成功:')
console.log('  NODE_ENV:', process.env.NODE_ENV)
console.log('  PORT:', process.env.PORT)
console.log('  JWT_SECRET:', process.env.JWT_SECRET ? '已设置' : '未设置')
console.log('')

const logger = require('./utils/logger')
const errorHandler = require('./middlewares/error')

// NeDB服务需要延迟加载，避免循环依赖和初始化竞争
let nedbService = null

// 延迟加载路由模块函数
function loadRoutes() {
  console.log('🔄 开始加载路由模块...')
  return {
    authRoutes: require('./routes/auth'),
    userRoutes: require('./routes/user'),
    roleRoutes: require('./routes/roles'),
    employeeRoutes: require('./routes/employee'),
    departmentRoutes: require('./routes/departments'),
    positionRoutes: require('./routes/positions'),
    businessLineRoutes: require('./routes/businessLines'),
    projectRoutes: require('./routes/projects'),
    calculationRoutes: require('./routes/calculation'),
    simulationRoutes: require('./routes/simulation'),
    profitRoutes: require('./routes/profitRoutes'),
    positionValueRoutes: require('./routes/positionValueRoutes'),
    performanceRoutes: require('./routes/performanceRoutes'),
    threeDimensionalRoutes: require('./routes/threeDimensionalRoutes'),
    bonusAllocationRoutes: require('./routes/bonusAllocationRoutes'),
    dataImportExportRoutes: require('./routes/dataImportExportRoutes'),
    personalBonusRoutes: require('./routes/personalBonus'),
    projectCollaborationRoutes: require('./routes/projectCollaboration'),
    permissionDelegationRoutes: require('./routes/permissionDelegation'),
    projectCostRoutes: require('./routes/projectCosts'),
    positionRequirementRoutes: require('./routes/positionRequirements'),
    projectMembersRoutes: require('./routes/projectMembers'),
    projectBonusRoutes: require('./routes/projectBonus'),
    reportsRoutes: require('./routes/reports'),
    healthRoutes: require('./routes/health')
  }
}

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

// 路由配置函数 - 在NeDB初始化后调用
function setupRoutes(routes) {
  console.log('🔄 配置API路由...')
  app.use('/api/auth', routes.authRoutes)
  app.use('/api/users', routes.userRoutes)
  app.use('/api/roles', routes.roleRoutes)
  app.use('/api/employees', routes.employeeRoutes)
  app.use('/api/departments', routes.departmentRoutes)
  app.use('/api/positions', routes.positionRoutes)
  app.use('/api/business-lines', routes.businessLineRoutes)
  app.use('/api/projects', routes.projectRoutes)
  app.use('/api/project-members', routes.projectMembersRoutes)
  app.use('/api/project-bonus', routes.projectBonusRoutes)
  app.use('/api/calculations', routes.calculationRoutes)
  app.use('/api/simulations', routes.simulationRoutes)
  app.use('/api/profit', routes.profitRoutes)
  app.use('/api/position-value', routes.positionValueRoutes)
  app.use('/api/performance', routes.performanceRoutes)
  app.use('/api/three-dimensional', routes.threeDimensionalRoutes)
  app.use('/api/bonus-allocation', routes.bonusAllocationRoutes)
  app.use('/api/data', routes.dataImportExportRoutes)
  app.use('/api/personal-bonus', routes.personalBonusRoutes)
  app.use('/api/project-collaboration', routes.projectCollaborationRoutes)
  app.use('/api/permission-delegation', routes.permissionDelegationRoutes)
  app.use('/api/project-costs', routes.projectCostRoutes)
  app.use('/api/position-requirements', routes.positionRequirementRoutes)
  app.use('/api/reports', routes.reportsRoutes)
  app.use('/api', routes.healthRoutes)
  console.log('✅ API路由配置完成')
}

// Swagger API文档
if (process.env.NODE_ENV !== 'production') {
  try {
    const swaggerUi = require('swagger-ui-express')
    const swaggerSpec = require('./docs/swagger')
    
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
    logger.info('Swagger文档已启用: http://localhost:' + PORT + '/api/docs')
  } catch (error) {
    logger.warn('Swagger文档加载失败:', error.message)
  }
}

// 错误处理中间件
app.use(errorHandler)

// 启动服务器
async function startServer() {
  try {
    // 初始化 NeDB 服务 - 增强的错误处理和重试机制
    console.log('🔄 开始初始化 NeDB 服务...')
    
    // 延迟加载 NeDB 服务，避免循环依赖
    if (!nedbService) {
      nedbService = require('./services/nedbService')
    }
    
    let retryCount = 0
    const maxRetries = 5
    const retryDelay = 1000 // 1秒
    
    while (retryCount < maxRetries) {
      try {
        console.log(`🔄 尝试初始化 NeDB 服务 (${retryCount + 1}/${maxRetries})...`)
        
        // 检查服务是否已经初始化
        if (nedbService.isInitialized) {
          console.log('✅ NeDB 服务已经初始化，跳过重复初始化')
          break
        }
        
        await nedbService.initialize()
        
        // 验证初始化是否成功
        if (!nedbService.isInitialized) {
          throw new Error('NeDB 服务初始化状态验证失败')
        }
        
        logger.info('✅ NeDB 服务初始化成功')
        break
        
      } catch (initError) {
        retryCount++
        const errorMsg = initError.message || initError.toString()
        console.error(`❌ NeDB 初始化失败 (尝试 ${retryCount}/${maxRetries}): ${errorMsg}`)
        logger.error(`NeDB 初始化失败 (尝试 ${retryCount}/${maxRetries}):`, initError)
        
        if (retryCount >= maxRetries) {
          throw new Error(`NeDB 初始化失败，已尝试 ${maxRetries} 次: ${errorMsg}`)
        }
        
        // 渐进式退避：每次重试增加延迟时间
        const delay = retryDelay * retryCount
        console.log(`⏱️ 等待 ${delay}ms 后重试...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    // 设置全局 NeDB 服务引用，供其他模块使用
    global.nedbService = nedbService
    
    // NeDB初始化完成后，加载并配置路由
    console.log('🔄 NeDB初始化完成，开始加载路由...')
    const routes = loadRoutes()
    setupRoutes(routes)
    
    // 启动 HTTP 服务器
    const server = app.listen(PORT, () => {
      logger.info(`🚀 服务器启动成功，端口: ${PORT}`)
      logger.info(`🌐 服务器地址: http://localhost:${PORT}`)
      
      if (process.env.NODE_ENV !== 'production') {
        logger.info(`📚 API文档地址: http://localhost:${PORT}/api/docs`)
      }
      
      // 异步获取数据库统计信息，不阻塞启动流程
      setImmediate(async () => {
        try {
          logger.info(`📊 获取数据库统计信息...`)
          const stats = await nedbService.getDatabaseStats()
          logger.info(`📊 数据库统计信息:`)
          logger.info(`   业务线: ${stats.businessLines} 条`)
          logger.info(`   部门: ${stats.departments} 条`)
          logger.info(`   岗位: ${stats.positions} 条`)
          logger.info(`   角色: ${stats.roles} 条`)
          logger.info(`   用户: ${stats.users} 条`)
          logger.info(`   员工: ${stats.employees} 条`)
        } catch (err) {
          logger.warn('获取数据库统计信息失败:', err.message)
        }
      })
    })
    
    // 设置服务器错误监听
    server.on('error', (error) => {
      console.error('❌ 服务器错误:', error)
      logger.error('Server error:', error)
      
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ 端口 ${PORT} 已被占用，请更换端口或停止占用该端口的进程`)
        process.exit(1)
      }
    })
    
    // 保存服务器实例供优雅关闭使用
    global.httpServer = server
    
  } catch (error) {
    const errorMsg = error.message || error.toString()
    console.error('❌ 服务器启动失败:', errorMsg)
    console.error('详细错误信息:', error)
    logger.error('Server startup failed:', error)
    
    // 清理资源
    if (nedbService && typeof nedbService.close === 'function') {
      try {
        await nedbService.close()
      } catch (closeError) {
        console.error('NeDB 服务关闭失败:', closeError.message)
      }
    }
    
    process.exit(1)
  }
}

// 优雅关闭函数
async function gracefulShutdown(signal) {
  console.log(`\n收到 ${signal} 信号，开始优雅关闭服务器...`)
  logger.info(`收到 ${signal} 信号，正在关闭服务器...`)
  
  try {
    // 停止接受新连接
    if (global.httpServer) {
      console.log('🔄 关闭 HTTP 服务器...')
      await new Promise((resolve, reject) => {
        global.httpServer.close((err) => {
          if (err) reject(err)
          else resolve()
        })
      })
      console.log('✅ HTTP 服务器已关闭')
    }
    
    // 关闭数据库连接
    if (global.nedbService && typeof global.nedbService.close === 'function') {
      console.log('🔄 关闭数据库连接...')
      await global.nedbService.close()
      console.log('✅ 数据库连接已关闭')
    }
    
    console.log('✅ 服务器优雅关闭完成')
    logger.info('服务器优雅关闭完成')
    process.exit(0)
    
  } catch (error) {
    console.error('❌ 优雅关闭过程中发生错误:', error.message)
    logger.error('Graceful shutdown error:', error)
    process.exit(1)
  }
}

// 优雅关闭
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// 未处理的异常捕获
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error)
  logger.error('未捕获的异常:', error)
  
  // 给予一些时间来记录日志，然后退出
  setTimeout(() => {
    process.exit(1)
  }, 1000)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的 Promise 拒绝 at:', promise, 'reason:', reason)
  logger.error('未处理的 Promise 拒绝:', { reason, promise })
  
  // 对于 NeDB 相关的 Promise 拒绝，给予更多容错
  const reasonStr = reason ? reason.toString() : ''
  if (reasonStr.includes('NeDB') || reasonStr.includes('database') || reasonStr.includes('初始化')) {
    logger.warn('检测到数据库相关的 Promise 拒绝，尝试继续运行...')
    return
  }
  
  // 给予一些时间来记录日志，然后退出
  setTimeout(() => {
    process.exit(1)
  }, 1000)
})

// 内存警告
process.on('warning', (warning) => {
  console.warn('⚠️ Node.js 警告:', warning.name, warning.message)
  logger.warn('Node.js warning:', warning)
})

// 启动服务器
setImmediate(() => {
  startServer().catch((error) => {
    console.error('❌ 启动服务器时发生未捕获的错误:', error)
    logger.error('Uncaught server startup error:', error)
    process.exit(1)
  })
})

module.exports = app
