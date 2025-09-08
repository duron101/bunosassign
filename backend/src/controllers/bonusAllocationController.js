/**
 * 奖金分配控制器
 * 提供奖金分配相关的业务逻辑
 */

const bonusAllocationService = require('../services/bonusAllocationService')
const { PermissionValidator } = require('../config/permissions')
const auditService = require('../services/auditService')
const logger = require('../utils/logger')

class BonusAllocationController {
  /**
   * 创建奖金分配
   */
  async createBonusAllocation(req, res, next) {
    try {
      const user = req.user
      const allocationData = req.body

      // 验证必要字段
      if (!allocationData.projectId || !allocationData.employeeId || !allocationData.amount) {
        return res.status(400).json({
          code: 400,
          message: '缺少必要字段',
          data: null
        })
      }

      // 检查项目是否存在
      const project = await global.nedbService.getProjectById(allocationData.projectId)
      if (!project) {
        return res.status(404).json({
          code: 404,
          message: '项目不存在',
          data: null
        })
      }

      // 检查用户是否有权限管理此项目
      if (!PermissionValidator.checkProjectPermission(user, 'manage', project)) {
        return res.status(403).json({
          code: 403,
          message: '您没有权限为此项目分配奖金',
          data: null
        })
      }

      // 创建奖金分配
      const allocation = await bonusAllocationService.createBonusAllocation({
        ...allocationData,
        createdBy: user.id,
        status: 'pending'
      })

      // 记录审计日志
      await auditService.logPermissionAction(
        user,
        'bonus:create',
        'bonus',
        allocation._id,
        {
          action: 'create_bonus_allocation',
          projectId: allocationData.projectId,
          employeeId: allocationData.employeeId,
          amount: allocationData.amount
        },
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          requestId: req.id
        }
      )

      res.json({
        code: 200,
        message: '奖金分配创建成功',
        data: allocation
      })

    } catch (error) {
      logger.error('Create bonus allocation error:', error)
      next(error)
    }
  }

  /**
   * 审批奖金分配
   */
  async approveBonusAllocation(req, res, next) {
    try {
      const user = req.user
      const { allocationId } = req.params
      const { approved, comments } = req.body

      // 验证必要字段
      if (typeof approved !== 'boolean') {
        return res.status(400).json({
          code: 400,
          message: '缺少审批结果',
          data: null
        })
      }

      // 获取奖金分配信息
      const allocation = await global.nedbService.getBonusAllocationById(allocationId)
      if (!allocation) {
        return res.status(404).json({
          code: 404,
          message: '奖金分配不存在',
          data: null
        })
      }

      // 检查项目是否存在
      const project = await global.nedbService.getProjectById(allocation.projectId)
      if (!project) {
        return res.status(404).json({
          code: 404,
          message: '项目不存在',
          data: null
        })
      }

      // 检查审批人权限
      if (!PermissionValidator.canAccessResource(user, 'bonus', 'approve')) {
        return res.status(403).json({
          code: 403,
          message: '您没有权限审批奖金分配',
          data: null
        })
      }

      // 检查大额奖金审批权限
      if (allocation.amount > 100000) {
        if (!PermissionValidator.canAccessResource(user, 'finance', 'approve')) {
          return res.status(403).json({
            code: 403,
            message: '大额奖金审批需要财务审批权限',
            data: null
          })
        }
      }

      // 审批奖金分配
      const result = await bonusAllocationService.approveBonusAllocation(
        allocationId,
        user.id,
        approved,
        comments
      )

      // 记录审计日志
      await auditService.logPermissionAction(
        user,
        'bonus:approve',
        'bonus',
        allocationId,
        {
          action: 'approve_bonus_allocation',
          approved,
          amount: allocation.amount,
          projectId: allocation.projectId,
          employeeId: allocation.employeeId,
          comments
        },
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          requestId: req.id
        }
      )

      res.json({
        code: 200,
        message: approved ? '奖金分配已批准' : '奖金分配已拒绝',
        data: result
      })

    } catch (error) {
      logger.error('Approve bonus allocation error:', error)
      next(error)
    }
  }

  /**
   * 获取奖金分配列表
   */
  async getBonusAllocations(req, res, next) {
    try {
      const user = req.user
      const { projectId, departmentId, employeeId, status, page = 1, limit = 10 } = req.query

      // 构建查询条件
      const query = {}
      if (projectId) query.projectId = projectId
      if (departmentId) query.departmentId = departmentId
      if (employeeId) query.employeeId = employeeId
      if (status) query.status = status

      // 获取用户可访问的项目
      const userProjects = await global.nedbService.getProjects({
        $or: [
          { managerId: user.employeeId },
          { members: user.employeeId },
          { status: 'public' }
        ]
      })

      // 过滤用户可访问的项目奖金分配
      const accessibleProjectIds = userProjects.map(p => p._id)
      if (accessibleProjectIds.length > 0) {
        query.projectId = { $in: accessibleProjectIds }
      } else {
        // 如果用户没有可访问的项目，返回空列表
        return res.json({
          code: 200,
          message: '获取成功',
          data: {
            allocations: [],
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: 0,
              pages: 0
            }
          }
        })
      }

      // 获取奖金分配列表
      const allocations = await global.nedbService.getBonusAllocations(query)
      const total = allocations.length

      // 分页
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedAllocations = allocations.slice(startIndex, endIndex)

      res.json({
        code: 200,
        message: '获取成功',
        data: {
          allocations: paginatedAllocations,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      })

    } catch (error) {
      logger.error('Get bonus allocations error:', error)
      next(error)
    }
  }

  /**
   * 更新奖金分配
   */
  async updateBonusAllocation(req, res, next) {
    try {
      const user = req.user
      const { allocationId } = req.params
      const updateData = req.body

      // 获取奖金分配信息
      const allocation = await global.nedbService.getBonusAllocationById(allocationId)
      if (!allocation) {
        return res.status(404).json({
          code: 404,
          message: '奖金分配不存在',
          data: null
        })
      }

      // 检查项目是否存在
      const project = await global.nedbService.getProjectById(allocation.projectId)
      if (!project) {
        return res.status(404).json({
          code: 404,
          message: '项目不存在',
          data: null
        })
      }

      // 检查用户是否有权限管理此项目
      if (!PermissionValidator.checkProjectPermission(user, 'manage', project)) {
        return res.status(403).json({
          code: 403,
          message: '您没有权限修改此奖金分配',
          data: null
        })
      }

      // 更新奖金分配
      const updatedAllocation = await global.nedbService.updateBonusAllocation(allocationId, {
        ...updateData,
        updatedBy: user.id,
        updatedAt: new Date()
      })

      // 记录审计日志
      await auditService.logPermissionAction(
        user,
        'bonus:update',
        'bonus',
        allocationId,
        {
          action: 'update_bonus_allocation',
          projectId: allocation.projectId,
          employeeId: allocation.employeeId,
          changes: updateData
        },
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          requestId: req.id
        }
      )

      res.json({
        code: 200,
        message: '奖金分配更新成功',
        data: updatedAllocation
      })

    } catch (error) {
      logger.error('Update bonus allocation error:', error)
      next(error)
    }
  }

  /**
   * 删除奖金分配
   */
  async deleteBonusAllocation(req, res, next) {
    try {
      const user = req.user
      const { allocationId } = req.params

      // 获取奖金分配信息
      const allocation = await global.nedbService.getBonusAllocationById(allocationId)
      if (!allocation) {
        return res.status(404).json({
          code: 404,
          message: '奖金分配不存在',
          data: null
        })
      }

      // 检查项目是否存在
      const project = await global.nedbService.getProjectById(allocation.projectId)
      if (!project) {
        return res.status(404).json({
          code: 404,
          message: '项目不存在',
          data: null
        })
      }

      // 检查用户是否有权限管理此项目
      if (!PermissionValidator.checkProjectPermission(user, 'manage', project)) {
        return res.status(403).json({
          code: 403,
          message: '您没有权限删除此奖金分配',
          data: null
        })
      }

      // 删除奖金分配
      await global.nedbService.deleteBonusAllocation(allocationId)

      // 记录审计日志
      await auditService.logPermissionAction(
        user,
        'bonus:delete',
        'bonus',
        allocationId,
        {
          action: 'delete_bonus_allocation',
          projectId: allocation.projectId,
          employeeId: allocation.employeeId,
          amount: allocation.amount
        },
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          requestId: req.id
        }
      )

      res.json({
        code: 200,
        message: '奖金分配删除成功',
        data: null
      })

    } catch (error) {
      logger.error('Delete bonus allocation error:', error)
      next(error)
    }
  }

  /**
   * 获取奖金统计信息
   */
  async getBonusStats(req, res, next) {
    try {
      const user = req.user
      const { projectId, departmentId, startDate, endDate } = req.query

      // 检查用户权限
      if (!PermissionValidator.canAccessResource(user, 'bonus', 'view')) {
        return res.status(403).json({
          code: 403,
          message: '您没有权限查看奖金统计信息',
          data: null
        })
      }

      // 获取统计信息
      const stats = await bonusAllocationService.getBonusStats({
        projectId,
        departmentId,
        startDate,
        endDate
      })

      res.json({
        code: 200,
        message: '获取成功',
        data: stats
      })

    } catch (error) {
      logger.error('Get bonus stats error:', error)
      next(error)
    }
  }

  /**
   * 批量审批奖金分配
   */
  async batchApproveBonusAllocations(req, res, next) {
    try {
      const user = req.user
      const { allocationIds, approved, comments } = req.body

      // 验证必要字段
      if (!Array.isArray(allocationIds) || allocationIds.length === 0) {
        return res.status(400).json({
          code: 400,
          message: '缺少奖金分配ID列表',
          data: null
        })
      }

      if (typeof approved !== 'boolean') {
        return res.status(400).json({
          code: 400,
          message: '缺少审批结果',
          data: null
        })
      }

      // 检查用户权限
      if (!PermissionValidator.canAccessResource(user, 'bonus', 'approve')) {
        return res.status(403).json({
          code: 403,
          message: '您没有权限审批奖金分配',
          data: null
        })
      }

      // 批量审批
      const results = await bonusAllocationService.batchApproveBonusAllocations(
        allocationIds,
        user.id,
        approved,
        comments
      )

      // 记录审计日志
      for (const allocationId of allocationIds) {
        try {
          const allocation = await global.nedbService.getBonusAllocationById(allocationId)
          if (allocation) {
            await auditService.logPermissionAction(
              user,
              'bonus:approve',
              'bonus',
              allocationId,
              {
                action: 'batch_approve_bonus_allocations',
                approved,
                amount: allocation.amount,
                projectId: allocation.projectId,
                employeeId: allocation.employeeId,
                comments
              },
              {
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                requestId: req.id
              }
            )
          }
        } catch (error) {
          logger.error('记录批量审批审计日志失败:', error)
        }
      }

      res.json({
        code: 200,
        message: `批量审批完成，成功: ${results.success}，失败: ${results.failed}`,
        data: results
      })

    } catch (error) {
      logger.error('Batch approve bonus allocations error:', error)
      next(error)
    }
  }
}

module.exports = new BonusAllocationController()