const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const EmployeeProfitContribution = sequelize.define('EmployeeProfitContribution', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  period: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      len: [4, 20]
    },
    comment: '期间，格式：YYYY-MM 或 YYYY-Q1'
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'employee_id'
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'project_id',
    comment: '关联项目ID'
  },
  contributionType: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'contribution_type',
    validate: {
      isIn: [['direct', 'indirect', 'support', 'management']]
    },
    comment: '贡献类型：直接/间接/支持/管理'
  },
  
  // 基础贡献数据
  contributionAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'contribution_amount',
    defaultValue: 0,
    comment: '贡献金额'
  },
  contributionRatio: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: false,
    field: 'contribution_ratio',
    defaultValue: 0,
    validate: {
      min: 0,
      max: 1
    },
    comment: '贡献占比'
  },
  
  // 工作量相关
  workHours: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    field: 'work_hours',
    comment: '工作时长'
  },
  workHoursRatio: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: true,
    field: 'work_hours_ratio',
    comment: '工时占比'
  },
  
  // 质量相关
  qualityScore: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    field: 'quality_score',
    validate: {
      min: 0,
      max: 1
    },
    comment: '质量评分 (0-1)'
  },
  clientSatisfactionScore: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    field: 'client_satisfaction_score',
    validate: {
      min: 0,
      max: 1
    },
    comment: '客户满意度评分 (0-1)'
  },
  
  // 项目相关
  milestoneCompletionRate: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: true,
    field: 'milestone_completion_rate',
    validate: {
      min: 0,
      max: 1
    },
    comment: '里程碑完成率'
  },
  deliveryOnTime: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    field: 'delivery_on_time',
    validate: {
      min: 0,
      max: 1
    },
    comment: '按时交付率'
  },
  
  // 效率相关
  efficiencyScore: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    field: 'efficiency_score',
    validate: {
      min: 0,
      max: 2
    },
    comment: '效率评分 (相对于平均水平的倍数)'
  },
  innovationScore: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    field: 'innovation_score',
    validate: {
      min: 0,
      max: 1
    },
    comment: '创新评分'
  },
  
  // 计算结果
  directContributionScore: {
    type: DataTypes.DECIMAL(8, 4),
    allowNull: true,
    field: 'direct_contribution_score',
    comment: '直接贡献得分'
  },
  workloadContributionScore: {
    type: DataTypes.DECIMAL(8, 4),
    allowNull: true,
    field: 'workload_contribution_score',
    comment: '工作量贡献得分'
  },
  qualityContributionScore: {
    type: DataTypes.DECIMAL(8, 4),
    allowNull: true,
    field: 'quality_contribution_score',
    comment: '质量贡献得分'
  },
  totalContributionScore: {
    type: DataTypes.DECIMAL(8, 4),
    allowNull: false,
    field: 'total_contribution_score',
    defaultValue: 0,
    comment: '总贡献得分'
  },
  
  // 计算方式和参数
  calculatedBy: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'calculated_by',
    validate: {
      isIn: [['manual', 'auto_formula', 'auto_ml', 'hybrid']]
    },
    defaultValue: 'auto_formula',
    comment: '计算方式：手工/自动公式/机器学习/混合'
  },
  calculationParams: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'calculation_params',
    comment: '计算参数JSON'
  },
  
  // 审核状态
  reviewStatus: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'review_status',
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'approved', 'rejected', 'adjusted']]
    },
    comment: '审核状态'
  },
  reviewComments: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'review_comments',
    comment: '审核意见'
  },
  reviewedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'reviewed_by',
    comment: '审核人ID'
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'reviewed_at',
    comment: '审核时间'
  },
  
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    validate: {
      isIn: [[0, 1]]
    },
    comment: '状态：0-无效，1-有效'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'created_by'
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'updated_by'
  }
}, {
  tableName: 'employee_profit_contributions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: '员工利润贡献表',
  indexes: [
    {
      fields: ['employee_id', 'period'],
      name: 'idx_employee_contribution_emp_period'
    },
    {
      fields: ['project_id', 'period'],
      name: 'idx_employee_contribution_project_period'
    },
    {
      fields: ['period', 'review_status'],
      name: 'idx_employee_contribution_period_status'
    },
    {
      unique: true,
      fields: ['employee_id', 'period', 'project_id', 'contribution_type'],
      name: 'unique_employee_contribution'
    }
  ]
})

module.exports = EmployeeProfitContribution