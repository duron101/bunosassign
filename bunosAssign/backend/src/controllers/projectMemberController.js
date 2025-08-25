const projectMemberService = require('../services/projectMemberService')
const { PermissionValidator } = require('../config/permissions')
const auditService = require('../services/auditService')
const logger = require('../utils/logger')

class ProjectMemberController {
  /**
   * 员工申请加入项目
   */
  async applyToJoinProject(req, res, next) {
    try {
      const { projectId, applyReason } = req.body
      const employeeId = req.user.employeeId // 从登录用户获取员工ID

      if (!employeeId) {
        return res.status(400).json({
          code: 400,
          message: '当前用户未关联员工信息',
          data: null
        })
      }

      const member = await projectMemberService.applyToJoinProject(
        employeeId,
        projectId,
        applyReason
      )

      res.json({
        code: 200,
        message: '申请提交成功，请等待项目经理审批',
        data: member
      })
    } catch (error) {
      logger.error('Apply to join project error:', error)
      next(error)
    }
  }

  /**
   * 获取项目角色列表
   */
  async getProjectRoles(req, res, next) {
    try {
      // 从全局NeDB服务获取角色信息
      const roles = await global.nedbService.getRoles()

      // 过滤出项目相关的角色
      const projectRoles = roles.filter(role =>
        role.name && (
          role.name.toLowerCase().includes('项目') ||
          role.name.toLowerCase().includes('project') ||
          role.name.toLowerCase().includes('成员') ||
          role.name.toLowerCase().includes('member')
        )
      )

      res.json({
        code: 200,
        message: '获取成功',
        data: projectRoles
      })
    } catch (error) {
      logger.error('Get project roles error:', error)
      next(error)
    }
  }

  /**
   * 获取项目成员申请列表（项目经理用）
   */
  async getPendingApplications(req, res, next) {
    try {
      const managerId = req.user.employeeId
      const userPermissions = req.user.Role?.permissions || req.user.permissions || []
      const isAdmin = userPermissions.includes('*') || userPermissions.includes('admin')

      // 如果是管理员，可以获取所有待审批的申请
      if (isAdmin) {
        console.log('🔐 管理员用户，获取所有待审批的申请')
        const allApplications = await projectMemberService.getAllPendingApplications()
        return res.json({
          code: 200,
          message: '获取成功',
          data: allApplications
        })
      }

      // 普通用户必须有员工ID
      if (!managerId) {
        return res.status(400).json({
          code: 400,
          message: '当前用户未关联员工信息',
          data: null
        })
      }

      // 获取用户管理的项目
      const managedProjects = await global.nedbService.getProjects({ managerId })
      if (managedProjects.length === 0) {
        return res.json({
          code: 200,
          message: '获取成功',
          data: []
        })
      }

      // 获取这些项目的待审批申请
      const projectIds = managedProjects.map(p => p._id)
      const pendingApplications = await projectMemberService.getPendingApplicationsByProjects(projectIds)

      res.json({
        code: 200,
        message: '获取成功',
        data: pendingApplications
      })
    } catch (error) {
      logger.error('Get pending applications error:', error)
      next(error)
    }
  }

