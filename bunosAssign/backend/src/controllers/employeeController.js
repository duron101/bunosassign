const nedbService = require('../services/nedbService')
const logger = require('../utils/logger')

class EmployeeController {
  // 获取员工列表
  async getEmployees(req, res, next) {
    try {
      const { 
        page = 1, 
        pageSize = 20, 
        search, 
        departmentId, 
        positionId,
        status 
      } = req.query

      // 获取所有员工
      let employees = await nedbService.getEmployees()
      
      // 搜索过滤
      if (search) {
        employees = employees.filter(emp => 
          emp.name.toLowerCase().includes(search.toLowerCase()) ||
          emp.employeeNo.toLowerCase().includes(search.toLowerCase()) ||
          (emp.email && emp.email.toLowerCase().includes(search.toLowerCase())) ||
          (emp.phone && emp.phone.toLowerCase().includes(search.toLowerCase()))
        )
      }

      // 部门过滤
      if (departmentId) {
        employees = employees.filter(emp => emp.departmentId === departmentId)
      }

      // 岗位过滤
      if (positionId) {
        employees = employees.filter(emp => emp.positionId === positionId)
      }

      // 状态过滤
      if (status !== undefined) {
        employees = employees.filter(emp => emp.status === parseInt(status))
      }

      // 分页处理
      const total = employees.length
      const offset = (page - 1) * pageSize
      const paginatedEmployees = employees.slice(offset, offset + parseInt(pageSize))

      // 获取每个员工的部门和岗位信息
      const employeesWithDetails = await Promise.all(
        paginatedEmployees.map(async (employee) => {
          let department = null
          if (employee.departmentId) {
            department = await nedbService.getDepartmentById(employee.departmentId)
          }

          let position = null
          if (employee.positionId) {
            position = await nedbService.getPositionById(employee.positionId)
          }

          let businessLine = null
          if (department && department.businessLineId) {
            businessLine = await nedbService.getBusinessLineById(department.businessLineId)
          }
          
          return {
            ...employee,
            id: employee._id, // 兼容前端期望的 id 字段
            department: department ? {
              id: department._id,
              name: department.name,
              code: department.code
            } : null,
            position: position ? {
              id: position._id,
              name: position.name,
              code: position.code
            } : null,
            businessLine: businessLine ? {
              id: businessLine._id,
              name: businessLine.name,
              code: businessLine.code
            } : null
          }
        })
      )

      res.json({
        code: 200,
        data: {
          employees: employeesWithDetails,
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
      logger.error('Get employees error:', error)
      next(error)
    }
  }

  // 获取员工详情
  async getEmployee(req, res, next) {
    try {
      const { id } = req.params

      const employee = await nedbService.getEmployeeById(id)

      if (!employee) {
        return res.status(404).json({
          code: 404,
          message: '员工不存在',
          data: null
        })
      }

      // 获取部门信息
      let department = null
      if (employee.departmentId) {
        department = await nedbService.getDepartmentById(employee.departmentId)
      }

      // 获取岗位信息
      let position = null
      if (employee.positionId) {
        position = await nedbService.getPositionById(employee.positionId)
      }

      // 获取业务线信息
      let businessLine = null
      if (department && department.businessLineId) {
        businessLine = await nedbService.getBusinessLineById(department.businessLineId)
      }

      res.json({
        code: 200,
        data: {
          ...employee,
          id: employee._id,
          department: department ? {
            id: department._id,
            name: department.name,
            code: department.code
          } : null,
          position: position ? {
            id: position._id,
            name: position.name,
            code: position.code
          } : null,
          businessLine: businessLine ? {
            id: businessLine._id,
            name: businessLine.name,
            code: businessLine.code
          } : null
        },
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get employee error:', error)
      next(error)
    }
  }

  // 创建员工
  async createEmployee(req, res, next) {
    try {
      const employeeData = req.body

      // 检查员工编号是否已存在
      const existingEmployee = await nedbService.findOne('employees', { 
        employeeNo: employeeData.employeeNo 
      })

      if (existingEmployee) {
        return res.status(400).json({
          code: 400,
          message: '员工编号已存在',
          data: null
        })
      }

      // 验证部门是否存在
      if (employeeData.departmentId) {
        const department = await nedbService.getDepartmentById(employeeData.departmentId)
        if (!department) {
          return res.status(400).json({
            code: 400,
            message: '指定的部门不存在',
            data: null
          })
        }
      }

      // 验证岗位是否存在
      if (employeeData.positionId) {
        const position = await nedbService.getPositionById(employeeData.positionId)
        if (!position) {
          return res.status(400).json({
            code: 400,
            message: '指定的岗位不存在',
            data: null
          })
        }
      }

      const newEmployee = await nedbService.createEmployee(employeeData)

      res.status(201).json({
        code: 201,
        data: {
          ...newEmployee,
          id: newEmployee._id
        },
        message: '创建成功'
      })

    } catch (error) {
      logger.error('Create employee error:', error)
      next(error)
    }
  }

  // 更新员工
  async updateEmployee(req, res, next) {
    try {
      const { id } = req.params
      const updateData = req.body

      // 检查员工是否存在
      const existingEmployee = await nedbService.getEmployeeById(id)
      if (!existingEmployee) {
        return res.status(404).json({
          code: 404,
          message: '员工不存在',
          data: null
        })
      }

      // 如果更新员工编号，检查是否与其他员工冲突
      if (updateData.employeeNo && updateData.employeeNo !== existingEmployee.employeeNo) {
        const employeeNoExists = await nedbService.findOne('employees', { 
          employeeNo: updateData.employeeNo,
          _id: { $ne: id }
        })

        if (employeeNoExists) {
          return res.status(400).json({
            code: 400,
            message: '员工编号已存在',
            data: null
          })
        }
      }

      // 验证部门是否存在
      if (updateData.departmentId && updateData.departmentId !== existingEmployee.departmentId) {
        const department = await nedbService.getDepartmentById(updateData.departmentId)
        if (!department) {
          return res.status(400).json({
            code: 400,
            message: '指定的部门不存在',
            data: null
          })
        }
      }

      // 验证岗位是否存在
      if (updateData.positionId && updateData.positionId !== existingEmployee.positionId) {
        const position = await nedbService.getPositionById(updateData.positionId)
        if (!position) {
          return res.status(400).json({
            code: 400,
            message: '指定的岗位不存在',
            data: null
          })
        }
      }

      const result = await nedbService.updateEmployee(id, updateData)

      if (result > 0) {
        const updatedEmployee = await nedbService.getEmployeeById(id)
        res.json({
          code: 200,
          data: {
            ...updatedEmployee,
            id: updatedEmployee._id
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
      logger.error('Update employee error:', error)
      next(error)
    }
  }

  // 删除员工
  async deleteEmployee(req, res, next) {
    try {
      const { id } = req.params

      // 检查员工是否存在
      const existingEmployee = await nedbService.getEmployeeById(id)
      if (!existingEmployee) {
        return res.status(404).json({
          code: 404,
          message: '员工不存在',
          data: null
        })
      }

      const result = await nedbService.deleteEmployee(id)

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
      logger.error('Delete employee error:', error)
      next(error)
    }
  }

  // 获取员工统计信息
  async getEmployeeStats(req, res, next) {
    try {
      const employees = await nedbService.getEmployees()
      
      const stats = await Promise.all(
        employees.map(async (employee) => {
          let department = null
          if (employee.departmentId) {
            department = await nedbService.getDepartmentById(employee.departmentId)
          }

          let position = null
          if (employee.positionId) {
            position = await nedbService.getPositionById(employee.positionId)
          }

          let businessLine = null
          if (department && department.businessLineId) {
            businessLine = await nedbService.getBusinessLineById(department.businessLineId)
          }

          return {
            id: employee._id,
            name: employee.name,
            employeeNo: employee.employeeNo,
            department: department ? {
              id: department._id,
              name: department.name,
              code: department.code
            } : null,
            position: position ? {
              id: position._id,
              name: position.name,
              code: position.code
            } : null,
            businessLine: businessLine ? {
              id: businessLine._id,
              name: businessLine.name,
              code: businessLine.code
            } : null,
            annualSalary: employee.annualSalary,
            entryDate: employee.entryDate,
            status: employee.status
          }
        })
      )

      res.json({
        code: 200,
        data: stats,
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get employee stats error:', error)
      next(error)
    }
  }

  // 员工转移（调动部门或岗位）
  async transfer(req, res, next) {
    try {
      const { id } = req.params
      const { departmentId, positionId, annualSalary, transferReason, effectiveDate } = req.body

      const employee = await nedbService.getEmployeeById(id)
      if (!employee) {
        return res.status(404).json({
          code: 404,
          message: '员工不存在',
          data: null
        })
      }

      // 验证部门是否存在
      if (departmentId) {
        const department = await nedbService.getDepartmentById(departmentId)
        if (!department) {
          return res.status(400).json({
            code: 400,
            message: '目标部门不存在',
            data: null
          })
        }
      }

      // 验证岗位是否存在
      if (positionId) {
        const position = await nedbService.getPositionById(positionId)
        if (!position) {
          return res.status(400).json({
            code: 400,
            message: '目标岗位不存在',
            data: null
          })
        }
      }

      // 更新员工信息
      const updateData = {
        departmentId: departmentId || employee.departmentId,
        positionId: positionId || employee.positionId,
        annualSalary: annualSalary || employee.annualSalary,
        transferReason: transferReason || null,
        effectiveDate: effectiveDate || new Date(),
        updatedAt: new Date()
      }

      const result = await nedbService.updateEmployee(id, updateData)

      if (result > 0) {
        // 获取更新后的员工信息
        const updatedEmployee = await nedbService.getEmployeeById(id)
        
        // 获取关联信息
        let department = null
        if (updatedEmployee.departmentId) {
          department = await nedbService.getDepartmentById(updatedEmployee.departmentId)
        }

        let position = null
        if (updatedEmployee.positionId) {
          position = await nedbService.getPositionById(updatedEmployee.positionId)
        }

        let businessLine = null
        if (department && department.businessLineId) {
          businessLine = await nedbService.getBusinessLineById(department.businessLineId)
        }

        res.json({
          code: 200,
          data: {
            employee: {
              ...updatedEmployee,
              id: updatedEmployee._id,
              department: department ? {
                id: department._id,
                name: department.name,
                code: department.code
              } : null,
              position: position ? {
                id: position._id,
                name: position.name,
                code: position.code
              } : null,
              businessLine: businessLine ? {
                id: businessLine._id,
                name: businessLine.name,
                code: businessLine.code
              } : null
            },
            transfer: {
              fromDepartmentId: employee.departmentId,
              fromPositionId: employee.positionId,
              fromSalary: employee.annualSalary,
              toDepartmentId: updateData.departmentId,
              toPositionId: updateData.positionId,
              toSalary: updateData.annualSalary,
              transferReason: updateData.transferReason,
              effectiveDate: updateData.effectiveDate
            }
          },
          message: '员工转移成功'
        })
      } else {
        res.status(400).json({
          code: 400,
          message: '转移失败',
          data: null
        })
      }

    } catch (error) {
      logger.error('Transfer employee error:', error)
      next(error)
    }
  }

  // 员工离职
  async resign(req, res, next) {
    try {
      const { id } = req.params
      const { resignDate, resignReason, handoverStatus } = req.body

      const employee = await nedbService.getEmployeeById(id)
      if (!employee) {
        return res.status(404).json({
          code: 404,
          message: '员工不存在',
          data: null
        })
      }

      if (employee.status === 0) {
        return res.status(400).json({
          code: 400,
          message: '员工已离职',
          data: null
        })
      }

      // 更新员工状态为离职
      const updateData = {
        status: 0,
        resignDate: resignDate ? new Date(resignDate) : new Date(),
        resignReason: resignReason || null,
        handoverStatus: handoverStatus || 'pending',
        updatedAt: new Date()
      }

      const result = await nedbService.updateEmployee(id, updateData)

      if (result > 0) {
        res.json({
          code: 200,
          data: null,
          message: '员工离职处理成功'
        })
      } else {
        res.status(400).json({
          code: 400,
          message: '离职处理失败',
          data: null
        })
      }

    } catch (error) {
      logger.error('Resign employee error:', error)
      next(error)
    }
  }

  // 批量操作员工
  async batchOperation(req, res, next) {
    try {
      const { action, employeeIds } = req.body

      if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
        return res.status(400).json({
          code: 400,
          message: '请选择要操作的员工',
          data: null
        })
      }

      let updateData = {}
      let actionText = ''

      switch (action) {
        case 'enable':
          updateData = { status: 1, updatedAt: new Date() }
          actionText = '启用'
          break
        case 'disable':
          updateData = { status: 0, updatedAt: new Date() }
          actionText = '禁用'
          break
        default:
          return res.status(400).json({
            code: 400,
            message: '无效的操作类型',
            data: null
          })
      }

      // 批量更新员工状态
      let updatedCount = 0
      for (const employeeId of employeeIds) {
        try {
          const result = await nedbService.updateEmployee(employeeId, updateData)
          if (result > 0) {
            updatedCount++
          }
        } catch (error) {
          logger.error(`批量操作员工 ${employeeId} 失败:`, error.message)
        }
      }

      res.json({
        code: 200,
        data: { updatedCount },
        message: `批量${actionText}成功，共处理${updatedCount}个员工`
      })

    } catch (error) {
      logger.error('Batch operation error:', error)
      next(error)
    }
  }

  // 获取可用员工列表（未关联用户的员工）
  async getAvailableEmployees(req, res, next) {
    try {
      const { search, departmentId, positionId } = req.query

      // 获取所有员工
      let employees = await nedbService.getEmployees()
      
      // 获取所有用户
      const users = await nedbService.getUsers()
      
      // 过滤出未关联用户的员工（userId为null或undefined的员工）
      let availableEmployees = employees.filter(emp => !emp.userId)
      
      // 搜索过滤
      if (search) {
        availableEmployees = availableEmployees.filter(emp => 
          emp.name.toLowerCase().includes(search.toLowerCase()) ||
          emp.employeeNo.toLowerCase().includes(search.toLowerCase()) ||
          (emp.email && emp.email.toLowerCase().includes(search.toLowerCase())) ||
          (emp.phone && emp.phone.toLowerCase().includes(search.toLowerCase()))
        )
      }

      // 部门过滤
      if (departmentId) {
        availableEmployees = availableEmployees.filter(emp => emp.departmentId === departmentId)
      }

      // 岗位过滤
      if (positionId) {
        availableEmployees = availableEmployees.filter(emp => emp.positionId === positionId)
      }

      // 只返回在职员工
      availableEmployees = availableEmployees.filter(emp => emp.status === 1)

      // 获取每个员工的部门和岗位信息
      const employeesWithDetails = await Promise.all(
        availableEmployees.map(async (employee) => {
          let department = null
          if (employee.departmentId) {
            department = await nedbService.getDepartmentById(employee.departmentId)
          }

          let position = null
          if (employee.positionId) {
            position = await nedbService.getPositionById(employee.positionId)
          }
          
          return {
            ...employee,
            id: employee._id, // 兼容前端期望的 id 字段
            department: department ? {
              id: department._id,
              name: department.name,
              code: department.code
            } : null,
            position: position ? {
              id: position._id,
              name: position.name,
              code: position.code
            } : null
          }
        })
      )

      res.json({
        code: 200,
        data: {
          employees: employeesWithDetails,
          total: employeesWithDetails.length
        },
        message: '获取可用员工列表成功'
      })

    } catch (error) {
      logger.error('Get available employees error:', error)
      next(error)
    }
  }
}

module.exports = new EmployeeController()