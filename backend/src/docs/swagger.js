const swaggerJSDoc = require('swagger-jsdoc')

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '奖金模拟系统 API',
      version: '1.0.0',
      description: '基于Vue3开发的奖金模拟系统后端API文档',
      contact: {
        name: 'Development Team',
        email: 'dev@company.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: '开发环境'
      },
      {
        url: 'https://api.bonus-system.com',
        description: '生产环境'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            username: { type: 'string' },
            realName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            roleId: { type: 'integer' },
            roleName: { type: 'string' },
            departmentId: { type: 'integer' },
            departmentName: { type: 'string' },
            status: { type: 'integer', enum: [0, 1] },
            lastLogin: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Employee: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            employeeNo: { type: 'string' },
            name: { type: 'string' },
            departmentId: { type: 'integer' },
            positionId: { type: 'integer' },
            annualSalary: { type: 'number', format: 'decimal' },
            entryDate: { type: 'string', format: 'date' },
            status: { type: 'integer', enum: [0, 1] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        BonusPool: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            period: { type: 'string' },
            totalProfit: { type: 'number', format: 'decimal' },
            poolRatio: { type: 'number', format: 'decimal' },
            poolAmount: { type: 'number', format: 'decimal' },
            reserveRatio: { type: 'number', format: 'decimal' },
            specialRatio: { type: 'number', format: 'decimal' },
            distributableAmount: { type: 'number', format: 'decimal' },
            status: { type: 'string', enum: ['draft', 'active', 'archived'] },
            createdBy: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            code: { type: 'integer' },
            message: { type: 'string' },
            data: { type: 'object' }
          }
        },
        PaginationResponse: {
          allOf: [
            { $ref: '#/components/schemas/ApiResponse' },
            {
              type: 'object',
              properties: {
                data: {
                  type: 'object',
                  properties: {
                    total: { type: 'integer' },
                    list: { type: 'array', items: {} },
                    page: { type: 'integer' },
                    pageSize: { type: 'integer' }
                  }
                }
              }
            }
          ]
        },
        Error: {
          type: 'object',
          properties: {
            code: { type: 'integer' },
            message: { type: 'string' },
            data: { type: 'null' }
          }
        }
      },
      responses: {
        Unauthorized: {
          description: '未认证',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        Forbidden: {
          description: '权限不足',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        NotFound: {
          description: '资源不存在',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        ValidationError: {
          description: '数据验证失败',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    tags: [
      {
        name: '认证',
        description: '用户认证相关接口'
      },
      {
        name: '用户管理',
        description: '用户管理相关接口'
      },
      {
        name: '员工管理',
        description: '员工管理相关接口'
      },
      {
        name: '奖金计算',
        description: '奖金计算相关接口'
      },
      {
        name: '模拟分析',
        description: '模拟分析相关接口'
      },
      {
        name: '报表',
        description: '报表相关接口'
      }
    ]
  },
  apis: ['./src/routes/*.js']
}

const specs = swaggerJSDoc(options)

module.exports = specs