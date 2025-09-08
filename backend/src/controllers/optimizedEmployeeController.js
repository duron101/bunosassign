const optimizedNedbService = require('../services/optimizedNedbService');
const logger = require('../utils/logger');

/**
 * 优化的员工控制器
 * 解决 N+1 查询问题，提升大数据量场景下的性能
 */
class OptimizedEmployeeController {
  
  /**
   * 获取员工列表 - 优化版本
   */
  async getEmployees(req, res, next) {
    const startTime = Date.now();
    
    try {
      const { 
        page = 1, 
        pageSize = 20, 
        search, 
        departmentId, 
        positionId,
        status = 1 
      } = req.query;

      console.log(`🔍 开始员工列表查询: 页码=${page}, 页大小=${pageSize}, 搜索="${search}"`);

      // 使用优化的批量查询方法
      const result = await optimizedNedbService.getEmployeesWithDetails(
        { search, departmentId, positionId, status },
        { page: parseInt(page), pageSize: parseInt(pageSize) }
      );

      const queryTime = Date.now() - startTime;
      
      res.json({
        code: 200,
        data: result,
        message: '获取成功',
        performance: {
          queryTime: `${queryTime}ms`,
          cacheHitRate: optimizedNedbService.getCacheHitRate()
        }
      });

      // 记录性能日志
      if (queryTime > 500) {
        logger.warn(`员工列表查询耗时较长: ${queryTime}ms, 参数:`, { page, pageSize, search, departmentId, positionId });
      } else {
        logger.info(`员工列表查询完成: ${queryTime}ms, 返回 ${result.employees.length} 条记录`);
      }

    } catch (error) {
      const queryTime = Date.now() - startTime;
      logger.error('优化员工列表查询失败:', error, `耗时: ${queryTime}ms`);
      next(error);
    }
  }

  /**
   * 获取员工详情 - 优化版本
   */
  async getEmployee(req, res, next) {
    const startTime = Date.now();
    
    try {
      const { id } = req.params;

      console.log(`🔍 开始员工详情查询: ID=${id}`);

      const employee = await optimizedNedbService.getEmployeeWithDetails(id);

      if (!employee) {
        return res.status(404).json({
          code: 404,
          message: '员工不存在',
          data: null
        });
      }

      const queryTime = Date.now() - startTime;

      res.json({
        code: 200,
        data: employee,
        message: '获取成功',
        performance: {
          queryTime: `${queryTime}ms`,
          cacheHitRate: optimizedNedbService.getCacheHitRate()
        }
      });

      logger.info(`员工详情查询完成: ${queryTime}ms, 员工: ${employee.name}`);

    } catch (error) {
      const queryTime = Date.now() - startTime;
      logger.error('员工详情查询失败:', error, `耗时: ${queryTime}ms`);
      next(error);
    }
  }

