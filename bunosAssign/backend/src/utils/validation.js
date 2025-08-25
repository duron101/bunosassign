const Joi = require('joi')

// 通用验证规则
const commonSchemas = {
  id: Joi.number().integer().positive().required(),
  email: Joi.string().email().max(100).allow('', null),
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).message('手机号格式不正确'),
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20)
  }
}

// 用户相关验证
const userSchemas = {
  login: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().min(6).max(128).required()
  }),
  
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/).required()
      .messages({
        'string.pattern.base': '密码至少8位，需包含字母和数字'
      }),
    realName: Joi.string().min(2).max(50).required(),
    email: commonSchemas.email.optional(),
    phone: commonSchemas.phone.optional(),
    roleId: Joi.string().required(), // 改为字符串类型，与NeDB的_id字段一致
    departmentId: Joi.string().optional(),
    status: Joi.number().integer().valid(0, 1).default(1), // 允许status字段，默认为1
    employeeId: Joi.string().optional() // 新增：员工ID字段，用于关联员工记录
  }),
  
  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/).required()
      .messages({
        'string.pattern.base': '新密码至少8位，需包含字母和数字'
      })
  }),
  
  update: Joi.object({
    realName: Joi.string().min(2).max(50),
    email: commonSchemas.email.optional(),
    phone: commonSchemas.phone.optional(),
    roleId: Joi.string(), // 改为字符串类型，与NeDB的_id字段一致
    departmentId: Joi.string().optional(),
    status: Joi.number().integer().valid(0, 1),
    employeeId: Joi.string().optional() // 新增：员工ID字段，用于关联员工记录
  })
}

// 员工相关验证
const employeeSchemas = {
  create: Joi.object({
    employeeNo: Joi.string().max(50).required(),
    name: Joi.string().min(2).max(50).required(),
    departmentId: Joi.string().required(),
    positionId: Joi.string().required(),
    annualSalary: Joi.number().positive().required(),
    entryDate: Joi.date().required(),
    phone: Joi.string().pattern(/^1[3-9]\d{9}$/).allow('', null).optional(),
    email: Joi.string().email().max(100).allow('', null).optional(),
    idCard: Joi.string().max(18).allow('', null).optional(),
    emergencyContact: Joi.string().max(50).allow('', null).optional(),
    emergencyPhone: Joi.string().pattern(/^1[3-9]\d{9}$/).allow('', null).optional(),
    address: Joi.string().max(200).allow('', null).optional()
  }),
  
  update: Joi.object({
    name: Joi.string().min(2).max(50),
    departmentId: Joi.string(),
    positionId: Joi.string(),
    annualSalary: Joi.number().positive(),
    entryDate: Joi.date(),
    status: Joi.number().integer().valid(0, 1),
    phone: Joi.string().pattern(/^1[3-9]\d{9}$/).allow('', null).optional(),
    email: Joi.string().email().max(100).allow('', null).optional(),
    idCard: Joi.string().max(18).allow('', null).optional(),
    emergencyContact: Joi.string().max(50).allow('', null).optional(),
    emergencyPhone: Joi.string().pattern(/^1[3-9]\d{9}$/).allow('', null).optional(),
    address: Joi.string().max(200).allow('', null).optional()
  })
}

// 奖金池相关验证
const bonusPoolSchemas = {
  create: Joi.object({
    period: Joi.string().pattern(/^\d{4}-(H1|H2|Q[1-4])$/).required(),
    totalProfit: Joi.number().positive().required(),
    poolRatio: Joi.number().min(0).max(1).required(),
    reserveRatio: Joi.number().min(0).max(0.2).default(0.02),
    specialRatio: Joi.number().min(0).max(0.1).default(0.03),
    lineWeights: Joi.array().items(
      Joi.object({
        lineId: Joi.number().integer().positive().required(),
        weight: Joi.number().min(0).max(1).required()
      })
    ).required()
  })
}

// 绩效相关验证
const performanceSchemas = {
  create: Joi.object({
    employeeId: Joi.number().integer().positive().required(),
    period: Joi.string().required(),
    rating: Joi.string().valid('excellent', 'good', 'pass', 'fail').required(),
    coefficient: Joi.number().min(0).max(1.2).required(),
    excellenceRating: Joi.string().valid('A+', 'A', 'B', 'C', '-').default('-'),
    comments: Joi.string().max(500)
  })
}

// 验证中间件
const validate = (schema) => {
  return (req, res, next) => {
    console.log('🔍 验证中间件 - 接收到的数据:', req.body)
    console.log('🔍 验证中间件 - 接收到的schema参数:', schema)
    console.log('🔍 验证中间件 - schema类型:', typeof schema)
    console.log('🔍 验证中间件 - schema描述:', schema.describe())
    
    const { error } = schema.validate(req.body)
    
    if (error) {
      console.log('🔍 验证中间件 - 验证失败:', error.details)
      return res.status(400).json({
        code: 400,
        message: `数据验证失败: ${error.details[0].message}`,
        data: null
      })
    }
    
    console.log('🔍 验证中间件 - 验证成功')
    next()
  }
}

// 查询参数验证中间件
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query)
    
    if (error) {
      return res.status(400).json({
        code: 400,
        message: `查询参数验证失败: ${error.details[0].message}`,
        data: null
      })
    }
    
    req.query = value
    next()
  }
}

module.exports = {
  commonSchemas,
  userSchemas,
  employeeSchemas,
  bonusPoolSchemas,
  performanceSchemas,
  validate,
  validateQuery
}