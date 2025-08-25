const logger = require('../utils/logger')

const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  // 记录错误日志
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  })

  // Sequelize验证错误
  if (err.name === 'SequelizeValidationError') {
    const message = err.errors.map(error => error.message).join(', ')
    return res.status(400).json({
      code: 400,
      message: `数据验证失败: ${message}`,
      data: null
    })
  }

  // Sequelize唯一约束错误
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0].path
    return res.status(400).json({
      code: 400,
      message: `${field} 已存在`,
      data: null
    })
  }

  // JWT错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      code: 401,
      message: '无效的访问令牌',
      data: null
    })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      code: 401,
      message: '访问令牌已过期',
      data: null
    })
  }

  // 默认错误
  res.status(error.statusCode || 500).json({
    code: error.statusCode || 500,
    message: error.message || '服务器内部错误',
    data: null
  })
}

module.exports = errorHandler