  /**
   * 批量获取员工详情 - 新增优化方法
   */
  async getBatchEmployees(req, res, next) {
    const startTime = Date.now();
    
    try {
      const { employeeIds } = req.body;

      if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
        return res.status(400).json({
          code: 400,
          message: '请提供有效的员工ID列表',
          data: null
        });
      }

      if (employeeIds.length > 1000) {
        return res.status(400).json({
          code: 400,
          message: '批量查询员工数量不能超过1000个',
          data: null
        });
      }

      console.log(`🔍 批量员工查询: ${employeeIds.length} 个员工`);

      const employees = await optimizedNedbService.getBatchEmployeesWithDetails(employeeIds);

      const queryTime = Date.now() - startTime;

      res.json({
        code: 200,
        data: {
          employees,
          requestedCount: employeeIds.length,
          foundCount: employees.length,
          notFoundCount: employeeIds.length - employees.length
        },
        message: '批量获取成功',
        performance: {
          queryTime: `${queryTime}ms`,
          avgTimePerEmployee: `${Math.round(queryTime / employeeIds.length)}ms`,
          cacheHitRate: optimizedNedbService.getCacheHitRate()
        }
      });

      logger.info(`批量员工查询完成: ${queryTime}ms, 查询 ${employeeIds.length} 个，找到 ${employees.length} 个`);

    } catch (error) {
      const queryTime = Date.now() - startTime;
      logger.error('批量员工查询失败:', error, `耗时: ${queryTime}ms`);
      next(error);
    }
  }

  /**
   * 创建员工
   */
  async createEmployee(req, res, next) {
    const startTime = Date.now();
    
    try {
      const employeeData = req.body;

      // 并行验证员工编号和关联数据
      const [existingEmployee, department, position] = await Promise.all([
        optimizedNedbService.findOne('employees', { employeeNo: employeeData.employeeNo }),
        employeeData.departmentId ? optimizedNedbService.findOne('departments', { _id: employeeData.departmentId }) : null,
        employeeData.positionId ? optimizedNedbService.findOne('positions', { _id: employeeData.positionId }) : null
      ]);

      if (existingEmployee) {
        return res.status(400).json({
          code: 400,
          message: '员工编号已存在',
          data: null
        });
      }

      if (employeeData.departmentId && !department) {
        return res.status(400).json({
          code: 400,
          message: '指定的部门不存在',
          data: null
        });
      }

      if (employeeData.positionId && !position) {
        return res.status(400).json({
          code: 400,
          message: '指定的岗位不存在',
          data: null
        });
      }

      const newEmployee = await optimizedNedbService.insert('employees', employeeData);

      const queryTime = Date.now() - startTime;

      res.status(201).json({
        code: 201,
        data: {
          ...newEmployee,
          id: newEmployee._id
        },
        message: '创建成功',
        performance: {
          queryTime: `${queryTime}ms`
        }
      });

      logger.info(`员工创建完成: ${queryTime}ms, 员工: ${employeeData.name}`);

    } catch (error) {
      const queryTime = Date.now() - startTime;
      logger.error('创建员工失败:', error, `耗时: ${queryTime}ms`);
      next(error);
    }
  }

  /**
   * 更新员工
   */
  async updateEmployee(req, res, next) {
    const startTime = Date.now();
    
    try {
      const { id } = req.params;
      const updateData = req.body;

      // 并行查询验证数据
      const validationPromises = [
        optimizedNedbService.findOne('employees', { _id: id })
      ];

      if (updateData.employeeNo) {
        validationPromises.push(
          optimizedNedbService.findOne('employees', { 
            employeeNo: updateData.employeeNo,
            _id: { $ne: id }
          })
        );
      }

      if (updateData.departmentId) {
        validationPromises.push(
          optimizedNedbService.findOne('departments', { _id: updateData.departmentId })
        );
      }

      if (updateData.positionId) {
        validationPromises.push(
          optimizedNedbService.findOne('positions', { _id: updateData.positionId })
        );
      }

      const [existingEmployee, employeeNoExists, department, position] = await Promise.all(validationPromises);

      if (!existingEmployee) {
        return res.status(404).json({
          code: 404,
          message: '员工不存在',
          data: null
        });
      }

      if (updateData.employeeNo && employeeNoExists) {
        return res.status(400).json({
          code: 400,
          message: '员工编号已存在',
          data: null
        });
      }

      if (updateData.departmentId && !department) {
        return res.status(400).json({
          code: 400,
          message: '指定的部门不存在',
          data: null
        });
      }

      if (updateData.positionId && !position) {
        return res.status(400).json({
          code: 400,
          message: '指定的岗位不存在',
          data: null
        });
      }

      const result = await optimizedNedbService.update('employees', { _id: id }, { $set: updateData });

      if (result > 0) {
        const updatedEmployee = await optimizedNedbService.getEmployeeWithDetails(id);
        
        const queryTime = Date.now() - startTime;
        
        res.json({
          code: 200,
          data: updatedEmployee,
          message: '更新成功',
          performance: {
            queryTime: `${queryTime}ms`
          }
        });

        logger.info(`员工更新完成: ${queryTime}ms, 员工: ${updatedEmployee.name}`);
      } else {
        res.status(400).json({
          code: 400,
          message: '更新失败',
          data: null
        });
      }

    } catch (error) {
      const queryTime = Date.now() - startTime;
      logger.error('更新员工失败:', error, `耗时: ${queryTime}ms`);
      next(error);
    }
  }

  /**
   * 删除员工
   */
  async deleteEmployee(req, res, next) {
    const startTime = Date.now();
    
    try {
      const { id } = req.params;

      const existingEmployee = await optimizedNedbService.findOne('employees', { _id: id });
      if (!existingEmployee) {
        return res.status(404).json({
          code: 404,
          message: '员工不存在',
          data: null
        });
      }

      const result = await optimizedNedbService.update('employees', { _id: id }, { $set: { status: 0 } });

      const queryTime = Date.now() - startTime;

      if (result > 0) {
        res.json({
          code: 200,
          message: '删除成功',
          data: null,
          performance: {
            queryTime: `${queryTime}ms`
          }
        });

        logger.info(`员工删除完成: ${queryTime}ms, 员工: ${existingEmployee.name}`);
      } else {
        res.status(400).json({
          code: 400,
          message: '删除失败',
          data: null
        });
      }

    } catch (error) {
      const queryTime = Date.now() - startTime;
      logger.error('删除员工失败:', error, `耗时: ${queryTime}ms`);
      next(error);
    }
  }

  /**
   * 获取员工统计信息 - 优化版本
   */
  async getEmployeeStats(req, res, next) {
    const startTime = Date.now();
    
    try {
      console.log('🔍 开始员工统计查询...');

      // 并行获取统计数据
      const [
        totalEmployees,
        activeEmployees,
        employees,
        departments,
        positions,
        businessLines
      ] = await Promise.all([
        optimizedNedbService.count('employees'),
        optimizedNedbService.count('employees', { status: 1 }),
        optimizedNedbService.find('employees', { status: 1 }),
        optimizedNedbService.find('departments', { status: 1 }),
        optimizedNedbService.find('positions', { status: 1 }),
        optimizedNedbService.find('businessLines', { status: 1 })
      ]);

      // 创建映射以提高统计性能
      const departmentMap = new Map(departments.map(d => [d._id, d]));
      const positionMap = new Map(positions.map(p => [p._id, p]));
      const businessLineMap = new Map(businessLines.map(bl => [bl._id, bl]));

      // 统计分布
      const departmentStats = {};
      const positionStats = {};
      const businessLineStats = {};
      const salaryStats = {
        total: 0,
        count: 0,
        min: Number.MAX_VALUE,
        max: 0,
        ranges: {
          '0-50k': 0,
          '50k-100k': 0,
          '100k-200k': 0,
          '200k+': 0
        }
      };

      // 一次遍历完成所有统计
      employees.forEach(employee => {
        // 部门统计
        const department = departmentMap.get(employee.departmentId);
        if (department) {
          const deptName = department.name;
          departmentStats[deptName] = (departmentStats[deptName] || 0) + 1;
          
          // 业务线统计
          const businessLine = businessLineMap.get(department.businessLineId);
          if (businessLine) {
            const blName = businessLine.name;
            businessLineStats[blName] = (businessLineStats[blName] || 0) + 1;
          }
        }

        // 岗位统计
        const position = positionMap.get(employee.positionId);
        if (position) {
          const posName = position.name;
          positionStats[posName] = (positionStats[posName] || 0) + 1;
        }

        // 薪资统计
        const salary = parseFloat(employee.annualSalary) || 0;
        if (salary > 0) {
          salaryStats.total += salary;
          salaryStats.count++;
          salaryStats.min = Math.min(salaryStats.min, salary);
          salaryStats.max = Math.max(salaryStats.max, salary);

          if (salary < 50000) {
            salaryStats.ranges['0-50k']++;
          } else if (salary < 100000) {
            salaryStats.ranges['50k-100k']++;
          } else if (salary < 200000) {
            salaryStats.ranges['100k-200k']++;
          } else {
            salaryStats.ranges['200k+']++;
          }
        }
      });

      // 计算平均薪资
      const avgSalary = salaryStats.count > 0 ? salaryStats.total / salaryStats.count : 0;

      const queryTime = Date.now() - startTime;

      const stats = {
        summary: {
          totalEmployees,
          activeEmployees,
          inactiveEmployees: totalEmployees - activeEmployees,
          avgSalary: Math.round(avgSalary)
        },
        distribution: {
          byDepartment: departmentStats,
          byPosition: positionStats,
          byBusinessLine: businessLineStats
        },
        salary: {
          ...salaryStats,
          average: Math.round(avgSalary),
          min: salaryStats.min === Number.MAX_VALUE ? 0 : salaryStats.min,
          total: salaryStats.total
        }
      };

      res.json({
        code: 200,
        data: stats,
        message: '统计获取成功',
        performance: {
          queryTime: `${queryTime}ms`,
          cacheHitRate: optimizedNedbService.getCacheHitRate()
        }
      });

      logger.info(`员工统计查询完成: ${queryTime}ms, 统计 ${activeEmployees} 名在职员工`);

    } catch (error) {
      const queryTime = Date.now() - startTime;
      logger.error('获取员工统计失败:', error, `耗时: ${queryTime}ms`);
      next(error);
    }
  }

  /**
   * 员工转移（调动部门或岗位）- 优化版本
   */
  async transfer(req, res, next) {
    const startTime = Date.now();
    
    try {
      const { id } = req.params;
      const { departmentId, positionId, annualSalary, transferReason, effectiveDate } = req.body;

      // 并行验证员工和目标部门/岗位
      const [employee, department, position] = await Promise.all([
        optimizedNedbService.findOne('employees', { _id: id }),
        departmentId ? optimizedNedbService.findOne('departments', { _id: departmentId }) : null,
        positionId ? optimizedNedbService.findOne('positions', { _id: positionId }) : null
      ]);

      if (!employee) {
        return res.status(404).json({
          code: 404,
          message: '员工不存在',
          data: null
        });
      }

      if (departmentId && !department) {
        return res.status(400).json({
          code: 400,
          message: '目标部门不存在',
          data: null
        });
      }

      if (positionId && !position) {
        return res.status(400).json({
          code: 400,
          message: '目标岗位不存在',
          data: null
        });
      }

      // 准备更新数据
      const updateData = {
        departmentId: departmentId || employee.departmentId,
        positionId: positionId || employee.positionId,
        annualSalary: annualSalary || employee.annualSalary,
        transferReason: transferReason || null,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
        updatedAt: new Date()
      };

      const result = await optimizedNedbService.update('employees', { _id: id }, { $set: updateData });

      if (result > 0) {
        // 获取更新后的完整员工信息
        const updatedEmployee = await optimizedNedbService.getEmployeeWithDetails(id);
        
        const queryTime = Date.now() - startTime;
        
        res.json({
          code: 200,
          data: {
            employee: updatedEmployee,
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
          message: '员工转移成功',
          performance: {
            queryTime: `${queryTime}ms`
          }
        });

        logger.info(`员工转移完成: ${queryTime}ms, 员工: ${employee.name}`);
      } else {
        res.status(400).json({
          code: 400,
          message: '转移失败',
          data: null
        });
      }

    } catch (error) {
      const queryTime = Date.now() - startTime;
      logger.error('员工转移失败:', error, `耗时: ${queryTime}ms`);
      next(error);
    }
  }

  /**
   * 批量操作员工 - 优化版本
   */
  async batchOperation(req, res, next) {
    const startTime = Date.now();
    
    try {
      const { action, employeeIds } = req.body;

      if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
        return res.status(400).json({
          code: 400,
          message: '请选择要操作的员工',
          data: null
        });
      }

      if (employeeIds.length > 1000) {
        return res.status(400).json({
          code: 400,
          message: '批量操作员工数量不能超过1000个',
          data: null
        });
      }

      let updateData = {};
      let actionText = '';

      switch (action) {
        case 'enable':
          updateData = { status: 1, updatedAt: new Date() };
          actionText = '启用';
          break;
        case 'disable':
          updateData = { status: 0, updatedAt: new Date() };
          actionText = '禁用';
          break;
        default:
          return res.status(400).json({
            code: 400,
            message: '无效的操作类型',
            data: null
          });
      }

      console.log(`🔄 批量${actionText}员工: ${employeeIds.length} 个`);

      // 批量更新
      const updatePromises = employeeIds.map(employeeId => 
        optimizedNedbService.update('employees', { _id: employeeId }, { $set: updateData })
          .catch(error => {
            logger.error(`批量操作员工 ${employeeId} 失败:`, error.message);
            return 0;
          })
      );

      const results = await Promise.all(updatePromises);
      const updatedCount = results.filter(result => result > 0).length;

      const queryTime = Date.now() - startTime;

      res.json({
        code: 200,
        data: { 
          updatedCount,
          requestedCount: employeeIds.length,
          failedCount: employeeIds.length - updatedCount
        },
        message: `批量${actionText}完成，成功处理${updatedCount}个员工`,
        performance: {
          queryTime: `${queryTime}ms`,
          avgTimePerEmployee: `${Math.round(queryTime / employeeIds.length)}ms`
        }
      });

      logger.info(`批量${actionText}完成: ${queryTime}ms, 处理 ${employeeIds.length} 个员工，成功 ${updatedCount} 个`);

    } catch (error) {
      const queryTime = Date.now() - startTime;
      logger.error('批量操作员工失败:', error, `耗时: ${queryTime}ms`);
      next(error);
    }
  }

  /**
   * 获取性能统计 - 新增方法
   */
  async getPerformanceStats(req, res, next) {
    try {
      const dbStats = optimizedNedbService.getPerformanceStats();
      
      res.json({
        code: 200,
        data: {
          database: dbStats,
          timestamp: new Date().toISOString()
        },
        message: '性能统计获取成功'
      });

    } catch (error) {
      logger.error('获取性能统计失败:', error);
      next(error);
    }
  }

  /**
   * 清理缓存 - 新增方法
   */
  async clearCache(req, res, next) {
    try {
      const { pattern } = req.body;
      
      if (pattern) {
        optimizedNedbService.invalidateCache(pattern);
      } else {
        // 清理所有员工相关缓存
        optimizedNedbService.invalidateCache('employees');
        optimizedNedbService.invalidateCache('departments');
        optimizedNedbService.invalidateCache('positions');
      }
      
      res.json({
        code: 200,
        data: null,
        message: '缓存清理成功'
      });

      logger.info(`缓存清理完成, 模式: ${pattern || 'all'}`);

    } catch (error) {
      logger.error('清理缓存失败:', error);
      next(error);
    }
  }
}

module.exports = new OptimizedEmployeeController();