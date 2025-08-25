const nedbService = require('../services/nedbService')
const logger = require('../utils/logger')

class DepartmentController {
  // 获取部门列表
  async getDepartments(req, res, next) {
    try {
      const { 
        page = 1, 
        pageSize = 20, 
        search, 
        businessLineId, 
        status 
      } = req.query

      // 获取所有部门
      let departments = await nedbService.getDepartments()
      console.log('从NeDB获取的原始部门数据:', departments)
      
      // 搜索过滤
      if (search) {
        departments = departments.filter(dept => 
          dept.name.toLowerCase().includes(search.toLowerCase()) ||
          dept.code.toLowerCase().includes(search.toLowerCase()) ||
          (dept.description && dept.description.toLowerCase().includes(search.toLowerCase()))
        )
      }

      // 业务线过滤
      if (businessLineId) {
        departments = departments.filter(dept => dept.businessLineId === businessLineId)
      }

      // 状态过滤
      if (status !== undefined) {
        departments = departments.filter(dept => dept.status === parseInt(status))
      }

      // 分页处理
      const total = departments.length
      const offset = (page - 1) * pageSize
      const paginatedDepartments = departments.slice(offset, offset + parseInt(pageSize))

      // 获取每个部门的员工数量和业务线信息
      const departmentsWithDetails = await Promise.all(
        paginatedDepartments.map(async (department) => {
          const employeeCount = await nedbService.count('employees', { 
            departmentId: department._id,
            status: 1 
          })

          let businessLine = null
          if (department.businessLineId) {
            businessLine = await nedbService.getBusinessLineById(department.businessLineId)
          }
          
          const processedDept = {
            ...department,
            id: department._id, // 兼容前端期望的 id 字段
            employeeCount,
            businessLine: businessLine ? {
              id: businessLine._id,
              name: businessLine.name,
              code: businessLine.code
            } : null
          }
          
          // 移除原始的_id字段，避免前端混淆
          delete processedDept._id
          
          console.log('处理后的部门数据:', processedDept)
          return processedDept
        })
      )

      console.log('最终返回的部门数据:', departmentsWithDetails)
      res.json({
        code: 200,
        data: {
          departments: departmentsWithDetails,
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
      logger.error('Get departments error:', error)
      next(error)
    }
  }

  // 获取部门详情
  async getDepartment(req, res, next) {
    try {
      const { id } = req.params

      const department = await nedbService.getDepartmentById(id)

      if (!department) {
        return res.status(404).json({
          code: 404,
          message: '部门不存在',
          data: null
        })
      }

      // 获取业务线信息
      let businessLine = null
      if (department.businessLineId) {
        businessLine = await nedbService.getBusinessLineById(department.businessLineId)
      }

      // 获取员工数量
      const employeeCount = await nedbService.count('employees', { 
        departmentId: department._id,
        status: 1 
      })

      const processedDepartment = {
        ...department,
        id: department._id,
        businessLine: businessLine ? {
          id: businessLine._id,
          name: businessLine.name,
          code: businessLine.code
        } : null,
        employeeCount
      }
      
      // 移除原始的_id字段，避免前端混淆
      delete processedDepartment._id
      
      res.json({
        code: 200,
        data: processedDepartment,
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get department error:', error)
      next(error)
    }
  }

  // 创建部门
  async createDepartment(req, res, next) {
    try {
      const departmentData = req.body

      // 检查代码是否已存在
      const existingDepartment = await nedbService.findOne('departments', { 
        code: departmentData.code 
      })

      if (existingDepartment) {
        return res.status(400).json({
          code: 400,
          message: '部门代码已存在',
          data: null
        })
      }

      // 验证业务线是否存在
      if (departmentData.businessLineId) {
        const businessLine = await nedbService.getBusinessLineById(departmentData.businessLineId)
        if (!businessLine) {
          return res.status(400).json({
            code: 400,
            message: '指定的业务线不存在',
            data: null
          })
        }
      }

      const newDepartment = await nedbService.createDepartment(departmentData)

      res.status(201).json({
        code: 201,
        data: {
          ...newDepartment,
          id: newDepartment._id
        },
        message: '创建成功'
      })

    } catch (error) {
      logger.error('Create department error:', error)
      next(error)
    }
  }

  // 更新部门
  async updateDepartment(req, res, next) {
    try {
      const { id } = req.params
      const updateData = req.body

      // 检查部门是否存在
      const existingDepartment = await nedbService.getDepartmentById(id)
      if (!existingDepartment) {
        return res.status(404).json({
          code: 404,
          message: '部门不存在',
          data: null
        })
      }

      // 如果更新代码，检查是否与其他部门冲突
      if (updateData.code && updateData.code !== existingDepartment.code) {
        const codeExists = await nedbService.findOne('departments', { 
          code: updateData.code,
          _id: { $ne: id }
        })

        if (codeExists) {
          return res.status(400).json({
            code: 400,
            message: '部门代码已存在',
            data: null
          })
        }
      }

      // 验证业务线是否存在
      if (updateData.businessLineId && updateData.businessLineId !== existingDepartment.businessLineId) {
        const businessLine = await nedbService.getBusinessLineById(updateData.businessLineId)
        if (!businessLine) {
          return res.status(400).json({
            code: 400,
            message: '指定的业务线不存在',
            data: null
          })
        }
      }

      const result = await nedbService.updateDepartment(id, updateData)

      if (result > 0) {
        const updatedDepartment = await nedbService.getDepartmentById(id)
        res.json({
          code: 200,
          data: {
            ...updatedDepartment,
            id: updatedDepartment._id
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
      logger.error('Update department error:', error)
      next(error)
    }
  }

  // 删除部门
  async deleteDepartment(req, res, next) {
    try {
      const { id } = req.params

      // 检查部门是否存在
      const existingDepartment = await nedbService.getDepartmentById(id)
      if (!existingDepartment) {
        return res.status(404).json({
          code: 404,
          message: '部门不存在',
          data: null
        })
      }

      // 检查是否有关联的员工
      const employeeCount = await nedbService.count('employees', { 
        departmentId: id,
        status: 1 
      })

      if (employeeCount > 0) {
        return res.status(400).json({
          code: 400,
          message: '该部门下还有员工，无法删除',
          data: null
        })
      }

      const result = await nedbService.deleteDepartment(id)

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
      logger.error('Delete department error:', error)
      next(error)
    }
  }

  // 获取部门统计信息
  async getDepartmentStats(req, res, next) {
    try {
      const departments = await nedbService.getDepartments()
      
      const stats = await Promise.all(
        departments.map(async (department) => {
          const employeeCount = await nedbService.count('employees', { 
            departmentId: department._id,
            status: 1 
          })

          let businessLine = null
          if (department.businessLineId) {
            businessLine = await nedbService.getBusinessLineById(department.businessLineId)
          }

          return {
            id: department._id,
            name: department.name,
            code: department.code,
            businessLine: businessLine ? {
              id: businessLine._id,
              name: businessLine.name,
              code: businessLine.code
            } : null,
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
      logger.error('Get department stats error:', error)
      next(error)
    }
  }

  // 获取部门树形结构
  async getDepartmentTree(req, res, next) {
    try {
      const { businessLineId } = req.query

      let query = { status: 1 }
      if (businessLineId) {
        query.businessLineId = businessLineId
      }

      const departments = await nedbService.find('departments', query)
      const businessLines = await nedbService.find('businessLines', { status: 1 })
      
      // 获取所有员工数据，统计每个部门的员工数量
      const employees = await nedbService.find('employees', { status: 1 })
      const departmentEmployeeCount = new Map()
      
      // 统计每个部门的员工数量
      employees.forEach(employee => {
        if (employee.departmentId) {
          const count = departmentEmployeeCount.get(employee.departmentId) || 0
          departmentEmployeeCount.set(employee.departmentId, count + 1)
        }
      })

      // 构建业务线映射
      const businessLineMap = new Map()
      businessLines.forEach(businessLine => {
        businessLineMap.set(businessLine._id, businessLine)
      })

      // 构建部门映射
      const departmentMap = new Map()
      departments.forEach(department => {
        departmentMap.set(department._id, {
          id: department._id,
          name: department.name,
          code: department.code,
          description: department.description,
          status: department.status,
          businessLineId: department.businessLineId,
          parentId: department.parentId,
          managerId: department.managerId,
          sort: department.sort || 0,
          createdAt: department.createdAt,
          updatedAt: department.updatedAt,
          BusinessLine: businessLineMap.get(department.businessLineId),
          employeeCount: departmentEmployeeCount.get(department._id) || 0,
          children: []
        })
      })

      // 构建树形结构
      const tree = []
      const processedIds = new Set()

      // 先处理顶级部门（没有父部门的部门）
      departments.forEach(department => {
        if (!department.parentId) {
          const node = departmentMap.get(department._id)
          if (node) {
            tree.push(node)
            processedIds.add(department._id)
          }
        }
      })

      // 递归构建子部门
      const buildChildren = (parentNode) => {
        departments.forEach(department => {
          if (department.parentId === parentNode.id && !processedIds.has(department._id)) {
            const childNode = departmentMap.get(department._id)
            if (childNode) {
              parentNode.children.push(childNode)
              processedIds.add(department._id)
              buildChildren(childNode)
            }
          }
        })
      }

      // 为每个顶级部门构建子部门
      tree.forEach(node => {
        buildChildren(node)
      })

      // 按 sort 字段排序，如果没有 sort 则按名称排序
      const sortNodes = (nodes) => {
        nodes.sort((a, b) => {
          if (a.sort !== undefined && b.sort !== undefined) {
            return a.sort - b.sort
          }
          if (a.sort !== undefined) return -1
          if (b.sort !== undefined) return 1
          return a.name.localeCompare(b.name)
        })
        
        nodes.forEach(node => {
          if (node.children && node.children.length > 0) {
            sortNodes(node.children)
          }
        })
      }

      sortNodes(tree)

      res.json({
        code: 200,
        data: tree,
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get department tree error:', error)
      next(error)
    }
  }

  // 批量操作部门
  async batchDepartments(req, res, next) {
    try {
      const { action, departmentIds } = req.body

      if (!departmentIds || !Array.isArray(departmentIds) || departmentIds.length === 0) {
        return res.status(400).json({
          code: 400,
          message: '请选择要操作的部门',
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

      // 批量更新部门状态
      let updatedCount = 0
      for (const departmentId of departmentIds) {
        try {
          const result = await nedbService.updateDepartment(departmentId, updateData)
          if (result > 0) {
            updatedCount++
          }
        } catch (error) {
          logger.error(`批量操作部门 ${departmentId} 失败:`, error.message)
        }
      }

      res.json({
        code: 200,
        data: { updatedCount },
        message: `批量${actionText}成功，共处理${updatedCount}个部门`
      })

    } catch (error) {
      logger.error('Batch departments error:', error)
      next(error)
    }
  }

  // 获取部门选项（用于下拉列表）
  async getDepartmentOptions(req, res, next) {
    try {
      const { status = 1 } = req.query
      
      // 获取所有启用的部门
      let departments = await nedbService.getDepartments()
      console.log('从NeDB获取的原始部门数据:', departments)
      
      // 如果指定了状态，进行过滤
      if (status !== undefined) {
        departments = departments.filter(dept => dept.status === parseInt(status))
      }
      
      // 只返回必要的字段，用于下拉列表
      const departmentOptions = departments.map(dept => {
        const option = {
          id: dept._id,
          name: dept.name || '',
          code: dept.code || '',
          description: dept.description || ''
        }
        console.log('处理后的部门选项:', option)
        return option
      })
      
      console.log('最终部门选项数据:', departmentOptions)
      
      res.json({
        code: 200,
        data: {
          departments: departmentOptions
        },
        message: '获取成功'
      })
      
    } catch (error) {
      logger.error('Get department options error:', error)
      next(error)
    }
  }
}

module.exports = new DepartmentController()