const nedbService = require('./nedbService')
const { PermissionValidator } = require('../config/permissions')
const logger = require('../utils/logger')

class ProjectMemberService {
  /**
   * 员工申请加入项目
   */
  async applyToJoinProject(employeeId, projectId, applyReason) {
    try {
      // 检查员工是否存在
      const employee = await nedbService.getEmployeeById(employeeId)
      if (!employee) {
        throw new Error('员工不存在')
      }

      // 检查项目是否存在
      const project = await nedbService.getProjectById(projectId)
      if (!project) {
        throw new Error('项目不存在')
      }

      // 检查是否已经申请或已是成员
      const existingMember = await this.getProjectMember(projectId, employeeId)
      if (existingMember) {
        if (existingMember.status === 'pending') {
          throw new Error('您已经申请加入该项目，请等待审批')
        }
        if (existingMember.status === 'approved') {
          throw new Error('您已经是该项目的成员')
        }
      }

      // 创建申请记录
      const memberData = {
        projectId,
        employeeId,
        status: 'pending',
        applyReason,
        contributionWeight: 1.0,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const member = await nedbService.createProjectMember(memberData)
      
      // TODO: 发送通知给项目经理
      
      return member
    } catch (error) {
      logger.error('Apply to join project error:', error)
      throw error
    }
  }

  /**
   * 获取项目成员列表
   */
  async getProjectMembers(projectId, status = null) {
    try {
      let members = await nedbService.getProjectMembers(projectId)
      
      if (status) {
        members = members.filter(m => m.status === status)
      }

      // 获取员工详细信息
      const membersWithDetails = await Promise.all(
        members.map(async (member) => {
          const employee = await nedbService.getEmployeeById(member.employeeId)
          let role = null
          if (member.roleId) {
            role = await nedbService.getProjectRoleById(member.roleId)
          }
          
          return {
            ...member,
            employee: employee ? {
              id: employee._id,
              name: employee.name,
              employeeNo: employee.employeeNo,
              departmentId: employee.departmentId,
              positionId: employee.positionId
            } : null,
            role: role ? {
              id: role._id,
              name: role.name,
              code: role.code,
              defaultWeight: role.defaultWeight
            } : null
          }
        })
      )

      return membersWithDetails
    } catch (error) {
      logger.error('Get project members error:', error)
      throw error
    }
  }

  /**
   * 更新成员角色和权重
   */
  async updateMemberRole(memberId, roleId, contributionWeight, managerId) {
    try {
      const member = await nedbService.getProjectMemberById(memberId)
      if (!member) {
        throw new Error('成员不存在')
      }

      // 验证是否是项目经理
      const project = await nedbService.getProjectById(member.projectId)
      if (project.managerId !== managerId) {
        throw new Error('只有项目经理才能更新成员角色')
      }

      const updateData = {
        roleId,
        contributionWeight,
        updatedAt: new Date()
      }

      return await nedbService.updateProjectMember(memberId, updateData)
    } catch (error) {
      logger.error('Update member role error:', error)
      throw error
    }
  }

  /**
   * 移除项目成员
   */
  async removeProjectMember(memberId, managerId, reason) {
    try {
      const member = await nedbService.getProjectMemberById(memberId)
      if (!member) {
        throw new Error('成员不存在')
      }

      // 验证是否是项目经理
      const project = await nedbService.getProjectById(member.projectId)
      if (project.managerId !== managerId) {
        throw new Error('只有项目经理才能移除成员')
      }

      const updateData = {
        status: 'removed',
        leaveDate: new Date(),
        rejectReason: reason,
        updatedAt: new Date()
      }

      return await nedbService.updateProjectMember(memberId, updateData)
    } catch (error) {
      logger.error('Remove project member error:', error)
      throw error
    }
  }

  /**
   * 审批申请（简化版本，用于测试）
   */
  async approveApplication(memberId, roleId, participationRatio = 1.0, remark = '') {
    try {
      const updateData = {
        status: 'approved',
        roleId: roleId,
        participationRatio: participationRatio,
        approvedAt: new Date(),
        remark: remark,
        updatedAt: new Date()
      }

      return await nedbService.updateProjectMember(memberId, updateData)
    } catch (error) {
      logger.error('Approve application error:', error)
      throw error
    }
  }

  /**
   * 获取员工参与的项目列表
   */
  async getEmployeeProjects(employeeId, status = null) {
    try {
      let members = await nedbService.getEmployeeProjectMembers(employeeId)
      
      if (status) {
        members = members.filter(m => m.status === status)
      }

      // 获取项目详细信息
      const projectsWithDetails = await Promise.all(
        members.map(async (member) => {
          const project = await nedbService.getProjectById(member.projectId)
          let role = null
          if (member.roleId) {
            role = await nedbService.getProjectRoleById(member.roleId)
          }
          
          return {
            ...member,
            id: member._id,
            projectId: member.projectId,
            projectName: project ? project.name : '未知项目',           // 前端期望的字段名
            projectCode: project ? project.code : '未知代码',           // 前端期望的字段名
            projectStatus: project ? project.status : 'unknown',       // 前端期望的字段名
            roleName: role ? role.name : (member.role || '成员'),      // 前端期望的字段名
            joinDate: member.joinDate || member.createdAt,
            status: member.status || 'active',                         // 参与状态
            participationRatio: member.contributionWeight || 0,        // 前端期望的字段名
            projectBonus: member.projectBonus || 0,                    // 项目奖金
            project: project ? {
              id: project._id,
              name: project.name,
              code: project.code,
              status: project.status,
              startDate: project.startDate,
              endDate: project.endDate,
              managerId: project.managerId
            } : null,
            role: role ? {
              id: role._id,
              name: role.name,
              code: role.code,
              defaultWeight: role.defaultWeight
            } : null
          }
        })
      )

      return projectsWithDetails
    } catch (error) {
      logger.error('Get employee projects error:', error)
      throw error
    }
  }

  /**
   * 获取所有项目（管理员用）
   */
  async getAllProjects(status = null) {
    try {
      // 获取所有项目
      const projects = await nedbService.getProjects()
      
      // 如果指定了状态，过滤项目
      let filteredProjects = projects
      if (status) {
        filteredProjects = projects.filter(p => p.status === status)
      }

      // 为每个项目获取成员信息
      const projectsWithMembers = await Promise.all(
        filteredProjects.map(async (project) => {
          const members = await nedbService.getProjectMembers(project._id)
          
          return {
            id: project._id,
            projectName: project.name,
            projectCode: project.code,
            projectStatus: project.status,
            startDate: project.startDate,
            endDate: project.endDate,
            managerId: project.managerId,
            memberCount: members.length,
            status: 'approved', // 管理员查看时默认为已批准状态
            roleName: '管理员',
            participationRatio: 1.0,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt
          }
        })
      )

      return projectsWithMembers
    } catch (error) {
      logger.error('Get all projects error:', error)
      throw error
    }
  }

  /**
   * 获取待审批的申请列表（项目经理用）
   */
  async getPendingApplications(managerId) {
    try {
      // 获取项目经理管理的所有项目
      const projects = await nedbService.getProjectsByManager(managerId)
      const projectIds = projects.map(p => p._id)

      // 获取这些项目的待审批申请
      let pendingMembers = []
      for (const projectId of projectIds) {
        const members = await this.getProjectMembers(projectId, 'pending')
        pendingMembers = pendingMembers.concat(members.map(m => ({
          ...m,
          projectName: projects.find(p => p._id === projectId)?.name
        })))
      }

      return pendingMembers
    } catch (error) {
      logger.error('Get pending applications error:', error)
      throw error
    }
  }

  /**
   * 获取所有待审批的申请列表（管理员用）
   */
  async getAllPendingApplications() {
    try {
      // 获取所有项目的待审批申请 - 使用正确的方法名
      const allProjects = await nedbService.getProjects()
      let allPendingMembers = []

      for (const project of allProjects) {
        const members = await this.getProjectMembers(project._id, 'pending')
        allPendingMembers = allPendingMembers.concat(members.map(m => ({
          ...m,
          projectName: project.name,
          projectCode: project.code
        })))
      }

      return allPendingMembers
    } catch (error) {
      logger.error('Get all pending applications error:', error)
      throw error
    }
  }

  /**
   * 根据项目ID列表获取待审批申请
   * @param {Array} projectIds - 项目ID列表
   * @returns {Array} 待审批申请列表
   */
  async getPendingApplicationsByProjects(projectIds) {
    try {
      let allPendingMembers = []

      for (const projectId of projectIds) {
        const members = await this.getProjectMembers(projectId, 'pending')
        const project = await nedbService.getProjectById(projectId)
        
        allPendingMembers = allPendingMembers.concat(members.map(m => ({
          ...m,
          projectName: project?.name || '未知项目',
          projectCode: project?.code || 'N/A'
        })))
      }

      return allPendingMembers
    } catch (error) {
      logger.error('Get pending applications by projects error:', error)
      throw error
    }
  }

  /**
   * 审批成员申请
   * @param {string} memberId - 成员ID
   * @param {string} approverId - 审批人ID
   * @param {boolean} approved - 是否批准
   * @param {string} comments - 审批意见
   * @param {string} role - 分配的角色
   * @param {Date} startDate - 开始日期
   * @returns {Object} 审批结果
   */
  async approveMemberApplication(memberId, approverId, approved, comments, role, startDate) {
    try {
      // 获取成员申请信息
      const member = await nedbService.getProjectMemberById(memberId)
      if (!member) {
        throw new Error('成员申请不存在')
      }

      // 更新申请状态
      const updatedMember = await nedbService.updateProjectMember(memberId, {
        status: approved ? 'active' : 'rejected',
        approvedBy: approverId,
        approvedAt: new Date(),
        approvalComments: comments,
        role: approved ? (role || 'member') : member.role,
        joinDate: approved ? (startDate || new Date()) : null,
        updatedAt: new Date()
      })

      if (approved) {
        logger.info('成员申请已批准', {
          memberId,
          projectId: member.projectId,
          employeeId: member.employeeId,
          role: role || 'member'
        })
      } else {
        logger.info('成员申请已拒绝', {
          memberId,
          projectId: member.projectId,
          employeeId: member.employeeId,
          comments
        })
      }

      return updatedMember
    } catch (error) {
      logger.error('审批成员申请失败:', error)
      throw error
    }
  }

  /**
   * 批量审批申请
   * @param {Array} memberIds - 成员ID列表
   * @param {string} approverId - 审批人ID
   * @param {boolean} approved - 是否批准
   * @param {string} comments - 审批意见
   * @param {string} role - 分配的角色
   * @param {Date} startDate - 开始日期
   * @returns {Object} 处理结果
   */
  async batchApproveApplications(memberIds, approverId, approved, comments, role, startDate) {
    try {
      const results = []
      const errors = []

      for (const memberId of memberIds) {
        try {
          const result = await this.approveMemberApplication(
            memberId,
            approverId,
            approved,
            comments,
            role,
            startDate
          )
          results.push(result)
        } catch (error) {
          errors.push({
            memberId,
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
      logger.error('批量审批申请失败:', error)
      throw error
    }
  }

  /**
   * 检查用户项目权限
   * @param {Object} user - 用户对象
   * @param {string} projectId - 项目ID
   * @param {string} action - 操作类型
   * @returns {boolean} 是否有权限
   */
  async checkUserProjectPermission(user, projectId, action) {
    try {
      // 检查基础权限
      if (!PermissionValidator.canAccessResource(user, 'project', action)) {
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
      logger.error('检查用户项目权限失败:', error)
      return false
    }
  }

  /**
   * 获取用户可管理的项目
   * @param {Object} user - 用户对象
   * @returns {Array} 可管理的项目列表
   */
  async getUserManagedProjects(user) {
    try {
      const projects = await nedbService.getProjects()
      
      // 过滤用户可管理的项目
      return projects.filter(project => 
        PermissionValidator.checkProjectPermission(user, 'manage', project)
      )
    } catch (error) {
      logger.error('获取用户可管理项目失败:', error)
      return []
    }
  }

  /**
   * 获取项目成员（内部方法）
   */
  async getProjectMember(projectId, employeeId) {
    try {
      const members = await nedbService.getProjectMembers(projectId)
      return members.find(m => m.employeeId === employeeId)
    } catch (error) {
      logger.error('Get project member error:', error)
      throw error
    }
  }
}

module.exports = new ProjectMemberService()