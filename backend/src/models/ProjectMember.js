const { createModel } = require('../adapters/model-adapter')

const ProjectMember = createModel('project_members')

// 项目成员表 - 记录员工与项目的关联关系
ProjectMember.attributes = {
  id: { type: 'STRING', primaryKey: true },
  projectId: { type: 'STRING', allowNull: false }, // 项目ID
  employeeId: { type: 'STRING', allowNull: false }, // 员工ID
  roleId: { type: 'STRING', allowNull: true }, // 项目角色ID
  status: { 
    type: 'STRING', 
    allowNull: false, 
    defaultValue: 'pending' // pending-待审批, approved-已通过, rejected-已拒绝, removed-已移除
  },
  joinDate: { type: 'DATE', allowNull: true }, // 加入日期
  leaveDate: { type: 'DATE', allowNull: true }, // 离开日期
  contributionWeight: { 
    type: 'DECIMAL', 
    allowNull: false, 
    defaultValue: 1.0 // 贡献权重，默认1.0
  },
  applyReason: { type: 'TEXT', allowNull: true }, // 申请理由
  approvedBy: { type: 'STRING', allowNull: true }, // 审批人ID
  approvedAt: { type: 'DATE', allowNull: true }, // 审批时间
  rejectReason: { type: 'TEXT', allowNull: true }, // 拒绝理由
  createdAt: { type: 'DATE', defaultValue: Date.now },
  updatedAt: { type: 'DATE', defaultValue: Date.now }
}

module.exports = ProjectMember