  /**
   * 审批成员申请
   */
  async approveMemberApplication(req, res, next) {
    try {
      const { memberId } = req.params
      const { approved, comments, role, startDate } = req.body
      const approver = req.user

      // 验证必要字段
      if (typeof approved !== 'boolean') {
        return res.status(400).json({
          code: 400,
          message: '缺少审批结果',
          data: null
        })
      }

      // 获取成员申请信息
      const member = await global.nedbService.getProjectMemberById(memberId)
      if (!member) {
        return res.status(404).json({
          code: 404,
          message: '成员申请不存在',
          data: null
        })
      }

      // 检查项目是否存在
      const project = await global.nedbService.getProjectById(member.projectId)
      if (!project) {
        return res.status(404).json({
          code: 404,
          message: '项目不存在',
          data: null
        })
      }

      // 检查审批人权限
      if (!PermissionValidator.checkProjectPermission(approver, 'manage', project)) {
        return res.status(403).json({
          code: 403,
          message: '您没有权限审批此申请',
          data: null
        })
      }

      // 审批申请
      const result = await projectMemberService.approveMemberApplication(
        memberId,
        approver.id,
        approved,
        comments,
        role,
        startDate
      )

      // 记录审计日志
      await auditService.logPermissionAction(
        approver,
        'member:approve',
        'project',
        member.projectId,
        {
          action: 'approve_member_application',
          memberId,
          approved,
          employeeId: member.employeeId,
          role: role || 'member'
        },
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          requestId: req.id
        }
      )

      res.json({
        code: 200,
        message: approved ? '申请已批准' : '申请已拒绝',
        data: result
      })

    } catch (error) {
      logger.error('Approve member application error:', error)
      next(error)
    }
  }

  /**
   * 批量审批申请
   */
  async batchApproveApplications(req, res, next) {
    try {
      const { memberIds, approved, comments, role, startDate } = req.body
      const approver = req.user

      // 验证必要字段
      if (!Array.isArray(memberIds) || memberIds.length === 0) {
        return res.status(400).json({
          code: 400,
          message: '缺少成员ID列表',
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

      // 批量审批
      const results = await projectMemberService.batchApproveApplications(
        memberIds,
        approver.id,
        approved,
        comments,
        role,
        startDate
      )

      // 记录审计日志
      for (const memberId of memberIds) {
        try {
          const member = await global.nedbService.getProjectMemberById(memberId)
          if (member) {
            await auditService.logPermissionAction(
              approver,
              'member:approve',
              'project',
              member.projectId,
              {
                action: 'batch_approve_member_applications',
                memberId,
                approved,
                role: role || 'member'
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
      logger.error('Batch approve applications error:', error)
      next(error)
    }
  }

  /**
   * 获取项目成员列表
   */
  async getProjectMembers(req, res, next) {
    try {
      const { projectId } = req.params
      const { status } = req.query

      const members = await projectMemberService.getProjectMembers(projectId, status)

      res.json({
        code: 200,
        message: '获取成功',
        data: members
      })
    } catch (error) {
      logger.error('Get project members error:', error)
      next(error)
    }
  }

  /**
   * 更新成员角色
   */
  async updateMemberRole(req, res, next) {
    try {
      const { memberId } = req.params
      const { role, reason } = req.body
      const updater = req.user

      // 验证必要字段
      if (!role) {
        return res.status(400).json({
          code: 400,
          message: '缺少角色信息',
          data: null
        })
      }

      // 获取成员信息
      const member = await global.nedbService.getProjectMemberById(memberId)
      if (!member) {
        return res.status(404).json({
          code: 404,
          message: '成员不存在',
          data: null
        })
      }

      // 检查项目是否存在
      const project = await global.nedbService.getProjectById(member.projectId)
      if (!project) {
        return res.status(404).json({
          code: 404,
          message: '项目不存在',
          data: null
        })
      }

      // 检查更新人权限
      if (!PermissionValidator.checkProjectPermission(updater, 'manage', project)) {
        return res.status(403).json({
          code: 403,
          message: '您没有权限更新此成员角色',
          data: null
        })
      }

      // 更新角色
      const updatedMember = await global.nedbService.updateProjectMember(memberId, {
        role,
        updatedBy: updater.id,
        updatedAt: new Date()
      })

      // 记录审计日志
      await auditService.logPermissionAction(
        updater,
        'role:update',
        'project',
        member.projectId,
        {
          action: 'update_member_role',
          memberId,
          oldRole: member.role,
          newRole: role,
          reason
        },
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          requestId: req.id
        }
      )

      res.json({
        code: 200,
        message: '成员角色更新成功',
        data: updatedMember
      })

    } catch (error) {
      logger.error('Update member role error:', error)
      next(error)
    }
  }

  /**
   * 移除项目成员
   */
  async removeProjectMember(req, res, next) {
    try {
      const { memberId } = req.params
      const { reason } = req.body
      const remover = req.user

      // 获取成员信息
      const member = await global.nedbService.getProjectMemberById(memberId)
      if (!member) {
        return res.status(404).json({
          code: 404,
          message: '成员不存在',
          data: null
        })
      }

      // 检查项目是否存在
      const project = await global.nedbService.getProjectById(member.projectId)
      if (!project) {
        return res.status(404).json({
          code: 404,
          message: '项目不存在',
          data: null
        })
      }

      // 检查移除人权限
      if (!PermissionValidator.checkProjectPermission(remover, 'manage', project)) {
        return res.status(403).json({
          code: 403,
          message: '您没有权限移除此成员',
          data: null
        })
      }

      // 移除成员
      await global.nedbService.removeProjectMember(memberId)

      // 记录审计日志
      await auditService.logPermissionAction(
        remover,
        'member:remove',
        'project',
        member.projectId,
        {
          action: 'remove_project_member',
          memberId,
          employeeId: member.employeeId,
          role: member.role,
          reason
        },
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          requestId: req.id
        }
      )

      res.json({
        code: 200,
        message: '成员已移除',
        data: null
      })

    } catch (error) {
      logger.error('Remove project member error:', error)
      next(error)
    }
  }

  /**
   * 获取员工参与的项目列表
   */
  async getEmployeeProjects(req, res, next) {
    try {
      const employeeId = req.user.employeeId || req.query.employeeId
      const { status } = req.query

      // 检查用户权限
      const userPermissions = req.user.Role?.permissions || req.user.permissions || []
      const isAdmin = userPermissions.includes('*') || userPermissions.includes('admin')

      // 如果是管理员且没有员工ID，返回所有项目
      if (isAdmin && !employeeId) {
        console.log('🔐 管理员用户，返回所有项目')
        const allProjects = await projectMemberService.getAllProjects(status)
        return res.json({
          code: 200,
          message: '获取成功',
          data: allProjects
        })
      }

      // 普通用户必须有员工ID
      if (!employeeId) {
        return res.status(400).json({
          code: 400,
          message: '缺少员工ID',
          data: null
        })
      }

      const projects = await projectMemberService.getEmployeeProjects(employeeId, status)

      res.json({
        code: 200,
        message: '获取成功',
        data: projects
      })
    } catch (error) {
      logger.error('Get employee projects error:', error)
      next(error)
    }
  }
}

module.exports = new ProjectMemberController()