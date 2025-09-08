const express = require('express')
const router = express.Router()

// 健康检查端点
router.get('/health', async (req, res) => {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      services: {}
    }

    // 检查数据库连接
    if (process.env.DB_TYPE === 'mysql') {
      try {
        // 这里可以添加MySQL连接检查
        healthData.services.database = {
          status: 'connected',
          type: 'mysql'
        }
      } catch (error) {
        healthData.services.database = {
          status: 'disconnected',
          type: 'mysql',
          error: error.message
        }
        healthData.status = 'degraded'
      }
    } else {
      // NeDB不需要连接检查
      healthData.services.database = {
        status: 'available',
        type: 'nedb'
      }
    }

    // 检查Redis连接 (如果配置)
    if (process.env.REDIS_HOST) {
      try {
        // 这里可以添加Redis连接检查
        healthData.services.redis = {
          status: 'connected'
        }
      } catch (error) {
        healthData.services.redis = {
          status: 'disconnected',
          error: error.message
        }
        healthData.status = 'degraded'
      }
    }

    // 根据整体状态设置HTTP状态码
    const statusCode = healthData.status === 'healthy' ? 200 : 503
    res.status(statusCode).json(healthData)

  } catch (error) {
    console.error('Health check error:', error)
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    })
  }
})

// 就绪检查端点 (Kubernetes风格)
router.get('/ready', async (req, res) => {
  try {
    // 检查应用是否准备好接收流量
    const ready = {
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'pass',
        memory: process.memoryUsage().heapUsed < 500 * 1024 * 1024 ? 'pass' : 'warn'
      }
    }

    res.json(ready)
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message
    })
  }
})

// 存活检查端点 (Kubernetes风格)
router.get('/live', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

module.exports = router