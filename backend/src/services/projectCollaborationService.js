/**
 * 项目协作服务
 * 提供项目协作相关的业务逻辑
 */

const nedbService = require('./nedbService')
const { PermissionValidator } = require('../config/permissions')
const auditService = require('../services/auditService')
const logger = require('../utils/logger')

class ProjectCollaborationService {
  /**
   * 创建项目协作
   * @param {Object} collaborationData - 协作数据
   * @returns {Object} 创建的协作记录
   */
  async createCollaboration(collaborationData) {
    try {
      const collaboration = {
        ...collaborationData,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = await nedbService.createCollaboration(collaboration)
      
      logger.info('项目协作创建成功', {
        collaborationId: result._id,
        projectId: collaborationData.projectId,
        title: collaborationData.title
      })

      return result
    } catch (error) {
      logger.error('创建项目协作失败:', error)
      throw error
    }
  }

  /**
   * 创建团队申请
   * @param {Object} applicationData - 申请数据
   * @returns {Object} 创建的申请记录
   */
  async createTeamApplication(applicationData) {
    try {
      const application = {
        ...applicationData,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = await nedbService.createTeamApplication(application)
      
      logger.info('团队申请创建成功', {
        applicationId: result._id,
        projectId: applicationData.projectId,
        applicantId: applicationData.applicantId
      })

      return result
    } catch (error) {
      logger.error('创建团队申请失败:', error)
      throw error
    }
  }

  /**
   * 审批团队申请
   * @param {string} applicationId - 申请ID
   * @param {string} approverId - 审批人ID
   * @param {boolean} approved - 是否批准
   * @param {string} comments - 审批意见
   * @param {string} role - 分配的角色
   * @param {Date} startDate - 开始日期
   * @returns {Object} 审批结果
   */
  async approveTeamApplication(applicationId, approverId, approved, comments, role, startDate) {
    try {
      // 获取申请信息
      const application = await nedbService.getTeamApplicationById(applicationId)
      if (!application) {
        throw new Error('申请不存在')
      }

      // 更新申请状态
      const updatedApplication = await nedbService.updateTeamApplication(applicationId, {
        status: approved ? 'approved' : 'rejected',
        approvedBy: approverId,
        approvedAt: new Date(),
        approvalComments: comments,
        updatedAt: new Date()
      })

      if (approved) {
        // 如果批准，创建项目成员记录
        const memberData = {
          projectId: application.projectId,
          employeeId: application.applicantId,
          role: role || 'member',
          joinDate: startDate || new Date(),
          status: 'active',
          source: 'team_application',
          applicationId: applicationId,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        await nedbService.createProjectMember(memberData)

        logger.info('团队申请已批准，成员已添加', {
          applicationId,
          projectId: application.projectId,
          employeeId: application.applicantId,
          role
        })
      } else {
        logger.info('团队申请已拒绝', {
          applicationId,
          projectId: application.projectId,
          employeeId: application.applicantId,
          comments
        })
      }

      return updatedApplication
    } catch (error) {
      logger.error('审批团队申请失败:', error)
      throw error
    }
  }

  /**
   * 获取协作统计信息
   * @param {string} projectId - 项目ID（可选）
   * @returns {Object} 统计信息
   */
  async getCollaborationStats(projectId = null) {
    try {
      const query = projectId ? { projectId } : {}
      
      // 获取协作统计
      const collaborations = await nedbService.getCollaborations(query)
      const totalCollaborations = collaborations.length
      const activeCollaborations = collaborations.filter(c => c.status === 'active').length
      const pausedCollaborations = collaborations.filter(c => c.status === 'paused').length
      const closedCollaborations = collaborations.filter(c => c.status === 'closed').length

      // 获取申请统计
      const applications = await nedbService.getTeamApplications(query)
      const totalApplications = applications.length
      const pendingApplications = applications.filter(a => a.status === 'pending').length
      const approvedApplications = applications.filter(a => a.status === 'approved').length
      const rejectedApplications = applications.filter(a => a.status === 'rejected').length

      // 获取成员统计
      const members = projectId ? 
        await nedbService.getProjectMembers(projectId) :
        await nedbService.getAllProjectMembers()
      
      const totalMembers = members.length
      const activeMembers = members.filter(m => m.status === 'active').length

      return {
        collaborations: {
          total: totalCollaborations,
          active: activeCollaborations,
          paused: pausedCollaborations,
          closed: closedCollaborations
        },
        applications: {
          total: totalApplications,
          pending: pendingApplications,
          approved: approvedApplications,
          rejected: rejectedApplications
        },
        members: {
          total: totalMembers,
          active: activeMembers
        }
      }
    } catch (error) {
      logger.error('获取协作统计信息失败:', error)
      return {}
    }
  }

  /**
   * 检查用户协作权限
   * @param {Object} user - 用户对象
   * @param {string} projectId - 项目ID
   * @param {string} action - 操作类型
   * @returns {boolean} 是否有权限
   */
  async checkUserCollaborationPermission(user, projectId, action) {
    try {
      // 检查基础权限
      if (!PermissionValidator.canAccessResource(user, 'collaboration', action)) {
        return false
      }

      // 如果有项目ID，检查项目级权限
      if (projectId) {
        const project = await nedbService.getProjectById(projectId)
        if (!project) {
          return false
        }

        return PermissionValidator.checkProjectPermission(user, action, project)
      }

      return true
    } catch (error) {
      logger.error('检查用户协作权限失败:', error)
      return false
    }
  }

  /**
   * 获取用户可访问的协作项目
   * @param {Object} user - 用户对象
   * @returns {Array} 可访问的项目列表
   */
  async getUserAccessibleProjects(user) {
    try {
      const projects = await nedbService.getProjects()
      
      // 过滤用户可访问的项目
      return PermissionValidator.filterAccessibleResources(user, 'project', projects)
    } catch (error) {
      logger.error('获取用户可访问项目失败:', error)
      return []
    }
  }

  /**
   * 批量处理团队申请
   * @param {Array} applicationIds - 申请ID列表
   * @param {string} approverId - 审批人ID
   * @param {boolean} approved - 是否批准
   * @param {string} comments - 审批意见
   * @returns {Object} 处理结果
   */
  async batchProcessTeamApplications(applicationIds, approverId, approved, comments) {
    try {
      const results = []
      const errors = []

      for (const applicationId of applicationIds) {
        try {
          const result = await this.approveTeamApplication(
            applicationId,
            approverId,
            approved,
            comments
          )
          results.push(result)
        } catch (error) {
          errors.push({
            applicationId,
            error: error.message
          })
        }
      }

      return {
        success: results.length,
        failed: errors.length,
        results,
        errors
      }
    } catch (error) {
      logger.error('批量处理团队申请失败:', error)
      throw error
    }
  }
}

module.exports = new ProjectCollaborationService()
