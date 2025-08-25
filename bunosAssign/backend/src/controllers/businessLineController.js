const nedbService = require('../services/nedbService')
const logger = require('../utils/logger')

class BusinessLineController {
  // 获取业务线列表
  async getBusinessLines(req, res, next) {
    try {
      const { 
        page = 1, 
        pageSize = 20, 
        search, 
        status 
      } = req.query

      // 获取所有业务线
      let businessLines = await nedbService.getBusinessLines()
      
      // 搜索过滤
      if (search) {
        businessLines = businessLines.filter(line => 
          line.name.toLowerCase().includes(search.toLowerCase()) ||
          line.code.toLowerCase().includes(search.toLowerCase()) ||
          (line.description && line.description.toLowerCase().includes(search.toLowerCase()))
        )
      }

      // 状态过滤
      if (status !== undefined) {
        businessLines = businessLines.filter(line => line.status === parseInt(status))
      }

      // 分页处理
      const total = businessLines.length
      const offset = (page - 1) * pageSize
      const paginatedBusinessLines = businessLines.slice(offset, offset + parseInt(pageSize))

      // 获取每个业务线的部门和员工数量
      const businessLinesWithStats = await Promise.all(
        paginatedBusinessLines.map(async (businessLine) => {
          const departmentCount = await nedbService.count('departments', { 
            businessLineId: businessLine._id,
            status: 1 
          })

          // 获取属于该业务线的员工数量
          // 先获取该业务线下的所有部门ID
          const departments = await nedbService.find('departments', { 
            businessLineId: businessLine._id,
            status: 1 
          })
          const departmentIds = departments.map(dept => dept._id)
          
          // 统计属于这些部门的员工数量
          let employeeCount = 0
          if (departmentIds.length > 0) {
            employeeCount = await nedbService.count('employees', { 
              departmentId: { $in: departmentIds },
              status: 1 
            })
          }
          
          return {
            ...businessLine,
            id: businessLine._id, // 兼容前端期望的 id 字段
            departmentCount,
            employeeCount
          }
        })
      )

      res.json({
        code: 200,
        data: {
          businessLines: businessLinesWithStats,
          pagination: {
            total: total,
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            totalPages: Math.ceil(total / pageSize)
          }
        },
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get business lines error:', error)
      next(error)
    }
  }

  // 获取业务线详情
  async getBusinessLine(req, res, next) {
    try {
      const { id } = req.params

      const businessLine = await nedbService.getBusinessLineById(id)

      if (!businessLine) {
        return res.status(404).json({
          code: 404,
          message: '业务线不存在',
          data: null
        })
      }

      // 获取统计信息
      const departmentCount = await nedbService.count('departments', { 
        businessLineId: businessLine._id,
        status: 1 
      })

      // 获取属于该业务线的员工数量
      const departments = await nedbService.find('departments', { 
        businessLineId: businessLine._id,
        status: 1 
      })
      const departmentIds = departments.map(dept => dept._id)
      
      let employeeCount = 0
      if (departmentIds.length > 0) {
        employeeCount = await nedbService.count('employees', { 
          departmentId: { $in: departmentIds },
          status: 1 
        })
      }

      res.json({
        code: 200,
        data: {
          ...businessLine,
          id: businessLine._id,
          departmentCount,
          employeeCount
        },
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get business line error:', error)
      next(error)
    }
  }

  // 创建业务线
  async createBusinessLine(req, res, next) {
    try {
      const businessLineData = req.body

      // 检查代码是否已存在
      const existingBusinessLine = await nedbService.findOne('businessLines', { 
        code: businessLineData.code 
      })

      if (existingBusinessLine) {
        return res.status(400).json({
          code: 400,
          message: '业务线代码已存在',
          data: null
        })
      }

      const newBusinessLine = await nedbService.createBusinessLine(businessLineData)

      res.status(201).json({
        code: 201,
        data: {
          ...newBusinessLine,
          id: newBusinessLine._id
        },
        message: '创建成功'
      })

    } catch (error) {
      logger.error('Create business line error:', error)
      next(error)
    }
  }

  // 更新业务线
  async updateBusinessLine(req, res, next) {
    try {
      const { id } = req.params
      const updateData = req.body

      // 检查业务线是否存在
      const existingBusinessLine = await nedbService.getBusinessLineById(id)
      if (!existingBusinessLine) {
        return res.status(404).json({
          code: 404,
          message: '业务线不存在',
          data: null
        })
      }

      // 如果更新代码，检查是否与其他业务线冲突
      if (updateData.code && updateData.code !== existingBusinessLine.code) {
        const codeExists = await nedbService.findOne('businessLines', { 
          code: updateData.code,
          _id: { $ne: id }
        })

        if (codeExists) {
          return res.status(400).json({
            code: 400,
            message: '业务线代码已存在',
            data: null
          })
        }
      }

      const result = await nedbService.updateBusinessLine(id, updateData)

      if (result > 0) {
        const updatedBusinessLine = await nedbService.getBusinessLineById(id)
        res.json({
          code: 200,
          data: {
            ...updatedBusinessLine,
            id: updatedBusinessLine._id
          },
          message: '更新成功'
        })
      } else {
        res.status(400).json({
          code: 400,
          message: '更新失败',
          data: null
        })
      }

    } catch (error) {
      logger.error('Update business line error:', error)
      next(error)
    }
  }

  // 删除业务线
  async deleteBusinessLine(req, res, next) {
    try {
      const { id } = req.params

      // 检查业务线是否存在
      const existingBusinessLine = await nedbService.getBusinessLineById(id)
      if (!existingBusinessLine) {
        return res.status(404).json({
          code: 404,
          message: '业务线不存在',
          data: null
        })
      }

      // 检查是否有关联的部门
      const departmentCount = await nedbService.count('departments', { 
        businessLineId: id,
        status: 1 
      })

      if (departmentCount > 0) {
        return res.status(400).json({
          code: 400,
          message: '该业务线下还有部门，无法删除',
          data: null
        })
      }

      const result = await nedbService.deleteBusinessLine(id)

      if (result > 0) {
        res.json({
          code: 200,
          message: '删除成功',
          data: null
        })
      } else {
        res.status(400).json({
          code: 400,
          message: '删除失败',
          data: null
        })
      }

    } catch (error) {
      logger.error('Delete business line error:', error)
      next(error)
    }
  }

  // 获取业务线统计信息
  async getBusinessLineStats(req, res, next) {
    try {
      const businessLines = await nedbService.getBusinessLines()
      
      const stats = await Promise.all(
        businessLines.map(async (businessLine) => {
          const departmentCount = await nedbService.count('departments', { 
            businessLineId: businessLine._id,
            status: 1 
          })

          const employeeCount = await nedbService.count('employees', { 
            status: 1 
          })

          return {
            id: businessLine._id,
            name: businessLine.name,
            code: businessLine.code,
            departmentCount,
            employeeCount
          }
        })
      )

      res.json({
        code: 200,
        data: stats,
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get business line stats error:', error)
      next(error)
    }
  }

  // 获取业务线绩效统计
  async getPerformanceStats(req, res, next) {
    try {
      const { id } = req.params
      const { year = new Date().getFullYear() } = req.query

      const businessLine = await nedbService.getBusinessLineById(id)
      if (!businessLine) {
        return res.status(404).json({
          code: 404,
          message: '业务线不存在',
          data: null
        })
      }

      // 获取部门数量
      const departmentCount = await nedbService.count('departments', { 
        businessLineId: id,
        status: 1 
      })

      // 获取员工数量
      const employeeCount = await nedbService.count('employees', { 
        status: 1 
      })

      const stats = {
        businessLine: {
          id: businessLine._id,
          name: businessLine.name,
          code: businessLine.code,
          weight: businessLine.weight || 0
        },
        summary: {
          departmentCount,
          employeeCount,
          year: parseInt(year)
        },
        kpiMetrics: businessLine.kpiMetrics || []
      }

      res.json({
        code: 200,
        data: stats,
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get performance stats error:', error)
      next(error)
    }
  }

  // 批量操作业务线
  async batchBusinessLines(req, res, next) {
    try {
      const { action, businessLineIds } = req.body

      if (!businessLineIds || !Array.isArray(businessLineIds) || businessLineIds.length === 0) {
        return res.status(400).json({
          code: 400,
          message: '请选择要操作的业务线',
          data: null
        })
      }

      let updateData = { updatedAt: new Date() }
      let actionText = ''

      switch (action) {
        case 'enable':
          updateData.status = 1
          actionText = '启用'
          break
        case 'disable':
          updateData.status = 0
          actionText = '禁用'
          break
        default:
          return res.status(400).json({
            code: 400,
            message: '无效的操作类型',
            data: null
          })
      }

      // 批量更新业务线状态
      let updatedCount = 0
      for (const businessLineId of businessLineIds) {
        try {
          const result = await nedbService.updateBusinessLine(businessLineId, updateData)
          if (result > 0) {
            updatedCount++
          }
        } catch (error) {
          logger.error(`批量操作业务线 ${businessLineId} 失败:`, error.message)
        }
      }

      res.json({
        code: 200,
        data: { updatedCount },
        message: `批量${actionText}成功，共处理${updatedCount}个业务线`
      })

    } catch (error) {
      logger.error('Batch business lines error:', error)
      next(error)
    }
  }
}

module.exports = new BusinessLineController()