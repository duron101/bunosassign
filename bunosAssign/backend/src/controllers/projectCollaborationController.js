/**
 * 项目协作控制器
 * 提供项目协作相关的业务逻辑
 */

const projectCollaborationService = require('../services/projectCollaborationService')
const { PermissionValidator } = require('../config/permissions')
const auditService = require('../services/auditService')
const notificationService = require('../services/notificationService')
const logger = require('../utils/logger')

class ProjectCollaborationController {
  /**
   * 发布项目协作
   */
  async publishCollaboration(req, res, next) {
    try {
      const user = req.user
      const collaborationData = req.body

      // 验证必要字段
      if (!collaborationData.projectId || !collaborationData.title || !collaborationData.description) {
        return res.status(400).json({
          code: 400,
          message: '缺少必要字段',
          data: null
        })
      }

      // 检查项目是否存在
      const project = await global.nedbService.getProjectById(collaborationData.projectId)
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
          message: '您没有权限为此项目发布协作',
          data: null
        })
      }

      // 创建协作记录
      const collaboration = await projectCollaborationService.createCollaboration({
        ...collaborationData,
        publisherId: user.id,
        publisherName: user.username,
        status: 'active'
      })

      // 记录审计日志
      await auditService.logPermissionAction(
        user,
        'collaboration:publish',
        'project',
        collaborationData.projectId,
        {
          action: 'publish_collaboration',
          collaborationId: collaboration._id,
          title: collaborationData.title
        },
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          requestId: req.id
        }
      )

      // 发送项目协作发布通知
      try {
        // 获取需要通知的用户（项目相关方）
        const project = await global.nedbService.getProjectById(collaborationData.projectId)
        if (project) {
          const notifyUserIds = []
          
          // 通知业务线负责人
          if (project.businessLineId) {
            const businessLine = await global.nedbService.findOne('businessLines', { _id: project.businessLineId })
            if (businessLine && businessLine.managerId) {
              notifyUserIds.push(businessLine.managerId)
            }
          }
          
          // 通知部门经理
          if (project.departmentId) {
            const department = await global.nedbService.findOne('departments', { _id: project.departmentId })
            if (department && department.managerId) {
              notifyUserIds.push(department.managerId)
            }
          }
          
          // 通知项目成员
          if (project.members && project.members.length > 0) {
            notifyUserIds.push(...project.members)
          }
          
          // 去重
          const uniqueUserIds = [...new Set(notifyUserIds)]
          
          if (uniqueUserIds.length > 0) {
            await notificationService.sendProjectNotification(
              project._id,
              'project_published',
              '新项目协作发布通知',
              `项目"${project.name}"发布了新的协作需求：${collaborationData.title}`,
              uniqueUserIds,
              {
                projectName: project.name,
                projectCode: project.code,
                collaborationTitle: collaborationData.title,
                collaborationDescription: collaborationData.description
              }
            )
          }
        }
      } catch (notificationError) {
        logger.warn('发送项目协作发布通知失败:', notificationError)
        // 通知失败不影响协作发布流程
      }

      res.json({
        code: 200,
        message: '项目协作发布成功',
        data: collaboration
      })

    } catch (error) {
      logger.error('Publish collaboration error:', error)
      next(error)
    }
  }

  /**
   * 申请加入项目团队
   */
  async applyForTeam(req, res, next) {
    try {
      const user = req.user
      const { projectId, collaborationId, skills, experience, motivation } = req.body

      // 验证必要字段
      if (!projectId || !collaborationId) {
        return res.status(400).json({
          code: 400,
          message: '缺少必要字段',
          data: null
        })
      }

      // 检查项目是否存在
      const project = await global.nedbService.getProjectById(projectId)
      if (!project) {
        return res.status(404).json({
          code: 404,
          message: '项目不存在',
          data: null
        })
      }

      // 检查协作是否存在
      const collaboration = await global.nedbService.getCollaborationById(collaborationId)
      if (!collaboration) {
        return res.status(404).json({
          code: 404,
          message: '协作不存在',
          data: null
        })
      }

      // 检查是否已经是项目成员
      const existingMember = await global.nedbService.getProjectMember(projectId, user.employeeId)
      if (existingMember) {
        return res.status(400).json({
          code: 400,
          message: '您已经是项目成员',
          data: null
        })
      }

      // 检查是否已经申请过
      const existingApplication = await global.nedbService.getTeamApplication(projectId, user.employeeId)
      if (existingApplication) {
        return res.status(400).json({
          code: 400,
          message: '您已经申请过此项目',
          data: null
        })
      }

      // 创建团队申请
      const application = await projectCollaborationService.createTeamApplication({
        projectId,
        collaborationId,
        applicantId: user.employeeId,
        applicantName: user.username,
        skills,
        experience,
        motivation,
        status: 'pending'
      })

      // 记录审计日志
      await auditService.logPermissionAction(
        user,
        'collaboration:apply',
        'project',
        projectId,
        {
          action: 'team_apply',
          applicationId: application._id,
          collaborationId
        },
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          requestId: req.id
        }
      )

      // 发送团队申请通知
      try {
        const notifyUserIds = []
        
        // 通知项目负责人
        if (project.managerId) {
          notifyUserIds.push(project.managerId)
        }
        
        // 通知业务线负责人
        if (project.businessLineId) {
          const businessLine = await global.nedbService.findOne('businessLines', { _id: project.businessLineId })
          if (businessLine && businessLine.managerId) {
            notifyUserIds.push(businessLine.managerId)
          }
        }
        
        // 通知部门经理
        if (project.departmentId) {
          const department = await global.nedbService.findOne('departments', { _id: project.departmentId })
          if (department && department.managerId) {
            notifyUserIds.push(department.managerId)
          }
        }
        
        // 去重
        const uniqueUserIds = [...new Set(notifyUserIds)]
        
        if (uniqueUserIds.length > 0) {
          await notificationService.sendTeamApplicationNotification(
            application._id,
            projectId,
            user.employeeId,
            'applied',
            uniqueUserIds
          )
        }
      } catch (notificationError) {
        logger.warn('发送团队申请通知失败:', notificationError)
        // 通知失败不影响申请流程
      }

      res.json({
        code: 200,
        message: '团队申请提交成功',
        data: application
      })

    } catch (error) {
      logger.error('Apply for team error:', error)
      next(error)
    }
  }

  /**
   * 审批团队申请
   */
  async approveTeamApplication(req, res, next) {
    try {
      const user = req.user
      const { applicationId } = req.params
      const { approved, comments, role, startDate } = req.body

      // 验证必要字段
      if (typeof approved !== 'boolean') {
        return res.status(400).json({
          code: 400,
          message: '缺少审批结果',
          data: null
        })
      }

      // 获取申请信息
      const application = await global.nedbService.getTeamApplicationById(applicationId)
      if (!application) {
        return res.status(404).json({
          code: 404,
          message: '申请不存在',
          data: null
        })
      }

      // 检查项目是否存在
      const project = await global.nedbService.getProjectById(application.projectId)
      if (!project) {
        return res.status(404).json({
          code: 404,
          message: '项目不存在',
          data: null
        })
      }

      // 检查用户是否有权限审批此申请
      if (!PermissionValidator.checkProjectPermission(user, 'manage', project)) {
        return res.status(403).json({
          code: 403,
          message: '您没有权限审批此申请',
          data: null
        })
      }

      // 审批申请
      const result = await projectCollaborationService.approveTeamApplication(
        applicationId,
        user.id,
        approved,
        comments,
        role,
        startDate
      )

      // 记录审计日志
      await auditService.logPermissionAction(
        user,
        'member:approve',
        'project',
        application.projectId,
        {
          action: 'approve_team_application',
          applicationId,
          approved,
          applicantId: application.applicantId,
          role: role || 'member'
        },
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          requestId: req.id
        }
      )

      // 发送审批结果通知
      try {
        await notificationService.sendTeamApplicationNotification(
          applicationId,
          application.projectId,
          application.applicantId,
          approved ? 'approved' : 'rejected',
          [application.applicantId]
        )
      } catch (notificationError) {
        logger.warn('发送审批结果通知失败:', notificationError)
        // 通知失败不影响审批流程
      }

      res.json({
        code: 200,
        message: approved ? '申请已批准' : '申请已拒绝',
        data: result
      })

    } catch (error) {
      logger.error('Approve team application error:', error)
      next(error)
    }
  }

  /**
   * 获取项目协作列表
   */
  async getCollaborations(req, res, next) {
    try {
      const user = req.user
      const { projectId, status, page = 1, limit = 10 } = req.query

      // 构建查询条件
      const query = {}
      if (projectId) query.projectId = projectId
      if (status) query.status = status

      // 获取用户可访问的项目
      const userProjects = await global.nedbService.getProjects({
        $or: [
          { managerId: user.employeeId },
          { members: user.employeeId },
          { status: 'public' }
        ]
      })

      // 过滤用户可访问的项目协作
      const accessibleProjectIds = userProjects.map(p => p._id)
      if (accessibleProjectIds.length > 0) {
        query.projectId = { $in: accessibleProjectIds }
      } else {
        // 如果用户没有可访问的项目，返回空列表
        return res.json({
          code: 200,
          message: '获取成功',
          data: {
            collaborations: [],
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: 0,
              pages: 0
            }
          }
        })
      }

      // 获取协作列表
      const collaborations = await global.nedbService.getCollaborations(query)
      const total = collaborations.length

      // 分页
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedCollaborations = collaborations.slice(startIndex, endIndex)

      res.json({
        code: 200,
        message: '获取成功',
        data: {
          collaborations: paginatedCollaborations,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      })

    } catch (error) {
      logger.error('Get collaborations error:', error)
      next(error)
    }
  }

  /**
   * 获取我的申请列表
   */
  async getMyApplications(req, res, next) {
    try {
      const user = req.user
      const { page = 1, pageSize = 10, projectName, status } = req.query

      // 构建查询条件
      const query = { applicantId: user.employeeId }
      if (status) query.status = status

      // 获取申请列表
      let applications = await global.nedbService.getTeamApplications(query)

      // 如果指定了项目名称，进行过滤
      if (projectName) {
        const projectIds = applications
          .filter(app => app.projectId)
          .map(app => app.projectId)
        
        if (projectIds.length > 0) {
          const projects = await global.nedbService.find('projects', {
            _id: { $in: projectIds },
            name: { $regex: projectName, $options: 'i' }
          })
          
          const filteredProjectIds = projects.map(p => p._id)
          applications = applications.filter(app => 
            filteredProjectIds.includes(app.projectId)
          )
        } else {
          applications = []
        }
      }

      // 为每个申请添加项目信息
      const enrichedApplications = await Promise.all(
        applications.map(async (app) => {
          try {
            const project = await global.nedbService.findOne('projects', { _id: app.projectId })
            return {
              ...app,
              Project: project || {}
            }
          } catch (error) {
            console.warn('获取项目信息失败:', error.message)
            return {
              ...app,
              Project: {}
            }
          }
        })
      )

      const total = enrichedApplications.length

      // 分页
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + parseInt(pageSize)
      const paginatedApplications = enrichedApplications.slice(startIndex, endIndex)

      res.json({
        code: 200,
        message: '获取成功',
        data: {
          applications: paginatedApplications,
          pagination: {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            total,
            totalPages: Math.ceil(total / parseInt(pageSize))
          }
        }
      })

    } catch (error) {
      logger.error('Get my applications error:', error)
      next(error)
    }
  }

  /**
   * 获取团队申请列表
   */
  async getTeamApplications(req, res, next) {
    try {
      const user = req.user
      const { projectId, status, page = 1, limit = 10 } = req.query

      // 构建查询条件
      const query = {}
      if (projectId) query.projectId = projectId
      if (status) query.status = status

      // 检查用户权限
      if (projectId) {
        // 如果指定了项目ID，检查用户是否有权限查看
        const project = await global.nedbService.getProjectById(projectId)
        if (!project) {
          return res.status(404).json({
            code: 404,
            message: '项目不存在',
            data: null
          })
        }

        if (!PermissionValidator.checkProjectPermission(user, 'manage', project)) {
          return res.status(403).json({
            code: 403,
            message: '您没有权限查看此项目的申请',
            data: null
          })
        }
      } else {
        // 如果没有指定项目ID，只返回用户有权限管理的项目申请
        const managedProjects = await global.nedbService.getProjects({
          managerId: user.employeeId
        })
        
        if (managedProjects.length > 0) {
          query.projectId = { $in: managedProjects.map(p => p._id) }
        } else {
          // 如果用户没有管理的项目，返回空列表
          return res.json({
            code: 200,
            message: '获取成功',
            data: {
              applications: [],
              pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: 0,
                pages: 0
              }
            }
          })
        }
      }

      // 获取申请列表
      const applications = await global.nedbService.getTeamApplications(query)
      const total = applications.length

      // 分页
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedApplications = applications.slice(startIndex, endIndex)

      res.json({
        code: 200,
        message: '获取成功',
        data: {
          applications: paginatedApplications,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      })

    } catch (error) {
      logger.error('Get team applications error:', error)
      next(error)
    }
  }

  /**
   * 更新项目协作状态
   */
  async updateCollaborationStatus(req, res, next) {
    try {
      const user = req.user
      const { collaborationId } = req.params
      const { status, reason } = req.body

      // 验证必要字段
      if (!status || !['active', 'paused', 'closed'].includes(status)) {
        return res.status(400).json({
          code: 400,
          message: '无效的状态值',
          data: null
        })
      }

      // 获取协作信息
      const collaboration = await global.nedbService.getCollaborationById(collaborationId)
      if (!collaboration) {
        return res.status(404).json({
          code: 404,
          message: '协作不存在',
          data: null
        })
      }

      // 检查项目是否存在
      const project = await global.nedbService.getProjectById(collaboration.projectId)
      if (!project) {
        return res.status(404).json({
          code: 404,
          message: '项目不存在',
          data: null
        })
      }

      // 检查用户是否有权限管理此协作
      if (!PermissionValidator.checkProjectPermission(user, 'manage', project)) {
        return res.status(403).json({
          code: 403,
          message: '您没有权限管理此协作',
          data: null
        })
      }

      // 更新状态
      const updatedCollaboration = await global.nedbService.updateCollaboration(collaborationId, {
        status,
        reason,
        updatedBy: user.id,
        updatedAt: new Date()
      })

      // 记录审计日志
      await auditService.logPermissionAction(
        user,
        'collaboration:update',
        'project',
        collaboration.projectId,
        {
          action: 'update_collaboration_status',
          collaborationId,
          oldStatus: collaboration.status,
          newStatus: status,
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
        message: '协作状态更新成功',
        data: updatedCollaboration
      })

    } catch (error) {
      logger.error('Update collaboration status error:', error)
      next(error)
    }
  }

  /**
   * 获取协作统计信息
   */
  async getCollaborationStats(req, res, next) {
    try {
      const user = req.user
      const { projectId } = req.query

      // 检查用户权限
      if (projectId) {
        const project = await global.nedbService.getProjectById(projectId)
        if (!project || !PermissionValidator.checkProjectPermission(user, 'view', project)) {
          return res.status(403).json({
            code: 403,
            message: '您没有权限查看此项目的统计信息',
            data: null
          })
        }
      }

      // 获取统计信息
      const stats = await projectCollaborationService.getCollaborationStats(projectId)

      res.json({
        code: 200,
        message: '获取成功',
        data: stats
      })

    } catch (error) {
      logger.error('Get collaboration stats error:', error)
      next(error)
    }
  }

  /**
   * 获取我的通知
   */
  async getMyNotifications(req, res, next) {
    try {
      const user = req.user
      const { page = 1, pageSize = 20, unreadOnly = false, notificationType, startDate, endDate } = req.query

      // 使用通知服务获取用户通知
      const result = await notificationService.getUserNotifications(user.id, {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        unreadOnly: unreadOnly === 'true',
        notificationType,
        startDate,
        endDate
      })

      res.json({
        code: 200,
        message: '获取成功',
        data: result
      })

    } catch (error) {
      logger.error('Get my notifications error:', error)
      next(error)
    }
  }

  /**
   * 标记通知为已读
   */
  async markNotificationRead(req, res, next) {
    try {
      const user = req.user
      const { notificationId } = req.params

      // 使用通知服务标记通知为已读
      const updatedNotification = await notificationService.markNotificationRead(notificationId, user.id)

      res.json({
        code: 200,
        message: '标记成功',
        data: updatedNotification
      })

    } catch (error) {
      logger.error('Mark notification read error:', error)
      next(error)
    }
  }

  /**
   * 批量标记通知为已读
   */
  async markAllNotificationsRead(req, res, next) {
    try {
      const user = req.user

      // 使用通知服务批量标记通知为已读
      const result = await notificationService.markAllNotificationsRead(user.id)

      res.json({
        code: 200,
        message: '批量标记成功',
        data: { updatedCount: result }
      })

    } catch (error) {
      logger.error('Mark all notifications read error:', error)
      next(error)
    }
  }
}

module.exports = new ProjectCollaborationController()