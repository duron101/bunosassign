import request from '@/utils/request'

// 项目成员相关API
export const projectMemberApi = {
  // 员工申请加入项目
  applyToJoin(data) {
    return request({
      url: '/project-members/apply',
      method: 'post',
      data
    })
  },

  // 获取我参与的项目
  getMyProjects() {
    return request({
      url: '/project-members/my-projects',
      method: 'get'
    })
  },

  // 取消项目申请
  cancelApplication(memberId) {
    return request({
      url: `/project-members/${memberId}/cancel`,
      method: 'put'
    })
  },

  // 获取项目成员申请列表（项目经理用）
  getProjectApplications(projectId, status = null) {
    return request({
      url: '/project-members/applications',
      method: 'get',
      params: { projectId, status }
    })
  },

  // 审批项目成员申请（项目经理用）
  approveApplication(memberId, data) {
    return request({
      url: `/project-members/${memberId}/approve`,
      method: 'put',
      data
    })
  },

  // 拒绝项目成员申请（项目经理用）
  rejectApplication(memberId, data) {
    return request({
      url: `/project-members/${memberId}/reject`,
      method: 'put',
      data
    })
  },

  // 获取项目成员列表
  getProjectMembers(projectId) {
    return request({
      url: `/project-members/projects/${projectId}/members`,
      method: 'get'
    })
  },

  // 更新项目成员角色
  updateMemberRole(memberId, data) {
    return request({
      url: `/project-members/${memberId}/role`,
      method: 'put',
      data
    })
  },

  // 设置成员参与度
  setMemberParticipation(memberId, data) {
    return request({
      url: `/project-members/${memberId}/participation`,
      method: 'put',
      data
    })
  },

  // 移除项目成员
  removeMember(memberId) {
    return request({
      url: `/project-members/${memberId}`,
      method: 'delete'
    })
  },

  // 获取项目角色列表
  getProjectRoles() {
    return request({
      url: '/project-members/roles',
      method: 'get'
    })
  },

  // 批量审批项目成员申请
  batchApproveApplications(data) {
    return request({
      url: '/project-members/batch-approve',
      method: 'post',
      data
    })
  },

  // 获取项目奖金详情
  getProjectBonusDetails(projectId, period) {
    return request({
      url: `/project-bonus/projects/${projectId}/periods/${period}`,
      method: 'get'
    })
  },

  // 导出项目成员列表
  exportProjectMembers(projectId) {
    return request({
      url: `/project-members/projects/${projectId}/export`,
      method: 'get',
      responseType: 'blob'
    })
  }
}

// 项目奖金相关API
export const projectBonusApi = {
  // 创建项目奖金池
  createBonusPool(data) {
    return request({
      url: '/project-bonus/pools',
      method: 'post',
      data
    })
  },

  // 计算项目奖金分配
  calculateBonus(poolId) {
    return request({
      url: `/project-bonus/pools/${poolId}/calculate`,
      method: 'post'
    })
  },

  // 审批项目奖金分配
  approveBonus(poolId) {
    return request({
      url: `/project-bonus/pools/${poolId}/approve`,
      method: 'post'
    })
  },

  // 设置项目角色权重
  setRoleWeights(projectId, data) {
    return request({
      url: `/project-bonus/projects/${projectId}/role-weights`,
      method: 'put',
      data
    })
  },

  // 获取项目角色权重
  getRoleWeights(projectId) {
    return request({
      url: `/project-bonus/projects/${projectId}/role-weights`,
      method: 'get'
    })
  },

  // 获取项目奖金分配详情
  getBonusDetails(projectId, period) {
    return request({
      url: `/project-bonus/projects/${projectId}/periods/${period}`,
      method: 'get'
    })
  }
}