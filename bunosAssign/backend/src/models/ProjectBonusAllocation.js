const { createModel } = require('../adapters/model-adapter')

const ProjectBonusAllocation = createModel('project_bonus_allocations')

// 项目奖金分配记录表 - 记录每个成员的项目奖金
ProjectBonusAllocation.attributes = {
  id: { type: 'STRING', primaryKey: true },
  poolId: { type: 'STRING', allowNull: false }, // 奖金池ID
  projectId: { type: 'STRING', allowNull: false }, // 项目ID
  memberId: { type: 'STRING', allowNull: false }, // 项目成员ID（关联project_members表）
  employeeId: { type: 'STRING', allowNull: false }, // 员工ID
  roleId: { type: 'STRING', allowNull: true }, // 项目角色ID
  baseAmount: { 
    type: 'DECIMAL', 
    allowNull: false,
    defaultValue: 0 // 基础奖金
  },
  roleWeight: { 
    type: 'DECIMAL', 
    allowNull: false,
    defaultValue: 1.0 // 角色权重
  },
  performanceCoefficient: { 
    type: 'DECIMAL', 
    allowNull: false,
    defaultValue: 1.0 // 绩效系数
  },
  contributionWeight: { 
    type: 'DECIMAL', 
    allowNull: false,
    defaultValue: 1.0 // 贡献度权重
  },
  finalAmount: { 
    type: 'DECIMAL', 
    allowNull: false,
    defaultValue: 0 // 最终奖金 = baseAmount * roleWeight * performanceCoefficient * contributionWeight
  },
  calculationDetails: { 
    type: 'JSON', 
    allowNull: true // 计算明细
  },
  status: { 
    type: 'STRING', 
    allowNull: false, 
    defaultValue: 'calculated' // calculated-已计算, confirmed-已确认, paid-已发放
  },
  paidAt: { type: 'DATE', allowNull: true }, // 发放时间
  notes: { type: 'TEXT', allowNull: true }, // 备注
  createdAt: { type: 'DATE', defaultValue: Date.now },
  updatedAt: { type: 'DATE', defaultValue: Date.now }
}

module.exports = ProjectBonusAllocation