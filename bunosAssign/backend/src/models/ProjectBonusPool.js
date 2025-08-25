const { createModel } = require('../adapters/model-adapter')

const ProjectBonusPool = createModel('project_bonus_pools')

// 项目奖金池表 - 管理项目级别的奖金分配
ProjectBonusPool.attributes = {
  id: { type: 'STRING', primaryKey: true },
  projectId: { type: 'STRING', allowNull: false }, // 项目ID
  period: { type: 'STRING', allowNull: false }, // 奖金周期（如：2024Q1）
  totalAmount: { 
    type: 'DECIMAL', 
    allowNull: false,
    defaultValue: 0 // 奖金池总额
  },
  allocatedAmount: { 
    type: 'DECIMAL', 
    allowNull: false,
    defaultValue: 0 // 已分配金额
  },
  profitAmount: { 
    type: 'DECIMAL', 
    allowNull: false,
    defaultValue: 0 // 项目利润
  },
  profitRatio: { 
    type: 'DECIMAL', 
    allowNull: false,
    defaultValue: 0.1 // 利润提成比例，默认10%
  },
  status: { 
    type: 'STRING', 
    allowNull: false, 
    defaultValue: 'draft' // draft-草稿, confirmed-已确认, allocated-已分配, paid-已发放
  },
  rules: { 
    type: 'JSON', 
    allowNull: true // 分配规则配置
  },
  createdBy: { type: 'STRING', allowNull: false }, // 创建人ID
  approvedBy: { type: 'STRING', allowNull: true }, // 审批人ID
  approvedAt: { type: 'DATE', allowNull: true }, // 审批时间
  notes: { type: 'TEXT', allowNull: true }, // 备注
  createdAt: { type: 'DATE', defaultValue: Date.now },
  updatedAt: { type: 'DATE', defaultValue: Date.now }
}

module.exports = ProjectBonusPool